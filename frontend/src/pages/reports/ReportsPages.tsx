import clsx from 'clsx';
import { ReactNode, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  Column,
  DataTable,
  EpcText,
  LoadingState,
  MovementTypeCell,
  PageHeader,
  StatusBadge,
  TwoLine,
  baseChartOptions,
  fmtCurrency,
  fmtDateTime,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchReports } from '@/services/api';
import * as db from '@/services/mock/data';
import { ReportDefinition } from '@/services/types';

type Category = ReportDefinition['category'];

const CATEGORY: Record<Category, { title: string; icon: string; description: string }> = {
  inventory: { title: 'Inventory Reports', icon: 'cube-3', description: 'Stock on hand, valuation, reorder and ageing.' },
  rfid: { title: 'RFID Reports', icon: 'scan-barcode', description: 'Read volumes, reader uptime, tag health and encoding.' },
  movement: { title: 'Movement Reports', icon: 'arrow-right-left', description: 'Receipts, transfers, issues and dwell times.' },
  exception: { title: 'Exception Reports', icon: 'shield-cross', description: 'Unauthorised exits, variances and cloned tags.' }
};

/* ---------------- Reports dashboard ---------------- */

export const ReportsDashboardPage = () => {
  const { data, loading } = useApiData(fetchReports);
  const reports = data ?? [];

  return (
    <Container>
      <PageHeader
        title="Reports Dashboard"
        icon="chart-simple"
        description="Run, schedule and export operational reports. Every report can be downloaded as CSV, Excel or PDF."
        actions={
          <Link to="/reports/ai-insights" className="btn btn-sm btn-light">
            <KeenIcon icon="artificial-intelligence" /> AI insights
          </Link>
        }
      />
      {loading ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7.5">
          {(Object.keys(CATEGORY) as Category[]).map((c) => (
            <div key={c} className="card">
              <div className="card-header py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <KeenIcon icon={CATEGORY[c].icon} className="text-lg" />
                  </span>
                  <TwoLine title={CATEGORY[c].title} sub={CATEGORY[c].description} />
                </div>
                <Link to={`/reports/${c}`} className="btn btn-xs btn-link shrink-0">
                  Open
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {reports
                  .filter((r) => r.category === c)
                  .map((r) => (
                    <Link key={r.id} to={`/reports/${c}?report=${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                      <TwoLine title={r.name} sub={r.description} />
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="badge badge-xs badge-outline">{r.frequency}</span>
                        <span className="text-2xs text-gray-500">Last run {timeAgo(r.lastRun)}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

/* ---------------- Report previews ---------------- */

type Preview = { rows: Record<string, unknown>[]; columns: Column<Record<string, unknown>>[]; chart?: ReactNode };

const col = (key: string, header: string, extra: Partial<Column<Record<string, unknown>>> = {}): Column<Record<string, unknown>> => ({
  key,
  header,
  sortable: true,
  ...extra
});

const buildPreview = (id: string): Preview => {
  switch (id) {
    case 'r1':
    case 'r2':
      return {
        rows: db.items.map((i) => ({ sku: i.sku, name: i.name, category: i.category, onHand: i.onHand, value: i.onHand * i.unitCost })),
        columns: [col('sku', 'SKU'), col('name', 'Item', { primary: true }), col('category', 'Category'), col('onHand', 'On hand', { align: 'end' }), col('value', 'Value', { align: 'end', render: (r) => fmtCurrency(r.value as number) })]
      };
    case 'r3':
      return {
        rows: db.items.filter((i) => i.onHand <= i.reorderLevel).map((i) => ({ sku: i.sku, name: i.name, onHand: i.onHand, reorderLevel: i.reorderLevel, suggested: i.reorderLevel * 3 - i.onHand })),
        columns: [col('sku', 'SKU'), col('name', 'Item', { primary: true }), col('onHand', 'On hand', { align: 'end' }), col('reorderLevel', 'Reorder level', { align: 'end' }), col('suggested', 'Suggested order', { align: 'end' })]
      };
    case 'r5':
    case 'r6':
      return {
        rows: db.readers.map((r) => ({ code: r.code, name: r.name, location: r.location, status: r.status, readsPerMin: r.readsPerMin, uptime: r.status === 'offline' ? 82.4 : r.status === 'degraded' ? 96.1 : 99.8 })),
        columns: [col('code', 'Reader'), col('name', 'Name', { primary: true }), col('location', 'Site'), col('status', 'Status', { render: (r) => <StatusBadge status={r.status as string} /> }), col('readsPerMin', 'Reads/min', { align: 'end' }), col('uptime', 'Uptime %', { align: 'end' })]
      };
    case 'r7':
    case 'r8':
      return {
        rows: db.tags.slice(0, 120).map((t) => ({ epc: t.epc, item: t.itemName ?? '—', status: t.status, rssi: t.rssi ?? '', health: t.health })),
        columns: [col('epc', 'EPC', { primary: true, render: (r) => <EpcText epc={r.epc as string} /> }), col('item', 'Item'), col('status', 'Status', { render: (r) => <StatusBadge status={r.status as string} /> }), col('rssi', 'RSSI', { align: 'end' }), col('health', 'Health', { align: 'end' })]
      };
    case 'r12':
    case 'r14':
      return {
        rows: db.alerts
          .filter((a) => (id === 'r12' ? a.type === 'unauthorized_movement' : a.type === 'duplicate_epc' || a.type === 'epc_tid_mismatch'))
          .map((a) => ({ time: a.createdAt, title: a.title, message: a.message, location: a.location, severity: a.severity })),
        columns: [col('time', 'Time', { render: (r) => fmtDateTime(r.time as string) }), col('title', 'Event', { primary: true }), col('message', 'Details'), col('location', 'Location'), col('severity', 'Severity', { render: (r) => <StatusBadge status={r.severity as string} /> })]
      };
    case 'r13':
      return {
        rows: db.varianceLines.map((v) => ({ session: v.session, sku: v.itemSku, name: v.itemName, variance: v.variance, value: v.value })),
        columns: [col('session', 'Session'), col('sku', 'SKU'), col('name', 'Item', { primary: true }), col('variance', 'Variance', { align: 'end' }), col('value', 'Value', { align: 'end', render: (r) => fmtCurrency(r.value as number) })]
      };
    case 'r11':
      return {
        rows: db.allZones.map((z) => ({ zone: `${z.code} · ${z.name}`, warehouse: z.warehouse, avgHours: Number((2 + Math.random() * 70).toFixed(1)), items: z.itemCount })),
        columns: [col('zone', 'Zone', { primary: true }), col('warehouse', 'Warehouse'), col('avgHours', 'Avg dwell (h)', { align: 'end' }), col('items', 'Items', { align: 'end' })]
      };
    default:
      return {
        rows: db.movements
          .filter((m) => (id === 'r10' ? m.type === 'transfer' : m.type !== 'scan'))
          .map((m) => ({ time: m.timestamp, type: m.type, item: m.itemName, from: m.from, to: m.to, qty: m.quantity, ref: m.reference ?? '' })),
        columns: [
          col('time', 'Time', { render: (r) => fmtDateTime(r.time as string) }),
          col('type', 'Type', { render: (r) => <MovementTypeCell type={r.type as never} /> }),
          col('item', 'Item', { primary: true }),
          col('from', 'From'),
          col('to', 'To'),
          col('qty', 'Qty', { align: 'end' }),
          col('ref', 'Reference')
        ]
      };
  }
};

export const ReportCategoryPage = () => {
  const { category } = useParams<{ category: Category }>();
  const { data } = useApiData(fetchReports);
  const [params] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(params.get('report'));

  const list = (data ?? []).filter((r) => r.category === category);
  const active = list.find((r) => r.id === activeId) ?? list[0];
  const preview = useMemo(() => {
    if (!active) return null;
    const p = buildPreview(active.id);
    return { ...p, rows: p.rows.map((r, i) => ({ __key: `${active.id}-${i}`, ...r })) };
  }, [active]);

  if (!category || !(category in CATEGORY)) return <Navigate to="/reports" replace />;
  const meta = CATEGORY[category];

  return (
    <Container>
      <PageHeader
        title={meta.title}
        icon={meta.icon}
        description={meta.description}
        crumbs={[{ label: 'Reports', path: '/reports' }, { label: meta.title }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7.5">
        <div className="card h-fit">
          <div className="flex lg:flex-col gap-1 p-2 overflow-x-auto">
            {list.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={clsx(
                  'flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-start shrink-0 lg:shrink',
                  active?.id === r.id ? 'bg-primary-light text-primary' : 'hover:bg-gray-50 text-gray-800'
                )}
              >
                <span className="text-2sm font-medium whitespace-nowrap lg:whitespace-normal">{r.name}</span>
                <span className="hidden lg:block text-xs text-gray-500">{r.frequency}</span>
              </button>
            ))}
          </div>
        </div>

        {active && preview && (
          <div className="lg:col-span-3 flex flex-col gap-5 min-w-0">
            <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TwoLine title={active.name} sub={`${active.description} · last run ${timeAgo(active.lastRun)}`} />
              <div className="flex flex-wrap gap-2">
                {active.format.map((f) => (
                  <button key={f} className="btn btn-sm btn-light" onClick={() => toast.success(`${active.name} exported as ${f}`)}>
                    <KeenIcon icon="exit-down" /> {f}
                  </button>
                ))}
                <button className="btn btn-sm btn-primary" onClick={() => toast.success('Report scheduled — delivered by email')}>
                  <KeenIcon icon="calendar-add" /> Schedule
                </button>
              </div>
            </div>
            <DataTable<Record<string, unknown>>
              title="Preview"
              subtitle={`${fmtNumber(preview.rows.length)} rows`}
              data={preview.rows}
              rowKey={(r) => String(r.__key)}
              columns={preview.columns}
              exportName={active.name.toLowerCase().replace(/\s+/g, '-')}
              searchKeys={preview.columns.map((c) => (r: Record<string, unknown>) => String(r[c.key] ?? ''))}
            />
          </div>
        )}
      </div>
    </Container>
  );
};

/* ---------------- AI insights ---------------- */

export const AiInsightsPage = () => {
  const weeks = ['W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'Now', 'W+1', 'W+2', 'W+3', 'W+4'];
  const actual = [420, 455, 430, 480, 510, 495, 530, null, null, null, null];
  const forecast = [null, null, null, null, null, null, 530, 548, 572, 590, 605];

  const insights = [
    { icon: 'chart-line-up', tone: 'text-primary', title: 'Demand for Nitrile Gloves expected to rise 18%', body: 'Seasonal pattern detected from the last 2 years. Raise reorder level from 40 to 55 boxes.' },
    { icon: 'shield-cross', tone: 'text-danger', title: 'Unusual exit pattern at Dock Gate 2', body: '7 unauthorized reads between 22:00–23:30 this week, 4× the normal rate. Review CCTV and gate rules.' },
    { icon: 'time', tone: 'text-warning', title: '11 SKUs are slow-moving', body: 'No movement in 60+ days, ₹4.2L tied up. Consider transfer to Pune Spares Store or liquidation.' },
    { icon: 'router', tone: 'text-info', title: 'RDR-007 read rate degrading', body: 'Read rate down 35% over 10 days with stable traffic — likely antenna cable issue. Schedule inspection.' }
  ];

  return (
    <Container>
      <PageHeader
        title="AI Insights"
        icon="artificial-intelligence"
        description="Machine-learning forecasts and anomaly detection on RFID read and movement data."
        crumbs={[{ label: 'Reports', path: '/reports' }, { label: 'AI Insights' }]}
        badge={<span className="badge badge-sm badge-outline badge-primary">Beta</span>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
        <div className="xl:col-span-2 min-w-0">
          <ChartCard
            title="Demand forecast — all consumables"
            subtitle="Weekly units issued, with 4-week forecast"
            type="line"
            height={300}
            series={[
              { name: 'Actual', data: actual },
              { name: 'Forecast', data: forecast }
            ]}
            options={baseChartOptions({
              stroke: { width: [3, 3], dashArray: [0, 6], curve: 'smooth' },
              markers: { size: 3 },
              xaxis: { categories: weeks }
            })}
          />
        </div>
        <div className="card">
          <div className="card-header py-4">
            <h3 className="card-title">Model health</h3>
          </div>
          <div className="card-body flex flex-col gap-4">
            {[
              ['Forecast accuracy (MAPE)', '6.8%'],
              ['Anomalies flagged (7d)', '14'],
              ['Confirmed by users', '9'],
              ['Last trained', '2 hours ago']
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-2sm">
                <span className="text-gray-600">{k}</span>
                <span className="font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7.5">
          {insights.map((i) => (
            <div key={i.title} className="card p-5 flex gap-4">
              <span className={clsx('flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100', i.tone)}>
                <KeenIcon icon={i.icon} className="text-lg" />
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gray-900">{i.title}</span>
                <span className="text-2sm text-gray-600">{i.body}</span>
                <div className="flex gap-2 pt-1">
                  <button className="btn btn-xs btn-light" onClick={() => toast.success('Marked as useful')}>
                    Useful
                  </button>
                  <button className="btn btn-xs btn-link" onClick={() => toast('Insight dismissed')}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};
