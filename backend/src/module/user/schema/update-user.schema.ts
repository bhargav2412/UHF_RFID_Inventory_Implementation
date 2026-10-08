import { CreateUserSchema } from "./create-user.schema";

export const UpdateUserSchema = CreateUserSchema.partial();