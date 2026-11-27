import { useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

import { fetchAuditorDashboard } from '../api/auditor';
import { OccupancyChart } from '../components/auditor/OccupancyChart';
import { PageHeading } from '../components/PageHeading';
import { useAbortableResource } from '../hooks/useAbortableResource';
import '../styles/data-pages.css';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function AuditorPage() {
  const { data, error, isLoading, isRefreshing, refresh } =
    useAbortableResource(fetchAuditorDashboard);
  const [search, setSearch] = useState('');

  const filteredPallets = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLocaleLowerCase();
    if (!query) return data.pallets;

    return data.pallets.filter((pallet) =>
      [pallet.pallet_number, pallet.barcode, pallet.item_name, pallet.location_code]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [data, search]);

  const metrics = data
    ? [
        { label: 'Total Storage Slots', value: data.summary.total_storage, tone: 'total' },
        { label: 'Occupied Slots', value: data.summary.occupied_count, tone: 'occupied' },
        { label: 'Free Slots', value: data.summary.free_count, tone: 'free' },
        {
          label: 'Utilization',
          value: `${data.summary.utilization_percent}%`,
          tone: 'utilization',
        },
      ]
    : [];

  return (
    <div className="page-stack data-page auditor-page">
      <PageHeading
        eyebrow="AUDIT & UTILIZATION"
        title="Auditor Dashboard"
        description="Track occupancy trends and review the active warehouse inventory."
      />

      <div className="data-page-toolbar">
        <p className="data-page-caption">
          {data ? `${data.pallets.length} active pallets` : 'Current warehouse view'}
        </p>
        <button
          aria-label="Refresh auditor dashboard"
          className="data-refresh-button"
          data-testid="auditor-refresh"
          disabled={isLoading || isRefreshing}
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="data-error-banner" data-testid="auditor-error" role="alert">
          {error}
        </p>
      )}

      {data ? (
        <>
          <section className="auditor-kpi-grid" aria-label="Warehouse occupancy summary">
            {metrics.map((metric) => (
              <article className="auditor-kpi-card" key={metric.label}>
                <span className="auditor-kpi-label">{metric.label}</span>
                <strong className={`auditor-kpi-value auditor-kpi-value--${metric.tone}`}>
                  {metric.value}
                </strong>
              </article>
            ))}
          </section>

          <OccupancyChart history={data.history} />

          <section className="auditor-panel" aria-labelledby="inventory-title">
            <div className="auditor-panel-heading inventory-heading">
              <div>
                <p className="section-eyebrow">CURRENT STOCK</p>
                <h2 id="inventory-title">Active inventory</h2>
              </div>
              <div className="inventory-search">
                <label className="visually-hidden" htmlFor="inventory-search">
                  Search pallet number, barcode, item, or location
                </label>
                <Search size={16} aria-hidden="true" />
                <input
                  autoComplete="off"
                  data-testid="inventory-search"
                  id="inventory-search"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory"
                  type="search"
                  value={search}
                />
              </div>
            </div>

            {filteredPallets.length ? (
              <div className="responsive-table-scroll" role="region" aria-label="Active inventory table" tabIndex={0}>
                <table className="data-table inventory-table">
                  <thead>
                    <tr>
                      <th scope="col">Location</th>
                      <th scope="col">Pallet Number</th>
                      <th scope="col">Barcode</th>
                      <th scope="col">Item Name</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Loaded By</th>
                      <th scope="col">Loaded At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPallets.map((pallet) => (
                      <tr key={pallet.id}>
                        <th scope="row">{pallet.location_code}</th>
                        <td>{pallet.pallet_number}</td>
                        <td>{pallet.barcode}</td>
                        <td>{pallet.item_name}</td>
                        <td>{pallet.quantity}</td>
                        <td>{pallet.loaded_by_username ?? 'Not recorded'}</td>
                        <td>{formatTimestamp(pallet.loaded_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="auditor-empty-state" data-testid="inventory-empty-state">
                {data.pallets.length === 0
                  ? 'No pallets are currently stored.'
                  : 'No pallets match your search.'}
              </p>
            )}
          </section>
        </>
      ) : isLoading ? (
        <section className="data-loading-panel" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          Loading auditor dashboard…
        </section>
      ) : (
        <section className="data-empty-panel" aria-label="Auditor dashboard unavailable">
          Dashboard data is unavailable. Use Refresh to try again.
        </section>
      )}
    </div>
  );
}
