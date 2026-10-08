import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from '../stock/item.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
  ) { }

  async getSummary() {
    const items = await this.itemModel.find({}, { item_name: 1, current_stock: 1, item_id: 1 }).lean();
    const totalStock = items.reduce((sum, item) => sum + (item.current_stock || 0), 0);
    
    return {
      total_items: items.length,
      total_stock: totalStock,
      stock_by_item: items.map(i => ({
        id: i.item_id,
        name: i.item_name,
        count: i.current_stock
      }))
    };
  }
}
