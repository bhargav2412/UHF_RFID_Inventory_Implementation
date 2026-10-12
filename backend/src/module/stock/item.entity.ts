import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
})
export class Item {
    /** SKU / item code shown in the UI */
    @Prop({ required: true, unique: true, trim: true })
    item_id: string;

    @Prop({ required: true, trim: true })
    item_name: string;

    /** Tags whose EPC starts with this prefix belong to this item */
    @Prop({ trim: true, uppercase: true, index: true })
    epc_prefix: string;

    /** Number of tagged units currently inside any warehouse */
    @Prop({ default: 0 })
    current_stock: number;

    /** Numeric tag range — alternative to epc_prefix (e.g. 1 to 199) */
    @Prop()
    uhf_range_start?: number;

    @Prop()
    uhf_range_end?: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
