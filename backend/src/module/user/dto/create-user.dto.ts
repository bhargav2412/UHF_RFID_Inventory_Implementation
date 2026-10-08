import { createZodDto } from "nestjs-zod";
import { CreateUserSchema } from "../schema/create-user.schema";
import { Types } from "mongoose";

export class CreateUserDto extends createZodDto(CreateUserSchema) {
}