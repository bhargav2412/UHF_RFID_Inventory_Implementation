import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { KeenIcon } from '@/components/keenicons';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { StockEntryModal } from './StockEntryModal';

interface StockEntry {
  _id: string;
  stock_entry_id: string;
  epc_id: string;
  tag_id?: string;
  item_id?: {
    item_id: string;
    item_name: string;
  };
  warehouse_id?: {
    warehouse_id: string;
    name: string;
  };
  machine_id?: {
    machine_id: string;
    name: string;
    reader_id: string;
  };
  reader_id: string;
  type: 'inbound' | 'outbound';
  timestamp: string;
}

interface StockEntryListProps {
  refreshTrigger: number;
  filters: any;
}

const truncateMiddle = (value?: string, max = 24) => {
  if (!value || value.length <= max) return value || '-';
  const start = Math.ceil((max - 3) / 2);
  const end = Math.floor((max - 3) / 2);
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const StockEntryList = ({ refreshTrigger, filters }: StockEntryListProps) => {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<StockEntry | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<StockEntry | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any>(null);
  const [summary, setSummary] = useState<any[]>([]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/ledger`, {
        params: { 
            page, 
            limit,
            ...filters
        }
      });
      setEntries(response.data.data || []);
      setMeta(response.data.meta || null);
      setSummary(response.data.summary || []);

    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger, page, limit, filters]);

  const handleDelete = async () => {
    if (!entryToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/stock/ledger/${entryToDelete._id}`);
      toast.success('Stock entry deleted successfully');
      fetchEntries();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete entry');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading ledger...</div>;
  }

  return (
    <div className="card">
      <div className="card-header flex flex-col gap-5 md:flex-row md:items-center md:justify-between h-auto py-5">
        <h3 className="card-title">Recent Transactions</h3>
        
        {summary.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {summary.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg border border-gray-200">
                <span className="text-xs font-medium text-gray-600">{s.date}:</span>
                <span className="text-sm font-bold text-gray-900">{s.count}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-light rounded-lg border border-primary-clarity">
              <span className="text-xs font-medium text-primary">Grand Total:</span>
              <span className="text-sm font-bold text-primary">{meta?.total || 0}</span>
            </div>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
            <thead>
              <tr>
                <th className="min-w-[180px] px-3">Timestamp</th>
                <th className="min-w-[200px] px-3">Entry ID</th>
                <th className="min-w-[250px] px-3">Tag / EPC ID</th>
                <th className="min-w-[200px] px-3">Item</th>
                <th className="min-w-[150px] px-3">Warehouse</th>
                <th className="min-w-[150px] px-3">Machine / Type</th>
                <th className="w-[100px] px-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(entries) && entries.length > 0 ? (

                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-muted/30">
                    <td className="px-3" title={new Date(entry.timestamp).toLocaleString()}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 font-mono text-sm" title={entry.stock_entry_id}>
                      {entry.stock_entry_id}
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-gray-900" title={entry.tag_id}>
                          {entry.tag_id || '-'}
                        </span>
                        <span className="font-mono text-xs text-gray-500" title={entry.epc_id}>
                          {entry.epc_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3">
                      {entry.item_id ? (
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold" title={entry.item_id.item_name}>
                            {entry.item_id.item_name}
                          </span>
                          <span className="text-xs text-gray-500" title={entry.item_id.item_id}>
                            {entry.item_id.item_id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown Item</span>
                      )}
                    </td>
                    <td className="px-3">
                      {entry.warehouse_id ? (
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{entry.warehouse_id.name}</span>
                          <span className="text-xs text-gray-500">{entry.warehouse_id.warehouse_id}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm text-gray-900">
                          {entry.machine_id?.name || entry.reader_id || '—'}
                        </span>
                        {entry.machine_id?.reader_id && (
                          <span className="font-mono text-xs text-gray-500">{entry.machine_id.reader_id}</span>
                        )}
                        <span className={`badge badge-sm ${entry.type === 'inbound' ? 'badge-success' : 'badge-danger'}`}>
                          {entry.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 text-end">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear"
                          onClick={() => {
                            setEntryToEdit(entry);
                            setEditModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear text-danger"
                          onClick={() => {
                            setEntryToDelete(entry);
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
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                <option value={200}>200</option>
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
        title="Delete Entry"
        description={`Are you sure you want to delete entry ${entryToDelete?.stock_entry_id}?`}
      />

      <StockEntryModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        entry={entryToEdit}
        onSuccess={fetchEntries}
      />
    </div>
  );
};

export { StockEntryList };
