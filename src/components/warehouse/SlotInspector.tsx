import { ArrowLeftRight } from 'lucide-react';

import type { LoadPalletPayload } from '../../api/warehouse';
import type { StorageLocation } from '../../types/wms';
import { LoadPalletForm } from './LoadPalletForm';

interface SlotInspectorProps {
  location: StorageLocation | null;
  canManagePallets: boolean;
  isMutating: boolean;
  actionError: string | null;
  onLoad: (payload: LoadPalletPayload) => Promise<boolean>;
  onUnload: (location: string) => void;
}

function formatLoadedAt(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

export function SlotInspector({
  location,
  canManagePallets,
  isMutating,
  actionError,
  onLoad,
  onUnload,
}: SlotInspectorProps) {
  return (
    <aside className="slot-inspector" aria-labelledby="slot-inspector-title">
      <p className="inspector-eyebrow">SELECTED LOCATION</p>
      <h2 id="slot-inspector-title">{location?.code ?? 'Slot details'}</h2>

      {!location ? (
        <p className="inspector-hint">
          Select a location on the warehouse map to view its status and available actions.
        </p>
      ) : location.location_type === 'TRANSFER' ? (
        <div className="transfer-notice">
          <span className="transfer-notice-mark" aria-hidden="true">
            <ArrowLeftRight size={18} strokeWidth={2.2} />
          </span>
          <div>
            <span className="transfer-notice-label">A1 · TRANSFER POINT</span>
            <h3>Shuttle transfer point</h3>
            <p>
              A1 is used for shuttle handoff and cannot store pallets. Pallet loading is disabled on
              transfer points.
            </p>
          </div>
        </div>
      ) : location.status === 'OCCUPIED' && location.pallet ? (
        <div className="inspector-content">
          <span className="inspector-status inspector-status--occupied">Occupied</span>
          <dl className="pallet-details">
            <div>
              <dt>Pallet Number</dt>
              <dd>{location.pallet.pallet_number}</dd>
            </div>
            <div>
              <dt>Barcode</dt>
              <dd>{location.pallet.barcode}</dd>
            </div>
            <div>
              <dt>Item Name</dt>
              <dd>{location.pallet.item_name}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{location.pallet.quantity}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{location.pallet.location_code}</dd>
            </div>
            <div>
              <dt>Loaded At</dt>
              <dd>{formatLoadedAt(location.pallet.loaded_at)}</dd>
            </div>
            <div>
              <dt>Loaded By</dt>
              <dd>{location.pallet.loaded_by_username ?? 'Not recorded'}</dd>
            </div>
          </dl>
          {canManagePallets && (
            <>
              {actionError && (
                <p className="warehouse-error" role="alert">
                  {actionError}
                </p>
              )}
              <button
                className="warehouse-action-button warehouse-action-button--danger"
                disabled={isMutating}
                onClick={() => onUnload(location.code)}
                type="button"
              >
                {isMutating ? 'Unloading pallet…' : 'Unload Pallet'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="inspector-content">
          <span className="inspector-status inspector-status--free">Free</span>
          {canManagePallets ? (
            <LoadPalletForm
              destination={location.code}
              isSubmitting={isMutating}
              onSubmit={onLoad}
              serverError={actionError}
            />
          ) : (
            <p className="readonly-note">Slot is currently free (read-only access).</p>
          )}
        </div>
      )}
    </aside>
  );
}
