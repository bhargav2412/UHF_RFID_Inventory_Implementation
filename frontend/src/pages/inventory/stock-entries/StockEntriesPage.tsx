import { Fragment, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
  ToolbarActions
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { StockEntryList } from './blocks/StockEntryList';
import { StockEntryModal } from './blocks/StockEntryModal';
import { KeenIcon } from '@/components/keenicons';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const StockEntriesPage = () => {
  const { currentLayout } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [resyncing, setResyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    item_id: '',
    warehouse_id: '',
    machine_id: '',
    type: '',
    epc_id: '',
    tag_id: '',
    reader_id: '',
    stock_entry_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/warehouses`, { params: { limit: 200 } })
      .then((res) => setWarehouses(res.data.data || []))
      .catch(() => {});
    axios.get(`${import.meta.env.VITE_APP_API_URL}/stock/machines`, { params: { limit: 200 } })
      .then((res) => setMachines(res.data.data || []))
      .catch(() => {});
  }, []);

  const debouncedFilters = useDebounce(filters, 500);

  const handleEntrySaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResync = async () => {
    try {
      setResyncing(true);
      await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/resync`);
      toast.success('Stock levels resynced successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Resync failed:', error);
      toast.error('Failed to resync stock');
    } finally {
      setResyncing(false);
    }
  };

  const handleResetLedger = async () => {
    try {
      setResetting(true);
      await axios.post(`${import.meta.env.VITE_APP_API_URL}/stock/reset-ledger`);
      toast.success('Stock ledger has been successfully reset');
      setRefreshTrigger(prev => prev + 1);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Reset ledger failed:', error);
      toast.error('Failed to reset ledger');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Stock Ledger" />
              <ToolbarDescription>View all inbound and outbound stock transactions</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Reset Ledger
              </button>
              <button
                className="btn btn-sm btn-light"
                onClick={handleResync}
                disabled={resyncing}
              >
                {resyncing ? 'Resyncing...' : 'Resync Stock'}
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Push Stock Entry
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        {/* Filters Card */}
        <div className="card p-5 mb-5">
          <div className="flex flex-col gap-4">
            {/* Primary Filters Row */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1 w-[200px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Entry ID</span>
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Search Entry..."
                  value={filters.stock_entry_id}
                  onChange={(e) => setFilters({ ...filters, stock_entry_id: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1 w-[200px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Tag ID</span>
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Search Tag..."
                  value={filters.tag_id}
                  onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1 w-[200px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">EPC ID</span>
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Search EPC..."
                  value={filters.epc_id}
                  onChange={(e) => setFilters({ ...filters, epc_id: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1 w-[150px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Type</span>
                <select
                  className="select select-sm"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              <div className="flex gap-2 h-[38px] items-center ms-auto">
                <button
                  className="btn btn-sm btn-primary px-5"
                  onClick={() => setRefreshTrigger(p => p + 1)}
                >
                  Apply
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => {
                    setFilters({ item_id: '', warehouse_id: '', machine_id: '', type: '', epc_id: '', tag_id: '', reader_id: '', stock_entry_id: '', start_date: '', end_date: '' });
                    setRefreshTrigger(p => p + 1);
                  }}
                >
                  Reset
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                >
                  <KeenIcon icon={showMoreFilters ? 'minus' : 'plus'} />
                  {showMoreFilters ? 'Less Filters' : 'More Filters'}
                </button>
              </div>
            </div>

            {/* Secondary Filters Row (Expandable) */}
            {showMoreFilters && (
              <div className="flex flex-wrap gap-4 items-end border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-1 w-[200px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Warehouse</span>
                  <select
                    className="select select-sm"
                    value={filters.warehouse_id}
                    onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>{w.warehouse_id} — {w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-[200px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Machine</span>
                  <select
                    className="select select-sm"
                    value={filters.machine_id}
                    onChange={(e) => setFilters({ ...filters, machine_id: e.target.value })}
                  >
                    <option value="">All Machines</option>
                    {machines.map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.reader_id})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-[200px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Reader ID</span>
                  <input
                    type="text"
                    className="input input-sm"
                    placeholder="Search Reader..."
                    value={filters.reader_id}
                    onChange={(e) => setFilters({ ...filters, reader_id: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-[260px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ms-1">Activity Period</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      className="input input-sm w-[130px]"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      className="input input-sm w-[130px]"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <StockEntryList refreshTrigger={refreshTrigger} filters={debouncedFilters} />

        <StockEntryModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleEntrySaved}
        />

        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader className="py-4 px-5 pe-12 border-b border-gray-200">
              <DialogTitle>Reset Stock Ledger</DialogTitle>
              <DialogDescription>
                Are you sure you want to soft delete all ledger entries and reset stock counts? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetLedger}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </Fragment>
  );
};

export { StockEntriesPage };
