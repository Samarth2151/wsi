import type { StorageLocation } from '../../types/wms';

const COLUMNS = ['A', 'B', 'C', 'D', 'E'] as const;
const ROWS = [1, 2, 3, 4, 5] as const;

interface WarehouseMapGridProps {
  locations: StorageLocation[];
  selectedCode: string | null;
  disabled?: boolean;
  onSelect: (code: string) => void;
}

function getSlotLabel(location: StorageLocation): string {
  if (location.location_type === 'TRANSFER') {
    return `${location.code}, transfer point. Pallets cannot be stored here. Select for details.`;
  }

  if (location.status === 'OCCUPIED' && location.pallet) {
    return `${location.code}, occupied by ${location.pallet.pallet_number}, ${location.pallet.item_name}. Select for details.`;
  }

  return `${location.code}, free storage slot. Select for details and loading.`;
}

export function WarehouseMapGrid({
  locations,
  selectedCode,
  disabled = false,
  onSelect,
}: WarehouseMapGridProps) {
  const locationsByCode = new Map(
    locations.map((location) => [location.code, location]),
  );

  return (
    <div className="warehouse-grid-scroll">
      <table
        className="warehouse-grid"
        aria-label="Warehouse locations, rows 1 through 5 and columns A through E"
      >
        <thead>
          <tr>
            <th className="grid-axis-label" scope="col">Row</th>
            {COLUMNS.map((column) => (
              <th className="grid-column-label" scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <th className="grid-row-label" scope="row">
                {row}
              </th>
              {COLUMNS.map((column) => {
                const code = `${column}${row}`;
                const location = locationsByCode.get(code);

                return (
                  <td className="grid-location-cell" key={code}>
                    {location ? (
                      <button
                        aria-label={getSlotLabel(location)}
                        aria-pressed={selectedCode === code}
                        className={[
                          'slot-button',
                          `slot-button--${location.status.toLowerCase()}`,
                          selectedCode === code ? 'is-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        data-testid={`slot-${code}`}
                        disabled={disabled}
                        onClick={() => onSelect(code)}
                        type="button"
                      >
                        <span className="slot-code">{code}</span>
                        {location.location_type === 'TRANSFER' ? (
                          <span className="slot-caption">Transfer Point</span>
                        ) : location.status === 'OCCUPIED' && location.pallet ? (
                          <>
                            <span className="slot-pallet-number">
                              {location.pallet.pallet_number}
                            </span>
                            <span className="slot-item-name">
                              {location.pallet.item_name}
                            </span>
                          </>
                        ) : (
                          <span className="slot-caption">Free</span>
                        )}
                      </button>
                    ) : (
                      <span
                        aria-label={`${code}, location data unavailable`}
                        className="slot-unavailable"
                        role="img"
                      >
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
