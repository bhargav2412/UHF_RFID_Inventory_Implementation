import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
})
export class Warehouse {
    @Prop({ required: true, unique: true, trim: true })
    warehouse_id: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    location?: string;

    /** Number of tagged units currently inside this warehouse */
    @Prop({ default: 0 })
    current_stock: number;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
