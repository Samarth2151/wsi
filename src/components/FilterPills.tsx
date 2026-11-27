export interface FilterPillOption<Value extends string> {
  value: Value;
  label: string;
}

interface FilterPillsProps<Value extends string> {
  label: string;
  options: readonly FilterPillOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function FilterPills<Value extends string>({
  label,
  options,
  value,
  onChange,
}: FilterPillsProps<Value>) {
  return (
    <div className="filter-pills" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className="filter-pill"
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
