import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ChartCard,
  EpcText,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
  baseChartOptions,
  fmtNumber,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchLiveSnapshot } from '@/services/api';
import { Movement, Reader } from '@/services/types';
import { movements } from '@/services/mock/data';

/**
 * Live RFID monitoring. In mock mode a timer simulates the event stream;
 * wire this to a WebSocket / SSE endpoint from the NestJS gateway for production.
 */
const LiveMonitoringPage = () => {
  const { data, loading } = useApiData(fetchLiveSnapshot);
  const [paused, setPaused] = useState(false);
  const [feed, setFeed] = useState<Movement[]>([]);
  const [rate, setRate] = useState<number[]>([]);
  const [readerFilter, setReaderFilter] = useState<string>('all');

  useEffect(() => {
    if (data) {
      setFeed(data.recent);
      setRate(data.readsPerMinute);
    }
  }, [data]);

  useEffect(() => {
    if (paused || !data) return;
    const id = window.setInterval(() => {
      const src = movements[Math.floor(Math.random() * movements.length)];
      const reader = data.readers.filter((r) => r.status !== 'offline')[Math.floor(Math.random() * 10)] ?? data.readers[0];
      const evt: Movement = { ...src, id: `live-${Date.now()}`, timestamp: new Date().toISOString(), reader: reader.code };
      setFeed((f) => [evt, ...f].slice(0, 40));
      setRate((r) => [...r.slice(1), Math.round(900 + Math.random() * 1500)]);
    }, 1800);
    return () => window.clearInterval(id);
  }, [paused, data]);

  const readers: Reader[] = data?.readers ?? [];
  const visibleFeed = useMemo(
    () => (readerFilter === 'all' ? feed : feed.filter((f) => f.reader === readerFilter)),
    [feed, readerFilter]
  );

  const online = readers.filter((r) => r.status === 'online').length;
  const degraded = readers.filter((r) => r.status === 'degraded').length;
  const offline = readers.filter((r) => r.status === 'offline').length;
  const current = rate[rate.length - 1] ?? 0;

  return (
    <Container>
      <PageHeader
        title="Live RFID Monitoring"
        icon="scan-barcode"
        description="Streaming tag reads from fixed, gate and handheld readers across all sites."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Live Monitoring' }]}
        badge={
          <span className={clsx('badge badge-sm gap-1.5', paused ? 'badge-outline' : 'badge-outline badge-success')}>
            <span className={clsx('size-1.5 rounded-full', paused ? 'bg-gray-400' : 'bg-success animate-pulse')} />
            {paused ? 'Paused' : 'Live'}
          </span>
        }
        actions={
          <button className="btn btn-sm btn-light" onClick={() => setPaused((p) => !p)}>
            <KeenIcon icon={paused ? 'to-right' : 'cross-circle'} /> {paused ? 'Resume stream' : 'Pause stream'}
          </button>
        }
      />

      {loading && !data ? (
        <div className="card">
          <LoadingState label="Connecting to readers…" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <StatCard label="Reads / minute" value={fmtNumber(current)} icon="pulse" tone="info" />
            <StatCard label="Readers online" value={`${online}/${readers.length}`} icon="router" tone="success" />
            <StatCard label="Degraded" value={degraded} icon="information-2" tone="warning" hint="High noise or low read rate" />
            <StatCard label="Offline" value={offline} icon="disconnect" tone="danger" hint="Missed heartbeats" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
            <div className="xl:col-span-2 min-w-0">
              <ChartCard
                title="Read throughput"
                subtitle="Tag reads per minute — last 30 minutes"
                type="area"
                height={260}
                series={[{ name: 'Reads/min', data: rate }]}
                options={baseChartOptions({
                  chart: { animations: { enabled: true, dynamicAnimation: { speed: 600 } } },
                  stroke: { curve: 'smooth', width: 2 },
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
                  colors: ['var(--tw-info)'],
                  xaxis: { categories: rate.map((_, i) => `-${rate.length - i}m`), tickAmount: 6 },
                  legend: { show: false }
                })}
              />
            </div>

            {/* Live feed */}
            <div className="card min-w-0 flex flex-col">
              <div className="card-header py-3.5 gap-2">
                <h3 className="card-title">Event stream</h3>
                <select className="select select-sm w-36" value={readerFilter} onChange={(e) => setReaderFilter(e.target.value)} aria-label="Filter by reader">
                  <option value="all">All readers</option>
                  {readers.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[330px]">
                {visibleFeed.length === 0 && <div className="py-10 text-center text-2sm text-gray-500">Waiting for reads…</div>}
                {visibleFeed.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-2sm font-medium text-gray-900 truncate">{e.itemName}</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <EpcText epc={e.epc} size={5} /> · {e.reader}
                      </span>
                    </div>
                    <span className="text-2xs text-gray-500 shrink-0 whitespace-nowrap">{timeAgo(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reader grid */}
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold text-gray-900">Readers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-5">
              {readers.map((r) => (
                <div key={r.id} className={clsx('card p-4 flex flex-col gap-3', r.status === 'offline' && 'border-danger-clarity')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={clsx(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg',
                          r.status === 'online' ? 'bg-success-light text-success' : r.status === 'degraded' ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger'
                        )}
                      >
                        <KeenIcon icon={r.type === 'handheld' ? 'scan-barcode' : r.type === 'gate' ? 'entrance-right' : 'router'} />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-2sm font-semibold text-gray-900 truncate">{r.code}</span>
                        <span className="text-xs text-gray-500 truncate">{r.name}</span>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-gray-50 py-1.5">
                      <div className="text-sm font-semibold text-gray-900">{r.readsPerMin}</div>
                      <div className="text-2xs text-gray-500">reads/min</div>
                    </div>
                    <div className="rounded-md bg-gray-50 py-1.5">
                      <div className="text-sm font-semibold text-gray-900">{r.antennas}</div>
                      <div className="text-2xs text-gray-500">antennas</div>
                    </div>
                    <div className="rounded-md bg-gray-50 py-1.5">
                      <div className="text-sm font-semibold text-gray-900">{r.txPower}</div>
                      <div className="text-2xs text-gray-500">dBm</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">{r.zone}</span>
                    <span className="shrink-0 inline-flex items-center gap-1" title="Last heartbeat">
                      <KeenIcon icon="pulse" className="text-2xs" /> {timeAgo(r.lastHeartbeat)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </Container>
  );
};

export { LiveMonitoringPage };
