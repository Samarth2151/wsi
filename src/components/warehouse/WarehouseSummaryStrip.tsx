import type { WarehouseSummary } from '../../types/wms';

interface WarehouseSummaryStripProps {
  summary: WarehouseSummary;
}

export function WarehouseSummaryStrip({
  summary,
}: WarehouseSummaryStripProps) {
  const metrics = [
    { label: 'Total Storage', value: summary.total_storage, tone: 'total' },
    { label: 'Occupied', value: summary.occupied_count, tone: 'occupied' },
    { label: 'Free', value: summary.free_count, tone: 'free' },
  ] as const;

  return (
    <section className="warehouse-summary-panel" aria-label="Warehouse summary">
      <div className="warehouse-summary-metrics">
        {metrics.map((metric) => (
          <div className="warehouse-summary-metric" key={metric.label}>
            <span className="summary-metric-label">{metric.label}</span>
            <strong className={`summary-metric-value summary-metric-value--${metric.tone}`}>
              {metric.value}
            </strong>
          </div>
        ))}
      </div>
      <ul className="warehouse-legend" aria-label="Map legend">
        <li>
          <span className="legend-swatch legend-swatch--transfer" aria-hidden="true" />
          A1 Transfer Point
        </li>
        <li>
          <span className="legend-swatch legend-swatch--free" aria-hidden="true" />
          Free
        </li>
        <li>
          <span className="legend-swatch legend-swatch--occupied" aria-hidden="true" />
          Occupied
        </li>
      </ul>
    </section>
  );
}
