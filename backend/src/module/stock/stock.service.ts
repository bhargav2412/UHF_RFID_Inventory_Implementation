import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from './item.entity';
import { TagRead, TagReadDocument } from './tag-read.entity';

@Injectable()
export class StockService {
    constructor(
        @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
        @InjectModel(TagRead.name) private tagReadModel: Model<TagReadDocument>,
    ) { }

    async createItem(data: { item_id: string; item_name: string; uhf_range_start: number; uhf_range_end: number }) {
        const existing = await this.itemModel.findOne({ item_id: data.item_id });
        if (existing) {
            throw new ConflictException('Item ID already exists');
        }
        const item = new this.itemModel(data);
        return item.save();
    }

    async findAllItems() {
        return this.itemModel.find().sort({ created_at: -1 }).lean();
    }

    async updateItem(id: string, data: Partial<Item>) {
        const item = await this.itemModel.findByIdAndUpdate(id, data, { new: true });
        if (!item) throw new BadRequestException('Item not found');
        return item;
    }

    /**
     * Optimized Tag Ingestion
     * 1. Check if tag exists (De-duplication)
     * 2. If new, find matching item range
     * 3. Update counter atomically
     */
    async pushTagRead(tag_id: string, reader_id?: string) {
        // 1. De-duplication check
        const existingTag = await this.tagReadModel.findOne({ tag_id });
        if (existingTag) {
            return { message: 'Tag already registered', tag: existingTag };
        }

        // Convert hex tag_id to number if necessary, but assuming decimal for range check
        // If it's hex, we might need: const tagNum = parseInt(tag_id, 16);
        const tagNum = parseInt(tag_id);
        if (isNaN(tagNum)) {
            throw new BadRequestException('Invalid tag_id format. Must be numeric for range check.');
        }

        // 2. Find matching item range
        const item = await this.itemModel.findOne({
            uhf_range_start: { $lte: tagNum },
            uhf_range_end: { $gte: tagNum }
        });

        if (!item) {
            throw new BadRequestException('Tag does not fall into any defined item range');
        }

        // 3. Register tag and increment count atomically
        const tagRead = new this.tagReadModel({
            tag_id,
            item_id: item._id,
            reader_id
        });

        try {
            await tagRead.save();
            
            // Atomic increment
            await this.itemModel.findByIdAndUpdate(item._id, {
                $inc: { current_stock: 1 }
            });

            return { message: 'Tag registered successfully', item_name: item.item_name };
        } catch (error) {
            if (error.code === 11000) { // Double check for race condition
                return { message: 'Tag already registered' };
            }
            throw error;
        }
    }

    async getDashboardStats() {
        const items = await this.itemModel.find({}, { item_name: 1, current_stock: 1, item_id: 1 }).lean();
        const totalStock = items.reduce((sum, item) => sum + (item.current_stock || 0), 0);
        const totalLedgerEntries = await this.tagReadModel.countDocuments();

        return {
            total_warehouses: 0,
            total_items: items.length,
            total_stock: totalStock,
            total_machines: 0,
            active_machines: 0,
            inactive_machines: 0,
            inbound_machines: 0,
            outbound_machines: 0,
            uncounted_entries: 0,
            total_ledger_entries: totalLedgerEntries,
            movement: { inbound: 0, outbound: 0 },
            activity_chart: { labels: [], inbound: [], outbound: [] },
            warehouses: [],
            machines: [],
            recent_entries: [],
            items,
        };
    }
}
