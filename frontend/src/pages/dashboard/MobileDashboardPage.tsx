import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import { EpcText, StatusBadge, TwoLine, fmtNumber, timeAgo, toneIcon, Tone } from '@/components/app';
import { useAuthContext } from '@/auth';
import { alerts, assets, items, tags, warehouses } from '@/services/mock/data';

type Mode = 'scan' | 'search' | 'inventory' | 'alerts' | 'count' | 'transfer';

const ACTIONS: { mode: Mode; label: string; icon: string; tone: Tone; hint: string }[] = [
  { mode: 'scan', label: 'Scan item', icon: 'scan-barcode', tone: 'primary', hint: 'Read RFID tags' },
  { mode: 'search', label: 'Search asset', icon: 'magnifier', tone: 'info', hint: 'Find by code or EPC' },
  { mode: 'inventory', label: 'View inventory', icon: 'cube-3', tone: 'success', hint: 'Stock on hand' },
  { mode: 'alerts', label: 'Alerts', icon: 'notification-status', tone: 'danger', hint: 'Needs attention' },
  { mode: 'count', label: 'Count inventory', icon: 'clipboard', tone: 'warning', hint: 'Cycle count zone' },
  { mode: 'transfer', label: 'Transfer stock', icon: 'arrow-right-left', tone: 'gray', hint: 'Move between zones' }
];

/** Simulated handheld read session: emits random tags while active. */
const useScanSession = () => {
  const [active, setActive] = useState(false);
  const [reads, setReads] = useState<typeof tags>([]);
  const timer = useRef<number>();

  useEffect(() => {
    if (!active) return;
    timer.current = window.setInterval(() => {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      setReads((r) => (r.some((x) => x.epc === tag.epc) ? r : [tag, ...r].slice(0, 50)));
    }, 450);
    return () => window.clearInterval(timer.current);
  }, [active]);

  return { active, setActive, reads, clear: () => setReads([]) };
};

const ScanPanel = ({ title, cta }: { title: string; cta: string }) => {
  const { active, setActive, reads, clear } = useScanSession();
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5 flex flex-col items-center gap-4 text-center">
        <button
          onClick={() => setActive(!active)}
          className={clsx(
            'relative flex size-28 items-center justify-center rounded-full text-white transition-colors',
            active ? 'bg-danger' : 'bg-primary'
          )}
          aria-pressed={active}
        >
          {active && <span className="absolute inset-0 rounded-full bg-danger opacity-40 animate-ping" />}
          <KeenIcon icon={active ? 'cross' : 'scan-barcode'} style="solid" className="text-4xl relative" />
        </button>
        <div>
          <div className="text-sm font-semibold text-gray-900">{active ? 'Reading… pull trigger to stop' : title}</div>
          <div className="text-xs text-gray-500">{fmtNumber(reads.length)} unique tags read</div>
        </div>
        <div className="flex w-full gap-2">
          <button className="btn btn-light grow justify-center" onClick={clear} disabled={!reads.length}>
            Clear
          </button>
          <button
            className="btn btn-primary grow justify-center"
            disabled={!reads.length}
            onClick={() => {
              setActive(false);
              toast.success(`${reads.length} tags submitted`);
              clear();
            }}
          >
            {cta}
          </button>
        </div>
      </div>
      <div className="card divide-y divide-gray-100">
        {reads.length === 0 && <div className="py-8 text-center text-2sm text-gray-500">Tags appear here as they are read.</div>}
        {reads.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <TwoLine title={t.itemName ?? 'Unregistered tag'} sub={<EpcText epc={t.epc} />} />
            <span className="text-2xs text-gray-500 shrink-0">{t.rssi ?? -60} dBm</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MobileDashboardPage = () => {
  const { currentUser } = useAuthContext();
  const [mode, setMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState('');
  const [fromZone, setFromZone] = useState('');
  const [toZone, setToZone] = useState('');
  const zones = warehouses.flatMap((w) => w.zones.map((z) => `${z.code} · ${z.name}`));
  const newAlerts = alerts.filter((a) => a.status === 'new');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return assets
      .filter((a) => a.assetCode.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.epc.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query]);

  const current = ACTIONS.find((a) => a.mode === mode);

  return (
    <Container>
      <div className="mx-auto w-full max-w-xl flex flex-col gap-5 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          {mode ? (
            <button className="btn btn-sm btn-light" onClick={() => setMode(null)}>
              <KeenIcon icon="black-left" /> Back
            </button>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Handheld · Shift A</span>
              <h1 className="text-lg font-semibold text-gray-900">
                Hello{currentUser?.first_name ? `, ${currentUser.first_name}` : ''}
              </h1>
            </div>
          )}
          {current ? (
            <span className="text-sm font-semibold text-gray-900">{current.label}</span>
          ) : (
            <span className="badge badge-sm badge-outline badge-success gap-1.5">
              <span className="badge badge-dot size-1.5 badge-success" /> Reader connected
            </span>
          )}
        </div>

        {!mode && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">{fmtNumber(items.reduce((s, i) => s + i.onHand, 0))}</div>
                <div className="text-2xs text-gray-500">Units on hand</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">3</div>
                <div className="text-2xs text-gray-500">My open tasks</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-lg font-semibold text-danger">{newAlerts.length}</div>
                <div className="text-2xs text-gray-500">New alerts</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ACTIONS.map((a) => (
                <button
                  key={a.mode}
                  onClick={() => setMode(a.mode)}
                  className="card p-4 flex flex-col items-start gap-3 text-start active:scale-[0.98] transition-transform hover:border-gray-300"
                >
                  <span className={clsx('flex size-11 items-center justify-center rounded-xl border', toneIcon[a.tone])}>
                    <KeenIcon icon={a.icon} className="text-xl" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{a.label}</span>
                    <span className="text-xs text-gray-500">{a.hint}</span>
                  </span>
                  {a.mode === 'alerts' && newAlerts.length > 0 && (
                    <span className="badge badge-xs badge-danger">{newAlerts.length} new</span>
                  )}
                </button>
              ))}
            </div>

            <div className="card">
              <div className="card-header py-3">
                <h3 className="card-title text-sm">My tasks today</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { t: 'Cycle count — Rack Aisle', s: 'AMD-C · 142 items', st: 'in_progress', to: '/audit/cycle-count' },
                  { t: 'Put away GRN-2026-00228', s: '4 lines · 86 units', st: 'pending', to: '/operations/putaway' },
                  { t: 'Investigate missing laptop', s: 'MIS-0897', st: 'open', to: '/audit/missing-items' }
                ].map((task) => (
                  <Link key={task.t} to={task.to} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                    <TwoLine title={task.t} sub={task.s} />
                    <StatusBadge status={task.st} />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'scan' && <ScanPanel title="Tap to start reading" cta="Submit reads" />}
        {mode === 'count' && (
          <>
            <select className="select" defaultValue={zones[2]} aria-label="Zone to count">
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
            <ScanPanel title="Walk the zone and read all tags" cta="Submit count" />
          </>
        )}

        {mode === 'transfer' && (
          <>
            <div className="card p-4 flex flex-col gap-3">
              <select className="select" value={fromZone} onChange={(e) => setFromZone(e.target.value)} aria-label="From zone">
                <option value="">From location…</option>
                {zones.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
              <select className="select" value={toZone} onChange={(e) => setToZone(e.target.value)} aria-label="To zone">
                <option value="">To location…</option>
                {zones.filter((z) => z !== fromZone).map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </div>
            {fromZone && toZone ? (
              <ScanPanel title="Read the tags you are moving" cta="Confirm transfer" />
            ) : (
              <div className="text-center text-2sm text-gray-500">Choose source and destination to start scanning.</div>
            )}
          </>
        )}

        {mode === 'search' && (
          <div className="flex flex-col gap-3">
            <label className="input">
              <KeenIcon icon="magnifier" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Asset code, name or EPC" />
            </label>
            <div className="card divide-y divide-gray-100">
              {query.trim().length < 2 && <div className="py-8 text-center text-2sm text-gray-500">Type at least 2 characters.</div>}
              {query.trim().length >= 2 && results.length === 0 && <div className="py-8 text-center text-2sm text-gray-500">No matching assets.</div>}
              {results.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <TwoLine title={`${a.assetCode} · ${a.name}`} sub={`${a.location} · seen ${timeAgo(a.lastSeen)}`} />
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'inventory' && (
          <div className="card divide-y divide-gray-100">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <TwoLine title={i.name} sub={`${i.sku} · ${i.category}`} />
                <span className={clsx('text-sm font-semibold tabular-nums', i.onHand <= i.reorderLevel ? 'text-danger' : 'text-gray-900')}>
                  {fmtNumber(i.onHand)} <span className="text-2xs font-normal text-gray-500">{i.uom}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {mode === 'alerts' && (
          <div className="card divide-y divide-gray-100">
            {newAlerts.map((a) => (
              <div key={a.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{a.title}</span>
                  <StatusBadge status={a.severity} />
                </div>
                <span className="text-xs text-gray-600">{a.message}</span>
                <span className="text-2xs text-gray-500">{a.location} · {timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export { MobileDashboardPage };
