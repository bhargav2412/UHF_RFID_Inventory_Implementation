import { Container } from '@/components/container';
import {
  DataTable,
  EpcText,
  MOVEMENT_META,
  MovementTypeCell,
  PageHeader,
  TwoLine,
  fmtDateTime
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchMovements } from '@/services/api';
import { readers } from '@/services/mock/data';
import { Movement, MovementType } from '@/services/types';

const PERIODS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' }
];

const MovementHistoryPage = () => {
  const { data, loading } = useApiData(fetchMovements);

  return (
    <Container>
      <PageHeader
        title="Movement History"
        icon="arrow-right-left"
        description="Complete audit trail of every RFID-captured movement — receipts, put-aways, transfers, issues and adjustments."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Movement History' }]}
      />
      <DataTable<Movement>
        data={data ?? []}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="movement-history"
        pageSize={25}
        searchPlaceholder="Search item, EPC, location, user or reference"
        searchKeys={['itemName', 'itemSku', 'epc', 'from', 'to', 'user', 'reference']}
        filters={[
          {
            key: 'type',
            label: 'Types',
            options: (Object.keys(MOVEMENT_META) as MovementType[]).map((t) => ({ value: t, label: MOVEMENT_META[t].label }))
          },
          { key: 'reader', label: 'Readers', options: readers.map((r) => ({ value: r.code, label: r.code })) },
          {
            key: 'period',
            label: 'Periods',
            options: PERIODS,
            match: (r, v) => Date.now() - new Date(r.timestamp).getTime() <= Number(v) * 864e5
          }
        ]}
        initialSort={{ key: 'timestamp', dir: 'desc' }}
        columns={[
          { key: 'timestamp', header: 'Date & time', sortable: true, value: (r) => +new Date(r.timestamp), render: (r) => <span className="whitespace-nowrap">{fmtDateTime(r.timestamp)}</span> },
          { key: 'type', header: 'Type', render: (r) => <MovementTypeCell type={r.type} /> },
          { key: 'itemName', header: 'Item', primary: true, sortable: true, render: (r) => <TwoLine title={r.itemName} sub={r.itemSku} /> },
          { key: 'epc', header: 'EPC', hideOnMobile: true, render: (r) => <EpcText epc={r.epc} /> },
          { key: 'from', header: 'From', hideOnMobile: true },
          { key: 'to', header: 'To' },
          { key: 'quantity', header: 'Qty', align: 'end', sortable: true },
          { key: 'reader', header: 'Reader', hideOnMobile: true },
          { key: 'user', header: 'User', hideOnMobile: true },
          { key: 'reference', header: 'Reference', hideOnMobile: true, render: (r) => r.reference ?? '—' }
        ]}
      />
    </Container>
  );
};

export { MovementHistoryPage };
