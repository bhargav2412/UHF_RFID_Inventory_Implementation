import { Link } from 'react-router-dom';
import { DashboardStats } from './types';

interface RecentActivityTableProps {
  entries: DashboardStats['recent_entries'];
}

const RecentActivityTable = ({ entries }: RecentActivityTableProps) => (
  <div className="card h-full">
    <div className="card-header flex justify-between items-center">
      <div>
        <h3 className="card-title">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-1">Latest RFID scan events</p>
      </div>
      <Link to="/inventory/stock-entries" className="btn btn-sm btn-light">
        View ledger
      </Link>
    </div>
    <div className="card-body p-0">
      <div className="table-responsive">
        <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
          <thead>
            <tr>
              <th className="px-5">Time</th>
              <th className="px-3">Warehouse</th>
              <th className="px-3">Item</th>
              <th className="px-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-muted/30">
                  <td className="px-5 text-sm text-gray-600">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3">
                    {entry.warehouse_id?.name || '—'}
                  </td>
                  <td className="px-3">
                    {entry.item_id?.item_name || (
                      <span className="text-gray-400">Uncounted</span>
                    )}
                  </td>
                  <td className="px-3">
                    <span
                      className={`badge badge-sm ${
                        entry.type === 'inbound' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No scan activity yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export { RecentActivityTable };
