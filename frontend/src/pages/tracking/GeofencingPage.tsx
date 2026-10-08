import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import { Field, FormDrawer, LoadingState, PageHeader, StatCard, titleCase } from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchGeofences } from '@/services/api';
import { allZones } from '@/services/mock/data';
import { Geofence } from '@/services/types';

const RULE_ICON: Record<Geofence['rule'], string> = {
  entry: 'entrance-left',
  exit: 'exit-right',
  dwell: 'time'
};

const GeofencingPage = () => {
  const { data, loading } = useApiData(fetchGeofences);
  const [fences, setFences] = useState<Geofence[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (data) setFences(data);
  }, [data]);

  const toggle = (id: string) =>
    setFences((fs) => fs.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));

  return (
    <Container>
      <PageHeader
        title="Geofencing"
        icon="geolocation-home"
        description="Virtual boundaries around zones and gates. Readers raise alerts when tagged items enter, exit or dwell outside the rules."
        crumbs={[{ label: 'RFID Tracking' }, { label: 'Geofencing' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
            <KeenIcon icon="plus" /> New geofence
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-5 lg:mb-7.5">
        <StatCard label="Geofences" value={fences.length} icon="geolocation-home" />
        <StatCard label="Enabled" value={fences.filter((f) => f.enabled).length} icon="toggle-on-circle" tone="success" />
        <StatCard label="Breaches (24h)" value={fences.reduce((s, f) => s + f.breaches24h, 0)} icon="shield-cross" tone="danger" />
        <StatCard label="Readers assigned" value={fences.reduce((s, f) => s + f.readers, 0)} icon="router" tone="info" />
      </div>

      {loading && !data ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
          {fences.map((f) => (
            <div key={f.id} className={clsx('card p-5 flex flex-col gap-4', !f.enabled && 'opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <KeenIcon icon={RULE_ICON[f.rule]} className="text-lg" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">{f.name}</span>
                    <span className="text-xs text-gray-500 truncate">{f.zone}</span>
                  </div>
                </div>
                <label className="switch switch-sm shrink-0">
                  <input type="checkbox" checked={f.enabled} onChange={() => toggle(f.id)} aria-label={`Enable ${f.name}`} />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-gray-50 py-2">
                  <div className="text-sm font-semibold text-gray-900">{titleCase(f.rule)}</div>
                  <div className="text-2xs text-gray-500">Rule</div>
                </div>
                <div className="rounded-md bg-gray-50 py-2">
                  <div className="text-sm font-semibold text-gray-900">{f.readers}</div>
                  <div className="text-2xs text-gray-500">Readers</div>
                </div>
                <div className="rounded-md bg-gray-50 py-2">
                  <div className={clsx('text-sm font-semibold', f.breaches24h ? 'text-danger' : 'text-gray-900')}>{f.breaches24h}</div>
                  <div className="text-2xs text-gray-500">Breaches 24h</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <KeenIcon icon="notification-on" className="text-sm text-gray-500" />
                {f.action}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="New geofence"
        description="Define a zone boundary and what should happen when it is crossed."
        submitLabel="Create geofence"
        onSubmit={() => {
          toast.success('Geofence created');
          setOpen(false);
        }}
      >
        <Field label="Name" required>
          <input className="input" required placeholder="e.g. Dock gate exit control" />
        </Field>
        <Field label="Zone" required>
          <select className="select" required>
            {allZones.map((z) => (
              <option key={z.id}>
                {z.code} · {z.name} ({z.warehouse})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trigger">
          <div className="grid grid-cols-3 gap-2">
            {(['entry', 'exit', 'dwell'] as const).map((r) => (
              <label key={r} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-2sm cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-light">
                <input type="radio" name="rule" className="radio radio-sm" defaultChecked={r === 'exit'} /> {titleCase(r)}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Dwell limit (minutes)" hint="Only used for dwell rules">
          <input className="input" type="number" min={1} defaultValue={15} />
        </Field>
        <Field label="Action">
          <select className="select">
            <option>Raise alert</option>
            <option>Raise alert + siren / light tower</option>
            <option>Block until document scanned</option>
            <option>Log only</option>
          </select>
        </Field>
        <Field label="Notify">
          <input className="input" placeholder="Emails or role, comma separated" />
        </Field>
      </FormDrawer>
    </Container>
  );
};

export { GeofencingPage };
