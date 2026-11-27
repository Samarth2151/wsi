import { BatteryCharging, Bot, RefreshCw } from 'lucide-react';

import { fetchShuttleStatus } from '../api/shuttle';
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

export function ShuttlePage() {
  const { data, error, isLoading, isRefreshing, refresh } =
    useAbortableResource(fetchShuttleStatus);
  const battery = data
    ? Math.min(100, Math.max(0, data.battery_percentage))
    : 0;
  const batteryLevel =
    battery < 25 ? 'low' : battery < 60 ? 'medium' : 'high';
  const statusClass = data?.status.toLowerCase().replaceAll('_', '-') ?? 'unknown';

  return (
    <div className="page-stack data-page">
      <PageHeading
        eyebrow="FLEET MONITORING"
        title="Shuttle Status"
        description="Review shuttle availability and battery condition."
      />

      <div className="data-page-toolbar">
        <p className="data-page-caption">
          {data ? `Last updated ${formatTimestamp(data.updated_at)}` : 'Live shuttle telemetry'}
        </p>
        <button
          aria-label="Refresh shuttle status"
          className="data-refresh-button"
          data-testid="shuttle-refresh"
          disabled={isLoading || isRefreshing}
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="data-error-banner" data-testid="shuttle-error" role="alert">
          {error}
        </p>
      )}

      {data ? (
        <section className="shuttle-card" aria-labelledby="shuttle-card-title">
          <div className="shuttle-card-header">
            <div className="shuttle-icon" aria-hidden="true">
              <Bot size={25} />
            </div>
            <div>
              <p className="section-eyebrow">REGISTERED SHUTTLE</p>
              <h2 id="shuttle-card-title">{data.identifier}</h2>
            </div>
            <span className={`shuttle-status-badge shuttle-status-badge--${statusClass}`}>
              <span className="status-indicator" aria-hidden="true" />
              {data.status}
            </span>
          </div>

          <div className="shuttle-battery-section">
            <div className="shuttle-battery-heading">
              <span>
                <BatteryCharging size={17} aria-hidden="true" /> Battery level
              </span>
              <strong>{data.battery_percentage}%</strong>
            </div>
            <div
              aria-label="Battery charge"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={battery}
              className="battery-progress"
              data-level={batteryLevel}
              role="progressbar"
            >
              <span className="battery-progress-fill" style={{ width: `${battery}%` }} />
            </div>
            <div className="battery-scale" aria-hidden="true">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <dl className="shuttle-details">
            <div>
              <dt>Operational status</dt>
              <dd>{data.status}</dd>
            </div>
            <div>
              <dt>Last telemetry update</dt>
              <dd>{formatTimestamp(data.updated_at)}</dd>
            </div>
          </dl>
        </section>
      ) : isLoading ? (
        <section className="data-loading-panel" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          Loading shuttle status…
        </section>
      ) : (
        <section className="data-empty-panel" aria-labelledby="shuttle-unavailable-title">
          <div className="shuttle-icon" aria-hidden="true">
            <Bot size={25} />
          </div>
          <h2 id="shuttle-unavailable-title">Shuttle status unavailable</h2>
          <p>Check the connection and refresh to try again.</p>
        </section>
      )}
    </div>
  );
}
