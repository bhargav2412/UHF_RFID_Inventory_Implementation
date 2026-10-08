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
    @Prop({ required: true, unique: true })
    item_id: string;

    @Prop({ required: true })
    item_name: string;

    @Prop({ required: true, index: true })
    uhf_range_start: number;

    @Prop({ required: true, index: true })
    uhf_range_end: number;

    @Prop({ default: 0 })
    current_stock: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Add compound index for range queries
ItemSchema.index({ uhf_range_start: 1, uhf_range_end: 1 });
