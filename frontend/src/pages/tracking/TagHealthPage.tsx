import { Container } from '@/components/container';
import {
  ChartCard,
  DataTable,
  EpcText,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
  TwoLine,
  baseChartOptions,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchTags } from '@/services/api';
import { RfidTag } from '@/services/types';

const BUCKETS = [
  { label: '-40 to -50', min: -50, max: -40 },
  { label: '-50 to -60', min: -60, max: -50 },
  { label: '-60 to -70', min: -70, max: -60 },
  { label: '-70 to -80', min: -80, max: -70 },
  { label: 'below -80', min: -200, max: -80 }
];

const TagHealthPage = () => {
  const { data, loading } = useApiData(fetchTags);
  const tags = (data ?? []).filter((t) => t.status !== 'unassigned');
  const weak = tags.filter((t) => t.health < 60);
  const avg = tags.length ? Math.round(tags.reduce((s, t) => s + t.health, 0) / tags.length) : 0;
  const stale = tags.filter((t) => t.lastSeen && Date.now() - new Date(t.lastSeen).getTime() > 3 * 864e5);

  return (
    <Container>
      <PageHeader
        title="RFID Tag Health"
        icon="pulse"
        description="Spot weak, damaged or silent tags before they cause count variances."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Tag Health' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Average health score" value={`${avg}/100`} icon="pulse" tone="success" />
        <StatCard label="Weak tags (<60)" value={fmtNumber(weak.length)} icon="wifi-square" tone="warning" />
        <StatCard label="Not read in 3+ days" value={fmtNumber(stale.length)} icon="time" tone="danger" />
        <StatCard label="Monitored tags" value={fmtNumber(tags.length)} icon="tag" tone="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5 mb-5 lg:mb-7.5">
        <div className="xl:col-span-2 min-w-0">
          <ChartCard
            title="RSSI distribution"
            subtitle="Signal strength of last read (dBm)"
            type="bar"
            height={260}
            series={[{ name: 'Tags', data: BUCKETS.map((b) => tags.filter((t) => (t.rssi ?? -100) > b.min && (t.rssi ?? -100) <= b.max).length) }]}
            options={baseChartOptions({
              plotOptions: { bar: { columnWidth: '50%', borderRadius: 4, distributed: true } },
              colors: ['var(--tw-success)', 'var(--tw-success)', 'var(--tw-info)', 'var(--tw-warning)', 'var(--tw-danger)'],
              xaxis: { categories: BUCKETS.map((b) => b.label) },
              legend: { show: false }
            })}
          />
        </div>
        <ChartCard
          title="Tags by status"
          type="donut"
          height={260}
          series={['active', 'inactive', 'damaged', 'lost'].map((s) => tags.filter((t) => t.status === s).length)}
          options={baseChartOptions({
            labels: ['Active', 'Inactive', 'Damaged', 'Lost'],
            colors: ['var(--tw-success)', 'var(--tw-gray-400)', 'var(--tw-warning)', 'var(--tw-danger)'],
            legend: { position: 'bottom', horizontalAlign: 'center' },
            stroke: { width: 2, colors: ['var(--tw-light)'] }
          })}
        />
      </div>

      <DataTable<RfidTag>
        title="Tags needing attention"
        subtitle="Health below 60 or not read for 3+ days"
        data={Array.from(new Set([...weak, ...stale]))}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="tag-health"
        searchKeys={['epc', 'itemName', 'itemSku', 'location']}
        initialSort={{ key: 'health', dir: 'asc' }}
        columns={[
          { key: 'epc', header: 'EPC', primary: true, render: (r) => <EpcText epc={r.epc} /> },
          { key: 'itemName', header: 'Item', render: (r) => <TwoLine title={r.itemName} sub={r.itemSku} /> },
          { key: 'location', header: 'Last location', hideOnMobile: true },
          { key: 'rssi', header: 'RSSI', align: 'end', sortable: true, render: (r) => `${r.rssi ?? '—'} dBm` },
          { key: 'health', header: 'Health', sortable: true, className: 'min-w-[130px]', render: (r) => <ProgressBar value={r.health} tone={r.health < 40 ? 'danger' : 'warning'} showLabel /> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'lastSeen', header: 'Last seen', sortable: true, value: (r) => (r.lastSeen ? +new Date(r.lastSeen) : 0), render: (r) => timeAgo(r.lastSeen) }
        ]}
      />
    </Container>
  );
};

export { TagHealthPage };
