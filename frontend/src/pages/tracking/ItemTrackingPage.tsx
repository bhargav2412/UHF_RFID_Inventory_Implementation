import clsx from 'clsx';
import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  DetailList,
  EmptyState,
  LoadingState,
  MOVEMENT_META,
  PageHeader,
  StatusBadge,
  fmtDateTime,
  fmtNumber,
  timeAgo,
  toneIcon
} from '@/components/app';
import { fetchItemTrail } from '@/services/api';
import { tags } from '@/services/mock/data';

type Trail = Awaited<ReturnType<typeof fetchItemTrail>>;

const SUGGESTIONS = tags.filter((t) => t.itemSku).slice(0, 4);

const ItemTrackingPage = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [result, setResult] = useState<Trail | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const run = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(await fetchItemTrail(q));
    setLoading(false);
  };

  useEffect(() => {
    const q = params.get('q');
    if (q) {
      setQuery(q);
      run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setParams(query.trim() ? { q: query.trim() } : {});
  };

  return (
    <Container>
      <PageHeader
        title="Item Tracking"
        icon="geolocation"
        description="Trace a single tagged item: where it is now and every location it has passed through."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Item Tracking' }]}
      />

      <form onSubmit={submit} className="card p-4 lg:p-5 mb-5 lg:mb-7.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <label className="input grow">
            <KeenIcon icon="magnifier" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter EPC, SKU or item name" aria-label="EPC, SKU or item" />
          </label>
          <button type="submit" className="btn btn-primary justify-center">
            <KeenIcon icon="geolocation" /> Track
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          Try:
          {SUGGESTIONS.map((t) => (
            <button key={t.id} type="button" className="badge badge-sm badge-outline hover:border-primary hover:text-primary" onClick={() => setParams({ q: t.itemSku! })}>
              {t.itemSku}
            </button>
          ))}
        </div>
      </form>

      {loading ? (
        <div className="card">
          <LoadingState label="Locating item…" />
        </div>
      ) : result === undefined ? (
        <div className="card">
          <EmptyState icon="geolocation" title="Search for an item to see its trail" description="Scan or paste an EPC, or type a SKU / item name." />
        </div>
      ) : result === null ? (
        <div className="card">
          <EmptyState icon="question-2" title="No tagged item found" description={`Nothing matches “${params.get('q')}”. Check the EPC or try a SKU.`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            <div className="card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <KeenIcon icon="cube-3" className="text-xl" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-semibold text-gray-900">{result.tag.itemName}</span>
                  <span className="text-xs text-gray-500">{result.tag.itemSku}</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">{result.tag.epc}</div>
              <DetailList
                items={[
                  { label: 'Status', value: <StatusBadge status={result.tag.status} /> },
                  { label: 'Tag type', value: result.tag.tagType },
                  { label: 'Read count', value: fmtNumber(result.tag.readCount) },
                  { label: 'RSSI', value: `${result.tag.rssi ?? '—'} dBm` }
                ]}
              />
            </div>
            <div className="card p-5 flex flex-col gap-2 border-primary-clarity bg-primary-light">
              <span className="text-xs font-medium uppercase tracking-wide text-primary">Current location</span>
              <span className="text-lg font-semibold text-gray-900">{result.tag.location}</span>
              <span className="text-2sm text-gray-600">
                Seen {timeAgo(result.tag.lastSeen)} by {result.tag.lastReader}
              </span>
            </div>
          </div>

          <div className="card xl:col-span-2">
            <div className="card-header py-4">
              <h3 className="card-title">Movement trail</h3>
              <span className="text-xs text-gray-500">{result.trail.length} events</span>
            </div>
            <div className="card-body">
              {result.trail.length === 0 ? (
                <EmptyState compact title="No movements recorded yet" />
              ) : (
                <ol className="relative flex flex-col gap-5 before:absolute before:start-4 before:top-2 before:bottom-2 before:border-s before:border-dashed before:border-gray-300">
                  {result.trail.map((m) => {
                    const meta = MOVEMENT_META[m.type];
                    return (
                      <li key={m.id} className="relative flex gap-4">
                        <span className={clsx('z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border', toneIcon[meta.tone])}>
                          <KeenIcon icon={meta.icon} className="text-sm" />
                        </span>
                        <div className="flex flex-col gap-0.5 grow min-w-0 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-2sm font-semibold text-gray-900">{meta.label}</span>
                            <span className="text-xs text-gray-500">{fmtDateTime(m.timestamp)}</span>
                          </div>
                          <span className="text-2sm text-gray-700">
                            {m.from} <KeenIcon icon="arrow-right" className="text-2xs mx-1 text-gray-400" /> {m.to}
                          </span>
                          <span className="text-xs text-gray-500">
                            Reader {m.reader} · {m.user}
                            {m.reference && ` · ${m.reference}`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export { ItemTrackingPage };
