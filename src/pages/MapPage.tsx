import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '../api/client';
import {
  fetchWarehouseState,
  loadPallet,
  unloadPallet,
  type LoadPalletPayload,
} from '../api/warehouse';
import { PageHeading } from '../components/PageHeading';
import { SlotInspector } from '../components/warehouse/SlotInspector';
import { WarehouseMapGrid } from '../components/warehouse/WarehouseMapGrid';
import { WarehouseSummaryStrip } from '../components/warehouse/WarehouseSummaryStrip';
import '../components/warehouse/warehouse.css';
import { useAuth } from '../context/AuthContext';
import type { WarehouseStateResponse } from '../types/wms';

const REFRESH_INTERVAL_MS = 3000;

function getActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessages = Object.entries(error.fields).flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    );
    return [error.message, ...fieldMessages].join(' ');
  }

  return error instanceof Error
    ? error.message
    : 'The warehouse action could not be completed. Please try again.';
}

export function MapPage() {
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState<WarehouseStateResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const activeFetchRef = useRef<AbortController | null>(null);
  const mutationInFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);

  const refreshWarehouse = useCallback(async () => {
    if (
      !mountedRef.current ||
      mutationInFlightRef.current ||
      activeFetchRef.current
    ) {
      return;
    }

    const controller = new AbortController();
    const requestVersion = requestVersionRef.current;
    activeFetchRef.current = controller;
    setIsRefreshing(true);

    try {
      const state = await fetchWarehouseState(controller.signal);
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        requestVersion === requestVersionRef.current &&
        !mutationInFlightRef.current
      ) {
        setWarehouse(state);
        setLastUpdated(new Date());
        setSyncError(null);
      }
    } catch (error: unknown) {
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        requestVersion === requestVersionRef.current
      ) {
        setSyncError(
          error instanceof ApiError
            ? error.message
            : 'Warehouse updates are temporarily unavailable.',
        );
      }
    } finally {
      if (activeFetchRef.current === controller) {
        activeFetchRef.current = null;
        if (mountedRef.current) setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refreshWarehouse();
    const intervalId = window.setInterval(() => {
      void refreshWarehouse();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      mountedRef.current = false;
      requestVersionRef.current += 1;
      const controller = activeFetchRef.current;
      activeFetchRef.current = null;
      controller?.abort();
    };
  }, [refreshWarehouse]);

  const runMutation = useCallback(
    async (request: () => Promise<unknown>, successText: string): Promise<boolean> => {
      if (mutationInFlightRef.current) return false;

      mutationInFlightRef.current = true;
      requestVersionRef.current += 1;
      const pendingFetch = activeFetchRef.current;
      activeFetchRef.current = null;
      pendingFetch?.abort();

      if (mountedRef.current) {
        setIsRefreshing(false);
        setIsMutating(true);
        setActionError(null);
        setSuccessMessage(null);
      }

      try {
        await request();
        if (mountedRef.current) setSuccessMessage(successText);
        return true;
      } catch (error: unknown) {
        if (mountedRef.current) setActionError(getActionErrorMessage(error));
        return false;
      } finally {
        mutationInFlightRef.current = false;
        if (mountedRef.current) {
          await refreshWarehouse();
        }
        if (mountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [refreshWarehouse],
  );

  const handleLoad = useCallback(
    (payload: LoadPalletPayload) =>
      runMutation(
        () => loadPallet(payload),
        `${payload.pallet_number} loaded into ${payload.destination}.`,
      ),
    [runMutation],
  );

  const handleUnload = useCallback(
    (location: string) => {
      void runMutation(
        () => unloadPallet({ location }),
        `Pallet unloaded from ${location}.`,
      );
    },
    [runMutation],
  );

  const selectedLocation = useMemo(
    () => warehouse?.locations.find((location) => location.code === selectedCode) ?? null,
    [selectedCode, warehouse],
  );

  const handleSelectSlot = (code: string) => {
    setSelectedCode(code);
    setActionError(null);
    setSuccessMessage(null);
  };

  const lastUpdatedText = lastUpdated
    ? new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastUpdated)
    : null;

  const canManagePallets = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  return (
    <div className="page-stack warehouse-page">
      <PageHeading
        eyebrow="WAREHOUSE OVERVIEW"
        title="Warehouse Map"
        description="View live storage occupancy and manage pallets by location."
      />

      <div className="warehouse-live-toolbar">
        <div className="live-sync-status" aria-live="off" role="status">
          <span
            aria-hidden="true"
            className={`live-sync-dot${isRefreshing ? ' is-syncing' : ''}`}
          />
          <span>
            {lastUpdatedText
              ? `Live sync active · Last updated ${lastUpdatedText}`
              : 'Live sync active · Waiting for first update'}
          </span>
        </div>
        <div className="warehouse-toolbar-actions">
          <button
            aria-label="Refresh warehouse map"
            className="warehouse-refresh-button"
            data-testid="warehouse-refresh"
            disabled={isRefreshing || isMutating}
            onClick={() => void refreshWarehouse()}
            type="button"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {syncError && (
        <p className="warehouse-sync-error" role="status">
          Live sync is temporarily unavailable. Showing the last successful snapshot. {syncError}
        </p>
      )}
      {successMessage && (
        <p className="warehouse-success" data-testid="warehouse-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {successMessage}
        </p>
      )}

      {warehouse ? (
        <>
          <WarehouseSummaryStrip summary={warehouse.summary} />
          <div className="warehouse-dashboard">
            <section className="warehouse-map-panel" aria-labelledby="map-grid-heading">
              <header className="warehouse-panel-heading">
                <div>
                  <h2 id="map-grid-heading">Storage locations</h2>
                  <p>Select a slot to inspect its status and pallet actions.</p>
                </div>
              </header>
              <WarehouseMapGrid
                disabled={isMutating}
                locations={warehouse.locations}
                onSelect={handleSelectSlot}
                selectedCode={selectedCode}
              />
            </section>
            <SlotInspector
              actionError={actionError}
              canManagePallets={canManagePallets}
              isMutating={isMutating}
              location={selectedLocation}
              onLoad={handleLoad}
              onUnload={handleUnload}
            />
          </div>
        </>
      ) : (
        <section className="warehouse-map-panel" aria-label="Warehouse map loading">
          {isRefreshing ? (
            <div className="warehouse-loading-state" role="status" aria-live="polite">
              <span className="loading-indicator" aria-hidden="true" />
              Loading live warehouse locations…
            </div>
          ) : (
            <div className="warehouse-loading-state">
              Warehouse locations could not be loaded. Use Refresh to try again.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
