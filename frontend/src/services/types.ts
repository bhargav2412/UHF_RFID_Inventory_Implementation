/* Domain types shared by the RFID inventory modules. */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  capacity: number;
  occupied: number;
  zones: Zone[];
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  capacity: number;
  occupied: number;
  itemCount: number;
  temperatureControlled: boolean;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: string;
  unitCost: number;
  reorderLevel: number;
  onHand: number;
  reserved: number;
  epcPrefix: string;
}

export type TagStatus = 'active' | 'unassigned' | 'inactive' | 'damaged' | 'lost';

export interface RfidTag {
  id: string;
  epc: string;
  tid: string;
  tagType: string;
  itemSku?: string;
  itemName?: string;
  status: TagStatus;
  location?: string;
  lastSeen?: string;
  lastReader?: string;
  rssi?: number;
  readCount: number;
  encodedAt: string;
  health: number;
}

export type ReaderStatus = 'online' | 'offline' | 'degraded';

export interface Reader {
  id: string;
  code: string;
  name: string;
  model: string;
  type: 'fixed' | 'handheld' | 'gate' | 'overhead';
  ip: string;
  location: string;
  zone: string;
  antennas: number;
  status: ReaderStatus;
  readsPerMin: number;
  lastHeartbeat: string;
  firmware: string;
  txPower: number;
}

export type MovementType =
  | 'receive'
  | 'putaway'
  | 'transfer'
  | 'issue'
  | 'adjustment'
  | 'scan'
  | 'return';

export interface Movement {
  id: string;
  timestamp: string;
  epc: string;
  itemSku: string;
  itemName: string;
  type: MovementType;
  from?: string;
  to?: string;
  quantity: number;
  reader: string;
  user: string;
  reference?: string;
}

export type OperationKind = 'receiving' | 'putaway' | 'transfer' | 'adjustment' | 'issue';

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'approved'
  | 'rejected';

export interface OperationLine {
  itemSku: string;
  itemName: string;
  expected: number;
  scanned: number;
  uom: string;
}

export interface OperationDocument {
  id: string;
  number: string;
  kind: OperationKind;
  date: string;
  status: DocumentStatus;
  source: string;
  destination: string;
  partner?: string;
  reason?: string;
  createdBy: string;
  lines: OperationLine[];
  totalExpected: number;
  totalScanned: number;
}

export type CountStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CountSession {
  id: string;
  number: string;
  type: 'cycle' | 'full';
  name: string;
  warehouse: string;
  zones: string[];
  scheduledFor: string;
  status: CountStatus;
  assignedTo: string;
  expected: number;
  counted: number;
  variance: number;
  accuracy: number;
}

export interface VarianceLine {
  id: string;
  session: string;
  itemSku: string;
  itemName: string;
  location: string;
  expected: number;
  counted: number;
  variance: number;
  value: number;
  reason?: string;
}

export type InvestigationStatus = 'open' | 'investigating' | 'found' | 'written_off' | 'closed';

export interface Investigation {
  id: string;
  number: string;
  epc: string;
  itemSku: string;
  itemName: string;
  lastLocation: string;
  lastSeen: string;
  value: number;
  status: InvestigationStatus;
  assignedTo: string;
  openedAt: string;
  priority: Severity;
  notes: string;
}

export type AlertType =
  | 'missing_item'
  | 'unauthorized_movement'
  | 'duplicate_epc'
  | 'epc_tid_mismatch'
  | 'reader_offline'
  | 'low_stock'
  | 'tag_not_responding'
  | 'expired_asset';

export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  location: string;
  createdAt: string;
}

export type AssetStatus = 'in_use' | 'available' | 'maintenance' | 'retired' | 'lost';

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  epc: string;
  serialNo: string;
  status: AssetStatus;
  custodian?: string;
  department: string;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  bookValue: number;
  warrantyUntil: string;
  nextMaintenance: string;
  lastSeen: string;
  lifecycleStage: 'procurement' | 'deployment' | 'operation' | 'maintenance' | 'disposal';
}

export interface AssetAssignment {
  id: string;
  assetCode: string;
  assetName: string;
  custodian: string;
  department: string;
  assignedAt: string;
  dueBack?: string;
  returnedAt?: string;
  status: 'active' | 'returned' | 'overdue';
}

export interface Custodian {
  id: string;
  name: string;
  email: string;
  department: string;
  assets: number;
  value: number;
  lastActivity: string;
  overdue: number;
}

export interface MaintenanceTask {
  id: string;
  number: string;
  assetCode: string;
  assetName: string;
  type: 'preventive' | 'corrective' | 'calibration' | 'inspection';
  dueDate: string;
  status: 'scheduled' | 'due' | 'overdue' | 'in_progress' | 'completed';
  technician: string;
  cost: number;
  frequency: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  site: string;
  status: 'active' | 'invited' | 'disabled';
  lastLogin: string;
}

export interface ReportDefinition {
  id: string;
  category: 'inventory' | 'rfid' | 'movement' | 'exception';
  name: string;
  description: string;
  frequency: string;
  lastRun: string;
  format: string[];
}

export interface Integration {
  id: string;
  name: string;
  category: 'ERP' | 'Accounting' | 'Messaging' | 'API';
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  icon: string;
}

export interface Geofence {
  id: string;
  name: string;
  zone: string;
  rule: 'entry' | 'exit' | 'dwell';
  action: string;
  readers: number;
  breaches24h: number;
  enabled: boolean;
}
