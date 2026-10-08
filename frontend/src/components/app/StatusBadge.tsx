import clsx from 'clsx';
import { titleCase } from './format';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gray';

/** Central mapping from any status/severity value used in the app to a colour. */
const STATUS_TONES: Record<string, BadgeTone> = {
  // generic
  active: 'success',
  online: 'success',
  completed: 'success',
  approved: 'success',
  resolved: 'success',
  connected: 'success',
  found: 'success',
  available: 'success',
  returned: 'gray',
  closed: 'gray',
  // in progress
  in_progress: 'primary',
  in_use: 'primary',
  investigating: 'primary',
  acknowledged: 'info',
  scheduled: 'info',
  pending: 'warning',
  draft: 'gray',
  invited: 'info',
  operation: 'primary',
  deployment: 'info',
  procurement: 'gray',
  // warning
  degraded: 'warning',
  due: 'warning',
  maintenance: 'warning',
  unassigned: 'gray',
  inactive: 'gray',
  open: 'warning',
  new: 'danger',
  // bad
  offline: 'danger',
  overdue: 'danger',
  damaged: 'danger',
  lost: 'danger',
  cancelled: 'gray',
  rejected: 'danger',
  error: 'danger',
  disconnected: 'gray',
  disabled: 'gray',
  retired: 'gray',
  written_off: 'danger',
  disposal: 'gray',
  // severity
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'info'
};

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  primary: 'badge-primary',
  gray: ''
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}

const StatusBadge = ({ status, label, dot = true, className }: StatusBadgeProps) => {
  const tone = STATUS_TONES[status] ?? 'gray';
  return (
    <span className={clsx('badge badge-sm badge-outline gap-1.5 whitespace-nowrap', TONE_CLASS[tone], className)}>
      {dot && <span className={clsx('badge badge-dot size-1.5', TONE_CLASS[tone] || 'bg-gray-400')} />}
      {label ?? titleCase(status)}
    </span>
  );
};

export { StatusBadge, STATUS_TONES };
export type { BadgeTone };
