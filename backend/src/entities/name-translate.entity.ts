import { Prop, Schema } from "@nestjs/mongoose";

@Schema({
    _id: false
})
export class NameTranslate {
    @Prop()
    gu?: string;
    
    @Prop()
    hi?: string;
}