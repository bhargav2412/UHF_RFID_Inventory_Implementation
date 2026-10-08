import { z } from "zod";
import { CustomErrorException } from "../exceptions/custom-error.exception";
import { HttpStatus } from "@nestjs/common";
import { SortOrder } from "src/enum/sort-order.enum";

export const PaginationSchema = z.object({
    page: z.string().transform((val) => {
        const num = Number(val);
        if (isNaN(num) || num < 1) {
            throw new CustomErrorException('page must be a non-negative number.', HttpStatus.BAD_REQUEST);
        }
        return num;
    }).optional().default("1"),
    rows_per_page: z.string().transform((val) => {
        const num = Number(val);
        if (isNaN(num) || num < 1) {
            throw new CustomErrorException('rows_per_page must be a non-negative number.', HttpStatus.BAD_REQUEST);
        }
        return num;
    }).optional(),
    search_text: z.string().nonempty().optional(),
    sort_by: z.string().nonempty().optional(),
    sort_order: z.string().transform((val) => {
        if (!Object.values(SortOrder).includes(val as SortOrder)) {
            throw new CustomErrorException('sort_order must be either asc or desc.', HttpStatus.BAD_REQUEST);
        }
        return val;
    }).optional(),
})