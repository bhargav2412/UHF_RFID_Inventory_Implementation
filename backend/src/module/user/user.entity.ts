import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../enum/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})
export class User {
    @Prop({ required: true })
    first_name: string;

    @Prop({ required: true })
    last_name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ enum: Object.values(UserRole), default: UserRole.WORKER })
    role: UserRole;

    @Prop()
    password: string;

    @Prop()
    phone: string;

    @Prop({ default: false })
    phone_verified: boolean;

    @Prop({ default: 0 })
    otp: number;

    @Prop({ default: null })
    otp_expiry: Date;

    @Prop({ default: null })
    auth_token: string;

    @Prop({ default: null })
    deleted_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
