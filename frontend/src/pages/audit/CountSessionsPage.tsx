import clsx from 'clsx';
import { useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  DataTable,
  DetailList,
  Field,
  FormDrawer,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
  TwoLine,
  fmtDate,
  fmtNumber
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchCountSessions } from '@/services/api';
import { PEOPLE, warehouses } from '@/services/mock/data';
import { CountSession } from '@/services/types';

interface Props {
  type: 'cycle' | 'full';
}

const COPY = {
  cycle: {
    title: 'Cycle Counting',
    icon: 'arrows-loop',
    description: 'Count a few zones or item classes every day so the whole store is verified without stopping operations.',
    newLabel: 'Schedule cycle count'
  },
  full: {
    title: 'Full Physical Count',
    icon: 'clipboard',
    description: 'Wall-to-wall RFID count of an entire warehouse. Fixed readers and handhelds reconcile against book stock.',
    newLabel: 'Plan physical count'
  }
};

const CountSessionsPage = ({ type }: Props) => {
  const copy = COPY[type];
  const { data, loading } = useApiData(() => fetchCountSessions(type), [type]);
  const [selected, setSelected] = useState<CountSession | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const sessions = data ?? [];
  const done = sessions.filter((s) => s.status === 'completed');
  const avgAccuracy = done.length ? (done.reduce((s, c) => s + c.accuracy, 0) / done.length).toFixed(2) : '—';
  const inProgress = sessions.filter((s) => s.status === 'in_progress');

  return (
    <Container>
      <PageHeader
        title={copy.title}
        icon={copy.icon}
        description={copy.description}
        crumbs={[{ label: 'Inventory Audit' }, { label: copy.title }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}>
            <KeenIcon icon="calendar-add" /> {copy.newLabel}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="In progress" value={inProgress.length} icon="time" tone="primary" />
        <StatCard label="Scheduled" value={sessions.filter((s) => s.status === 'scheduled').length} icon="calendar" tone="info" />
        <StatCard label="Completed" value={done.length} icon="check-circle" tone="success" />
        <StatCard label="Average accuracy" value={`${avgAccuracy}%`} icon="verify" tone="success" />
      </div>

      {inProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
          {inProgress.map((s) => (
            <div key={s.id} className="card p-5 flex flex-col gap-4 border-primary-clarity">
              <div className="flex items-start justify-between gap-3">
                <TwoLine title={s.name} sub={`${s.number} · ${s.warehouse}`} />
                <StatusBadge status={s.status} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {fmtNumber(s.counted)} of {fmtNumber(s.expected)} tags read
                  </span>
                  <span>{s.assignedTo}</span>
                </div>
                <ProgressBar value={s.counted} max={s.expected} showLabel />
              </div>
              <div className="flex flex-wrap gap-2">
                {s.zones.map((z) => (
                  <span key={z} className="badge badge-xs badge-outline">
                    {z}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-light" onClick={() => setSelected(s)}>
                  Details
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => toast.success(`${s.number} submitted for reconciliation`)}>
                  Finish & reconcile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable<CountSession>
        title="Count sessions"
        data={sessions}
        loading={loading}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        exportName={`${type}-counts`}
        searchKeys={['number', 'name', 'warehouse', 'assignedTo']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: ['scheduled', 'in_progress', 'completed', 'cancelled'].map((s) => ({ value: s, label: s.replace('_', ' ') }))
          },
          { key: 'warehouse', label: 'Warehouses', options: warehouses.map((w) => ({ value: w.name, label: w.name })) }
        ]}
        initialSort={{ key: 'scheduledFor', dir: 'desc' }}
        columns={[
          { key: 'number', header: 'Session', primary: true, sortable: true, render: (r) => <TwoLine title={r.name} sub={r.number} /> },
          { key: 'warehouse', header: 'Warehouse', hideOnMobile: true },
          { key: 'scheduledFor', header: 'Date', sortable: true, value: (r) => +new Date(r.scheduledFor), render: (r) => fmtDate(r.scheduledFor) },
          { key: 'assignedTo', header: 'Assigned to', hideOnMobile: true },
          { key: 'expected', header: 'Expected', align: 'end', sortable: true, render: (r) => fmtNumber(r.expected) },
          { key: 'counted', header: 'Counted', align: 'end', render: (r) => (r.counted ? fmtNumber(r.counted) : '—') },
          {
            key: 'variance',
            header: 'Variance',
            align: 'end',
            sortable: true,
            render: (r) =>
              r.status === 'completed' ? (
                <span className={clsx('font-medium', r.variance < 0 ? 'text-danger' : r.variance > 0 ? 'text-warning' : 'text-success')}>
                  {r.variance > 0 ? '+' : ''}
                  {r.variance}
                </span>
              ) : (
                '—'
              )
          },
          { key: 'accuracy', header: 'Accuracy', align: 'end', sortable: true, render: (r) => (r.accuracy ? `${r.accuracy}%` : '—') },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />

      <FormDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ''}
        description={selected?.number}
      >
        {selected && (
          <>
            <DetailList
              items={[
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Type', value: selected.type === 'full' ? 'Full physical count' : 'Cycle count' },
                { label: 'Warehouse', value: selected.warehouse },
                { label: 'Zones', value: selected.zones.join(', ') },
                { label: 'Scheduled', value: fmtDate(selected.scheduledFor) },
                { label: 'Assigned to', value: selected.assignedTo },
                { label: 'Expected (book)', value: fmtNumber(selected.expected) },
                { label: 'Counted (RFID)', value: fmtNumber(selected.counted) },
                { label: 'Variance', value: selected.variance },
                { label: 'Accuracy', value: selected.accuracy ? `${selected.accuracy}%` : '—' }
              ]}
            />
            {selected.status !== 'scheduled' && (
              <Field label="Progress">
                <ProgressBar value={selected.counted} max={selected.expected} showLabel />
              </Field>
            )}
          </>
        )}
      </FormDrawer>

      <FormDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={copy.newLabel}
        submitLabel="Schedule"
        onSubmit={() => {
          toast.success('Count scheduled and assigned');
          setCreateOpen(false);
        }}
      >
        <Field label="Name" required>
          <input className="input" required placeholder={type === 'full' ? 'Quarterly full count' : 'High value items — Rack Aisle'} />
        </Field>
        <Field label="Warehouse" required>
          <select className="select" required>
            {warehouses.map((w) => (
              <option key={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
        {type === 'cycle' && (
          <Field label="Count by">
            <select className="select">
              <option>Zone</option>
              <option>ABC class</option>
              <option>Item category</option>
              <option>Random sample (10%)</option>
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" required>
            <input className="input" type="date" required />
          </Field>
          <Field label="Recurrence">
            <select className="select" defaultValue={type === 'full' ? 'Quarterly' : 'Weekly'}>
              {['One-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Assign to">
          <select className="select">
            {PEOPLE.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        {type === 'full' && (
          <label className="flex items-center gap-2 text-2sm text-gray-700">
            <input type="checkbox" className="checkbox checkbox-sm" defaultChecked /> Freeze stock movements during count
          </label>
        )}
      </FormDrawer>
    </Container>
  );
};

export const CycleCountPage = () => <CountSessionsPage type="cycle" />;
export const PhysicalCountPage = () => <CountSessionsPage type="full" />;
