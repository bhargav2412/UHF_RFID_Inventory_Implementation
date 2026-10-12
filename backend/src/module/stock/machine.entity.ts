import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MachineDocument = HydratedDocument<Machine>;

export enum MachineType {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

export enum MachineStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

/** An RFID reading machine (reader) installed at a warehouse gate. */
@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
})
export class Machine {
    @Prop({ required: true, unique: true, trim: true })
    machine_id: string;

    /** Identifier the physical reader sends with every tag read */
    @Prop({ required: true, unique: true, trim: true })
    reader_id: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true, index: true })
    warehouse_id: Types.ObjectId;

    @Prop({ enum: Object.values(MachineType), default: MachineType.INBOUND })
    type: MachineType;

    @Prop({ enum: Object.values(MachineStatus), default: MachineStatus.ACTIVE })
    status: MachineStatus;
}

export const MachineSchema = SchemaFactory.createForClass(Machine);
