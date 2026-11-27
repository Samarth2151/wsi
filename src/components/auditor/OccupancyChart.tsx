import type { OccupancyHistoryPoint } from '../../types/wms';

interface OccupancyChartProps {
  history: OccupancyHistoryPoint[];
}

const CHART_WIDTH = 760;
const CHART_HEIGHT = 300;
const LEFT = 44;
const RIGHT = 18;
const TOP = 22;
const BOTTOM = 52;
const CAPACITY = 24;
const TICKS = [0, 6, 12, 18, 24] as const;

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function OccupancyChart({ history }: OccupancyChartProps) {
  const plotWidth = CHART_WIDTH - LEFT - RIGHT;
  const plotHeight = CHART_HEIGHT - TOP - BOTTOM;
  const baseline = TOP + plotHeight;
  const step = history.length ? plotWidth / history.length : plotWidth;
  const barWidth = Math.min(50, step * 0.54);

  return (
    <section className="auditor-panel" aria-labelledby="occupancy-chart-title">
      <div className="auditor-panel-heading">
        <div>
          <p className="section-eyebrow">CAPACITY TREND</p>
          <h2 id="occupancy-chart-title">Seven-day occupancy</h2>
        </div>
        <ul className="chart-legend" aria-label="Occupancy chart legend">
          <li><span className="chart-legend-swatch chart-legend-swatch--occupied" aria-hidden="true" />Occupied</li>
          <li><span className="chart-legend-swatch chart-legend-swatch--free" aria-hidden="true" />Free</li>
        </ul>
      </div>

      {history.length === 0 ? (
        <p className="auditor-empty-state">No occupancy history is available yet.</p>
      ) : (
        <>
          <div className="occupancy-chart-scroll">
            <svg
              aria-describedby="occupancy-chart-description"
              aria-labelledby="occupancy-chart-svg-title"
              className="occupancy-chart-svg"
              data-testid="occupancy-chart"
              role="img"
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            >
              <title id="occupancy-chart-svg-title">Daily occupied and free storage slots</title>
              <desc id="occupancy-chart-description">
                Stacked bars compare occupied and free slots for each day. The warehouse capacity is 24 storage slots.
              </desc>

              {TICKS.map((tick) => {
                const y = baseline - (tick / CAPACITY) * plotHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={LEFT}
                      x2={CHART_WIDTH - RIGHT}
                      y1={y}
                      y2={y}
                      stroke={tick === 0 ? '#cbd5ce' : '#e8ede9'}
                      strokeWidth={tick === 0 ? 1.5 : 1}
                    />
                    <text
                      className="chart-axis-label"
                      textAnchor="end"
                      x={LEFT - 9}
                      y={y + 4}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {history.map((point, index) => {
                const occupied = Math.min(CAPACITY, Math.max(0, point.occupied_count));
                const free = Math.min(CAPACITY, Math.max(0, point.free_count));
                const center = LEFT + step * index + step / 2;
                const x = center - barWidth / 2;
                const occupiedHeight = (occupied / CAPACITY) * plotHeight;
                const freeHeight = (free / CAPACITY) * plotHeight;
                const occupiedY = baseline - occupiedHeight;
                const freeY = occupiedY - freeHeight;
                const label = formatDate(point.date);
                const accessibleSummary = `${label}: ${point.occupied_count} occupied slots and ${point.free_count} free slots`;

                return (
                  <g key={point.date} aria-label={accessibleSummary}>
                    <rect
                      x={x}
                      y={freeY}
                      width={barWidth}
                      height={freeHeight}
                      rx={4}
                      fill="#d9e4dc"
                    >
                      <title>{`${accessibleSummary}. Free slots`}</title>
                    </rect>
                    <rect
                      x={x}
                      y={occupiedY}
                      width={barWidth}
                      height={occupiedHeight}
                      rx={4}
                      fill="#28784d"
                    >
                      <title>{`${accessibleSummary}. Occupied slots`}</title>
                    </rect>
                    {freeHeight >= 19 && (
                      <text
                        className="chart-bar-value chart-bar-value--free"
                        textAnchor="middle"
                        x={center}
                        y={freeY + freeHeight / 2 + 3}
                      >
                        {point.free_count}
                      </text>
                    )}
                    {occupiedHeight >= 19 && (
                      <text
                        className="chart-bar-value chart-bar-value--occupied"
                        textAnchor="middle"
                        x={center}
                        y={occupiedY + occupiedHeight / 2 + 3}
                      >
                        {point.occupied_count}
                      </text>
                    )}
                    <text
                      className="chart-axis-label chart-date-label"
                      textAnchor="middle"
                      x={center}
                      y={baseline + 23}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="occupancy-data-table-scroll">
            <table className="occupancy-data-table">
              <caption>Daily occupied and free slot counts</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Occupied</th>
                  <th scope="col">Free</th>
                </tr>
              </thead>
              <tbody>
                {history.map((point) => (
                  <tr key={point.date}>
                    <th scope="row">{formatDate(point.date)}</th>
                    <td>{point.occupied_count}</td>
                    <td>{point.free_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
