import clsx from 'clsx';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

export const toneIcon: Record<Tone, string> = {
  primary: 'bg-primary-light text-primary border-primary-clarity',
  success: 'bg-success-light text-success border-success-clarity',
  warning: 'bg-warning-light text-warning border-warning-clarity',
  danger: 'bg-danger-light text-danger border-danger-clarity',
  info: 'bg-info-light text-info border-info-clarity',
  gray: 'bg-gray-100 text-gray-600 border-gray-200'
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: string;
  tone?: Tone;
  hint?: ReactNode;
  trend?: number;
  trendLabel?: string;
  to?: string;
  footer?: ReactNode;
}

/** KPI tile: icon, label, big value and an optional trend or hint line. */
const StatCard = ({ label, value, icon, tone = 'primary', hint, trend, trendLabel, to, footer }: StatCardProps) => {
  const body = (
    <div
      className={clsx(
        'card h-full p-4 lg:p-5 flex flex-col gap-3 transition-shadow',
        to && 'hover:shadow-card hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-2sm font-medium text-gray-600 leading-snug">{label}</span>
        <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-lg border', toneIcon[tone])}>
          <KeenIcon icon={icon} className="text-lg" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold leading-none text-gray-900 tabular-nums">{value}</span>
        {trend !== undefined && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trend >= 0 ? 'text-success' : 'text-danger'
            )}
            title={trendLabel}
          >
            <KeenIcon icon={trend >= 0 ? 'arrow-up' : 'arrow-down'} className="text-2xs" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {hint && <div className="text-xs text-gray-500 -mt-1">{hint}</div>}
      {footer}
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
};

export { StatCard };
