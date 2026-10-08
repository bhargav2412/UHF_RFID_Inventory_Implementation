import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'auto';
  showLabel?: boolean;
  className?: string;
}

/** Thin progress bar; `auto` tone turns amber above 80% and red above 95%. */
const ProgressBar = ({ value, max = 100, tone = 'primary', showLabel, className }: ProgressBarProps) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const resolved = tone === 'auto' ? (pct >= 95 ? 'danger' : pct >= 80 ? 'warning' : 'success') : tone;
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div className={clsx('progress h-1.5 grow', `progress-${resolved}`)}>
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-700 tabular-nums w-9 text-end">{Math.round(pct)}%</span>}
    </div>
  );
};

export { ProgressBar };
