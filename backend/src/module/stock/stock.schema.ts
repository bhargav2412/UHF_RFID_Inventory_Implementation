import { z } from 'zod';

const trimmed = z.string().trim();
const optionalText = z.string().trim().optional().transform((v) => (v === '' ? undefined : v));
const direction = z.enum(['inbound', 'outbound']);

/* ---------------- Query strings ---------------- */

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const paginationFields = {
    page: z.coerce.number().int().min(1).default(1),
    // `limit` is used by the UI; `rows_per_page` kept for older clients
    limit: emptyToUndefined(z.coerce.number().int().min(1).max(500).optional()),
    rows_per_page: emptyToUndefined(z.coerce.number().int().min(1).max(500).optional()),
    search: optionalText,
    search_text: optionalText,
};

const normalisePaging = <T extends { limit?: number; rows_per_page?: number; search?: string; search_text?: string }>(
    q: T,
) => {
    const { rows_per_page, search_text, ...rest } = q;
    return { ...rest, limit: q.limit ?? rows_per_page ?? 10, search: q.search ?? search_text };
};

export const ListQuerySchema = z.object(paginationFields).transform(normalisePaging);
export type ListQuery = { page: number; limit: number; search?: string };

export const MachineQuerySchema = z
    .object({
        ...paginationFields,
        status: emptyToUndefined(z.enum(['active', 'inactive']).optional()),
        type: emptyToUndefined(direction.optional()),
        warehouse_id: optionalText,
    })
    .transform(normalisePaging);

export const LedgerQuerySchema = z
    .object({
        ...paginationFields,
        stock_entry_id: optionalText,
        epc_id: optionalText,
        tag_id: optionalText,
        reader_id: optionalText,
        item_id: optionalText,
        warehouse_id: optionalText,
        machine_id: optionalText,
        type: emptyToUndefined(direction.optional()),
        start_date: optionalText,
        end_date: optionalText,
    })
    .transform(normalisePaging);
export type LedgerQuery = ListQuery & {
    stock_entry_id?: string;
    epc_id?: string;
    tag_id?: string;
    reader_id?: string;
    item_id?: string;
    warehouse_id?: string;
    machine_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
};

/* ---------------- Items ---------------- */

/**
 * An item is identified either by an EPC prefix (hex, e.g. "E280") or by a
 * numeric tag range (e.g. 1 to 199 — tags whose number falls in the range).
 */
const itemFields = {
    item_name: trimmed.min(1, 'Item name is required'),
    epc_prefix: z.preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
        trimmed
            .regex(/^[0-9A-Fa-f]+$/, 'EPC prefix must be hexadecimal (0-9, A-F), e.g. E280')
            .transform((v) => v.toUpperCase())
            .optional()
            .nullable(),
    ),
    uhf_range_start: emptyToUndefined(z.coerce.number().int().min(0, 'Range start must be 0 or more').optional().nullable()),
    uhf_range_end: emptyToUndefined(z.coerce.number().int().min(0, 'Range end must be 0 or more').optional().nullable()),
};

type ItemMatchShape = { epc_prefix?: string | null; uhf_range_start?: number | null; uhf_range_end?: number | null };
const hasRange = (v: ItemMatchShape) => v.uhf_range_start != null || v.uhf_range_end != null;

const checkMatching = (v: ItemMatchShape, ctx: z.RefinementCtx, required: boolean) => {
    if (v.epc_prefix && hasRange(v)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['epc_prefix'], message: 'Use either an EPC prefix or a tag range, not both' });
    }
    if (hasRange(v)) {
        if (v.uhf_range_start == null || v.uhf_range_end == null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['uhf_range_start'], message: 'Enter both range start and range end' });
        } else if (v.uhf_range_start > v.uhf_range_end) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['uhf_range_end'], message: 'Range end must be greater than or equal to range start' });
        }
    }
    if (required && !v.epc_prefix && !hasRange(v)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['epc_prefix'], message: 'Enter an EPC prefix or a tag range' });
    }
};

export const CreateItemSchema = z
    .object({ item_id: trimmed.min(1, 'Item ID (SKU) is required'), ...itemFields })
    .superRefine((v, ctx) => checkMatching(v, ctx, true));
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

// Unknown keys (e.g. _id, item_id, current_stock sent back by the edit form) are stripped.
export const UpdateItemSchema = z
    .object({
        item_name: itemFields.item_name.optional(),
        epc_prefix: itemFields.epc_prefix,
        uhf_range_start: itemFields.uhf_range_start,
        uhf_range_end: itemFields.uhf_range_end,
    })
    .superRefine((v, ctx) => checkMatching(v, ctx, false));
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

/* ---------------- Warehouses ---------------- */

export const CreateWarehouseSchema = z.object({
    warehouse_id: trimmed.min(1, 'Warehouse ID is required'),
    name: trimmed.min(1, 'Name is required'),
    location: optionalText,
});
export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;

export const UpdateWarehouseSchema = CreateWarehouseSchema.omit({ warehouse_id: true }).partial();
export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;

/* ---------------- Machines ---------------- */

export const CreateMachineSchema = z.object({
    machine_id: trimmed.min(1, 'Machine ID is required'),
    reader_id: trimmed.min(1, 'Reader ID is required'),
    name: trimmed.min(1, 'Name is required'),
    warehouse_id: trimmed.min(1, 'Warehouse is required'),
    type: direction.default('inbound'),
    status: z.enum(['active', 'inactive']).default('active'),
});
export type CreateMachineInput = z.infer<typeof CreateMachineSchema>;

export const UpdateMachineSchema = z.object({
    machine_id: trimmed.min(1).optional(),
    reader_id: trimmed.min(1).optional(),
    name: trimmed.min(1).optional(),
    warehouse_id: trimmed.min(1).optional(),
    type: direction.optional(),
    status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateMachineInput = z.infer<typeof UpdateMachineSchema>;

/* ---------------- Push / ledger ---------------- */

const PushEntrySchema = z
    .object({
        epc_id: trimmed.optional(),
        tag_id: optionalText,
        reader_id: trimmed.min(1, 'reader_id is required'),
        type: emptyToUndefined(direction.optional()),
        stock_entry_id: optionalText,
    })
    // Older readers send the EPC as `tag_id` only
    .transform((e) => ({ ...e, epc_id: e.epc_id || e.tag_id || '' }))
    .refine((e) => e.epc_id.length > 0, { message: 'epc_id is required' });

/** Accepts one entry or an array of entries. */
export const PushSchema = z
    .union([PushEntrySchema, z.array(PushEntrySchema).min(1, 'At least one entry is required').max(5000)])
    .transform((v) => (Array.isArray(v) ? v : [v]));
export type PushEntryInput = z.infer<typeof PushEntrySchema>;

export const UpdateLedgerSchema = z.object({
    stock_entry_id: trimmed.min(1).optional(),
    epc_id: trimmed.min(1).optional(),
    tag_id: z.string().trim().optional(),
    reader_id: trimmed.min(1).optional(),
    type: direction.optional(),
});
export type UpdateLedgerInput = z.infer<typeof UpdateLedgerSchema>;
