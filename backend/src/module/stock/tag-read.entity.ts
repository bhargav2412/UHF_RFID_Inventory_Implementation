import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Item } from './item.entity';

export type TagReadDocument = HydratedDocument<TagRead>;

@Schema({
    timestamps: {
        createdAt: 'timestamp',
        updatedAt: false,
    },
})
export class TagRead {
    @Prop({ required: true, unique: true })
    tag_id: string;

    @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
    item_id: Types.ObjectId;

    @Prop()
    reader_id: string;
}

export const TagReadSchema = SchemaFactory.createForClass(TagRead);
