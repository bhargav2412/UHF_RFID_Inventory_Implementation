import { useState } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  ErrorState,
  LoadingState,
  PageHeader,
  SegmentTabs,
  StatCard,
  baseChartOptions,
  fmtCurrency,
  titleCase
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchExecutiveDashboard } from '@/services/api';

type Range = '3m' | '6m' | '12m';

const ExecutiveDashboardPage = () => {
  const { data, loading, error, reload } = useApiData(fetchExecutiveDashboard);
  const [range, setRange] = useState<Range>('12m');

  const header = (
    <PageHeader
      title="Executive Dashboard"
      icon="graph-up"
      description="Inventory value, turnover, utilisation and accuracy trends for management review."
      crumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Executive' }]}
      actions={
        <>
          <SegmentTabs<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '3m', label: '3M' },
              { value: '6m', label: '6M' },
              { value: '12m', label: '12M' }
            ]}
          />
          <button className="btn btn-sm btn-light" onClick={() => window.print()}>
            <KeenIcon icon="printer" /> Print
          </button>
        </>
      }
    />
  );

  if (loading && !data) return <Container>{header}<div className="card"><LoadingState /></div></Container>;
  if (error || !data) return <Container>{header}<div className="card"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div></Container>;

  const n = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const months = data.months.slice(-n);
  const slice = <T,>(arr: T[]) => arr.slice(-n);
  const k = data.kpis;

  return (
    <Container>
      {header}
      <div className="flex flex-col gap-5 lg:gap-7.5">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-5">
          <StatCard label="Stock value" value={fmtCurrency(k.stockValue, true)} icon="dollar" trend={k.stockValueChange} trendLabel="vs last quarter" />
          <StatCard label="Inventory turnover" value={`${k.turnover}×`} icon="arrows-loop" tone="info" hint="Annualised" />
          <StatCard label="Inventory accuracy" value={`${k.accuracy}%`} icon="verify" tone="success" trend={0.4} />
          <StatCard label="Warehouse utilisation" value={`${k.utilization}%`} icon="home-2" tone="warning" hint="Bins occupied" />
          <StatCard label="Shrinkage" value={`${k.shrinkage}%`} icon="chart-line-down" tone="danger" trend={-0.1} hint="Of stock value" />
          <StatCard label="Active warehouses" value={data.utilization.length} icon="geolocation" tone="gray" hint="3 cities" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
          <ChartCard
            title="Inventory trends"
            subtitle="Units received vs issued and on-hand level"
            type="line"
            series={[
              { name: 'Received', type: 'column', data: slice(data.inventoryTrend.inbound) },
              { name: 'Issued', type: 'column', data: slice(data.inventoryTrend.outbound) },
              { name: 'On hand', type: 'line', data: slice(data.inventoryTrend.onHand) }
            ]}
            options={baseChartOptions({
              stroke: { width: [0, 0, 3], curve: 'smooth' },
              plotOptions: { bar: { columnWidth: '45%', borderRadius: 3 } },
              xaxis: { categories: months },
              yaxis: [
                { title: { text: 'Units moved' }, labels: { style: { colors: 'var(--tw-gray-500)' } } },
                { show: false },
                { opposite: true, title: { text: 'On hand' }, labels: { style: { colors: 'var(--tw-gray-500)' } } }
              ]
            })}
          />
          <ChartCard
            title="Stock value trend"
            subtitle="Month-end inventory valuation (₹)"
            type="area"
            series={[{ name: 'Stock value', data: slice(data.stockValueTrend) }]}
            options={baseChartOptions({
              stroke: { curve: 'smooth', width: 2 },
              fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
              colors: ['var(--tw-success)'],
              xaxis: { categories: months },
              yaxis: { labels: { formatter: (v: number) => fmtCurrency(v, true) } },
              tooltip: { y: { formatter: (v: number) => fmtCurrency(v) } },
              legend: { show: false }
            })}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
          <ChartCard
            title="Warehouse utilisation"
            subtitle="Share of bin capacity in use"
            type="radialBar"
            height={300}
            series={data.utilization.map((u) => u.value)}
            options={baseChartOptions({
              labels: data.utilization.map((u) => u.name.split(' ')[0]),
              plotOptions: {
                radialBar: {
                  hollow: { size: '38%' },
                  track: { background: 'var(--tw-gray-100)' },
                  dataLabels: { total: { show: true, label: 'Average', formatter: () => `${k.utilization}%` } }
                }
              },
              legend: { show: true, position: 'bottom', horizontalAlign: 'center' }
            })}
          />
          <ChartCard
            title="Inventory accuracy trend"
            subtitle="Result of completed counts"
            type="line"
            height={300}
            series={[{ name: 'Accuracy %', data: slice(data.accuracyTrend) }]}
            options={baseChartOptions({
              stroke: { curve: 'smooth', width: 3 },
              markers: { size: 4 },
              colors: ['var(--tw-primary)'],
              xaxis: { categories: months },
              yaxis: { min: 95, max: 100, labels: { formatter: (v: number) => `${v.toFixed(1)}%` } },
              annotations: { yaxis: [{ y: 98, borderColor: 'var(--tw-success)', strokeDashArray: 4, label: { text: 'Target 98%', style: { background: 'var(--tw-success)', color: '#fff' } } }] },
              legend: { show: false }
            })}
          />
          <ChartCard
            className="lg:col-span-2 xl:col-span-1"
            title="Stock value by category"
            type="donut"
            height={300}
            series={data.categoryValue.map((c) => Math.round(c.value))}
            options={baseChartOptions({
              labels: data.categoryValue.map((c) => c.category),
              legend: { position: 'bottom', horizontalAlign: 'center' },
              tooltip: { y: { formatter: (v: number) => fmtCurrency(v) } },
              plotOptions: { pie: { donut: { size: '62%' } } },
              stroke: { width: 2, colors: ['var(--tw-light)'] }
            })}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
          <ChartCard
            title="Movement analysis"
            subtitle="Transactions per month by type"
            type="bar"
            series={data.movementAnalysis.map((m) => ({ name: titleCase(m.name), data: slice(m.data) }))}
            options={baseChartOptions({
              chart: { stacked: true },
              plotOptions: { bar: { columnWidth: '50%', borderRadius: 2 } },
              xaxis: { categories: months }
            })}
          />
          <ChartCard
            title="Zone activity heat map"
            subtitle="Ahmedabad Central DC — read intensity by weekday"
            type="heatmap"
            series={data.heatmap}
            options={baseChartOptions({
              plotOptions: {
                heatmap: {
                  radius: 4,
                  shadeIntensity: 0.5,
                  colorScale: {
                    ranges: [
                      { from: 0, to: 25, color: '#BFDBFE', name: 'Low' },
                      { from: 26, to: 55, color: '#60A5FA', name: 'Medium' },
                      { from: 56, to: 80, color: '#2563EB', name: 'High' },
                      { from: 81, to: 100, color: '#1E3A8A', name: 'Peak' }
                    ]
                  }
                }
              },
              stroke: { width: 2, colors: ['var(--tw-light)'] },
              legend: { position: 'bottom', horizontalAlign: 'center' }
            })}
          />
        </div>
      </div>
    </Container>
  );
};

export { ExecutiveDashboardPage };
