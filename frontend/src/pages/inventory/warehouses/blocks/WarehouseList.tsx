import { useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { WarehouseModal, Warehouse } from './WarehouseModal';

interface WarehouseListProps {
  refreshTrigger: number;
  search: string;
}

const WarehouseList = ({ refreshTrigger, search }: WarehouseListProps) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses`, {
        params: { page, limit, search }
      });
      setWarehouses(response.data.data || []);
      setMeta(response.data.meta || null);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [refreshTrigger, page, limit]);

  const handleDelete = async () => {
    if (!warehouseToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses/${warehouseToDelete._id}`);
      toast.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error: any) {
      console.error('Delete failed:', error);
      const message = error.response?.data?.message || 'Failed to delete warehouse';
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading warehouses...</div>;
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title">Warehouses</h3>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
            <thead>
              <tr>
                <th className="min-w-[150px] px-3">Warehouse ID</th>
                <th className="min-w-[200px] px-3">Name</th>
                <th className="min-w-[200px] px-3">Location</th>
                <th className="min-w-[120px] px-3">Current Stock</th>
                <th className="w-[100px] px-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(warehouses) && warehouses.length > 0 ? (
                warehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="hover:bg-muted/30">
                    <td className="px-3">
                      <span className="text-gray-900 font-bold">{warehouse.warehouse_id}</span>
                    </td>
                    <td className="px-3">{warehouse.name}</td>
                    <td className="px-3 text-gray-500">{warehouse.location || '-'}</td>
                    <td className="px-3">
                      <span className={`badge ${
                        (warehouse.current_stock ?? 0) > 0
                          ? 'badge-success'
                          : (warehouse.current_stock ?? 0) < 0
                            ? 'badge-danger'
                            : 'badge-light'
                      }`}>
                        {warehouse.current_stock ?? 0}
                      </span>
                    </td>
                    <td className="px-3 text-end">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear"
                          onClick={() => {
                            setWarehouseToEdit(warehouse);
                            setEditModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear text-danger"
                          onClick={() => {
                            setWarehouseToDelete(warehouse);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    No warehouses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 mt-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-muted-foreground">Rows per page</span>
              <select
                className="select select-sm w-[70px]"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {(page - 1) * limit + 1} - {Math.min(page * limit, meta.total)} of {meta.total}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-light"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <KeenIcon icon="black-left" />
                </button>
                <span className="flex items-center px-3 text-sm font-medium">
                  Page {page} of {meta.last_page}
                </span>
                <button
                  className="btn btn-sm btn-light"
                  disabled={page === meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                >
                  <KeenIcon icon="black-right" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        description={`Are you sure you want to delete ${warehouseToDelete?.name}? This action cannot be undone.`}
      />

      <WarehouseModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        warehouse={warehouseToEdit}
        onSuccess={fetchWarehouses}
      />
    </div>
  );
};

export { WarehouseList };
