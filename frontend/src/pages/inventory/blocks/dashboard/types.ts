export interface DashboardStats {
  total_warehouses: number;
  total_stock: number;
  total_items: number;
  total_machines: number;
  active_machines: number;
  inactive_machines: number;
  inbound_machines: number;
  outbound_machines: number;
  uncounted_entries: number;
  total_ledger_entries: number;
  movement: { inbound: number; outbound: number };
  activity_chart: {
    labels: string[];
    inbound: number[];
    outbound: number[];
  };
  warehouses: Array<{
    _id: string;
    warehouse_id: string;
    name: string;
    location?: string;
    current_stock: number;
  }>;
  machines: Array<{
    _id: string;
    machine_id: string;
    name: string;
    reader_id: string;
    type: 'inbound' | 'outbound';
    status: 'active' | 'inactive';
    warehouse_id?: { warehouse_id: string; name: string };
  }>;
  recent_entries: Array<{
    _id: string;
    stock_entry_id: string;
    epc_id: string;
    type: 'inbound' | 'outbound';
    timestamp: string;
    item_id?: { item_id: string; item_name: string };
    warehouse_id?: { warehouse_id: string; name: string };
    machine_id?: { machine_id: string; name: string; reader_id: string };
  }>;
}
