import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { DashboardStats } from './types';

interface MachineStatusPanelProps {
  stats: Pick<
    DashboardStats,
    'total_machines' | 'active_machines' | 'inactive_machines' | 'inbound_machines' | 'outbound_machines' | 'machines'
  >;
}

const MachineStatusPanel = ({ stats }: MachineStatusPanelProps) => (
  <div className="card h-full">
    <div className="card-header flex justify-between items-center">
      <div>
        <h3 className="card-title">Reading Machines</h3>
        <p className="text-sm text-gray-500 dark:text-gray-600 mt-1">RFID reader status overview</p>
      </div>
      <Link to="/inventory/machines" className="btn btn-sm btn-light">
        Manage
      </Link>
    </div>
    <div className="card-body flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-300 bg-light-active dark:bg-coal-300">
          <div className="flex items-center gap-2 text-gray-700 text-sm mb-1">
            <KeenIcon icon="check-circle" style="solid" className="text-success" />
            Active
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.active_machines}</div>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-300 bg-light-active dark:bg-coal-300">
          <div className="flex items-center gap-2 text-gray-700 text-sm mb-1">
            <KeenIcon icon="cross-circle" style="solid" className="text-gray-500 dark:text-gray-600" />
            Inactive
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.inactive_machines}</div>
        </div>
        <div className="p-4 rounded-lg border border-success-clarity bg-success-clarity">
          <div className="text-sm text-gray-700 mb-1">Inbound readers</div>
          <div className="text-xl font-bold text-success">{stats.inbound_machines}</div>
        </div>
        <div className="p-4 rounded-lg border border-danger-clarity bg-danger-clarity">
          <div className="text-sm text-gray-700 mb-1">Outbound readers</div>
          <div className="text-xl font-bold text-danger">{stats.outbound_machines}</div>
        </div>
      </div>

      {stats.machines.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-300 pt-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase mb-3">
            Recent Machines
          </p>
          <div className="flex flex-col gap-2">
            {stats.machines.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-300 hover:bg-light-active dark:hover:bg-coal-300"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{m.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-600 font-mono">{m.reader_id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge badge-sm ${
                      m.type === 'inbound' ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {m.type}
                  </span>
                  <span
                    className={`badge badge-sm ${
                      m.status === 'active' ? 'badge-success' : 'badge-light'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.total_machines === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-600 text-sm">
          No machines configured yet.{' '}
          <Link to="/inventory/machines" className="text-primary hover:underline">
            Add one
          </Link>
        </div>
      )}
    </div>
  </div>
);

export { MachineStatusPanel };
