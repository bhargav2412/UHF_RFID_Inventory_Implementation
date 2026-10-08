import { KeenIcon } from '@/components/keenicons';
import { DashboardStats } from './types';

interface DashboardStatCardsProps {
  stats: DashboardStats;
}

type StatTone = 'primary' | 'success' | 'info' | 'warning' | 'danger';

const toneStyles: Record<StatTone, string> = {
  primary: 'bg-primary-clarity border-primary-clarity text-primary',
  success: 'bg-success-clarity border-success-clarity text-success',
  info: 'bg-info-clarity border-info-clarity text-info',
  warning: 'bg-warning-clarity border-warning-clarity text-warning',
  danger: 'bg-danger-clarity border-danger-clarity text-danger'
};

const StatCard = ({
  icon,
  tone,
  label,
  value,
  subtext
}: {
  icon: string;
  tone: StatTone;
  label: string;
  value: number | string;
  subtext?: string;
}) => (
  <div className="card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <div
        className={`flex items-center justify-center size-11 rounded-lg border shrink-0 ${toneStyles[tone]}`}
      >
        <KeenIcon icon={icon} style="solid" className="text-xl" />
      </div>
      {subtext && (
        <span className="text-xs text-gray-500 dark:text-gray-600 text-end">{subtext}</span>
      )}
    </div>
    <div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <p className="text-sm text-gray-600 dark:text-gray-700 mt-1">{label}</p>
    </div>
  </div>
);

const DashboardStatCards = ({ stats }: DashboardStatCardsProps) => {
  const netMovement = stats.movement.inbound - stats.movement.outbound;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
      <StatCard
        icon="home-2"
        tone="primary"
        label="Warehouses"
        value={stats.total_warehouses}
      />
      <StatCard
        icon="book"
        tone="success"
        label="Total Stock"
        value={stats.total_stock}
        subtext="Across all sites"
      />
      <StatCard
        icon="technology-2"
        tone="info"
        label="Active Machines"
        value={stats.active_machines}
        subtext={`${stats.total_machines} total`}
      />
      <StatCard
        icon="arrow-up"
        tone="success"
        label="Inbound Scans"
        value={stats.movement.inbound}
        subtext="All time"
      />
      <StatCard
        icon="arrow-down"
        tone="danger"
        label="Outbound Scans"
        value={stats.movement.outbound}
        subtext={`Net: ${netMovement >= 0 ? '+' : ''}${netMovement}`}
      />
      <StatCard
        icon="barcode"
        tone="warning"
        label="Uncounted Tags"
        value={stats.uncounted_entries}
        subtext={`${stats.total_items} catalog items`}
      />
    </div>
  );
};

export { DashboardStatCards };
