import { Link } from 'react-router-dom';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MovementTypeCell,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
  TwoLine,
  baseChartOptions,
  fmtCompact,
  fmtDateTime,
  fmtNumber,
  timeAgo,
  MOVEMENT_META
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchMainDashboard } from '@/services/api';
import { MovementType } from '@/services/types';

const MainDashboardPage = () => {
  const { data, loading, error, reload } = useApiData(fetchMainDashboard);

  const header = (
    <PageHeader
      title="Inventory Overview"
      icon="element-11"
      description="Real-time view of stock, RFID reads, reader health and warehouse capacity."
      actions={
        <>
          <span className="hidden sm:inline text-xs text-gray-500">Updated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          <button className="btn btn-sm btn-light" onClick={reload}>
            <KeenIcon icon="arrows-circle" /> Refresh
          </button>
          <Link to="/operations/receiving" className="btn btn-sm btn-primary">
            <KeenIcon icon="plus" /> Receive goods
          </Link>
        </>
      }
    />
  );

  if (loading && !data) return <Container>{header}<div className="card"><LoadingState label="Loading dashboard…" /></div></Container>;
  if (error || !data) return <Container>{header}<div className="card"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div></Container>;

  const k = data.kpis;
  const mix = data.movementMix.filter((m) => m.count > 0);

  return (
    <Container>
      {header}

      <div className="flex flex-col gap-5 lg:gap-7.5">
        {/* KPI grid — 10 indicators from the design document */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-5">
          <StatCard label="Total inventory items" value={fmtNumber(k.totalItems)} icon="cube-3" hint={`${fmtNumber(k.totalUnits)} units on hand`} to="/inventory/items" />
          <StatCard label="Items in stock" value={fmtNumber(k.inStock)} icon="check-circle" tone="success" hint={`${Math.round((k.inStock / k.totalItems) * 100)}% of catalogue`} />
          <StatCard label="Items out of stock" value={fmtNumber(k.outOfStock)} icon="cross-circle" tone="danger" hint="Need replenishment" to="/reports/inventory" />
          <StatCard label="Low stock alerts" value={fmtNumber(k.lowStock)} icon="chart-line-down" tone="warning" hint="At or below reorder level" to="/alerts?type=low_stock" />
          <StatCard label="Inventory accuracy" value={`${k.accuracy}%`} icon="verify" tone="success" trend={0.4} trendLabel="vs last month" to="/audit/variance" />
          <StatCard label="Today's RFID reads" value={fmtCompact(k.todaysReads)} icon="scan-barcode" tone="info" trend={8.2} trendLabel="vs yesterday" to="/tracking/live" />
          <StatCard label="Items moved today" value={fmtNumber(k.movedToday)} icon="arrow-right-left" tone="primary" hint="Receipts, transfers and issues" to="/tracking/movements" />
          <StatCard label="Missing items" value={fmtNumber(k.missingItems)} icon="question-2" tone="danger" hint="Open investigations" to="/audit/missing-items" />
          <StatCard label="Unidentified tags" value={fmtNumber(k.unidentifiedTags)} icon="tag-cross" tone="warning" hint="Read but not registered" to="/inventory/rfid-tags" />
          <StatCard
            label="Reader status"
            value={
              <span>
                {k.readersOnline}
                <span className="text-base text-gray-500 font-medium">/{k.readersTotal}</span>
              </span>
            }
            icon="router"
            tone={k.readersOnline === k.readersTotal ? 'success' : 'warning'}
            hint={`${k.readersTotal - k.readersOnline} need attention`}
            to="/inventory/machines"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
          <div className="xl:col-span-2 min-w-0">
            <ChartCard
              title="RFID reads by hour"
              subtitle="All readers, last 24 hours"
              type="area"
              height={290}
              series={[{ name: 'Reads', data: data.readsTrend.reads }]}
              options={baseChartOptions({
                stroke: { curve: 'smooth', width: 2 },
                fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
                xaxis: { categories: data.readsTrend.labels, tickAmount: 8 },
                legend: { show: false }
              })}
            />
          </div>
          <ChartCard
            title="Movement mix"
            subtitle="Last 7 days by transaction type"
            type="donut"
            height={290}
            series={mix.map((m) => m.count)}
            options={baseChartOptions({
              labels: mix.map((m) => MOVEMENT_META[m.type as MovementType].label),
              legend: { position: 'bottom', horizontalAlign: 'center' },
              plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Movements' } } } } },
              stroke: { width: 2, colors: ['var(--tw-light)'] }
            })}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
          {/* Warehouse occupancy */}
          <div className="card">
            <div className="card-header py-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="card-title">Warehouse occupancy</h3>
                <span className="text-xs text-gray-500">Overall {k.occupancy}% of bin capacity used</span>
              </div>
              <Link to="/tracking/locations" className="btn btn-xs btn-link">View zones</Link>
            </div>
            <div className="card-body flex flex-col gap-5">
              {data.warehouses.map((w) => {
                const pct = Math.round((w.occupied / w.capacity) * 100);
                return (
                  <div key={w.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <TwoLine title={w.name} sub={`${fmtNumber(w.occupied)} / ${fmtNumber(w.capacity)} bins`} />
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} tone="auto" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent movements */}
          <div className="xl:col-span-2 min-w-0">
            <DataTable
              title="Recent movements"
              subtitle="Latest stock transactions captured by RFID"
              toolbar={<Link to="/tracking/movements" className="btn btn-xs btn-link">View all</Link>}
              data={data.recentMovements}
              rowKey={(r) => r.id}
              pageSize={5}
              columns={[
                { key: 'type', header: 'Type', render: (r) => <MovementTypeCell type={r.type} /> },
                { key: 'itemName', header: 'Item', primary: true, render: (r) => <TwoLine title={r.itemName} sub={r.itemSku} /> },
                { key: 'to', header: 'Location', render: (r) => <span className="text-2sm">{r.to}</span>, hideOnMobile: true },
                { key: 'quantity', header: 'Qty', align: 'end' },
                { key: 'timestamp', header: 'When', align: 'end', render: (r) => <span title={fmtDateTime(r.timestamp)}>{timeAgo(r.timestamp)}</span> }
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
          {/* Low stock */}
          <div className="card">
            <div className="card-header py-4">
              <h3 className="card-title">Low stock</h3>
              <Link to="/reports/inventory" className="btn btn-xs btn-link">Reorder report</Link>
            </div>
            <div className="card-body p-0 divide-y divide-gray-100">
              {data.lowStockItems.length === 0 && <EmptyState compact title="All items above reorder level" icon="check-circle" />}
              {data.lowStockItems.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <TwoLine title={i.name} sub={`${i.sku} · reorder at ${i.reorderLevel}`} />
                  <span className={`badge badge-sm badge-outline ${i.onHand === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {i.onHand} {i.uom}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active alerts */}
          <div className="card">
            <div className="card-header py-4">
              <h3 className="card-title">Active alerts</h3>
              <Link to="/alerts" className="btn btn-xs btn-link">Alert center</Link>
            </div>
            <div className="card-body p-0 divide-y divide-gray-100">
              {data.alerts.map((a) => (
                <Link key={a.id} to={`/alerts?type=${a.type}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                  <TwoLine title={a.title} sub={a.message} />
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={a.severity} />
                    <span className="text-2xs text-gray-500">{timeAgo(a.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Reader health */}
          <div className="card lg:col-span-2 xl:col-span-1">
            <div className="card-header py-4">
              <h3 className="card-title">Reader health</h3>
              <Link to="/tracking/live" className="btn btn-xs btn-link">Live view</Link>
            </div>
            <div className="card-body p-0 divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
              {data.readers.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <TwoLine title={`${r.code} · ${r.name}`} sub={r.zone} />
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={r.status} />
                    <span className="text-2xs text-gray-500">{r.readsPerMin}/min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export { MainDashboardPage };
