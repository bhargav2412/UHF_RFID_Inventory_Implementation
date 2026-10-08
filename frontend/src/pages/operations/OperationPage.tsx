import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  Column,
  DataTable,
  DetailList,
  Field,
  FormDrawer,
  PageHeader,
  ProgressBar,
  SegmentTabs,
  StatCard,
  StatusBadge,
  TwoLine,
  fmtDateTime,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchOperationDocs } from '@/services/api';
import { items, warehouses } from '@/services/mock/data';
import { OperationDocument, OperationKind } from '@/services/types';

interface OperationConfig {
  title: string;
  icon: string;
  description: string;
  newLabel: string;
  sourceLabel: string;
  destinationLabel: string;
  steps: string[];
}

const CONFIG: Record<OperationKind, OperationConfig> = {
  receiving: {
    title: 'Goods Receiving',
    icon: 'entrance-left',
    description: 'Receive supplier deliveries at the dock — RFID gates verify every tagged unit against the purchase order.',
    newLabel: 'New receipt (GRN)',
    sourceLabel: 'Supplier',
    destinationLabel: 'Receiving warehouse',
    steps: ['Create GRN against PO', 'Pass pallets through dock gate', 'Resolve shortages / excess', 'Post receipt']
  },
  putaway: {
    title: 'Put Away',
    icon: 'element-plus',
    description: 'Move received stock from staging to storage bins. Bin readers confirm the final location.',
    newLabel: 'New put-away task',
    sourceLabel: 'From (staging)',
    destinationLabel: 'To bin / zone',
    steps: ['Select received GRN', 'System suggests bins', 'Scan at destination', 'Confirm put-away']
  },
  transfer: {
    title: 'Stock Transfer',
    icon: 'arrow-right-left',
    description: 'Transfer stock between warehouses or zones with dispatch and receipt both confirmed by RFID.',
    newLabel: 'New transfer',
    sourceLabel: 'From',
    destinationLabel: 'To',
    steps: ['Create transfer order', 'Scan out at source gate', 'In transit', 'Scan in at destination']
  },
  adjustment: {
    title: 'Stock Adjustment',
    icon: 'setting-4',
    description: 'Correct stock for damage, expiry or count differences. Adjustments above threshold need approval.',
    newLabel: 'New adjustment',
    sourceLabel: 'Location',
    destinationLabel: '—',
    steps: ['Select item & location', 'Enter quantity and reason', 'Manager approval', 'Post to ledger']
  },
  issue: {
    title: 'Stock Issue',
    icon: 'exit-right',
    description: 'Issue stock to production, maintenance or customers. Exit gates block untagged or unauthorised movement.',
    newLabel: 'New issue',
    sourceLabel: 'From location',
    destinationLabel: 'Issued to',
    steps: ['Create issue request', 'Pick & scan items', 'Pass exit gate', 'Confirm handover']
  }
};

type StatusTab = 'all' | 'open' | 'completed';

const statusLabel = (kind: OperationKind, status: string) =>
  kind === 'transfer' && status === 'in_progress'
    ? 'In transit'
    : kind === 'adjustment' && status === 'pending'
      ? 'Awaiting approval'
      : undefined;

interface Line {
  sku: string;
  qty: number;
}

const OperationPage = ({ kind }: { kind: OperationKind }) => {
  const cfg = CONFIG[kind];
  const { data, loading } = useApiData(() => fetchOperationDocs(kind), [kind]);
  const [tab, setTab] = useState<StatusTab>('all');
  const [selected, setSelected] = useState<OperationDocument | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ sku: '', qty: 1 }]);
  const docs = data ?? [];

  const open = docs.filter((d) => ['draft', 'pending', 'in_progress'].includes(d.status));
  const completed = docs.filter((d) => d.status === 'completed');
  const filtered = useMemo(
    () => (tab === 'open' ? open : tab === 'completed' ? completed : docs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, docs]
  );
  const units = completed.reduce((s, d) => s + d.totalScanned, 0);
  const exceptions = completed.filter((d) => d.totalScanned !== d.totalExpected).length;
  const zones = warehouses.flatMap((w) => w.zones.map((z) => `${z.code} · ${z.name}`));

  const columns: Column<OperationDocument>[] = [
    { key: 'number', header: 'Document', primary: true, sortable: true, render: (r) => <TwoLine title={r.number} sub={`by ${r.createdBy}`} /> },
    { key: 'date', header: 'Date', sortable: true, value: (r) => +new Date(r.date), render: (r) => <span title={fmtDateTime(r.date)}>{timeAgo(r.date)}</span> },
    ...(kind === 'adjustment'
      ? [
          { key: 'source', header: cfg.sourceLabel, hideOnMobile: true } as Column<OperationDocument>,
          { key: 'reason', header: 'Reason' } as Column<OperationDocument>
        ]
      : [
          { key: 'source', header: cfg.sourceLabel, hideOnMobile: true } as Column<OperationDocument>,
          { key: 'destination', header: cfg.destinationLabel } as Column<OperationDocument>
        ]),
    { key: 'lines', header: 'Lines', align: 'center', value: (r) => r.lines.length, render: (r) => r.lines.length, hideOnMobile: true },
    {
      key: 'progress',
      header: kind === 'adjustment' ? 'Quantity' : 'Scanned',
      className: 'min-w-[150px]',
      value: (r) => r.totalScanned / r.totalExpected,
      render: (r) =>
        kind === 'adjustment' ? (
          <span className="font-medium text-gray-900">{fmtNumber(r.totalExpected)} units</span>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600 tabular-nums">
              {fmtNumber(r.totalScanned)} / {fmtNumber(r.totalExpected)}
            </span>
            <ProgressBar value={r.totalScanned} max={r.totalExpected} tone={r.status === 'completed' && r.totalScanned < r.totalExpected ? 'warning' : 'primary'} />
          </div>
        )
    },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} label={statusLabel(kind, r.status)} /> }
  ];

  const submit = () => {
    if (lines.some((l) => !l.sku || l.qty < 1)) {
      toast.error('Complete every line with an item and quantity');
      return;
    }
    toast.success(`${cfg.newLabel.replace('New ', '')} created as draft`);
    setCreateOpen(false);
    setLines([{ sku: '', qty: 1 }]);
  };

  return (
    <Container>
      <PageHeader
        title={cfg.title}
        icon={cfg.icon}
        description={cfg.description}
        crumbs={[{ label: 'Operations' }, { label: cfg.title }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}>
            <KeenIcon icon="plus" /> {cfg.newLabel}
          </button>
        }
      />

      {/* Process steps */}
      <div className="card mb-5 lg:mb-7.5">
        <div className="card-body grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {cfg.steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-2sm font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-2sm text-gray-700 leading-snug">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Open documents" value={open.length} icon="time" tone="warning" />
        <StatCard label="Completed (30 days)" value={completed.length} icon="check-circle" tone="success" />
        <StatCard label={kind === 'adjustment' ? 'Units adjusted' : 'Units processed'} value={fmtNumber(units)} icon="cube-3" />
        <StatCard label="With exceptions" value={exceptions} icon="information-2" tone={exceptions ? 'danger' : 'gray'} hint="Scanned ≠ expected" />
      </div>

      <DataTable<OperationDocument>
        title={
          <SegmentTabs<StatusTab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'All', count: docs.length },
              { value: 'open', label: 'Open', count: open.length },
              { value: 'completed', label: 'Completed', count: completed.length }
            ]}
          />
        }
        data={filtered}
        loading={loading}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        exportName={`${kind}-documents`}
        searchPlaceholder="Search document, location or user"
        searchKeys={['number', 'source', 'destination', 'createdBy', (r) => r.lines.map((l) => l.itemName).join(' ')]}
        initialSort={{ key: 'date', dir: 'desc' }}
        columns={columns}
      />

      {/* Detail drawer */}
      <FormDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.number ?? ''}
        description={cfg.title}
        width="sm:max-w-[620px]"
        footer={
          selected && selected.status !== 'completed' && selected.status !== 'cancelled' ? (
            <>
              <button type="button" className="btn btn-light" onClick={() => toast.info('Handheld scan session started')}>
                <KeenIcon icon="scan-barcode" /> Scan with handheld
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  toast.success(`${selected.number} posted`);
                  setSelected(null);
                }}
              >
                {kind === 'adjustment' ? 'Approve & post' : 'Complete'}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-light" onClick={() => setSelected(null)}>
              Close
            </button>
          )
        }
      >
        {selected && (
          <>
            <DetailList
              items={[
                { label: 'Status', value: <StatusBadge status={selected.status} label={statusLabel(kind, selected.status)} /> },
                { label: 'Date', value: fmtDateTime(selected.date) },
                { label: cfg.sourceLabel, value: selected.source },
                ...(kind === 'adjustment'
                  ? [{ label: 'Reason', value: selected.reason }]
                  : [{ label: cfg.destinationLabel, value: selected.destination }]),
                { label: 'Created by', value: selected.createdBy },
                { label: 'Lines', value: selected.lines.length }
              ]}
            />
            <div className="rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-2.5 text-2sm font-semibold text-gray-900">Line items</div>
              <div className="divide-y divide-gray-100">
                {selected.lines.map((l) => {
                  const diff = l.scanned - l.expected;
                  return (
                    <div key={l.itemSku + l.expected} className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <TwoLine title={l.itemName} sub={l.itemSku} />
                        <span className="text-2sm tabular-nums text-gray-800 shrink-0">
                          {kind === 'adjustment' ? `${l.expected} ${l.uom}` : `${l.scanned} / ${l.expected} ${l.uom}`}
                        </span>
                      </div>
                      {kind !== 'adjustment' && (
                        <div className="flex items-center gap-3">
                          <ProgressBar className="grow" value={l.scanned} max={l.expected} tone={diff === 0 ? 'success' : 'primary'} />
                          {selected.status === 'completed' && diff !== 0 && (
                            <span className="badge badge-xs badge-outline badge-danger">{diff} short</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </FormDrawer>

      {/* Create drawer */}
      <FormDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={cfg.newLabel}
        description="Saved as a draft. Scanning starts once the document is released."
        submitLabel="Create draft"
        onSubmit={submit}
        width="sm:max-w-[620px]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kind === 'receiving' && (
            <>
              <Field label="Supplier" required>
                <input className="input" required placeholder="Supplier name" />
              </Field>
              <Field label="PO / ASN number">
                <input className="input" placeholder="PO-2026-…" />
              </Field>
            </>
          )}
          {kind === 'issue' && (
            <Field label="Issued to" required className="sm:col-span-2">
              <input className="input" required placeholder="Department, line or customer" />
            </Field>
          )}
          {kind === 'adjustment' && (
            <Field label="Reason" required className="sm:col-span-2">
              <select className="select" required defaultValue="">
                <option value="" disabled>
                  Select reason…
                </option>
                {['Damaged in storage', 'Cycle count correction', 'Expired', 'Found stock', 'Sample consumption'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          )}
          {kind === 'transfer' ? (
            <>
              <Field label="From warehouse" required>
                <select className="select" required>
                  {warehouses.map((w) => (
                    <option key={w.id}>{w.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="To warehouse" required>
                <select className="select" required defaultValue={warehouses[1].name}>
                  {warehouses.map((w) => (
                    <option key={w.id}>{w.name}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label={kind === 'receiving' ? 'Receiving warehouse' : cfg.sourceLabel} required>
                <select className="select" required>
                  {(kind === 'receiving' ? warehouses.map((w) => w.name) : zones).map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </Field>
              {kind === 'putaway' && (
                <Field label="To bin / zone" required>
                  <select className="select" required>
                    {zones.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2sm font-semibold text-gray-900">Items</span>
            <button type="button" className="btn btn-xs btn-light" onClick={() => setLines((l) => [...l, { sku: '', qty: 1 }])}>
              <KeenIcon icon="plus" /> Add line
            </button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                className="select grow min-w-0"
                value={line.sku}
                onChange={(e) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, sku: e.target.value } : l)))}
                aria-label="Item"
              >
                <option value="">Select item…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.sku}>
                    {i.sku} — {i.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={kind === 'adjustment' ? undefined : 1}
                className="input w-24"
                value={line.qty}
                onChange={(e) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, qty: Number(e.target.value) } : l)))}
                aria-label="Quantity"
              />
              <button
                type="button"
                className="btn btn-icon btn-sm btn-light btn-clear text-danger"
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                aria-label="Remove line"
              >
                <KeenIcon icon="trash" />
              </button>
            </div>
          ))}
          {kind === 'adjustment' && <span className="text-xs text-gray-500">Use a negative quantity to reduce stock.</span>}
        </div>

        <Field label="Notes">
          <textarea className="textarea" rows={3} placeholder="Optional remarks" />
        </Field>
      </FormDrawer>
    </Container>
  );
};

export const GoodsReceivingPage = () => <OperationPage kind="receiving" />;
export const PutAwayPage = () => <OperationPage kind="putaway" />;
export const StockTransferPage = () => <OperationPage kind="transfer" />;
export const StockAdjustmentPage = () => <OperationPage kind="adjustment" />;
export const StockIssuePage = () => <OperationPage kind="issue" />;
export { OperationPage };
