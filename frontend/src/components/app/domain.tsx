import clsx from 'clsx';
import { ReactNode } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { AlertType, MovementType } from '@/services/types';
import { Tone, toneIcon } from './StatCard';
import { shortEpc } from './format';

export const MOVEMENT_META: Record<MovementType, { label: string; icon: string; tone: Tone }> = {
  receive: { label: 'Received', icon: 'entrance-left', tone: 'success' },
  putaway: { label: 'Put away', icon: 'element-plus', tone: 'info' },
  transfer: { label: 'Transfer', icon: 'arrow-right-left', tone: 'primary' },
  issue: { label: 'Issued', icon: 'exit-right', tone: 'warning' },
  adjustment: { label: 'Adjustment', icon: 'setting-4', tone: 'danger' },
  scan: { label: 'Scan', icon: 'scan-barcode', tone: 'gray' },
  return: { label: 'Return', icon: 'arrow-circle-left', tone: 'info' }
};

export const ALERT_META: Record<AlertType, { label: string; icon: string }> = {
  missing_item: { label: 'Missing items', icon: 'question-2' },
  unauthorized_movement: { label: 'Unauthorized movement', icon: 'shield-cross' },
  duplicate_epc: { label: 'Duplicate EPC', icon: 'copy' },
  epc_tid_mismatch: { label: 'EPC/TID mismatch', icon: 'disconnect' },
  reader_offline: { label: 'Reader offline', icon: 'router' },
  low_stock: { label: 'Low stock', icon: 'chart-line-down' },
  tag_not_responding: { label: 'Tag not responding', icon: 'wifi-square' },
  expired_asset: { label: 'Expired assets', icon: 'calendar-remove' }
};

/** Small coloured icon + label used for movement types in tables. */
export const MovementTypeCell = ({ type }: { type: MovementType }) => {
  const meta = MOVEMENT_META[type];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className={clsx('flex size-7 items-center justify-center rounded-md border', toneIcon[meta.tone])}>
        <KeenIcon icon={meta.icon} className="text-sm" />
      </span>
      <span className="text-2sm text-gray-800">{meta.label}</span>
    </span>
  );
};

/** Monospace, truncated EPC with full value in the tooltip. */
export const EpcText = ({ epc, size = 6 }: { epc?: string; size?: number }) => (
  <span className="font-mono text-xs text-gray-700" title={epc}>
    {shortEpc(epc, size)}
  </span>
);

/** Two-line cell: primary text + muted secondary text. */
export const TwoLine = ({ title, sub }: { title: ReactNode; sub?: ReactNode }) => (
  <div className="flex flex-col min-w-0">
    <span className="text-2sm font-medium text-gray-900 truncate">{title}</span>
    {sub && <span className="text-xs text-gray-500 truncate">{sub}</span>}
  </div>
);
