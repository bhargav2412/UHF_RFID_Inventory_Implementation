import { useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { MachineModal, Machine } from './MachineModal';

interface MachineListProps {
  refreshTrigger: number;
  search: string;
}

const getWarehouseLabel = (machine: Machine): string => {
  if (!machine.warehouse_id) return '-';
  if (typeof machine.warehouse_id === 'string') return machine.warehouse_id;
  return `${machine.warehouse_id.warehouse_id} — ${machine.warehouse_id.name}`;
};

const MachineList = ({ refreshTrigger, search }: MachineListProps) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any>(null);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/machines`, {
        params: { page, limit, search }
      });
      setMachines(response.data.data || []);
      setMeta(response.data.meta || null);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [refreshTrigger, page, limit]);

  const handleDelete = async () => {
    if (!machineToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/stock/machines/${machineToDelete._id}`);
      toast.success('Machine deleted successfully');
      fetchMachines();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete machine');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading machines...</div>;
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title">Reading Machines</h3>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
            <thead>
              <tr>
                <th className="min-w-[120px] px-3">Machine ID</th>
                <th className="min-w-[180px] px-3">Name</th>
                <th className="min-w-[140px] px-3">Reader ID</th>
                <th className="min-w-[200px] px-3">Warehouse</th>
                <th className="min-w-[100px] px-3">Type</th>
                <th className="min-w-[90px] px-3">Status</th>
                <th className="w-[100px] px-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(machines) && machines.length > 0 ? (
                machines.map((machine) => (
                  <tr key={machine._id} className="hover:bg-muted/30">
                    <td className="px-3">
                      <span className="text-gray-900 font-bold">{machine.machine_id}</span>
                    </td>
                    <td className="px-3">{machine.name}</td>
                    <td className="px-3 font-mono text-sm">{machine.reader_id}</td>
                    <td className="px-3">{getWarehouseLabel(machine)}</td>
                    <td className="px-3">
                      <span className={`badge badge-sm ${machine.type === 'inbound' ? 'badge-success' : 'badge-danger'}`}>
                        {machine.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`badge badge-sm ${machine.status === 'active' ? 'badge-success' : 'badge-light'}`}>
                        {machine.status}
                      </span>
                    </td>
                    <td className="px-3 text-end">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear"
                          onClick={() => {
                            setMachineToEdit(machine);
                            setEditModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear text-danger"
                          onClick={() => {
                            setMachineToDelete(machine);
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
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No machines found.
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
        title="Delete Machine"
        description={`Are you sure you want to delete ${machineToDelete?.name}? This action cannot be undone.`}
      />

      <MachineModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        machine={machineToEdit}
        onSuccess={fetchMachines}
      />
    </div>
  );
};

export { MachineList };
