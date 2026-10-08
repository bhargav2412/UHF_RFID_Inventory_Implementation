import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
  ToolbarActions
} from '@/partials/toolbar';
import {
  DashboardStats,
  DashboardStatCards,
  ActivityTrendChart,
  MovementBreakdownChart,
  WarehouseStockChart,
  WarehouseOverviewTable,
  RecentActivityTable,
  MachineStatusPanel
} from './blocks/dashboard';

type DashboardApiResponse = Partial<DashboardStats>;

const InventoryDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get<DashboardApiResponse>(
        `${import.meta.env.VITE_APP_API_URL}/stock/dashboard`
      );
      const data = response.data;
      setStats({
        total_warehouses: data.total_warehouses ?? 0,
        total_stock: data.total_stock ?? 0,
        total_items: data.total_items ?? 0,
        total_machines: data.total_machines ?? 0,
        active_machines: data.active_machines ?? 0,
        inactive_machines: data.inactive_machines ?? 0,
        inbound_machines: data.inbound_machines ?? 0,
        outbound_machines: data.outbound_machines ?? 0,
        uncounted_entries: data.uncounted_entries ?? 0,
        total_ledger_entries: data.total_ledger_entries ?? 0,
        movement: data.movement ?? { inbound: 0, outbound: 0 },
        activity_chart: data.activity_chart ?? { labels: [], inbound: [], outbound: [] },
        warehouses: data.warehouses ?? [],
        machines: data.machines ?? [],
        recent_entries: data.recent_entries ?? []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <span className="text-gray-500">Loading dashboard...</span>
        </div>
      </Container>
    );
  }

  const isEmpty =
    !stats ||
    (stats.total_warehouses === 0 &&
      stats.total_machines === 0 &&
      stats.total_ledger_entries === 0 &&
      stats.total_items === 0);

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Inventory Dashboard" />
            <ToolbarDescription>
              Real-time overview of warehouse stock, machines, and RFID activity
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <button className="btn btn-sm btn-light" onClick={fetchStats}>
              Refresh
            </button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {isEmpty ? (
          <div className="card mt-5 p-10 flex flex-col items-center justify-center text-center">
            <img src="/media/illustrations/2.svg" className="max-h-[150px] mb-5" alt="dashboard" />
            <h3 className="text-lg font-bold text-gray-900">Welcome to CVS Inventory</h3>
            <p className="text-gray-600 max-w-[400px]">
              Create warehouses and reading machines to start tracking RFID stock movements.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:gap-7.5 mt-5">
            {stats && <DashboardStatCards stats={stats} />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
              <div className="xl:col-span-2">
                {stats && <ActivityTrendChart activityChart={stats.activity_chart} />}
              </div>
              <div>
                {stats && <MovementBreakdownChart movement={stats.movement} />}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
              {stats && <WarehouseStockChart warehouses={stats.warehouses} />}
              {stats && <MachineStatusPanel stats={stats} />}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
              {stats && <WarehouseOverviewTable warehouses={stats.warehouses} />}
              {stats && <RecentActivityTable entries={stats.recent_entries} />}
            </div>
          </div>
        )}
      </Container>
    </Fragment>
  );
};

export { InventoryDashboardPage };
