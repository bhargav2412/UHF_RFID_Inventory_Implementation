import { z } from "zod";

export const nameTranslateSchema = z.object({
    gu: z.string().nonempty({ message: "Name in Gujarati cannot be empty." }).optional(),
    hi: z.string().nonempty({ message: "Name in Hindi cannot be empty." }).optional(),
}).strict();