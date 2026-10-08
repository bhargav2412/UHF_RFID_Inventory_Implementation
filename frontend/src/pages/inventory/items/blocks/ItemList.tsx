import { useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { ItemModal } from './ItemModal';

interface Item {
  _id: string;
  item_id: string;
  item_name: string;
  epc_prefix: string;
}

interface ItemListProps {
  refreshTrigger: number;
  search: string;
}

const truncateMiddle = (value?: string, max = 24) => {
  if (!value || value.length <= max) return value || '-';
  const start = Math.ceil((max - 3) / 2);
  const end = Math.floor((max - 3) / 2);
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const ItemList = ({ refreshTrigger, search }: ItemListProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/items`, {
        params: {
          page,
          limit,
          search
        }
      });
      setItems(response.data.data || []);
      setMeta(response.data.meta || null);

    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger, page, limit]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/stock/items/${itemToDelete._id}`);
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10">Loading items...</div>;
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title">Stock Items</h3>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-auto w-full table-border align-middle text-gray-700 font-medium">
            <thead>
              <tr>
                <th className="min-w-[150px] px-3">Item ID (SKU)</th>
                <th className="min-w-[200px] px-3">Name</th>
                <th className="min-w-[150px] px-3">EPC Prefix</th>
                <th className="w-[100px] px-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (

                items.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30">
                    <td className="px-3" title={item.item_id}>
                      <span className="text-gray-900 font-bold">{item.item_id}</span>
                    </td>
                    <td className="px-3" title={item.item_name}>
                      {item.item_name}
                    </td>
                    <td className="px-3 font-mono text-sm" title={item.epc_prefix}>
                      {item.epc_prefix || '-'}
                    </td>
                    <td className="px-3 text-end">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear"
                          onClick={() => {
                            setItemToEdit(item);
                            setEditModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-light btn-clear text-danger"
                          onClick={() => {
                            setItemToDelete(item);
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
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    No items found.
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
        title="Delete Item"
        description={`Are you sure you want to delete ${itemToDelete?.item_name}? This action cannot be undone.`}
      />

      <ItemModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        item={itemToEdit}
        onSuccess={fetchItems}
      />
    </div>
  );
};

export { ItemList };
