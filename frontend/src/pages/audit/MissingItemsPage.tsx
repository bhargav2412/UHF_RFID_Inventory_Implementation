import { useEffect, useState } from 'react';
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
  SegmentTabs,
  StatCard,
  StatusBadge,
  TwoLine,
  fmtCurrency,
  fmtDate,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchInvestigations } from '@/services/api';
import { movements } from '@/services/mock/data';
import { Investigation, InvestigationStatus } from '@/services/types';

type Tab = 'active' | 'resolved' | 'all';

const MissingItemsPage = () => {
  const { data, loading } = useApiData(fetchInvestigations);
  const [cases, setCases] = useState<Investigation[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [selected, setSelected] = useState<Investigation | null>(null);

  useEffect(() => {
    if (data) setCases(data);
  }, [data]);

  const isActive = (c: Investigation) => c.status === 'open' || c.status === 'investigating';
  const active = cases.filter(isActive);
  const shown = tab === 'active' ? active : tab === 'resolved' ? cases.filter((c) => !isActive(c)) : cases;

  const update = (status: InvestigationStatus) => {
    if (!selected) return;
    setCases((cs) => cs.map((c) => (c.id === selected.id ? { ...c, status } : c)));
    setSelected({ ...selected, status });
    toast.success(`Case ${selected.number} marked as ${status.replace('_', ' ')}`);
  };

  const trail = selected ? movements.filter((m) => m.itemSku === selected.itemSku).slice(0, 5) : [];

  return (
    <Container>
      <PageHeader
        title="Missing Item Investigation"
        icon="question-2"
        description="Cases for tagged items not detected by any reader. Track the last known location and close each case with an outcome."
        crumbs={[{ label: 'Inventory Audit' }, { label: 'Missing Items' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Open cases" value={cases.filter((c) => c.status === 'open').length} icon="information-2" tone="warning" />
        <StatCard label="Under investigation" value={cases.filter((c) => c.status === 'investigating').length} icon="search-list" tone="primary" />
        <StatCard label="Recovered" value={cases.filter((c) => c.status === 'found').length} icon="check-circle" tone="success" />
        <StatCard label="Value at risk" value={fmtCurrency(active.reduce((s, c) => s + c.value, 0), true)} icon="dollar" tone="danger" />
      </div>

      <DataTable<Investigation>
        title={
          <SegmentTabs<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'active', label: 'Active', count: active.length },
              { value: 'resolved', label: 'Resolved', count: cases.length - active.length },
              { value: 'all', label: 'All', count: cases.length }
            ]}
          />
        }
        data={shown}
        loading={loading}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        exportName="missing-items"
        searchKeys={['number', 'itemName', 'itemSku', 'epc', 'lastLocation', 'assignedTo']}
        filters={[{ key: 'priority', label: 'Priority', options: ['high', 'medium', 'low'].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) })) }]}
        initialSort={{ key: 'openedAt', dir: 'desc' }}
        columns={[
          { key: 'number', header: 'Case', sortable: true },
          { key: 'itemName', header: 'Item', primary: true, render: (r) => <TwoLine title={r.itemName} sub={<EpcText epc={r.epc} size={5} />} /> },
          { key: 'lastLocation', header: 'Last location', hideOnMobile: true },
          { key: 'lastSeen', header: 'Last seen', sortable: true, value: (r) => +new Date(r.lastSeen), render: (r) => timeAgo(r.lastSeen) },
          { key: 'value', header: 'Value', align: 'end', sortable: true, render: (r) => fmtCurrency(r.value) },
          { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
          { key: 'assignedTo', header: 'Owner', hideOnMobile: true },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'openedAt', header: 'Opened', sortable: true, hideOnMobile: true, value: (r) => +new Date(r.openedAt), render: (r) => fmtDate(r.openedAt) }
        ]}
      />

      <FormDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.number} · ${selected.itemName}` : ''}
        description="Missing item investigation"
        width="sm:max-w-[600px]"
        footer={
          selected && isActive(selected) ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-light" onClick={() => update('investigating')} disabled={selected.status === 'investigating'}>
                Start investigation
              </button>
              <button type="button" className="btn btn-light text-danger" onClick={() => update('written_off')}>
                Write off
              </button>
              <button type="button" className="btn btn-success" onClick={() => update('found')}>
                <KeenIcon icon="check" /> Mark found
              </button>
            </div>
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
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Priority', value: <StatusBadge status={selected.priority} /> },
                { label: 'SKU', value: selected.itemSku },
                { label: 'Value', value: fmtCurrency(selected.value) },
                { label: 'Last location', value: selected.lastLocation },
                { label: 'Last seen', value: `${fmtDate(selected.lastSeen)} (${timeAgo(selected.lastSeen)})` },
                { label: 'Owner', value: selected.assignedTo },
                { label: 'Opened', value: fmtDate(selected.openedAt) }
              ]}
            />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs break-all">{selected.epc}</div>
            <div className="rounded-lg border border-warning-clarity bg-warning-light p-3 text-2sm text-gray-800">{selected.notes}</div>
            <div className="flex flex-col gap-2">
              <span className="text-2sm font-semibold text-gray-900">Recent movements of this SKU</span>
              {trail.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2">
                  <TwoLine title={`${m.from} → ${m.to}`} sub={`${m.reader} · ${m.user}`} />
                  <span className="text-2xs text-gray-500 shrink-0">{timeAgo(m.timestamp)}</span>
                </div>
              ))}
            </div>
            <Field label="Add note">
              <textarea className="textarea" rows={3} placeholder="Findings, CCTV reference, people contacted…" />
            </Field>
          </>
        )}
      </FormDrawer>
    </Container>
  );
};

export { MissingItemsPage };
