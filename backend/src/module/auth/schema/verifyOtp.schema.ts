import { stringToObjectId } from "src/utils/mongo.util";
import { z } from "zod";

export const verifyOtpSchema = z.object({
    userId: z.string().transform((val) => stringToObjectId(val)),
    otp: z.number().min(1000, { message: "OTP must be 4 digits" }).max(9999, { message: "OTP must be 4 digits" }),
});
