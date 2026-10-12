import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Item, ItemDocument } from './item.entity';
import { Warehouse, WarehouseDocument } from './warehouse.entity';
import { Machine, MachineDocument, MachineStatus, MachineType } from './machine.entity';
import { StockEntry, StockEntryDocument } from './stock-entry.entity';
import {
    CreateItemInput,
    CreateMachineInput,
    CreateWarehouseInput,
    LedgerQuery,
    ListQuery,
    PushEntryInput,
    UpdateItemInput,
    UpdateLedgerInput,
    UpdateMachineInput,
    UpdateWarehouseInput,
} from './stock.schema';

export interface PageMeta {
    total: number;
    page: number;
    limit: number;
    last_page: number;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toObjectId = (id: string, label = 'id') => {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid ${label}`);
    return new Types.ObjectId(id);
};

@Injectable()
export class StockService {
    constructor(
        @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
        @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
        @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
        @InjectModel(StockEntry.name) private ledgerModel: Model<StockEntryDocument>,
    ) { }

    /* ------------------------------------------------------------------ */
    /* Helpers                                                             */
    /* ------------------------------------------------------------------ */

    private async paginate<T>(
        model: Model<T>,
        filter: FilterQuery<T>,
        query: ListQuery,
        sort: Record<string, 1 | -1>,
        populate: string[] = [],
    ) {
        const limit = Math.min(Math.max(query.limit, 1), 500);
        const page = Math.max(query.page, 1);
        let q = model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean();
        for (const p of populate) q = q.populate(p) as typeof q;
        const [data, total] = await Promise.all([q.exec(), model.countDocuments(filter)]);
        const meta: PageMeta = { total, page, limit, last_page: Math.max(1, Math.ceil(total / limit)) };
        return { data, meta };
    }

    /** Find the item whose EPC prefix matches the EPC (longest prefix wins). */
    private async matchItem(epc: string): Promise<ItemDocument | null> {
        const items = await this.itemModel.find({ epc_prefix: { $nin: [null, ''] } }, { epc_prefix: 1 }).lean();
        let best: { _id: Types.ObjectId; len: number } | null = null;
        for (const it of items) {
            const prefix = (it.epc_prefix || '').toUpperCase();
            if (prefix && epc.startsWith(prefix) && (!best || prefix.length > best.len)) {
                best = { _id: it._id as Types.ObjectId, len: prefix.length };
            }
        }
        if (best) return this.itemModel.findById(best._id);

        // Numeric tag range matching (e.g. item covers tags 1–199)
        const num = Number.parseInt(epc, 10);
        if (!Number.isNaN(num) && /^\d+$/.test(epc)) {
            return this.itemModel.findOne({ uhf_range_start: { $lte: num }, uhf_range_end: { $gte: num } });
        }
        return null;
    }

    private nextEntryId() {
        const ts = Date.now().toString(36).toUpperCase();
        const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `SE-${ts}-${rnd}`;
    }

    /* ------------------------------------------------------------------ */
    /* Items                                                               */
    /* ------------------------------------------------------------------ */

    /** Ensure the prefix / range does not collide with another item. */
    private async assertItemMatching(
        data: { epc_prefix?: string | null; uhf_range_start?: number | null; uhf_range_end?: number | null },
        excludeId?: Types.ObjectId,
    ) {
        const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};
        if (data.epc_prefix) {
            if (await this.itemModel.exists({ epc_prefix: data.epc_prefix, ...notSelf })) {
                throw new ConflictException('EPC prefix is already used by another item');
            }
        }
        if (data.uhf_range_start != null && data.uhf_range_end != null) {
            const overlap = await this.itemModel.findOne({
                ...notSelf,
                uhf_range_start: { $lte: data.uhf_range_end },
                uhf_range_end: { $gte: data.uhf_range_start },
            });
            if (overlap) {
                throw new ConflictException(
                    `Tag range overlaps ${overlap.item_id} (${overlap.uhf_range_start}–${overlap.uhf_range_end})`,
                );
            }
        }
    }

    async createItem(data: CreateItemInput) {
        if (await this.itemModel.exists({ item_id: data.item_id })) {
            throw new ConflictException('Item ID already exists');
        }
        await this.assertItemMatching(data);
        return this.itemModel.create(data);
    }

    async findItems(query: ListQuery) {
        const filter: FilterQuery<ItemDocument> = {};
        if (query.search) {
            const rx = new RegExp(escapeRegex(query.search), 'i');
            filter.$or = [{ item_id: rx }, { item_name: rx }, { epc_prefix: rx }];
        }
        return this.paginate(this.itemModel, filter, query, { created_at: -1 });
    }

    async updateItem(id: string, data: UpdateItemInput) {
        const _id = toObjectId(id);
        await this.assertItemMatching(data, _id);
        const update: Record<string, unknown> = {};
        const unset: Record<string, ''> = {};
        if (data.item_name) update.item_name = data.item_name;
        // Switching between prefix and range clears the other identification method
        if (data.epc_prefix) {
            update.epc_prefix = data.epc_prefix;
            unset.uhf_range_start = '';
            unset.uhf_range_end = '';
        } else if (data.uhf_range_start != null && data.uhf_range_end != null) {
            update.uhf_range_start = data.uhf_range_start;
            update.uhf_range_end = data.uhf_range_end;
            unset.epc_prefix = '';
        }
        const item = await this.itemModel.findByIdAndUpdate(
            _id,
            { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
            { new: true, runValidators: true },
        );
        if (!item) throw new NotFoundException('Item not found');
        return item;
    }

    async deleteItem(id: string) {
        const _id = toObjectId(id);
        const item = await this.itemModel.findByIdAndDelete(_id);
        if (!item) throw new NotFoundException('Item not found');
        // Ledger lines keep their history but become unidentified
        await this.ledgerModel.updateMany({ item_id: _id }, { $set: { item_id: null } });
        return { _id };
    }

    /* ------------------------------------------------------------------ */
    /* Warehouses                                                          */
    /* ------------------------------------------------------------------ */

    async createWarehouse(data: CreateWarehouseInput) {
        if (await this.warehouseModel.exists({ warehouse_id: data.warehouse_id })) {
            throw new ConflictException('Warehouse ID already exists');
        }
        return this.warehouseModel.create(data);
    }

    async findWarehouses(query: ListQuery) {
        const filter: FilterQuery<WarehouseDocument> = {};
        if (query.search) {
            const rx = new RegExp(escapeRegex(query.search), 'i');
            filter.$or = [{ warehouse_id: rx }, { name: rx }, { location: rx }];
        }
        return this.paginate(this.warehouseModel, filter, query, { created_at: -1 });
    }

    async updateWarehouse(id: string, data: UpdateWarehouseInput) {
        const wh = await this.warehouseModel.findByIdAndUpdate(toObjectId(id), data, { new: true, runValidators: true });
        if (!wh) throw new NotFoundException('Warehouse not found');
        return wh;
    }

    async deleteWarehouse(id: string) {
        const _id = toObjectId(id);
        const machines = await this.machineModel.countDocuments({ warehouse_id: _id });
        if (machines > 0) {
            throw new BadRequestException(`Cannot delete: ${machines} machine(s) are assigned to this warehouse`);
        }
        const wh = await this.warehouseModel.findByIdAndDelete(_id);
        if (!wh) throw new NotFoundException('Warehouse not found');
        return { _id };
    }

    /* ------------------------------------------------------------------ */
    /* Machines (readers)                                                  */
    /* ------------------------------------------------------------------ */

    private async assertWarehouse(id: string) {
        const _id = toObjectId(id, 'warehouse');
        if (!(await this.warehouseModel.exists({ _id }))) throw new BadRequestException('Warehouse not found');
        return _id;
    }

    async createMachine(data: CreateMachineInput) {
        if (await this.machineModel.exists({ machine_id: data.machine_id })) {
            throw new ConflictException('Machine ID already exists');
        }
        if (await this.machineModel.exists({ reader_id: data.reader_id })) {
            throw new ConflictException('Reader ID is already assigned to another machine');
        }
        const warehouse_id = await this.assertWarehouse(data.warehouse_id);
        const machine = await this.machineModel.create({ ...data, warehouse_id });
        return machine.populate('warehouse_id');
    }

    async findMachines(query: ListQuery & { status?: string; type?: string; warehouse_id?: string }) {
        const filter: FilterQuery<MachineDocument> = {};
        if (query.search) {
            const rx = new RegExp(escapeRegex(query.search), 'i');
            filter.$or = [{ machine_id: rx }, { reader_id: rx }, { name: rx }];
        }
        if (query.status) filter.status = query.status as MachineStatus;
        if (query.type) filter.type = query.type as MachineType;
        if (query.warehouse_id) filter.warehouse_id = toObjectId(query.warehouse_id, 'warehouse');
        return this.paginate(this.machineModel, filter, query, { created_at: -1 }, ['warehouse_id']);
    }

    async updateMachine(id: string, data: UpdateMachineInput) {
        const _id = toObjectId(id);
        const update: Record<string, unknown> = { ...data };
        if (data.reader_id) {
            const clash = await this.machineModel.exists({ reader_id: data.reader_id, _id: { $ne: _id } });
            if (clash) throw new ConflictException('Reader ID is already assigned to another machine');
        }
        if (data.machine_id) {
            const clash = await this.machineModel.exists({ machine_id: data.machine_id, _id: { $ne: _id } });
            if (clash) throw new ConflictException('Machine ID already exists');
        }
        if (data.warehouse_id) update.warehouse_id = await this.assertWarehouse(data.warehouse_id);
        const machine = await this.machineModel
            .findByIdAndUpdate(_id, update, { new: true, runValidators: true })
            .populate('warehouse_id');
        if (!machine) throw new NotFoundException('Machine not found');
        return machine;
    }

    async deleteMachine(id: string) {
        const m = await this.machineModel.findByIdAndDelete(toObjectId(id));
        if (!m) throw new NotFoundException('Machine not found');
        return { _id: m._id };
    }

    /* ------------------------------------------------------------------ */
    /* Tag push (readers → ledger)                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Stock model: each EPC is "in stock" at the warehouse of its latest INBOUND read,
     * and leaves stock on an OUTBOUND read. Repeated reads with the same direction at the
     * same warehouse are ignored as duplicates.
     */
    async pushEntries(entries: PushEntryInput[]) {
        const results: {
            epc_id: string;
            status: 'recorded' | 'duplicate' | 'error';
            stock_entry_id?: string;
            item?: string | null;
            message?: string;
        }[] = [];

        const machineCache = new Map<string, MachineDocument | null>();

        for (const raw of entries) {
            const epc = raw.epc_id.trim().toUpperCase();
            try {
                if (!machineCache.has(raw.reader_id)) {
                    machineCache.set(raw.reader_id, await this.machineModel.findOne({ reader_id: raw.reader_id }));
                }
                const machine = machineCache.get(raw.reader_id);
                if (!machine) throw new BadRequestException(`Unknown reader_id '${raw.reader_id}'`);
                if (machine.status !== MachineStatus.ACTIVE) {
                    throw new BadRequestException(`Machine '${machine.machine_id}' is inactive`);
                }

                const type = (raw.type as MachineType) ?? machine.type;
                const warehouseId = machine.warehouse_id as Types.ObjectId;

                const last = await this.ledgerModel.findOne({ epc_id: epc }).sort({ timestamp: -1 });
                if (last && last.type === type && String(last.warehouse_id) === String(warehouseId)) {
                    results.push({ epc_id: epc, status: 'duplicate', stock_entry_id: last.stock_entry_id });
                    continue;
                }

                const stockEntryId = raw.stock_entry_id?.trim() || this.nextEntryId();
                if (await this.ledgerModel.exists({ stock_entry_id: stockEntryId })) {
                    throw new ConflictException(`Stock entry ID '${stockEntryId}' already exists`);
                }

                const item = await this.matchItem(epc);
                await this.ledgerModel.create({
                    stock_entry_id: stockEntryId,
                    epc_id: epc,
                    tag_id: raw.tag_id || undefined,
                    reader_id: raw.reader_id,
                    machine_id: machine._id,
                    warehouse_id: warehouseId,
                    item_id: item?._id ?? null,
                    type,
                });

                // Remove from previous location if it was in stock
                if (last && last.type === MachineType.INBOUND) {
                    await this.adjustStock(last.warehouse_id, last.item_id, -1);
                }
                if (type === MachineType.INBOUND) {
                    await this.adjustStock(warehouseId, item?._id ?? null, +1);
                }

                results.push({ epc_id: epc, status: 'recorded', stock_entry_id: stockEntryId, item: item?.item_name ?? null });
            } catch (e) {
                results.push({ epc_id: epc, status: 'error', message: e instanceof Error ? e.message : 'Failed' });
            }
        }

        const summary = {
            received: entries.length,
            recorded: results.filter((r) => r.status === 'recorded').length,
            duplicates: results.filter((r) => r.status === 'duplicate').length,
            errors: results.filter((r) => r.status === 'error').length,
        };
        // A single manual push that failed should surface as an error to the UI
        if (entries.length === 1 && summary.errors === 1) {
            throw new BadRequestException(results[0].message);
        }
        return { summary, results };
    }

    private async adjustStock(
        warehouseId: Types.ObjectId | undefined | null,
        itemId: Types.ObjectId | undefined | null,
        delta: number,
    ) {
        if (warehouseId) {
            await this.warehouseModel.updateOne({ _id: warehouseId }, { $inc: { current_stock: delta } });
        }
        if (itemId) {
            await this.itemModel.updateOne({ _id: itemId }, { $inc: { current_stock: delta } });
        }
    }

    /* ------------------------------------------------------------------ */
    /* Ledger                                                              */
    /* ------------------------------------------------------------------ */

    private async buildLedgerFilter(q: LedgerQuery) {
        const filter: FilterQuery<StockEntryDocument> = {};
        const rx = (v: string) => new RegExp(escapeRegex(v.trim()), 'i');
        if (q.stock_entry_id) filter.stock_entry_id = rx(q.stock_entry_id);
        if (q.epc_id) filter.epc_id = rx(q.epc_id);
        if (q.tag_id) filter.tag_id = rx(q.tag_id);
        if (q.reader_id) filter.reader_id = rx(q.reader_id);
        if (q.type) filter.type = q.type as MachineType;
        if (q.warehouse_id) filter.warehouse_id = toObjectId(q.warehouse_id, 'warehouse');
        if (q.machine_id) filter.machine_id = toObjectId(q.machine_id, 'machine');
        if (q.item_id) {
            if (Types.ObjectId.isValid(q.item_id)) {
                filter.item_id = new Types.ObjectId(q.item_id);
            } else {
                const items = await this.itemModel.find({ $or: [{ item_id: rx(q.item_id) }, { item_name: rx(q.item_id) }] }, { _id: 1 });
                filter.item_id = { $in: items.map((i) => i._id) };
            }
        }
        if (q.start_date || q.end_date) {
            const range: Record<string, Date> = {};
            if (q.start_date) range.$gte = new Date(`${q.start_date}T00:00:00`);
            if (q.end_date) range.$lte = new Date(`${q.end_date}T23:59:59.999`);
            filter.timestamp = range;
        }
        return filter;
    }

    async findLedger(q: LedgerQuery) {
        const filter = await this.buildLedgerFilter(q);
        const { data, meta } = await this.paginate(this.ledgerModel, filter, q, { timestamp: -1 }, [
            'item_id',
            'warehouse_id',
            'machine_id',
        ]);

        // Entries per day for the filtered result (latest 7 days that have data)
        const daily = await this.ledgerModel.aggregate([
            { $match: filter },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 7 },
        ]);
        const summary = daily.map((d) => ({ date: d._id as string, count: d.count as number }));
        return { data, meta, summary };
    }

    async updateLedgerEntry(id: string, data: UpdateLedgerInput) {
        const _id = toObjectId(id);
        const entry = await this.ledgerModel.findById(_id);
        if (!entry) throw new NotFoundException('Stock entry not found');

        if (data.stock_entry_id && data.stock_entry_id !== entry.stock_entry_id) {
            if (await this.ledgerModel.exists({ stock_entry_id: data.stock_entry_id })) {
                throw new ConflictException('Stock entry ID already exists');
            }
            entry.stock_entry_id = data.stock_entry_id;
        }
        if (data.tag_id !== undefined) entry.tag_id = data.tag_id || undefined;
        if (data.type) entry.type = data.type as MachineType;
        if (data.reader_id && data.reader_id !== entry.reader_id) {
            const machine = await this.machineModel.findOne({ reader_id: data.reader_id });
            if (!machine) throw new BadRequestException(`Unknown reader_id '${data.reader_id}'`);
            entry.reader_id = machine.reader_id;
            entry.machine_id = machine._id as Types.ObjectId;
            entry.warehouse_id = machine.warehouse_id as Types.ObjectId;
        }
        if (data.epc_id && data.epc_id.toUpperCase() !== entry.epc_id) {
            entry.epc_id = data.epc_id.toUpperCase();
            const item = await this.matchItem(entry.epc_id);
            entry.item_id = (item?._id as Types.ObjectId) ?? null;
        }
        await entry.save();
        await this.resyncStock();
        return entry.populate(['item_id', 'warehouse_id', 'machine_id']);
    }

    async deleteLedgerEntry(id: string) {
        const entry = await this.ledgerModel.findByIdAndDelete(toObjectId(id));
        if (!entry) throw new NotFoundException('Stock entry not found');
        await this.resyncStock();
        return { _id: entry._id };
    }

    /**
     * Rebuild current_stock for every item and warehouse from the ledger:
     * an EPC counts as in stock when its latest entry is INBOUND.
     * Also re-links ledger lines to items (useful after adding EPC prefixes).
     */
    async resyncStock() {
        // Re-match unidentified lines to items
        const unidentified = await this.ledgerModel.distinct('epc_id', { item_id: null });
        for (const epc of unidentified) {
            const item = await this.matchItem(epc);
            if (item) await this.ledgerModel.updateMany({ epc_id: epc, item_id: null }, { $set: { item_id: item._id } });
        }

        const inStock = await this.ledgerModel.aggregate([
            { $sort: { timestamp: -1 } },
            { $group: { _id: '$epc_id', type: { $first: '$type' }, warehouse_id: { $first: '$warehouse_id' }, item_id: { $first: '$item_id' } } },
            { $match: { type: MachineType.INBOUND } },
            {
                $facet: {
                    byWarehouse: [{ $group: { _id: '$warehouse_id', count: { $sum: 1 } } }],
                    byItem: [{ $match: { item_id: { $ne: null } } }, { $group: { _id: '$item_id', count: { $sum: 1 } } }],
                },
            },
        ]);
        const { byWarehouse = [], byItem = [] } = inStock[0] ?? {};

        await this.warehouseModel.updateMany({}, { $set: { current_stock: 0 } });
        await this.itemModel.updateMany({}, { $set: { current_stock: 0 } });
        if (byWarehouse.length) {
            await this.warehouseModel.bulkWrite(
                byWarehouse.filter((w: any) => w._id).map((w: any) => ({
                    updateOne: { filter: { _id: w._id }, update: { $set: { current_stock: w.count } } },
                })),
            );
        }
        if (byItem.length) {
            await this.itemModel.bulkWrite(
                byItem.map((i: any) => ({
                    updateOne: { filter: { _id: i._id }, update: { $set: { current_stock: i.count } } },
                })),
            );
        }
        return {
            warehouses_updated: byWarehouse.length,
            items_updated: byItem.length,
            relinked_epcs: unidentified.length,
        };
    }

    async resetLedger() {
        const { deletedCount } = await this.ledgerModel.deleteMany({});
        await this.warehouseModel.updateMany({}, { $set: { current_stock: 0 } });
        await this.itemModel.updateMany({}, { $set: { current_stock: 0 } });
        return { deleted: deletedCount };
    }

    /* ------------------------------------------------------------------ */
    /* Dashboard                                                           */
    /* ------------------------------------------------------------------ */

    async getDashboardStats() {
        const DAYS = 14;
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (DAYS - 1));

        const [
            total_warehouses,
            total_items,
            stockAgg,
            machines,
            uncounted_entries,
            total_ledger_entries,
            movementAgg,
            activityAgg,
            warehouses,
            recent_entries,
        ] = await Promise.all([
            this.warehouseModel.countDocuments(),
            this.itemModel.countDocuments(),
            this.warehouseModel.aggregate([{ $group: { _id: null, total: { $sum: '$current_stock' } } }]),
            this.machineModel.find().populate('warehouse_id', 'warehouse_id name').sort({ created_at: -1 }).lean(),
            this.ledgerModel.countDocuments({ item_id: null }),
            this.ledgerModel.countDocuments(),
            this.ledgerModel.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
            this.ledgerModel.aggregate([
                { $match: { timestamp: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' } },
                            type: '$type',
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            this.warehouseModel.find().sort({ current_stock: -1 }).lean(),
            this.ledgerModel
                .find()
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('item_id', 'item_id item_name')
                .populate('warehouse_id', 'warehouse_id name')
                .populate('machine_id', 'machine_id name reader_id')
                .lean(),
        ]);

        const labels: string[] = [];
        const inbound: number[] = [];
        const outbound: number[] = [];
        for (let i = 0; i < DAYS; i++) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
            labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }));
            inbound.push(activityAgg.find((a) => a._id.day === key && a._id.type === MachineType.INBOUND)?.count ?? 0);
            outbound.push(activityAgg.find((a) => a._id.day === key && a._id.type === MachineType.OUTBOUND)?.count ?? 0);
        }

        return {
            total_warehouses,
            total_stock: stockAgg[0]?.total ?? 0,
            total_items,
            total_machines: machines.length,
            active_machines: machines.filter((m) => m.status === MachineStatus.ACTIVE).length,
            inactive_machines: machines.filter((m) => m.status !== MachineStatus.ACTIVE).length,
            inbound_machines: machines.filter((m) => m.type === MachineType.INBOUND).length,
            outbound_machines: machines.filter((m) => m.type === MachineType.OUTBOUND).length,
            uncounted_entries,
            total_ledger_entries,
            movement: {
                inbound: movementAgg.find((m) => m._id === MachineType.INBOUND)?.count ?? 0,
                outbound: movementAgg.find((m) => m._id === MachineType.OUTBOUND)?.count ?? 0,
            },
            activity_chart: { labels, inbound, outbound },
            warehouses,
            machines,
            recent_entries,
        };
    }
}
