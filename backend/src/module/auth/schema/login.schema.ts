import { stringToObjectId } from "src/utils/mongo.util";
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const otpSchema = z.object({
    phone: z.string().length(10, { message: "Phone number must be 10 characters" }),
});

export const logoutSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
});