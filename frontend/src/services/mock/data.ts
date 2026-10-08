import {
  AlertItem,
  AlertType,
  AppUser,
  Asset,
  AssetAssignment,
  CountSession,
  Custodian,
  Geofence,
  Integration,
  Investigation,
  Item,
  MaintenanceTask,
  Movement,
  MovementType,
  OperationDocument,
  OperationKind,
  Reader,
  ReportDefinition,
  RfidTag,
  VarianceLine,
  Warehouse,
  Zone
} from '../types';
import {
  daysAgo,
  daysFromNow,
  float,
  hex,
  hoursAgo,
  int,
  minutesAgo,
  pad,
  pick,
  rand,
  resetSeed,
  weighted
} from './rng';

resetSeed();

export const PEOPLE = [
  'Aarav Shah',
  'Priya Patel',
  'Rohan Mehta',
  'Neha Iyer',
  'Vikram Rao',
  'Ananya Desai',
  'Karan Joshi',
  'Sneha Kulkarni',
  'Arjun Nair',
  'Meera Gupta',
  'Rahul Verma',
  'Isha Reddy'
];

export const DEPARTMENTS = ['Operations', 'Maintenance', 'IT', 'Quality', 'Logistics', 'Finance'];

/* ---------------- Locations ---------------- */

const WAREHOUSE_SEED = [
  { code: 'WH-AMD', name: 'Ahmedabad Central DC', city: 'Ahmedabad' },
  { code: 'WH-MUM', name: 'Mumbai Fulfilment Hub', city: 'Mumbai' },
  { code: 'WH-PUN', name: 'Pune Spares Store', city: 'Pune' }
];

const ZONE_NAMES = ['Receiving Dock', 'Bulk Storage', 'Rack Aisle', 'Pick Face', 'Cold Room', 'Dispatch Bay'];

export const warehouses: Warehouse[] = WAREHOUSE_SEED.map((w, wi) => {
  const zones: Zone[] = ZONE_NAMES.map((name, zi) => {
    const capacity = int(400, 1600);
    const occupied = Math.min(capacity, Math.round(capacity * float(0.35, 0.97, 2)));
    return {
      id: `z-${wi}-${zi}`,
      code: `${w.code.split('-')[1]}-${String.fromCharCode(65 + zi)}`,
      name,
      warehouseId: `wh-${wi}`,
      capacity,
      occupied,
      itemCount: Math.round(occupied * float(0.6, 1.1, 2)),
      temperatureControlled: name === 'Cold Room'
    };
  });
  const capacity = zones.reduce((s, z) => s + z.capacity, 0);
  const occupied = zones.reduce((s, z) => s + z.occupied, 0);
  return { id: `wh-${wi}`, ...w, capacity, occupied, zones };
});

export const allZones = warehouses.flatMap((w) => w.zones.map((z) => ({ ...z, warehouse: w.name })));

const zoneLabel = () => {
  const z = pick(allZones);
  return `${z.code} · ${z.name}`;
};

/* ---------------- Items ---------------- */

const ITEM_SEED: [string, string, string, number][] = [
  ['Industrial Safety Helmet', 'Safety', 'pcs', 450],
  ['Hi-Vis Reflective Vest', 'Safety', 'pcs', 220],
  ['Nitrile Gloves (Box/100)', 'Consumables', 'box', 380],
  ['Pallet Wrap Film 500mm', 'Packaging', 'roll', 640],
  ['Corrugated Carton 18x12x12', 'Packaging', 'pcs', 38],
  ['Hydraulic Pump HX-200', 'Spares', 'pcs', 18500],
  ['Ball Bearing 6205-2RS', 'Spares', 'pcs', 145],
  ['V-Belt B-52', 'Spares', 'pcs', 320],
  ['Servo Motor 1.5kW', 'Electrical', 'pcs', 27400],
  ['Proximity Sensor M18', 'Electrical', 'pcs', 1350],
  ['Cat6 Patch Cable 3m', 'IT', 'pcs', 160],
  ['Rugged Handheld Scanner', 'IT', 'pcs', 48500],
  ['Thermal Label Roll 100x150', 'Consumables', 'roll', 290],
  ['Lithium Grease 1kg', 'Consumables', 'tin', 540],
  ['Stainless Hex Bolt M12', 'Hardware', 'pcs', 22],
  ['Spring Washer M12', 'Hardware', 'pcs', 4],
  ['Forklift Battery 48V', 'Equipment', 'pcs', 165000],
  ['Pallet Jack 2.5T', 'Equipment', 'pcs', 21500],
  ['Vaccine Cooler Box', 'Cold Chain', 'pcs', 6400],
  ['Temperature Logger', 'Cold Chain', 'pcs', 3900],
  ['Fire Extinguisher 6kg', 'Safety', 'pcs', 2850],
  ['First Aid Kit (Large)', 'Safety', 'pcs', 1750],
  ['LED High Bay 150W', 'Electrical', 'pcs', 6900],
  ['Copper Cable 4 sq mm (90m)', 'Electrical', 'coil', 5600],
  ['Packing Tape 48mm', 'Packaging', 'roll', 55],
  ['Stretch Hood Bag', 'Packaging', 'pcs', 74],
  ['Gear Oil EP-90 (20L)', 'Consumables', 'can', 4300],
  ['Pneumatic Cylinder 63x200', 'Spares', 'pcs', 7800],
  ['PLC I/O Module', 'Electrical', 'pcs', 15800],
  ['Laptop 14" i5', 'IT', 'pcs', 62000]
];

export const items: Item[] = ITEM_SEED.map(([name, category, uom, unitCost], i) => {
  const reorderLevel = int(10, 120);
  const onHand = weighted<number>([
    [0, 1],
    [int(1, reorderLevel), 3],
    [int(reorderLevel, reorderLevel * 8), 10]
  ]);
  return {
    id: `itm-${i}`,
    sku: `SKU-${pad(1001 + i)}`,
    name,
    category,
    uom,
    unitCost,
    reorderLevel,
    onHand,
    reserved: Math.round(onHand * float(0, 0.25, 2)),
    epcPrefix: `3034${hex(4)}`
  };
});

/* ---------------- Readers ---------------- */

const READER_MODELS = ['Zebra FX9600', 'Impinj R700', 'Zebra ATR7000', 'Chainway C72', 'Zebra MC3390R'];

export const readers: Reader[] = Array.from({ length: 14 }, (_, i) => {
  const type = i < 4 ? 'gate' : i < 9 ? 'fixed' : i < 11 ? 'overhead' : 'handheld';
  const wh = warehouses[i % warehouses.length];
  const zone = pick(wh.zones);
  const status = weighted<Reader['status']>([
    ['online', 10],
    ['degraded', 2],
    ['offline', 1.5]
  ]);
  return {
    id: `rdr-${i}`,
    code: `RDR-${pad(i + 1, 3)}`,
    name: `${type === 'gate' ? 'Dock Gate' : type === 'handheld' ? 'Handheld' : type === 'overhead' ? 'Overhead Array' : 'Fixed Reader'} ${i + 1}`,
    model: type === 'handheld' ? pick(['Chainway C72', 'Zebra MC3390R']) : pick(READER_MODELS.slice(0, 3)),
    type,
    ip: `10.20.${wi(i)}.${int(10, 250)}`,
    location: wh.name,
    zone: `${zone.code} · ${zone.name}`,
    antennas: type === 'handheld' ? 1 : pick([2, 4, 8]),
    status,
    readsPerMin: status === 'offline' ? 0 : int(status === 'degraded' ? 5 : 40, status === 'degraded' ? 40 : 420),
    lastHeartbeat: status === 'offline' ? minutesAgo(int(25, 300)) : minutesAgo(int(0, 2)),
    firmware: `v${int(2, 4)}.${int(0, 9)}.${int(0, 30)}`,
    txPower: float(20, 31.5, 1)
  } as Reader;
});

function wi(i: number) {
  return (i % 3) + 1;
}

/* ---------------- Tags ---------------- */

export const tags: RfidTag[] = Array.from({ length: 320 }, (_, i) => {
  const item = pick(items);
  const status = weighted<RfidTag['status']>([
    ['active', 18],
    ['unassigned', 2],
    ['inactive', 1],
    ['damaged', 0.6],
    ['lost', 0.6]
  ]);
  const assigned = status !== 'unassigned';
  const reader = pick(readers);
  return {
    id: `tag-${i}`,
    epc: `${item.epcPrefix}${hex(16)}`,
    tid: `E280${hex(20)}`,
    tagType: pick(['UHF Gen2 Label', 'UHF Hard Tag', 'On-Metal Tag', 'Cable Tie Tag']),
    itemSku: assigned ? item.sku : undefined,
    itemName: assigned ? item.name : undefined,
    status,
    location: assigned ? zoneLabel() : undefined,
    lastSeen: status === 'lost' ? daysAgo(int(8, 40)) : assigned ? minutesAgo(int(1, 4000)) : undefined,
    lastReader: assigned ? reader.code : undefined,
    rssi: assigned ? -int(38, 78) : undefined,
    readCount: assigned ? int(4, 3200) : 0,
    encodedAt: daysAgo(int(5, 400)),
    health: status === 'damaged' ? int(10, 45) : status === 'lost' ? int(0, 30) : int(62, 100)
  };
});

/* ---------------- Movements ---------------- */

const MOVE_TYPES: [MovementType, number][] = [
  ['scan', 6],
  ['receive', 3],
  ['putaway', 3],
  ['transfer', 2],
  ['issue', 3],
  ['adjustment', 0.7],
  ['return', 0.6]
];

export const movements: Movement[] = Array.from({ length: 480 }, (_, i) => {
  const tag = pick(tags.filter((t) => t.itemSku));
  const type = weighted(MOVE_TYPES);
  return {
    id: `mv-${i}`,
    timestamp: minutesAgo(i * int(4, 20) + int(0, 5)),
    epc: tag.epc,
    itemSku: tag.itemSku!,
    itemName: tag.itemName!,
    type,
    from: type === 'receive' ? 'Supplier' : zoneLabel(),
    to: type === 'issue' ? pick(['Production Line 1', 'Maintenance Dept', 'Customer Dispatch']) : zoneLabel(),
    quantity: type === 'scan' ? 1 : int(1, 40),
    reader: pick(readers).code,
    user: pick(PEOPLE),
    reference: type === 'scan' ? undefined : `${type.slice(0, 3).toUpperCase()}-${pad(int(100, 999), 5)}`
  };
});

/* ---------------- Operation documents ---------------- */

const KIND_PREFIX: Record<OperationKind, string> = {
  receiving: 'GRN',
  putaway: 'PUT',
  transfer: 'TRF',
  adjustment: 'ADJ',
  issue: 'ISS'
};

const SUPPLIERS = ['Apex Industrial Supplies', 'Bharat Packaging Co.', 'Shree Electricals', 'Nova Safety Gear', 'Orbit Spares Pvt Ltd'];
const ISSUE_TO = ['Production Line 1', 'Production Line 2', 'Maintenance Dept', 'Customer Order', 'Project Site B'];
const ADJ_REASONS = ['Damaged in storage', 'Cycle count correction', 'Expired', 'Found stock', 'Sample consumption'];

const makeDocs = (kind: OperationKind, count: number): OperationDocument[] =>
  Array.from({ length: count }, (_, i) => {
    const lineCount = int(1, 5);
    const lines = Array.from({ length: lineCount }, () => {
      const item = pick(items);
      const expected = int(5, 120);
      return {
        itemSku: item.sku,
        itemName: item.name,
        uom: item.uom,
        expected,
        scanned: 0
      };
    });
    const status = weighted<OperationDocument['status']>([
      ['completed', 6],
      ['in_progress', 2],
      ['pending', 2],
      ['draft', 1],
      ['cancelled', 0.4]
    ]);
    lines.forEach((l) => {
      l.scanned =
        status === 'completed'
          ? l.expected - (rand() < 0.15 ? int(1, 3) : 0)
          : status === 'in_progress'
            ? int(0, l.expected)
            : 0;
    });
    const wh = pick(warehouses);
    const wh2 = pick(warehouses.filter((w) => w.id !== wh.id));
    const source =
      kind === 'receiving' ? pick(SUPPLIERS) : kind === 'transfer' ? wh.name : zoneLabel();
    const destination =
      kind === 'receiving'
        ? `${wh.name}`
        : kind === 'transfer'
          ? wh2.name
          : kind === 'issue'
            ? pick(ISSUE_TO)
            : kind === 'adjustment'
              ? '—'
              : zoneLabel();
    return {
      id: `${kind}-${i}`,
      number: `${KIND_PREFIX[kind]}-${2026}-${pad(count - i + 200, 5)}`,
      kind,
      date: hoursAgo(i * int(5, 18) + int(0, 4)),
      status,
      source,
      destination,
      partner: kind === 'receiving' ? source : kind === 'issue' ? destination : undefined,
      reason: kind === 'adjustment' ? pick(ADJ_REASONS) : undefined,
      createdBy: pick(PEOPLE),
      lines,
      totalExpected: lines.reduce((s, l) => s + l.expected, 0),
      totalScanned: lines.reduce((s, l) => s + l.scanned, 0)
    };
  });

export const operationDocs: Record<OperationKind, OperationDocument[]> = {
  receiving: makeDocs('receiving', 28),
  putaway: makeDocs('putaway', 24),
  transfer: makeDocs('transfer', 18),
  adjustment: makeDocs('adjustment', 14),
  issue: makeDocs('issue', 26)
};

/* ---------------- Audits ---------------- */

export const countSessions: CountSession[] = Array.from({ length: 22 }, (_, i) => {
  const type = i % 4 === 0 ? 'full' : 'cycle';
  const wh = pick(warehouses);
  const status = i < 2 ? 'in_progress' : i < 5 ? 'scheduled' : weighted<CountSession['status']>([
    ['completed', 9],
    ['cancelled', 1]
  ]);
  const expected = type === 'full' ? int(2500, 9000) : int(120, 900);
  const counted =
    status === 'completed' ? expected - int(-6, 22) : status === 'in_progress' ? Math.round(expected * float(0.2, 0.8, 2)) : 0;
  const variance = status === 'completed' ? counted - expected : 0;
  return {
    id: `cnt-${i}`,
    number: `${type === 'full' ? 'PHY' : 'CC'}-${pad(500 - i, 4)}`,
    type,
    name:
      type === 'full'
        ? `Quarterly full count — ${wh.city}`
        : `${pick(['ABC class A', 'High value', 'Fast movers', 'Random sample', 'Spares'])} — ${pick(wh.zones).name}`,
    warehouse: wh.name,
    zones: type === 'full' ? wh.zones.map((z) => z.code) : [pick(wh.zones).code],
    scheduledFor: i < 5 ? daysFromNow(i < 2 ? 0 : int(1, 14)) : daysAgo(i * int(2, 5)),
    status,
    assignedTo: pick(PEOPLE),
    expected,
    counted,
    variance,
    accuracy: status === 'completed' ? Number(((1 - Math.abs(variance) / expected) * 100).toFixed(2)) : 0
  };
});

export const varianceLines: VarianceLine[] = Array.from({ length: 60 }, (_, i) => {
  const item = pick(items);
  const expected = int(5, 300);
  const counted = Math.max(0, expected + weighted<number>([
    [int(-12, -1), 5],
    [int(1, 8), 2],
    [0, 1]
  ]));
  const variance = counted - expected;
  return {
    id: `var-${i}`,
    session: pick(countSessions.filter((c) => c.status === 'completed')).number,
    itemSku: item.sku,
    itemName: item.name,
    location: zoneLabel(),
    expected,
    counted,
    variance,
    value: variance * item.unitCost,
    reason: variance === 0 ? undefined : pick(['Unscanned tag', 'Damaged tag', 'Misplaced', 'Unrecorded issue', 'Not investigated'])
  };
}).filter((v) => v.variance !== 0);

export const investigations: Investigation[] = Array.from({ length: 24 }, (_, i) => {
  const tag = pick(tags.filter((t) => t.itemSku));
  const item = items.find((it) => it.sku === tag.itemSku)!;
  return {
    id: `inv-${i}`,
    number: `MIS-${pad(900 - i, 4)}`,
    epc: tag.epc,
    itemSku: item.sku,
    itemName: item.name,
    lastLocation: tag.location ?? zoneLabel(),
    lastSeen: daysAgo(int(1, 30)),
    value: item.unitCost,
    status: i < 4 ? 'open' : weighted<Investigation['status']>([
      ['investigating', 3],
      ['found', 4],
      ['written_off', 1.5],
      ['closed', 2]
    ]),
    assignedTo: pick(PEOPLE),
    openedAt: daysAgo(i + int(0, 3)),
    priority: item.unitCost > 10000 ? 'high' : item.unitCost > 2000 ? 'medium' : 'low',
    notes: pick([
      'Not detected by any reader during last two cycle counts.',
      'Last seen at dispatch gate without matching issue document.',
      'Tag read intermittently — possible tag damage.',
      'Reported missing by zone supervisor.'
    ])
  };
});

/* ---------------- Alerts ---------------- */

const ALERT_TEMPLATES: Record<AlertType, { title: string; severity: AlertItem['severity'][]; msg: () => string }> = {
  missing_item: {
    title: 'Missing item',
    severity: ['high', 'medium'],
    msg: () => `${pick(items).name} not seen for ${int(3, 20)} days`
  },
  unauthorized_movement: {
    title: 'Unauthorized movement',
    severity: ['critical', 'high'],
    msg: () => `Tag passed ${pick(readers.filter((r) => r.type === 'gate')).name} without an issue document`
  },
  duplicate_epc: {
    title: 'Duplicate EPC detected',
    severity: ['high'],
    msg: () => `EPC ${hex(8)}… reported by two readers simultaneously`
  },
  epc_tid_mismatch: {
    title: 'EPC/TID mismatch',
    severity: ['critical', 'high'],
    msg: () => `TID does not match registered EPC — possible cloned tag`
  },
  reader_offline: {
    title: 'Reader offline',
    severity: ['high', 'medium'],
    msg: () => `${pick(readers).code} missed ${int(3, 12)} heartbeats`
  },
  low_stock: {
    title: 'Low stock',
    severity: ['medium', 'low'],
    msg: () => {
      const it = pick(items);
      return `${it.name} below reorder level (${it.reorderLevel} ${it.uom})`;
    }
  },
  tag_not_responding: {
    title: 'Tag not responding',
    severity: ['low', 'medium'],
    msg: () => `Weak RSSI (-${int(75, 88)} dBm) on tag in ${pick(allZones).name}`
  },
  expired_asset: {
    title: 'Expired asset',
    severity: ['medium', 'low'],
    msg: () => `${pick(['Fire Extinguisher', 'Calibration certificate', 'Warranty', 'Temperature Logger'])} expired ${int(1, 30)} days ago`
  }
};

export const ALERT_TYPES = Object.keys(ALERT_TEMPLATES) as AlertType[];

export const alerts: AlertItem[] = Array.from({ length: 64 }, (_, i) => {
  const type = weighted<AlertType>([
    ['missing_item', 3],
    ['unauthorized_movement', 2],
    ['duplicate_epc', 1],
    ['epc_tid_mismatch', 1],
    ['reader_offline', 2],
    ['low_stock', 3],
    ['tag_not_responding', 2],
    ['expired_asset', 1.5]
  ]);
  const t = ALERT_TEMPLATES[type];
  return {
    id: `alt-${i}`,
    type,
    title: t.title,
    message: t.msg(),
    severity: pick(t.severity),
    status: i < 12 ? 'new' : weighted<AlertItem['status']>([
      ['new', 2],
      ['acknowledged', 3],
      ['resolved', 6]
    ]),
    source: pick(readers).code,
    location: zoneLabel(),
    createdAt: minutesAgo(i * int(20, 90) + int(1, 15))
  };
});

/* ---------------- Assets ---------------- */

const ASSET_SEED: [string, string, number][] = [
  ['Forklift Toyota 8FBE', 'Material Handling', 1450000],
  ['Reach Truck BT RRE', 'Material Handling', 2100000],
  ['Rugged Tablet', 'IT Equipment', 68000],
  ['Laptop Dell Latitude', 'IT Equipment', 82000],
  ['Torque Wrench Set', 'Tools', 24000],
  ['Digital Multimeter', 'Tools', 9800],
  ['Weighing Scale 500kg', 'Instruments', 46000],
  ['Pallet Wrapper', 'Machinery', 380000],
  ['Air Compressor 10HP', 'Machinery', 210000],
  ['RFID Handheld Reader', 'IT Equipment', 98000],
  ['Thermal Printer ZT411', 'IT Equipment', 115000],
  ['Generator 62.5 kVA', 'Utilities', 960000]
];

export const assets: Asset[] = Array.from({ length: 64 }, (_, i) => {
  const [name, category, cost] = pick(ASSET_SEED);
  const status = weighted<Asset['status']>([
    ['in_use', 10],
    ['available', 3],
    ['maintenance', 1.5],
    ['retired', 0.8],
    ['lost', 0.4]
  ]);
  const age = int(30, 1800);
  const bookValue = Math.max(0, Math.round(cost * (1 - age / 2600)));
  const custodian = status === 'in_use' ? pick(PEOPLE) : undefined;
  return {
    id: `ast-${i}`,
    assetCode: `AST-${pad(3000 + i)}`,
    name,
    category,
    epc: `3500${hex(20)}`,
    serialNo: `SN${hex(8)}`,
    status,
    custodian,
    department: pick(DEPARTMENTS),
    location: zoneLabel(),
    purchaseDate: daysAgo(age),
    purchaseCost: cost,
    bookValue,
    warrantyUntil: daysFromNow(int(-200, 700)),
    nextMaintenance: daysFromNow(int(-15, 120)),
    lastSeen: minutesAgo(int(1, 6000)),
    lifecycleStage:
      status === 'retired'
        ? 'disposal'
        : status === 'maintenance'
          ? 'maintenance'
          : age < 60
            ? 'deployment'
            : 'operation'
  };
});

export const assignments: AssetAssignment[] = assets
  .filter((a) => a.custodian)
  .map((a, i) => {
    const overdue = rand() < 0.12;
    return {
      id: `asg-${i}`,
      assetCode: a.assetCode,
      assetName: a.name,
      custodian: a.custodian!,
      department: a.department,
      assignedAt: daysAgo(int(2, 300)),
      dueBack: rand() < 0.5 ? daysFromNow(overdue ? -int(1, 20) : int(5, 90)) : undefined,
      status: overdue ? 'overdue' : 'active'
    } as AssetAssignment;
  })
  .concat(
    Array.from({ length: 14 }, (_, i) => {
      const a = pick(assets);
      return {
        id: `asg-r-${i}`,
        assetCode: a.assetCode,
        assetName: a.name,
        custodian: pick(PEOPLE),
        department: pick(DEPARTMENTS),
        assignedAt: daysAgo(int(120, 400)),
        returnedAt: daysAgo(int(5, 110)),
        status: 'returned' as const
      };
    })
  );

export const custodians: Custodian[] = PEOPLE.map((name, i) => {
  const owned = assets.filter((a) => a.custodian === name);
  return {
    id: `cus-${i}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@cvsinventory.in`,
    department: pick(DEPARTMENTS),
    assets: owned.length,
    value: owned.reduce((s, a) => s + a.bookValue, 0),
    lastActivity: minutesAgo(int(10, 8000)),
    overdue: assignments.filter((a) => a.custodian === name && a.status === 'overdue').length
  };
});

export const maintenanceTasks: MaintenanceTask[] = Array.from({ length: 36 }, (_, i) => {
  const a = pick(assets);
  const offset = int(-20, 60);
  const status: MaintenanceTask['status'] =
    i < 6
      ? 'completed'
      : offset < -3
        ? 'overdue'
        : offset < 3
          ? pick(['due', 'in_progress'] as const)
          : 'scheduled';
  return {
    id: `mnt-${i}`,
    number: `WO-${pad(7000 + i)}`,
    assetCode: a.assetCode,
    assetName: a.name,
    type: pick(['preventive', 'corrective', 'calibration', 'inspection'] as const),
    dueDate: i < 6 ? daysAgo(int(2, 40)) : daysFromNow(offset),
    status,
    technician: pick(PEOPLE),
    cost: int(800, 45000),
    frequency: pick(['Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time'])
  };
});

/* ---------------- Admin ---------------- */

export const ROLES = ['Super Admin', 'Admin', 'Warehouse Manager', 'Auditor', 'Operator', 'Viewer'];

export const users: AppUser[] = PEOPLE.map((name, i) => ({
  id: `usr-${i}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@cvsinventory.in`,
  role: i === 0 ? 'Super Admin' : pick(ROLES.slice(1)),
  site: pick(warehouses).name,
  status: weighted<AppUser['status']>([
    ['active', 9],
    ['invited', 1],
    ['disabled', 0.6]
  ]),
  lastLogin: minutesAgo(int(5, 20000))
}));

export const reports: ReportDefinition[] = [
  { id: 'r1', category: 'inventory', name: 'Stock on Hand', description: 'Current quantity and value by item and location', frequency: 'Daily', lastRun: hoursAgo(2), format: ['CSV', 'PDF', 'XLSX'] },
  { id: 'r2', category: 'inventory', name: 'Stock Valuation', description: 'Inventory value by category with ageing buckets', frequency: 'Weekly', lastRun: daysAgo(1), format: ['PDF', 'XLSX'] },
  { id: 'r3', category: 'inventory', name: 'Low Stock & Reorder', description: 'Items at or below reorder level with suggested quantity', frequency: 'Daily', lastRun: hoursAgo(5), format: ['CSV', 'XLSX'] },
  { id: 'r4', category: 'inventory', name: 'Slow & Non-moving Stock', description: 'Items with no movement in 30/60/90 days', frequency: 'Monthly', lastRun: daysAgo(6), format: ['PDF', 'XLSX'] },
  { id: 'r5', category: 'rfid', name: 'Tag Read Summary', description: 'Reads per reader, antenna and hour', frequency: 'Hourly', lastRun: minutesAgo(25), format: ['CSV'] },
  { id: 'r6', category: 'rfid', name: 'Reader Uptime', description: 'Availability and heartbeat gaps per reader', frequency: 'Daily', lastRun: hoursAgo(3), format: ['PDF', 'CSV'] },
  { id: 'r7', category: 'rfid', name: 'Tag Health', description: 'RSSI distribution and non-responding tags', frequency: 'Weekly', lastRun: daysAgo(2), format: ['PDF', 'XLSX'] },
  { id: 'r8', category: 'rfid', name: 'Encoding Log', description: 'Tags encoded and commissioned by user', frequency: 'Daily', lastRun: hoursAgo(9), format: ['CSV'] },
  { id: 'r9', category: 'movement', name: 'Movement Register', description: 'All receipts, transfers and issues with references', frequency: 'Daily', lastRun: hoursAgo(1), format: ['CSV', 'XLSX'] },
  { id: 'r10', category: 'movement', name: 'Inter-warehouse Transfers', description: 'Transfers in transit and delivered', frequency: 'Daily', lastRun: hoursAgo(4), format: ['PDF', 'XLSX'] },
  { id: 'r11', category: 'movement', name: 'Dwell Time by Zone', description: 'Average time items stay in each zone', frequency: 'Weekly', lastRun: daysAgo(3), format: ['PDF'] },
  { id: 'r12', category: 'exception', name: 'Unauthorized Exits', description: 'Gate reads without matching documents', frequency: 'Real-time', lastRun: minutesAgo(8), format: ['CSV', 'PDF'] },
  { id: 'r13', category: 'exception', name: 'Count Variance', description: 'Variance by session, item and value', frequency: 'Per count', lastRun: daysAgo(1), format: ['PDF', 'XLSX'] },
  { id: 'r14', category: 'exception', name: 'Duplicate & Cloned Tags', description: 'Duplicate EPC and EPC/TID mismatch events', frequency: 'Daily', lastRun: hoursAgo(6), format: ['CSV'] }
];

export const integrations: Integration[] = [
  { id: 'i1', name: 'SAP S/4HANA', category: 'ERP', description: 'Sync material master, GRN and goods issue postings', status: 'connected', lastSync: minutesAgo(6), icon: 'abstract-26' },
  { id: 'i2', name: 'Oracle NetSuite', category: 'ERP', description: 'Purchase orders, transfers and item fulfilment', status: 'disconnected', icon: 'abstract-33' },
  { id: 'i3', name: 'Microsoft Dynamics 365', category: 'ERP', description: 'Inventory journals and warehouse transfers', status: 'disconnected', icon: 'abstract-41' },
  { id: 'i4', name: 'Tally Prime', category: 'Accounting', description: 'Stock valuation and asset depreciation vouchers', status: 'connected', lastSync: hoursAgo(3), icon: 'bill' },
  { id: 'i5', name: 'Zoho Books', category: 'Accounting', description: 'Inventory value and write-off journals', status: 'error', lastSync: daysAgo(1), icon: 'wallet' },
  { id: 'i6', name: 'Email / SMTP', category: 'Messaging', description: 'Alert and report delivery by email', status: 'connected', lastSync: minutesAgo(15), icon: 'sms' },
  { id: 'i7', name: 'Webhooks', category: 'API', description: 'Push RFID events to external systems', status: 'connected', lastSync: minutesAgo(1), icon: 'technology-2' },
  { id: 'i8', name: 'MQTT Broker', category: 'API', description: 'Stream raw tag reads from edge readers', status: 'connected', lastSync: minutesAgo(0), icon: 'router' }
];

export const geofences: Geofence[] = [
  { id: 'g1', name: 'Dock gate exit control', zone: 'AMD-F · Dispatch Bay', rule: 'exit', action: 'Raise critical alert + siren', readers: 4, breaches24h: 3, enabled: true },
  { id: 'g2', name: 'Cold room dwell limit', zone: 'MUM-E · Cold Room', rule: 'dwell', action: 'Alert if outside > 15 min', readers: 2, breaches24h: 1, enabled: true },
  { id: 'g3', name: 'High value cage', zone: 'AMD-C · Rack Aisle', rule: 'entry', action: 'Log & notify supervisor', readers: 2, breaches24h: 0, enabled: true },
  { id: 'g4', name: 'Spares store exit', zone: 'PUN-F · Dispatch Bay', rule: 'exit', action: 'Require issue document', readers: 2, breaches24h: 2, enabled: true },
  { id: 'g5', name: 'Quarantine area', zone: 'MUM-A · Receiving Dock', rule: 'exit', action: 'Block until QC release', readers: 1, breaches24h: 0, enabled: false }
];
