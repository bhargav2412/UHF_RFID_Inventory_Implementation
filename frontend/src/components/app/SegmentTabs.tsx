import clsx from 'clsx';

interface SegmentTabsProps<V extends string> {
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string; count?: number }[];
  className?: string;
}

/** Horizontally scrollable pill tabs — stays usable on narrow screens. */
function SegmentTabs<V extends string>({ value, onChange, options, className }: SegmentTabsProps<V>) {
  return (
    <div className={clsx('scrollable-x-auto', className)}>
      <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-2sm font-medium transition-colors',
              value === o.value
                ? 'bg-light text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 border border-transparent'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={clsx(
                  'rounded-full px-1.5 text-2xs leading-4',
                  value === o.value ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { SegmentTabs };
