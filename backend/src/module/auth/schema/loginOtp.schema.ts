import { z } from "zod";

export const loginOtpSchema = z.object({
    phone: z.string().length(10, { message: "Phone number must be 10 characters" }),
});
