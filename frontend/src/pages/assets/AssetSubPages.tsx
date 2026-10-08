import clsx from 'clsx';
import { useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  DataTable,
  Field,
  FormDrawer,
  PageHeader,
  StatCard,
  StatusBadge,
  TwoLine,
  baseChartOptions,
  daysUntil,
  fmtCurrency,
  fmtDate,
  fmtNumber,
  timeAgo,
  titleCase
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchAssets, fetchAssignments, fetchCustodians, fetchMaintenance } from '@/services/api';
import { PEOPLE, assets as allAssets } from '@/services/mock/data';
import { Asset, AssetAssignment, Custodian, MaintenanceTask } from '@/services/types';

/* ---------------- Assignments ---------------- */

export const AssetAssignmentsPage = () => {
  const { data, loading } = useApiData(fetchAssignments);
  const [open, setOpen] = useState(false);
  const rows = data ?? [];

  return (
    <Container>
      <PageHeader
        title="Asset Assignment"
        icon="user-tick"
        description="Check assets out to people or departments and track returns. Overdue items are flagged automatically."
        crumbs={[{ label: 'Assets' }, { label: 'Assignments' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
            <KeenIcon icon="plus" /> New assignment
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Active assignments" value={rows.filter((r) => r.status === 'active').length} icon="user-tick" />
        <StatCard label="Overdue returns" value={rows.filter((r) => r.status === 'overdue').length} icon="time" tone="danger" />
        <StatCard label="Returned (90 days)" value={rows.filter((r) => r.status === 'returned').length} icon="arrow-circle-left" tone="success" />
      </div>
      <DataTable<AssetAssignment>
        data={rows}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="asset-assignments"
        searchKeys={['assetCode', 'assetName', 'custodian', 'department']}
        filters={[{ key: 'status', label: 'Status', options: ['active', 'overdue', 'returned'].map((s) => ({ value: s, label: titleCase(s) })) }]}
        initialSort={{ key: 'assignedAt', dir: 'desc' }}
        rowActions={(r) =>
          r.status !== 'returned' ? (
            <button className="btn btn-xs btn-light" onClick={() => toast.success(`${r.assetCode} checked in`)}>
              Check in
            </button>
          ) : null
        }
        columns={[
          { key: 'assetName', header: 'Asset', primary: true, sortable: true, render: (r) => <TwoLine title={r.assetName} sub={r.assetCode} /> },
          { key: 'custodian', header: 'Assigned to', sortable: true, render: (r) => <TwoLine title={r.custodian} sub={r.department} /> },
          { key: 'assignedAt', header: 'Assigned', sortable: true, value: (r) => +new Date(r.assignedAt), render: (r) => fmtDate(r.assignedAt) },
          {
            key: 'dueBack',
            header: 'Due back',
            render: (r) =>
              r.returnedAt ? (
                <span className="text-gray-500">Returned {fmtDate(r.returnedAt)}</span>
              ) : r.dueBack ? (
                <span className={clsx(daysUntil(r.dueBack) < 0 && 'text-danger font-medium')}>{fmtDate(r.dueBack)}</span>
              ) : (
                'Permanent'
              )
          },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Assign asset"
        submitLabel="Assign"
        onSubmit={() => {
          toast.success('Asset assigned — custodian notified');
          setOpen(false);
        }}
      >
        <Field label="Asset" required hint="Or scan the asset tag with a handheld">
          <select className="select" required>
            {allAssets
              .filter((a) => a.status === 'available')
              .map((a) => (
                <option key={a.id}>
                  {a.assetCode} — {a.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Custodian" required>
          <select className="select" required>
            {PEOPLE.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Return by" hint="Leave empty for a permanent assignment">
          <input className="input" type="date" />
        </Field>
        <Field label="Condition / remarks">
          <textarea className="textarea" rows={3} />
        </Field>
      </FormDrawer>
    </Container>
  );
};

/* ---------------- Custodians ---------------- */

export const CustodiansPage = () => {
  const { data, loading } = useApiData(fetchCustodians);
  const rows = data ?? [];
  return (
    <Container>
      <PageHeader
        title="Custodian Tracking"
        icon="people"
        description="Who is accountable for which assets, their total value and any overdue returns."
        crumbs={[{ label: 'Assets' }, { label: 'Custodians' }]}
      />
      <DataTable<Custodian>
        data={rows}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="custodians"
        searchKeys={['name', 'email', 'department']}
        initialSort={{ key: 'value', dir: 'desc' }}
        columns={[
          {
            key: 'name',
            header: 'Custodian',
            primary: true,
            sortable: true,
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                  {r.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <TwoLine title={r.name} sub={r.email} />
              </div>
            )
          },
          { key: 'department', header: 'Department', sortable: true },
          { key: 'assets', header: 'Assets held', align: 'end', sortable: true },
          { key: 'value', header: 'Value held', align: 'end', sortable: true, render: (r) => fmtCurrency(r.value) },
          { key: 'overdue', header: 'Overdue', align: 'center', sortable: true, render: (r) => (r.overdue ? <span className="badge badge-sm badge-danger">{r.overdue}</span> : <span className="text-gray-400">0</span>) },
          { key: 'lastActivity', header: 'Last activity', sortable: true, value: (r) => +new Date(r.lastActivity), render: (r) => timeAgo(r.lastActivity) }
        ]}
      />
    </Container>
  );
};

/* ---------------- Maintenance ---------------- */

export const MaintenancePage = () => {
  const { data, loading } = useApiData(fetchMaintenance);
  const [open, setOpen] = useState(false);
  const rows = data ?? [];
  const count = (s: MaintenanceTask['status']) => rows.filter((r) => r.status === s).length;

  return (
    <Container>
      <PageHeader
        title="Maintenance Schedules"
        icon="wrench"
        description="Preventive maintenance, calibration and inspections for tagged assets, with overdue tracking."
        crumbs={[{ label: 'Assets' }, { label: 'Maintenance' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
            <KeenIcon icon="calendar-add" /> Schedule work order
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Overdue" value={count('overdue')} icon="information-2" tone="danger" />
        <StatCard label="Due this week" value={count('due')} icon="calendar-tick" tone="warning" />
        <StatCard label="In progress" value={count('in_progress')} icon="wrench" tone="primary" />
        <StatCard label="Scheduled" value={count('scheduled')} icon="calendar" tone="info" />
      </div>
      <DataTable<MaintenanceTask>
        data={rows}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="maintenance"
        searchKeys={['number', 'assetCode', 'assetName', 'technician']}
        filters={[
          { key: 'status', label: 'Status', options: ['overdue', 'due', 'in_progress', 'scheduled', 'completed'].map((s) => ({ value: s, label: titleCase(s) })) },
          { key: 'type', label: 'Types', options: ['preventive', 'corrective', 'calibration', 'inspection'].map((s) => ({ value: s, label: titleCase(s) })) }
        ]}
        initialSort={{ key: 'dueDate', dir: 'asc' }}
        rowActions={(r) =>
          r.status !== 'completed' ? (
            <button className="btn btn-xs btn-light" onClick={() => toast.success(`${r.number} completed`)}>
              Complete
            </button>
          ) : null
        }
        columns={[
          { key: 'number', header: 'Work order', sortable: true },
          { key: 'assetName', header: 'Asset', primary: true, render: (r) => <TwoLine title={r.assetName} sub={r.assetCode} /> },
          { key: 'type', header: 'Type', render: (r) => titleCase(r.type) },
          { key: 'frequency', header: 'Frequency', hideOnMobile: true },
          { key: 'dueDate', header: 'Due', sortable: true, value: (r) => +new Date(r.dueDate), render: (r) => <span className={clsx(r.status === 'overdue' && 'text-danger font-medium')}>{fmtDate(r.dueDate)}</span> },
          { key: 'technician', header: 'Technician', hideOnMobile: true },
          { key: 'cost', header: 'Est. cost', align: 'end', sortable: true, hideOnMobile: true, render: (r) => fmtCurrency(r.cost) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Schedule work order"
        submitLabel="Schedule"
        onSubmit={() => {
          toast.success('Work order scheduled');
          setOpen(false);
        }}
      >
        <Field label="Asset" required>
          <select className="select" required>
            {allAssets.map((a) => (
              <option key={a.id}>
                {a.assetCode} — {a.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select className="select">
              {['Preventive', 'Corrective', 'Calibration', 'Inspection'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Frequency">
            <select className="select">
              {['One-time', 'Monthly', 'Quarterly', 'Half-yearly', 'Yearly'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date" required>
            <input className="input" type="date" required />
          </Field>
          <Field label="Technician">
            <select className="select">
              {PEOPLE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Checklist / instructions">
          <textarea className="textarea" rows={4} />
        </Field>
      </FormDrawer>
    </Container>
  );
};

/* ---------------- Lifecycle ---------------- */

const STAGES: { key: Asset['lifecycleStage']; label: string; icon: string }[] = [
  { key: 'procurement', label: 'Procurement', icon: 'basket' },
  { key: 'deployment', label: 'Deployment', icon: 'rocket' },
  { key: 'operation', label: 'Operation', icon: 'setting-3' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
  { key: 'disposal', label: 'Disposal', icon: 'trash' }
];

export const AssetLifecyclePage = () => {
  const { data, loading } = useApiData(fetchAssets);
  const rows = data ?? [];
  const ageYears = (a: Asset) => (Date.now() - new Date(a.purchaseDate).getTime()) / (365 * 864e5);
  const buckets = ['< 1 yr', '1–2 yrs', '2–3 yrs', '3–4 yrs', '4+ yrs'];
  const bucketOf = (a: Asset) => Math.min(4, Math.floor(ageYears(a)));
  const nearEnd = rows.filter((a) => a.status !== 'retired' && a.bookValue < a.purchaseCost * 0.2);

  return (
    <Container>
      <PageHeader
        title="Lifecycle Management"
        icon="arrows-loop"
        description="Follow each asset from procurement to disposal — ageing, depreciation and assets due for replacement."
        crumbs={[{ label: 'Assets' }, { label: 'Lifecycle' }]}
      />

      <div className="card mb-5 lg:mb-7.5">
        <div className="card-body grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGES.map((s, i) => {
            const n = rows.filter((a) => a.lifecycleStage === s.key).length;
            return (
              <div key={s.key} className="relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-light text-primary">
                  <KeenIcon icon={s.icon} className="text-lg" />
                </span>
                <span className="text-2xl font-semibold text-gray-900">{fmtNumber(n)}</span>
                <span className="text-xs text-gray-600">{s.label}</span>
                {i < STAGES.length - 1 && (
                  <KeenIcon icon="arrow-right" className="hidden lg:block absolute -end-3 top-1/2 -translate-y-1/2 text-gray-300 z-[1]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5 mb-5 lg:mb-7.5">
        <ChartCard
          title="Asset age profile"
          subtitle="Number of assets by age"
          type="bar"
          height={260}
          series={[{ name: 'Assets', data: buckets.map((_, i) => rows.filter((a) => bucketOf(a) === i).length) }]}
          options={baseChartOptions({ plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } }, xaxis: { categories: buckets }, legend: { show: false } })}
        />
        <ChartCard
          title="Cost vs book value"
          subtitle="By category (₹)"
          type="bar"
          height={260}
          series={[
            { name: 'Purchase cost', data: Array.from(new Set(rows.map((a) => a.category))).map((c) => rows.filter((a) => a.category === c).reduce((s, a) => s + a.purchaseCost, 0)) },
            { name: 'Book value', data: Array.from(new Set(rows.map((a) => a.category))).map((c) => rows.filter((a) => a.category === c).reduce((s, a) => s + a.bookValue, 0)) }
          ]}
          options={baseChartOptions({
            plotOptions: { bar: { columnWidth: '55%', borderRadius: 3 } },
            xaxis: { categories: Array.from(new Set(rows.map((a) => a.category))) },
            yaxis: { labels: { formatter: (v: number) => fmtCurrency(v, true) } },
            tooltip: { y: { formatter: (v: number) => fmtCurrency(v) } }
          })}
        />
      </div>

      <DataTable<Asset>
        title="Due for replacement"
        subtitle="Book value under 20% of cost"
        data={nearEnd}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="assets-replacement"
        searchKeys={['assetCode', 'name', 'category']}
        emptyTitle="No assets near end of life"
        rowActions={(r) => (
          <button className="btn btn-xs btn-light" onClick={() => toast.success(`${r.assetCode} sent for disposal approval`)}>
            Retire
          </button>
        )}
        columns={[
          { key: 'name', header: 'Asset', primary: true, render: (r) => <TwoLine title={r.name} sub={r.assetCode} /> },
          { key: 'purchaseDate', header: 'Purchased', sortable: true, value: (r) => +new Date(r.purchaseDate), render: (r) => fmtDate(r.purchaseDate) },
          { key: 'purchaseCost', header: 'Cost', align: 'end', render: (r) => fmtCurrency(r.purchaseCost) },
          { key: 'bookValue', header: 'Book value', align: 'end', sortable: true, render: (r) => fmtCurrency(r.bookValue) },
          { key: 'lifecycleStage', header: 'Stage', render: (r) => <StatusBadge status={r.lifecycleStage} /> }
        ]}
      />
    </Container>
  );
};
