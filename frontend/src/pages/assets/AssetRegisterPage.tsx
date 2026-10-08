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
  StatCard,
  StatusBadge,
  TwoLine,
  daysUntil,
  fmtCurrency,
  fmtDate,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchAssets } from '@/services/api';
import { DEPARTMENTS, PEOPLE, allZones } from '@/services/mock/data';
import { Asset } from '@/services/types';

const STATUS = ['in_use', 'available', 'maintenance', 'retired', 'lost'];

const AssetRegisterPage = () => {
  const { data, loading } = useApiData(fetchAssets);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const assets = data ?? [];
  const categories = Array.from(new Set(assets.map((a) => a.category)));

  return (
    <Container>
      <PageHeader
        title="Asset Tracking"
        icon="briefcase"
        description="Register of RFID-tagged fixed assets — where each one is, who holds it and what it is worth."
        crumbs={[{ label: 'Assets' }, { label: 'Asset Register' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}>
            <KeenIcon icon="plus" /> Add asset
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Total assets" value={fmtNumber(assets.length)} icon="briefcase" hint={`${categories.length} categories`} />
        <StatCard label="In use" value={assets.filter((a) => a.status === 'in_use').length} icon="user-tick" tone="primary" />
        <StatCard label="Under maintenance" value={assets.filter((a) => a.status === 'maintenance').length} icon="wrench" tone="warning" />
        <StatCard label="Book value" value={fmtCurrency(assets.reduce((s, a) => s + a.bookValue, 0), true)} icon="dollar" tone="success" />
      </div>

      <DataTable<Asset>
        title="Assets"
        data={assets}
        loading={loading}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        exportName="asset-register"
        searchKeys={['assetCode', 'name', 'serialNo', 'epc', 'custodian', 'location']}
        filters={[
          { key: 'status', label: 'Status', options: STATUS.map((s) => ({ value: s, label: s.replace('_', ' ') })) },
          { key: 'category', label: 'Categories', options: categories.map((c) => ({ value: c, label: c })) },
          { key: 'department', label: 'Departments', options: DEPARTMENTS.map((d) => ({ value: d, label: d })) }
        ]}
        initialSort={{ key: 'assetCode', dir: 'asc' }}
        columns={[
          { key: 'assetCode', header: 'Asset', primary: true, sortable: true, render: (r) => <TwoLine title={r.name} sub={`${r.assetCode} · ${r.category}`} /> },
          { key: 'custodian', header: 'Custodian', sortable: true, render: (r) => r.custodian ?? <span className="text-gray-500">—</span> },
          { key: 'department', header: 'Department', hideOnMobile: true },
          { key: 'location', header: 'Location', hideOnMobile: true },
          { key: 'lastSeen', header: 'Last seen', sortable: true, value: (r) => +new Date(r.lastSeen), render: (r) => timeAgo(r.lastSeen) },
          { key: 'bookValue', header: 'Book value', align: 'end', sortable: true, render: (r) => fmtCurrency(r.bookValue) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />

      <FormDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ''}
        description={selected?.assetCode}
        footer={
          <>
            <button type="button" className="btn btn-light" onClick={() => toast.info('Maintenance work order created')}>
              <KeenIcon icon="wrench" /> Schedule maintenance
            </button>
            <button type="button" className="btn btn-primary" onClick={() => toast.success('Assignment form opened')}>
              <KeenIcon icon="user-tick" /> Assign
            </button>
          </>
        }
      >
        {selected && (
          <>
            <DetailList
              items={[
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Lifecycle stage', value: <StatusBadge status={selected.lifecycleStage} /> },
                { label: 'Category', value: selected.category },
                { label: 'Serial no.', value: selected.serialNo },
                { label: 'Custodian', value: selected.custodian ?? '—' },
                { label: 'Department', value: selected.department },
                { label: 'Location', value: selected.location },
                { label: 'Last seen', value: timeAgo(selected.lastSeen) },
                { label: 'Purchase date', value: fmtDate(selected.purchaseDate) },
                { label: 'Purchase cost', value: fmtCurrency(selected.purchaseCost) },
                { label: 'Book value', value: fmtCurrency(selected.bookValue) },
                {
                  label: 'Warranty until',
                  value: (
                    <span className={daysUntil(selected.warrantyUntil) < 0 ? 'text-danger' : ''}>
                      {fmtDate(selected.warrantyUntil)}
                    </span>
                  )
                },
                { label: 'Next maintenance', value: fmtDate(selected.nextMaintenance) }
              ]}
            />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-2xs uppercase tracking-wide text-gray-500 mb-1">EPC</div>
              <div className="font-mono text-xs break-all text-gray-800">{selected.epc}</div>
            </div>
          </>
        )}
      </FormDrawer>

      <FormDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add asset"
        description="Register a fixed asset and encode its RFID tag."
        submitLabel="Save asset"
        width="sm:max-w-[600px]"
        onSubmit={() => {
          toast.success('Asset registered');
          setCreateOpen(false);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Asset name" required className="sm:col-span-2">
            <input className="input" required placeholder="e.g. Forklift Toyota 8FBE" />
          </Field>
          <Field label="Category" required>
            <select className="select" required>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Serial number">
            <input className="input" placeholder="Manufacturer serial" />
          </Field>
          <Field label="Department">
            <select className="select">
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <select className="select">
              {allZones.map((z) => (
                <option key={z.id}>
                  {z.code} · {z.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purchase date">
            <input className="input" type="date" />
          </Field>
          <Field label="Purchase cost (₹)">
            <input className="input" type="number" min={0} />
          </Field>
          <Field label="Warranty until">
            <input className="input" type="date" />
          </Field>
          <Field label="Custodian">
            <select className="select" defaultValue="">
              <option value="">Unassigned</option>
              {PEOPLE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="RFID EPC" className="sm:col-span-2" hint="Leave blank to auto-generate and print a tag">
            <input className="input font-mono" placeholder="3500…" />
          </Field>
        </div>
      </FormDrawer>
    </Container>
  );
};

export { AssetRegisterPage };
