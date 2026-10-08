import clsx from 'clsx';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  DataTable,
  PageHeader,
  StatCard,
  TwoLine,
  baseChartOptions,
  fmtCurrency,
  fmtNumber
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchVariance } from '@/services/api';
import { VarianceLine } from '@/services/types';

const VarianceReportPage = () => {
  const { data, loading } = useApiData(fetchVariance);
  const lines = data ?? [];
  const shortage = lines.filter((l) => l.variance < 0);
  const excess = lines.filter((l) => l.variance > 0);
  const netValue = lines.reduce((s, l) => s + l.value, 0);
  const reasons = Array.from(new Set(lines.map((l) => l.reason ?? 'Unknown')));
  const sessions = Array.from(new Set(lines.map((l) => l.session)));

  return (
    <Container>
      <PageHeader
        title="Variance Report"
        icon="chart-line-down-2"
        description="Differences between book stock and RFID-counted stock, by session, item and value."
        crumbs={[{ label: 'Inventory Audit' }, { label: 'Variance Report' }]}
        actions={
          <button className="btn btn-sm btn-light" onClick={() => window.print()}>
            <KeenIcon icon="printer" /> Print
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Lines with variance" value={fmtNumber(lines.length)} icon="information-2" />
        <StatCard label="Shortages" value={fmtNumber(shortage.reduce((s, l) => s + l.variance, 0))} icon="arrow-down" tone="danger" hint={`${shortage.length} lines`} />
        <StatCard label="Excess" value={`+${fmtNumber(excess.reduce((s, l) => s + l.variance, 0))}`} icon="arrow-up" tone="warning" hint={`${excess.length} lines`} />
        <StatCard label="Net value impact" value={fmtCurrency(netValue, true)} icon="dollar" tone={netValue < 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5 mb-5 lg:mb-7.5">
        <ChartCard
          title="Variance by reason"
          subtitle="Number of lines"
          type="bar"
          height={260}
          series={[{ name: 'Lines', data: reasons.map((r) => lines.filter((l) => (l.reason ?? 'Unknown') === r).length) }]}
          options={baseChartOptions({
            plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 3 } },
            xaxis: { categories: reasons },
            legend: { show: false }
          })}
        />
        <ChartCard
          title="Value impact by session"
          subtitle="Net ₹ per count session"
          type="bar"
          height={260}
          series={[{ name: 'Value', data: sessions.map((s) => Math.round(lines.filter((l) => l.session === s).reduce((a, l) => a + l.value, 0))) }]}
          options={baseChartOptions({
            plotOptions: { bar: { columnWidth: '45%', borderRadius: 3, colors: { ranges: [{ from: -1e12, to: -0.01, color: 'var(--tw-danger)' }] } } },
            colors: ['var(--tw-success)'],
            xaxis: { categories: sessions },
            yaxis: { labels: { formatter: (v: number) => fmtCurrency(v, true) } },
            tooltip: { y: { formatter: (v: number) => fmtCurrency(v) } },
            legend: { show: false }
          })}
        />
      </div>

      <DataTable<VarianceLine>
        title="Variance lines"
        data={lines}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="variance-report"
        searchKeys={['itemName', 'itemSku', 'location', 'session']}
        filters={[
          { key: 'session', label: 'Sessions', options: sessions.map((s) => ({ value: s, label: s })) },
          {
            key: 'direction',
            label: 'Directions',
            options: [
              { value: 'short', label: 'Shortage' },
              { value: 'excess', label: 'Excess' }
            ],
            match: (r, v) => (v === 'short' ? r.variance < 0 : r.variance > 0)
          },
          { key: 'reason', label: 'Reasons', options: reasons.map((r) => ({ value: r, label: r })) }
        ]}
        initialSort={{ key: 'value', dir: 'asc' }}
        columns={[
          { key: 'itemName', header: 'Item', primary: true, sortable: true, render: (r) => <TwoLine title={r.itemName} sub={r.itemSku} /> },
          { key: 'session', header: 'Session', hideOnMobile: true },
          { key: 'location', header: 'Location', hideOnMobile: true },
          { key: 'expected', header: 'Book', align: 'end', sortable: true },
          { key: 'counted', header: 'Counted', align: 'end', sortable: true },
          {
            key: 'variance',
            header: 'Variance',
            align: 'end',
            sortable: true,
            render: (r) => (
              <span className={clsx('font-semibold', r.variance < 0 ? 'text-danger' : 'text-warning')}>
                {r.variance > 0 ? '+' : ''}
                {r.variance}
              </span>
            )
          },
          { key: 'value', header: 'Value', align: 'end', sortable: true, render: (r) => <span className={r.value < 0 ? 'text-danger' : 'text-gray-800'}>{fmtCurrency(r.value)}</span> },
          { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '—' }
        ]}
      />
    </Container>
  );
};

export { VarianceReportPage };
