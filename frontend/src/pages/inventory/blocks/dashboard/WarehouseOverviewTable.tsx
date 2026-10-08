import { Link } from 'react-router-dom';
import { DashboardStats } from './types';

interface WarehouseOverviewTableProps {
  warehouses: DashboardStats['warehouses'];
}

const WarehouseOverviewTable = ({ warehouses }: WarehouseOverviewTableProps) => (
  <div className="card h-full">
    <div className="card-header flex justify-between items-center">
      <div>
        <h3 className="card-title">Warehouse Overview</h3>
        <p className="text-sm text-gray-500 mt-1">Stock levels and locations</p>
      </div>
      <Link to="/inventory/warehouses" className="btn btn-sm btn-light">
        View all
      </Link>
    </div>
    <div className="card-body p-0">
      <div className="table-responsive">
        <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
          <thead>
            <tr>
              <th className="px-5">ID</th>
              <th className="px-3">Name</th>
              <th className="px-3">Location</th>
              <th className="px-3 text-end">Stock</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.length > 0 ? (
              warehouses.map((w) => (
                <tr key={w._id} className="hover:bg-muted/30">
                  <td className="px-5 font-bold text-gray-900">{w.warehouse_id}</td>
                  <td className="px-3">{w.name}</td>
                  <td className="px-3 text-gray-500">{w.location || '—'}</td>
                  <td className="px-3 text-end">
                    <span
                      className={`badge ${
                        (w.current_stock ?? 0) > 0
                          ? 'badge-success'
                          : (w.current_stock ?? 0) < 0
                            ? 'badge-danger'
                            : 'badge-light'
                      }`}
                    >
                      {w.current_stock ?? 0}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No warehouses configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export { WarehouseOverviewTable };
