import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  DataTable,
  EpcText,
  LoadingState,
  PageHeader,
  ProgressBar,
  SegmentTabs,
  StatusBadge,
  TwoLine,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchWarehouses } from '@/services/api';
import { tags } from '@/services/mock/data';
import { RfidTag } from '@/services/types';

const occupancyTone = (pct: number) =>
  pct >= 95 ? 'border-danger-clarity bg-danger-light' : pct >= 80 ? 'border-warning-clarity bg-warning-light' : 'border-gray-200 bg-light';

const LocationTrackingPage = () => {
  const { data, loading } = useApiData(fetchWarehouses);
  const [whId, setWhId] = useState<string>('wh-0');
  const [zoneCode, setZoneCode] = useState<string | null>(null);

  const wh = data?.find((w) => w.id === whId) ?? data?.[0];
  const zone = wh?.zones.find((z) => z.code === zoneCode) ?? null;
  const zoneTags = useMemo(
    () => (zone ? tags.filter((t) => t.location?.startsWith(zone.code)) : []),
    [zone]
  );

  return (
    <Container>
      <PageHeader
        title="Location Tracking"
        icon="map"
        description="Zone-by-zone view of what is stored where, with live occupancy from bin and overhead readers."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Location Tracking' }]}
      />

      {loading || !wh || !data ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : (
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <SegmentTabs
            value={wh.id}
            onChange={(v) => {
              setWhId(v);
              setZoneCode(null);
            }}
            options={data.map((w) => ({ value: w.id, label: w.name }))}
          />

          <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                <KeenIcon icon="home-2" className="text-xl" />
              </span>
              <TwoLine title={wh.name} sub={`${wh.city} · ${wh.zones.length} zones`} />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-72">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Occupancy</span>
                <span className="font-medium text-gray-900">
                  {fmtNumber(wh.occupied)} / {fmtNumber(wh.capacity)} bins
                </span>
              </div>
              <ProgressBar value={wh.occupied} max={wh.capacity} tone="auto" showLabel />
            </div>
          </div>

          {/* Zone map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {wh.zones.map((z) => {
              const pct = Math.round((z.occupied / z.capacity) * 100);
              const active = z.code === zoneCode;
              return (
                <button
                  key={z.id}
                  onClick={() => setZoneCode(active ? null : z.code)}
                  className={clsx(
                    'card p-4 text-start flex flex-col gap-3 transition-all hover:border-gray-300',
                    occupancyTone(pct),
                    active && '!border-primary ring-2 ring-primary-clarity'
                  )}
                  aria-pressed={active}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500">{z.code}</span>
                      <span className="text-sm font-semibold text-gray-900">{z.name}</span>
                    </div>
                    {z.temperatureControlled && (
                      <span className="badge badge-xs badge-outline badge-info gap-1">
                        <KeenIcon icon="thermometer" className="text-2xs" /> 2–8°C
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-semibold text-gray-900 tabular-nums">{pct}%</div>
                      <div className="text-xs text-gray-500">{fmtNumber(z.itemCount)} tagged units</div>
                    </div>
                    <span className="text-xs text-primary font-medium">{active ? 'Hide items' : 'View items'}</span>
                  </div>
                  <ProgressBar value={pct} tone="auto" />
                </button>
              );
            })}
          </div>

          {zone && (
            <DataTable<RfidTag>
              title={`Items in ${zone.code} · ${zone.name}`}
              subtitle="Tags last read in this zone"
              data={zoneTags}
              rowKey={(r) => r.id}
              searchKeys={['itemName', 'itemSku', 'epc']}
              exportName={`zone-${zone.code}`}
              columns={[
                { key: 'itemName', header: 'Item', primary: true, render: (r) => <TwoLine title={r.itemName} sub={r.itemSku} /> },
                { key: 'epc', header: 'EPC', render: (r) => <EpcText epc={r.epc} /> },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'lastReader', header: 'Reader', hideOnMobile: true },
                { key: 'lastSeen', header: 'Last seen', sortable: true, value: (r) => (r.lastSeen ? +new Date(r.lastSeen) : 0), render: (r) => timeAgo(r.lastSeen) }
              ]}
              emptyTitle="No tags currently read in this zone"
            />
          )}
        </div>
      )}
    </Container>
  );
};

export { LocationTrackingPage };
