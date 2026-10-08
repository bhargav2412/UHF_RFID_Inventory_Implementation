import { useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  DataTable,
  DetailList,
  EpcText,
  Field,
  FormDrawer,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
  TwoLine,
  fmtDate,
  fmtDateTime,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchTags } from '@/services/api';
import { items } from '@/services/mock/data';
import { RfidTag } from '@/services/types';

const STATUS_OPTIONS = ['active', 'unassigned', 'inactive', 'damaged', 'lost'].map((s) => ({
  value: s,
  label: s[0].toUpperCase() + s.slice(1)
}));

const RfidTagsPage = () => {
  const { data, loading } = useApiData(fetchTags);
  const [selected, setSelected] = useState<RfidTag | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const tags = data ?? [];
  const count = (s: RfidTag['status']) => tags.filter((t) => t.status === s).length;

  return (
    <Container>
      <PageHeader
        title="RFID Tag Master"
        icon="tag"
        description="Register, encode and manage every UHF tag — EPC, TID, assigned item and health."
        crumbs={[{ label: 'Inventory' }, { label: 'RFID Tag Master' }]}
        actions={
          <>
            <button className="btn btn-sm btn-light" onClick={() => toast.info('Upload a CSV with EPC, TID and SKU columns')}>
              <KeenIcon icon="file-up" /> Bulk import
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}>
              <KeenIcon icon="plus" /> Register tag
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Total tags" value={fmtNumber(tags.length)} icon="tag" />
        <StatCard label="Active" value={fmtNumber(count('active'))} icon="check-circle" tone="success" />
        <StatCard label="Unassigned" value={fmtNumber(count('unassigned'))} icon="tag-cross" tone="warning" hint="Encoded but not linked" />
        <StatCard label="Damaged / lost" value={fmtNumber(count('damaged') + count('lost'))} icon="shield-cross" tone="danger" />
      </div>

      <DataTable<RfidTag>
        title="Tags"
        data={tags}
        loading={loading}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        exportName="rfid-tags"
        searchPlaceholder="Search EPC, TID, SKU or item"
        searchKeys={['epc', 'tid', 'itemSku', 'itemName']}
        filters={[
          { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          {
            key: 'tagType',
            label: 'Tag type',
            options: Array.from(new Set(tags.map((t) => t.tagType))).map((t) => ({ value: t, label: t }))
          }
        ]}
        initialSort={{ key: 'lastSeen', dir: 'desc' }}
        columns={[
          { key: 'epc', header: 'EPC', primary: true, render: (r) => <EpcText epc={r.epc} />, sortable: true },
          { key: 'itemName', header: 'Item', sortable: true, render: (r) => (r.itemName ? <TwoLine title={r.itemName} sub={r.itemSku} /> : <span className="text-gray-500">Not assigned</span>) },
          { key: 'tagType', header: 'Type', hideOnMobile: true },
          { key: 'location', header: 'Location', hideOnMobile: true, render: (r) => r.location ?? '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, sortable: true },
          {
            key: 'health',
            header: 'Health',
            sortable: true,
            className: 'min-w-[120px]',
            render: (r) => <ProgressBar value={r.health} tone={r.health < 50 ? 'danger' : r.health < 75 ? 'warning' : 'success'} showLabel />
          },
          { key: 'lastSeen', header: 'Last seen', sortable: true, value: (r) => (r.lastSeen ? +new Date(r.lastSeen) : 0), render: (r) => <span title={fmtDateTime(r.lastSeen)}>{timeAgo(r.lastSeen)}</span> }
        ]}
      />

      <FormDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title="Tag details"
        description={selected?.itemName ?? 'Unassigned tag'}
        footer={
          <>
            <button className="btn btn-light" onClick={() => toast.success('Tag deactivated')} type="button">
              Deactivate
            </button>
            <button className="btn btn-primary" onClick={() => toast.success('Re-encode job sent to printer')} type="button">
              <KeenIcon icon="printer" /> Re-encode
            </button>
          </>
        }
      >
        {selected && (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
              <div className="text-2xs uppercase tracking-wide text-gray-500 mb-1 font-sans">EPC</div>
              {selected.epc}
              <div className="text-2xs uppercase tracking-wide text-gray-500 mt-3 mb-1 font-sans">TID</div>
              {selected.tid}
            </div>
            <DetailList
              items={[
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Tag type', value: selected.tagType },
                { label: 'Item', value: selected.itemName ?? '—' },
                { label: 'SKU', value: selected.itemSku ?? '—' },
                { label: 'Location', value: selected.location ?? '—' },
                { label: 'Last reader', value: selected.lastReader ?? '—' },
                { label: 'Last seen', value: fmtDateTime(selected.lastSeen) },
                { label: 'RSSI', value: selected.rssi ? `${selected.rssi} dBm` : '—' },
                { label: 'Read count', value: fmtNumber(selected.readCount) },
                { label: 'Encoded on', value: fmtDate(selected.encodedAt) }
              ]}
            />
            <Field label="Tag health">
              <ProgressBar value={selected.health} tone={selected.health < 50 ? 'danger' : 'success'} showLabel />
            </Field>
          </>
        )}
      </FormDrawer>

      <FormDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Register RFID tag"
        description="Commission a new tag and link it to an item."
        submitLabel="Register tag"
        onSubmit={() => {
          toast.success('Tag registered');
          setCreateOpen(false);
        }}
      >
        <Field label="EPC (hex)" required hint="24 hex characters for 96-bit EPC">
          <input className="input font-mono" required pattern="[0-9A-Fa-f]{24,32}" placeholder="3034ABCD…" />
        </Field>
        <Field label="TID" hint="Read automatically when a tag is presented to the encoder">
          <input className="input font-mono" placeholder="E280…" />
        </Field>
        <Field label="Item" required>
          <select className="select" required defaultValue="">
            <option value="" disabled>
              Select item…
            </option>
            {items.map((i) => (
              <option key={i.id} value={i.sku}>
                {i.sku} — {i.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tag type">
          <select className="select" defaultValue="UHF Gen2 Label">
            {['UHF Gen2 Label', 'UHF Hard Tag', 'On-Metal Tag', 'Cable Tie Tag'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-2sm text-gray-700">
          <input type="checkbox" className="checkbox checkbox-sm" defaultChecked /> Lock EPC memory after encoding
        </label>
      </FormDrawer>
    </Container>
  );
};

export { RfidTagsPage };
