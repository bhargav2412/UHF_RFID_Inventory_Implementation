import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MachineType } from './machine.entity';

export type StockEntryDocument = HydratedDocument<StockEntry>;

/** One RFID movement (stock ledger line): a tag read in or out of a warehouse. */
@Schema({
    collection: 'stock_ledger',
    timestamps: {
        createdAt: 'timestamp',
        updatedAt: 'updated_at',
    },
})
export class StockEntry {
    @Prop({ required: true, unique: true, trim: true })
    stock_entry_id: string;

    @Prop({ required: true, trim: true, uppercase: true, index: true })
    epc_id: string;

    @Prop({ trim: true, index: true })
    tag_id?: string;

    @Prop({ required: true, trim: true, index: true })
    reader_id: string;

    @Prop({ type: Types.ObjectId, ref: 'Machine', index: true })
    machine_id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', index: true })
    warehouse_id?: Types.ObjectId;

    /** Null when the EPC does not match any item prefix (unidentified tag) */
    @Prop({ type: Types.ObjectId, ref: 'Item', default: null, index: true })
    item_id?: Types.ObjectId | null;

    @Prop({ enum: Object.values(MachineType), required: true })
    type: MachineType;

    timestamp?: Date;
}

export const StockEntrySchema = SchemaFactory.createForClass(StockEntry);
StockEntrySchema.index({ epc_id: 1, timestamp: -1 });
