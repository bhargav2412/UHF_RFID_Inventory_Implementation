import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';
import {
  DataTable,
  Field,
  FormDrawer,
  LoadingState,
  PageHeader,
  SegmentTabs,
  StatusBadge,
  TwoLine,
  timeAgo
} from '@/components/app';
import { useApiData } from '@/hooks/useApiData';
import { fetchIntegrations, fetchUsers } from '@/services/api';
import { ROLES, warehouses } from '@/services/mock/data';
import { AppUser, Integration } from '@/services/types';

/* ---------------- Users ---------------- */

export const UsersAdminPage = () => {
  const { data, loading } = useApiData(fetchUsers);
  const [open, setOpen] = useState(false);

  return (
    <Container>
      <PageHeader
        title="Users"
        icon="users"
        description="People who can sign in, their role and the site they work at."
        crumbs={[{ label: 'Administration' }, { label: 'Users' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
            <KeenIcon icon="plus" /> Invite user
          </button>
        }
      />
      <DataTable<AppUser>
        data={data ?? []}
        loading={loading}
        rowKey={(r) => r.id}
        exportName="users"
        searchKeys={['name', 'email', 'role', 'site']}
        filters={[
          { key: 'role', label: 'Roles', options: ROLES.map((r) => ({ value: r, label: r })) },
          { key: 'status', label: 'Status', options: ['active', 'invited', 'disabled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) }
        ]}
        rowActions={() => (
          <button className="btn btn-xs btn-icon btn-light btn-clear" onClick={() => toast.info('Edit user')} aria-label="Edit user">
            <KeenIcon icon="pencil" />
          </button>
        )}
        columns={[
          {
            key: 'name',
            header: 'User',
            primary: true,
            sortable: true,
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                  {r.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <TwoLine title={r.name} sub={r.email} />
              </div>
            )
          },
          { key: 'role', header: 'Role', sortable: true, render: (r) => <span className="badge badge-sm badge-outline">{r.role}</span> },
          { key: 'site', header: 'Site', hideOnMobile: true },
          { key: 'lastLogin', header: 'Last login', sortable: true, value: (r) => +new Date(r.lastLogin), render: (r) => timeAgo(r.lastLogin) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
      />
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Invite user"
        submitLabel="Send invite"
        onSubmit={() => {
          toast.success('Invitation sent');
          setOpen(false);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required>
            <input className="input" required />
          </Field>
          <Field label="Last name" required>
            <input className="input" required />
          </Field>
        </div>
        <Field label="Email" required>
          <input className="input" type="email" required />
        </Field>
        <Field label="Role" required>
          <select className="select" required defaultValue="Operator">
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Site access">
          <select className="select">
            <option>All sites</option>
            {warehouses.map((w) => (
              <option key={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
      </FormDrawer>
    </Container>
  );
};

/* ---------------- Roles & permissions ---------------- */

const MODULES = ['Dashboard', 'Inventory', 'Operations', 'RFID Tracking', 'Inventory Audit', 'Assets', 'Reports', 'Alerts', 'Administration'];
const ACTIONS = ['View', 'Create', 'Edit', 'Approve', 'Delete'] as const;

const defaultMatrix = (role: string) =>
  Object.fromEntries(
    MODULES.map((m) => [
      m,
      Object.fromEntries(
        ACTIONS.map((a) => [
          a,
          role === 'Super Admin' ||
            (role === 'Admin' && m !== 'Administration') ||
            (role === 'Admin' && a === 'View') ||
            (role === 'Warehouse Manager' && !['Administration'].includes(m) && a !== 'Delete') ||
            (role === 'Auditor' && (a === 'View' || (m === 'Inventory Audit' && a !== 'Delete'))) ||
            (role === 'Operator' && (a === 'View' || (['Operations', 'RFID Tracking'].includes(m) && a === 'Create'))) ||
            (role === 'Viewer' && a === 'View' && m !== 'Administration')
        ])
      )
    ])
  ) as Record<string, Record<(typeof ACTIONS)[number], boolean>>;

export const RolesPage = () => {
  const [role, setRole] = useState(ROLES[2]);
  const [matrix, setMatrix] = useState(() => defaultMatrix(ROLES[2]));

  useEffect(() => setMatrix(defaultMatrix(role)), [role]);

  const toggle = (m: string, a: (typeof ACTIONS)[number]) =>
    setMatrix((x) => ({ ...x, [m]: { ...x[m], [a]: !x[m][a] } }));

  return (
    <Container>
      <PageHeader
        title="Roles & Permissions"
        icon="security-user"
        description="Control what each role can see and do in every module."
        crumbs={[{ label: 'Administration' }, { label: 'Roles & Permissions' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => toast.success(`Permissions for ${role} saved`)}>
            <KeenIcon icon="check" /> Save changes
          </button>
        }
      />
      <div className="flex flex-col gap-5">
        <SegmentTabs value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
        <div className="card">
          <div className="scrollable-x-auto">
            <table className="table table-border align-middle text-2sm">
              <thead>
                <tr>
                  <th className="min-w-[180px]">Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a} className="text-center min-w-[90px]">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m}>
                    <td className="font-medium text-gray-900">{m}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={matrix[m][a]}
                          disabled={role === 'Super Admin'}
                          onChange={() => toggle(m, a)}
                          aria-label={`${role} ${a} ${m}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role === 'Super Admin' && <div className="card-footer text-xs text-gray-500">Super Admin always has full access.</div>}
        </div>
      </div>
    </Container>
  );
};

/* ---------------- Integrations & API ---------------- */

export const IntegrationsPage = () => {
  const { data, loading } = useApiData(fetchIntegrations);
  const [keyOpen, setKeyOpen] = useState(false);
  const groups: Integration['category'][] = ['ERP', 'Accounting', 'Messaging', 'API'];

  return (
    <Container>
      <PageHeader
        title="Integrations & API"
        icon="technology-2"
        description="Connect ERP and accounting systems, stream RFID events and manage API keys for external applications."
        crumbs={[{ label: 'Administration' }, { label: 'Integrations & API' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setKeyOpen(true)}>
            <KeenIcon icon="key" /> Create API key
          </button>
        }
      />
      {loading || !data ? (
        <div className="card">
          <LoadingState />
        </div>
      ) : (
        <div className="flex flex-col gap-7.5">
          {groups.map((g) => (
            <div key={g} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{g === 'API' ? 'APIs & streaming' : g}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
                {data
                  .filter((i) => i.category === g)
                  .map((i) => (
                    <div key={i.id} className="card p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            <KeenIcon icon={i.icon} className="text-lg" />
                          </span>
                          <TwoLine title={i.name} sub={i.lastSync ? `Synced ${timeAgo(i.lastSync)}` : 'Not connected'} />
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                      <p className="text-2sm text-gray-600 grow">{i.description}</p>
                      <div className="flex gap-2">
                        {i.status === 'disconnected' ? (
                          <button className="btn btn-sm btn-primary" onClick={() => toast.info(`Connect ${i.name}`)}>
                            Connect
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-light" onClick={() => toast.info(`${i.name} settings`)}>
                              <KeenIcon icon="setting-2" /> Configure
                            </button>
                            <button className="btn btn-sm btn-light" onClick={() => toast.success(`${i.name} sync started`)}>
                              <KeenIcon icon="arrows-circle" /> Sync now
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="card">
            <div className="card-header py-4">
              <h3 className="card-title">API keys</h3>
              <a className="btn btn-xs btn-link" href={`${import.meta.env.VITE_APP_API_URL ?? ''}/docs`} target="_blank" rel="noreferrer">
                API documentation
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { name: 'ERP connector', key: 'cvs_live_••••••••3f9a', scope: 'Read/Write', created: '12 Mar 2026' },
                { name: 'BI dashboard', key: 'cvs_live_••••••••a71c', scope: 'Read only', created: '02 Jun 2026' },
                { name: 'Edge gateway', key: 'cvs_live_••••••••0be4', scope: 'Events write', created: '18 Aug 2026' }
              ].map((k) => (
                <div key={k.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3">
                  <TwoLine title={k.name} sub={`${k.scope} · created ${k.created}`} />
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{k.key}</code>
                    <button className="btn btn-xs btn-light text-danger" onClick={() => toast.success(`${k.name} key revoked`)}>
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <FormDrawer
        open={keyOpen}
        onOpenChange={setKeyOpen}
        title="Create API key"
        submitLabel="Create key"
        onSubmit={() => {
          toast.success('API key created — copy it now, it will not be shown again');
          setKeyOpen(false);
        }}
      >
        <Field label="Name" required>
          <input className="input" required placeholder="e.g. Power BI connector" />
        </Field>
        <Field label="Scope">
          <select className="select">
            <option>Read only</option>
            <option>Read/Write</option>
            <option>Events write (readers / gateways)</option>
          </select>
        </Field>
        <Field label="Expires">
          <select className="select">
            <option>Never</option>
            <option>30 days</option>
            <option>90 days</option>
            <option>1 year</option>
          </select>
        </Field>
      </FormDrawer>
    </Container>
  );
};

/* ---------------- System settings ---------------- */

type SettingsTab = 'general' | 'rfid' | 'stock' | 'notifications';

const Toggle = ({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) => (
  <label className="flex items-start justify-between gap-4 py-3">
    <span className="flex flex-col">
      <span className="text-2sm font-medium text-gray-900">{label}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </span>
    <span className="switch switch-sm shrink-0">
      <input type="checkbox" defaultChecked={defaultChecked} />
    </span>
  </label>
);

export const SystemSettingsPage = () => {
  const [tab, setTab] = useState<SettingsTab>('general');

  return (
    <Container>
      <PageHeader
        title="System Settings"
        icon="setting-2"
        description="Organisation defaults, RFID reader parameters, stock rules and notification preferences."
        crumbs={[{ label: 'Administration' }, { label: 'System Settings' }]}
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => toast.success('Settings saved')}>
            <KeenIcon icon="check" /> Save
          </button>
        }
      />
      <div className="flex flex-col gap-5">
        <SegmentTabs<SettingsTab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'general', label: 'General' },
            { value: 'rfid', label: 'RFID & readers' },
            { value: 'stock', label: 'Stock rules' },
            { value: 'notifications', label: 'Notifications' }
          ]}
        />
        <div className={clsx('card max-w-3xl')}>
          <div className="card-body flex flex-col gap-5">
            {tab === 'general' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Organisation name">
                  <input className="input" defaultValue="CVS Inventory Pvt Ltd" />
                </Field>
                <Field label="Default warehouse">
                  <select className="select">
                    {warehouses.map((w) => (
                      <option key={w.id}>{w.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Time zone">
                  <select className="select" defaultValue="Asia/Kolkata">
                    <option>Asia/Kolkata</option>
                    <option>Asia/Dubai</option>
                    <option>UTC</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select className="select" defaultValue="INR">
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </Field>
                <Field label="Date format">
                  <select className="select">
                    <option>DD MMM YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </Field>
                <Field label="Document prefix" hint="Used for GRN, TRF, ISS numbers">
                  <input className="input" defaultValue="2026" />
                </Field>
              </div>
            )}
            {tab === 'rfid' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="EPC encoding scheme">
                    <select className="select">
                      <option>SGTIN-96</option>
                      <option>GIAI-96 (assets)</option>
                      <option>Custom 96-bit</option>
                    </select>
                  </Field>
                  <Field label="Duplicate read window" hint="Ignore repeat reads of the same EPC within this time">
                    <input className="input" type="number" defaultValue={30} />
                  </Field>
                  <Field label="Minimum RSSI (dBm)" hint="Reads weaker than this are discarded">
                    <input className="input" type="number" defaultValue={-75} />
                  </Field>
                  <Field label="Default transmit power (dBm)">
                    <input className="input" type="number" step={0.5} defaultValue={27} />
                  </Field>
                  <Field label="Reader heartbeat timeout (s)">
                    <input className="input" type="number" defaultValue={60} />
                  </Field>
                  <Field label="Missing item threshold (days)" hint="Raise a missing-item alert after no reads for">
                    <input className="input" type="number" defaultValue={3} />
                  </Field>
                </div>
                <div className="divide-y divide-gray-100">
                  <Toggle label="Verify TID on every read" hint="Detects cloned tags (EPC/TID mismatch)" defaultChecked />
                  <Toggle label="Lock EPC memory after encoding" defaultChecked />
                  <Toggle label="Accept reads from unregistered tags" hint="They appear as Unidentified Tags on the dashboard" defaultChecked />
                </div>
              </>
            )}
            {tab === 'stock' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Valuation method">
                    <select className="select">
                      <option>Weighted average</option>
                      <option>FIFO</option>
                    </select>
                  </Field>
                  <Field label="Adjustment approval above (₹)">
                    <input className="input" type="number" defaultValue={10000} />
                  </Field>
                  <Field label="Receiving tolerance (%)" hint="Allowed over/short vs PO before exception">
                    <input className="input" type="number" defaultValue={2} />
                  </Field>
                  <Field label="Cycle count frequency (A/B/C)">
                    <input className="input" defaultValue="Weekly / Monthly / Quarterly" />
                  </Field>
                </div>
                <div className="divide-y divide-gray-100">
                  <Toggle label="Block negative stock" defaultChecked />
                  <Toggle label="Require issue document at exit gates" hint="Unauthorised movement alert otherwise" defaultChecked />
                  <Toggle label="Auto-create put-away tasks after receipt" defaultChecked />
                </div>
              </>
            )}
            {tab === 'notifications' && (
              <div className="divide-y divide-gray-100">
                <Toggle label="Critical alerts by SMS" hint="Unauthorised movement, EPC/TID mismatch" defaultChecked />
                <Toggle label="Daily low-stock digest by email" defaultChecked />
                <Toggle label="Reader offline notifications" defaultChecked />
                <Toggle label="Maintenance due reminders" defaultChecked />
                <Toggle label="Weekly executive summary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
