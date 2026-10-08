import axios from 'axios';
import * as db from './mock/data';
import { int, lastNMonths } from './mock/rng';
import { OperationKind } from './types';

/**
 * Service layer for all RFID inventory modules.
 *
 * Every function returns mock data while `VITE_APP_USE_MOCK` is not "false".
 * When the NestJS endpoints are ready, set VITE_APP_USE_MOCK=false in .env and
 * each call will hit the endpoint documented next to it instead.
 */
export const USE_MOCK = import.meta.env.VITE_APP_USE_MOCK !== 'false';
const API = import.meta.env.VITE_APP_API_URL;

const delay = <T>(data: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));

const get = async <T>(path: string, mock: () => T, params?: Record<string, unknown>): Promise<T> => {
  if (USE_MOCK) return delay(mock());
  const res = await axios.get(`${API}${path}`, { params });
  return (res.data?.data ?? res.data) as T;
};

/* ---------------- Dashboards ---------------- */

export const fetchMainDashboard = () =>
  get('/dashboard/overview', () => {
    const totalItems = db.items.length;
    const inStock = db.items.filter((i) => i.onHand > 0).length;
    const lowStock = db.items.filter((i) => i.onHand > 0 && i.onHand <= i.reorderLevel).length;
    const today = db.movements.filter((m) => Date.now() - new Date(m.timestamp).getTime() < 864e5);
    const capacity = db.warehouses.reduce((s, w) => s + w.capacity, 0);
    const occupied = db.warehouses.reduce((s, w) => s + w.occupied, 0);
    return {
      kpis: {
        totalItems,
        totalUnits: db.items.reduce((s, i) => s + i.onHand, 0),
        inStock,
        outOfStock: totalItems - inStock,
        lowStock,
        todaysReads: 48210 + int(0, 900),
        movedToday: today.filter((m) => m.type !== 'scan').length,
        missingItems: db.investigations.filter((i) => ['open', 'investigating'].includes(i.status)).length,
        unidentifiedTags: 37,
        readersOnline: db.readers.filter((r) => r.status === 'online').length,
        readersTotal: db.readers.length,
        accuracy: 98.6,
        occupancy: Math.round((occupied / capacity) * 100)
      },
      readsTrend: {
        labels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`),
        reads: Array.from({ length: 24 }, (_, h) => (h > 6 && h < 21 ? int(1800, 3600) : int(200, 900)))
      },
      movementMix: ['receive', 'putaway', 'transfer', 'issue', 'adjustment', 'return'].map((type) => ({
        type,
        count: db.movements.filter((m) => m.type === type).length
      })),
      recentMovements: db.movements.filter((m) => m.type !== 'scan').slice(0, 8),
      readers: db.readers,
      warehouses: db.warehouses.map((w) => ({
        id: w.id,
        name: w.name,
        city: w.city,
        capacity: w.capacity,
        occupied: w.occupied
      })),
      lowStockItems: db.items.filter((i) => i.onHand <= i.reorderLevel).slice(0, 6),
      alerts: db.alerts.filter((a) => a.status !== 'resolved').slice(0, 6)
    };
  });

export const fetchExecutiveDashboard = () =>
  get('/dashboard/executive', () => {
    const months = lastNMonths(12);
    const stockValue = db.items.reduce((s, i) => s + i.onHand * i.unitCost, 0);
    let v = stockValue * 0.82;
    return {
      kpis: {
        stockValue,
        stockValueChange: 6.4,
        turnover: 7.8,
        accuracy: 98.6,
        utilization: 74,
        shrinkage: 0.42
      },
      months,
      inventoryTrend: {
        inbound: months.map(() => int(3800, 7200)),
        outbound: months.map(() => int(3500, 6900)),
        onHand: months.map(() => int(21000, 28000))
      },
      stockValueTrend: months.map(() => {
        v = v * (1 + (int(-30, 60) / 1000));
        return Math.round(v);
      }),
      accuracyTrend: months.map(() => Number((96.5 + Math.random() * 3).toFixed(2))),
      utilization: db.warehouses.map((w) => ({
        name: w.name,
        value: Math.round((w.occupied / w.capacity) * 100)
      })),
      categoryValue: Array.from(new Set(db.items.map((i) => i.category))).map((c) => ({
        category: c,
        value: db.items.filter((i) => i.category === c).reduce((s, i) => s + i.onHand * i.unitCost, 0)
      })),
      movementAnalysis: ['receive', 'putaway', 'transfer', 'issue', 'adjustment'].map((t) => ({
        name: t,
        data: months.map(() => int(200, 1600))
      })),
      heatmap: db.warehouses[0].zones.map((z) => ({
        name: z.name,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({
          x: d,
          y: int(z.name.includes('Dock') || z.name.includes('Dispatch') ? 60 : 5, z.name.includes('Dock') || z.name.includes('Dispatch') ? 100 : 70)
        }))
      }))
    };
  });

/* ---------------- Master data ---------------- */

export const fetchItems = () => get('/stock/items', () => db.items);
export const fetchTags = () => get('/rfid/tags', () => db.tags);
export const fetchReaders = () => get('/rfid/readers', () => db.readers);
export const fetchWarehouses = () => get('/locations', () => db.warehouses);

/* ---------------- Operations ---------------- */

export const fetchOperationDocs = (kind: OperationKind) =>
  get(`/operations/${kind}`, () => db.operationDocs[kind]);

/* ---------------- Tracking ---------------- */

export const fetchMovements = () => get('/tracking/movements', () => db.movements);

export const fetchItemTrail = (query: string) =>
  get(
    '/tracking/item',
    () => {
      const q = query.trim().toLowerCase();
      const tag = db.tags.find(
        (t) =>
          t.itemSku &&
          (t.epc.toLowerCase().includes(q) ||
            t.itemSku.toLowerCase() === q ||
            t.itemName?.toLowerCase().includes(q))
      );
      if (!tag) return null;
      const trail = db.movements.filter((m) => m.epc === tag.epc);
      const extra = db.movements.filter((m) => m.itemSku === tag.itemSku && m.epc !== tag.epc).slice(0, 8);
      return {
        tag,
        trail: [...trail, ...extra]
          .map((m) => ({ ...m, epc: tag.epc }))
          .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      };
    },
    { q: query }
  );

export const fetchLiveSnapshot = () =>
  get('/tracking/live', () => ({
    readers: db.readers,
    recent: db.movements.slice(0, 25),
    readsPerMinute: Array.from({ length: 30 }, () => int(900, 2400))
  }));

/* ---------------- Audit ---------------- */

export const fetchCountSessions = (type: 'cycle' | 'full') =>
  get(`/audit/counts?type=${type}`, () => db.countSessions.filter((c) => c.type === type));
export const fetchVariance = () => get('/audit/variance', () => db.varianceLines);
export const fetchInvestigations = () => get('/audit/investigations', () => db.investigations);

/* ---------------- Alerts ---------------- */

export const fetchAlerts = () => get('/alerts', () => db.alerts);

/* ---------------- Assets ---------------- */

export const fetchAssets = () => get('/assets', () => db.assets);
export const fetchAssignments = () => get('/assets/assignments', () => db.assignments);
export const fetchCustodians = () => get('/assets/custodians', () => db.custodians);
export const fetchMaintenance = () => get('/assets/maintenance', () => db.maintenanceTasks);

/* ---------------- Reports / Admin ---------------- */

export const fetchReports = () => get('/reports', () => db.reports);
export const fetchUsers = () => get('/users', () => db.users);
export const fetchIntegrations = () => get('/integrations', () => db.integrations);
export const fetchGeofences = () => get('/geofences', () => db.geofences);

