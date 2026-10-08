import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  ALERT_META,
  DataTable,
  PageHeader,
  SegmentTabs,
  StatusBadge,
  TwoLine,
  fmtDateTime,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchAlerts } from '@/services/api';
import { ALERT_TYPES } from '@/services/mock/data';
import { AlertItem, AlertStatus, AlertType } from '@/services/types';

type StatusTab = 'open' | AlertStatus | 'all';

const AlertCenterPage = () => {
  const { data, loading } = useApiData(fetchAlerts);
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [tab, setTab] = useState<StatusTab>('open');
  const typeFilter = (params.get('type') as AlertType | null) ?? null;

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const setStatus = (ids: string[], status: AlertStatus) => {
    setItems((list) => list.map((a) => (ids.includes(a.id) ? { ...a, status } : a)));
    toast.success(`${ids.length} alert${ids.length > 1 ? 's' : ''} ${status}`);
  };

  const shown = useMemo(
    () =>
      items.filter(
        (a) =>
          (!typeFilter || a.type === typeFilter) &&
          (tab === 'all' ? true : tab === 'open' ? a.status !== 'resolved' : a.status === tab)
      ),
    [items, typeFilter, tab]
  );

  const openOf = (t: AlertType) => items.filter((a) => a.type === t && a.status !== 'resolved').length;
  const newCount = items.filter((a) => a.status === 'new').length;

  return (
    <Container>
      <PageHeader
        title="Alert Center"
        icon="notification-status"
        description="Every exception raised by readers, stock rules and asset schedules — acknowledge, assign and resolve from one place."
        badge={newCount > 0 ? <span className="badge badge-sm badge-danger">{newCount} new</span> : undefined}
        actions={
          <button
            className="btn btn-sm btn-light"
            disabled={!newCount}
            onClick={() => setStatus(items.filter((a) => a.status === 'new').map((a) => a.id), 'acknowledged')}
          >
            <KeenIcon icon="double-check-circle" /> Acknowledge all new
          </button>
        }
      />

      {/* Alert type tiles (8 types from the design document) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-5 lg:mb-7.5">
        {ALERT_TYPES.map((t) => {
          const count = openOf(t);
          const active = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setParams(active ? {} : { type: t })}
              className={clsx(
                'card p-3.5 flex flex-col gap-2.5 text-start transition-all hover:border-gray-300',
                active && '!border-primary ring-2 ring-primary-clarity'
              )}
              aria-pressed={active}
            >
              <span
                className={clsx(
                  'flex size-8 items-center justify-center rounded-lg',
                  count ? 'bg-danger-light text-danger' : 'bg-gray-100 text-gray-500'
                )}
              >
                <KeenIcon icon={ALERT_META[t].icon} />
              </span>
              <span className="text-xl font-semibold leading-none text-gray-900">{count}</span>
              <span className="text-xs text-gray-600 leading-tight">{ALERT_META[t].label}</span>
            </button>
          );
        })}
      </div>

      <DataTable<AlertItem>
        title={
          <SegmentTabs<StatusTab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'open', label: 'Open', count: items.filter((a) => a.status !== 'resolved').length },
              { value: 'new', label: 'New', count: newCount },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'all', label: 'All' }
            ]}
          />
        }
        subtitle={
          typeFilter ? (
            <span className="inline-flex items-center gap-1.5">
              Filtered by {ALERT_META[typeFilter].label}
              <button className="text-primary hover:underline" onClick={() => setParams({})}>
                clear
              </button>
            </span>
          ) : undefined
        }
        data={shown}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="alerts"
        searchKeys={['title', 'message', 'location', 'source']}
        filters={[
          { key: 'severity', label: 'Severity', options: ['critical', 'high', 'medium', 'low'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) }
        ]}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        emptyTitle="No alerts here"
        emptyDescription="Nice — nothing needs your attention in this view."
        rowActions={(r) =>
          r.status === 'resolved' ? null : (
            <div className="flex justify-end gap-1">
              {r.status === 'new' && (
                <button className="btn btn-xs btn-light" onClick={() => setStatus([r.id], 'acknowledged')}>
                  Ack
                </button>
              )}
              <button className="btn btn-xs btn-light text-success" onClick={() => setStatus([r.id], 'resolved')}>
                Resolve
              </button>
            </div>
          )
        }
        columns={[
          { key: 'severity', header: 'Severity', sortable: true, value: (r) => ['critical', 'high', 'medium', 'low'].indexOf(r.severity), render: (r) => <StatusBadge status={r.severity} /> },
          {
            key: 'title',
            header: 'Alert',
            primary: true,
            render: (r) => (
              <div className="flex items-start gap-2.5 min-w-0">
                <KeenIcon icon={ALERT_META[r.type].icon} className="mt-0.5 text-gray-500" />
                <TwoLine title={r.title} sub={r.message} />
              </div>
            )
          },
          { key: 'location', header: 'Location', hideOnMobile: true },
          { key: 'source', header: 'Source', hideOnMobile: true },
          { key: 'createdAt', header: 'Raised', sortable: true, value: (r) => +new Date(r.createdAt), render: (r) => <span title={fmtDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />
    </Container>
  );
};

export { AlertCenterPage };
