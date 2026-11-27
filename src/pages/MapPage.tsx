import { CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '../api/client';
import {
  fetchWarehouseState,
  loadPallet,
  unloadPallet,
  type LoadPalletPayload,
} from '../api/warehouse';
import { FilterPills } from '../components/FilterPills';
import { PageHeading } from '../components/PageHeading';
import { SlotInspector } from '../components/warehouse/SlotInspector';
import { WarehouseMapGrid } from '../components/warehouse/WarehouseMapGrid';
import { WarehouseSummaryStrip } from '../components/warehouse/WarehouseSummaryStrip';
import '../components/warehouse/warehouse.css';
import { useAuth } from '../context/AuthContext';
import type { WarehouseStateResponse } from '../types/wms';

const REFRESH_INTERVAL_MS = 3000;
const SLOT_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'Occupied', label: 'Occupied' },
  { value: 'Transfer Point', label: 'Transfer Point' },
] as const;

type SlotFilter = (typeof SLOT_FILTERS)[number]['value'];

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
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('All');
  const [mapSearch, setMapSearch] = useState('');
  const [recentlyChangedCodes, setRecentlyChangedCodes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const activeFetchRef = useRef<AbortController | null>(null);
  const mutationInFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);
  const previousSlotStatesRef = useRef<Map<string, string> | null>(null);
  const changedSlotTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!lastUpdated) {
      setSecondsSinceUpdate(0);
      return;
    }

    const updateAge = () => {
      setSecondsSinceUpdate(
        Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000)),
      );
    };

    updateAge();
    const intervalId = window.setInterval(updateAge, 1000);
    return () => window.clearInterval(intervalId);
  }, [lastUpdated]);

  useEffect(() => {
    if (!warehouse) return;

    const nextStates = new Map(
      warehouse.locations.map((location) => [
        location.code,
        `${location.status}:${location.pallet?.pallet_number ?? ''}`,
      ]),
    );
    const previousStates = previousSlotStatesRef.current;

    if (previousStates) {
      const changedCodes = new Set<string>();
      for (const [code, state] of nextStates) {
        if (previousStates.has(code) && previousStates.get(code) !== state) {
          changedCodes.add(code);
        }
      }

      if (changedCodes.size > 0) {
        setRecentlyChangedCodes(changedCodes);
        if (changedSlotTimeoutRef.current !== null) {
          window.clearTimeout(changedSlotTimeoutRef.current);
        }
        changedSlotTimeoutRef.current = window.setTimeout(() => {
          setRecentlyChangedCodes(new Set());
          changedSlotTimeoutRef.current = null;
        }, 1800);
      }
    }

    previousSlotStatesRef.current = nextStates;
  }, [warehouse]);

  useEffect(
    () => () => {
      if (changedSlotTimeoutRef.current !== null) {
        window.clearTimeout(changedSlotTimeoutRef.current);
      }
    },
    [],
  );

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

  const normalizedSearch = mapSearch.trim().toLowerCase();
  const isHighlightingSlots = slotFilter !== 'All' || normalizedSearch.length > 0;
  const highlightedCodes = useMemo(() => {
    if (!warehouse || !isHighlightingSlots) return new Set<string>();

    return new Set(
      warehouse.locations
        .filter((location) => {
          const matchesFilter =
            slotFilter === 'All' ||
            (slotFilter === 'Available' && location.status === 'FREE') ||
            (slotFilter === 'Occupied' && location.status === 'OCCUPIED') ||
            (slotFilter === 'Transfer Point' && location.location_type === 'TRANSFER');
          const searchableText = [
            location.code,
            location.pallet?.pallet_number ?? '',
            location.pallet?.barcode ?? '',
            location.pallet?.item_name ?? '',
          ]
            .join(' ')
            .toLowerCase();
          const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

          return matchesFilter && matchesSearch;
        })
        .map((location) => location.code),
    );
  }, [isHighlightingSlots, normalizedSearch, slotFilter, warehouse]);

  const dimmedCodes = useMemo(() => {
    if (!warehouse || !isHighlightingSlots) return new Set<string>();
    return new Set(
      warehouse.locations
        .filter((location) => !highlightedCodes.has(location.code))
        .map((location) => location.code),
    );
  }, [highlightedCodes, isHighlightingSlots, warehouse]);

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
        <div
          aria-label={
            lastUpdatedText
              ? `Live sync active. Updated ${secondsSinceUpdate} seconds ago at ${lastUpdatedText}.`
              : 'Live sync active. Waiting for first update.'
          }
          aria-live="off"
          className="live-sync-status"
          role="status"
        >
          <span
            aria-hidden="true"
            className={`live-sync-dot${isRefreshing ? ' is-syncing' : ''}`}
          />
          <span>
            {lastUpdatedText
              ? `Live sync active · updated ${secondsSinceUpdate}s ago`
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
              <div className="warehouse-map-controls">
                <FilterPills
                  label="Filter warehouse locations"
                  onChange={setSlotFilter}
                  options={SLOT_FILTERS}
                  value={slotFilter}
                />
                <div className="warehouse-map-search">
                  <Search size={15} aria-hidden="true" />
                  <input
                    aria-label="Search locations and pallets"
                    autoComplete="off"
                    id="warehouse-map-search"
                    onChange={(event) => setMapSearch(event.target.value)}
                    placeholder="Find a slot or pallet"
                    type="search"
                    value={mapSearch}
                  />
                </div>
              </div>
              {isHighlightingSlots && highlightedCodes.size === 0 && (
                <p className="warehouse-map-no-matches" role="status">
                  No locations match these filters.
                </p>
              )}
              <WarehouseMapGrid
                disabled={isMutating}
                dimmedCodes={dimmedCodes}
                highlightedCodes={highlightedCodes}
                locations={warehouse.locations}
                onSelect={handleSelectSlot}
                recentlyChangedCodes={recentlyChangedCodes}
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
