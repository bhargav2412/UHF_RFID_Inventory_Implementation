import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { AuthGuard } from '../../guard/auth.guard';
import { RolesGuard } from '../../guard/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../enum/role.enum';
import { ZodValidationPipe } from '../../pipe/zod.pipe';
import { ResponseDto } from '../../dto/response.dto';
import {
    CreateItemSchema,
    CreateMachineSchema,
    CreateWarehouseSchema,
    LedgerQuerySchema,
    ListQuerySchema,
    MachineQuerySchema,
    PushSchema,
    UpdateItemSchema,
    UpdateLedgerSchema,
    UpdateMachineSchema,
    UpdateWarehouseSchema,
} from './stock.schema';
import type {
    CreateItemInput,
    CreateMachineInput,
    CreateWarehouseInput,
    LedgerQuery,
    ListQuery,
    PushEntryInput,
    UpdateItemInput,
    UpdateLedgerInput,
    UpdateMachineInput,
    UpdateWarehouseInput,
} from './stock.schema';

const ADMINS = [UserRole.SUPERADMIN, UserRole.ADMIN] as const;
const ALL_STAFF = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKER] as const;

/**
 * List responses: { result, message, data: [...], meta: { total, page, limit, last_page } }
 * Single records:  { result, message, data: {...} }
 */
@Controller('stock')
@UseGuards(AuthGuard, RolesGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    /* ---------------- Dashboard ---------------- */

    /** Flat object — consumed directly by the inventory dashboard. */
    @Get('dashboard')
    getDashboardStats() {
        return this.stockService.getDashboardStats();
    }

    /* ---------------- Items ---------------- */

    @Get('items')
    async findItems(@Query(new ZodValidationPipe(ListQuerySchema)) query: ListQuery) {
        const { data, meta } = await this.stockService.findItems(query);
        return new ResponseDto(data, 'Item list.', { meta });
    }

    @Post('items')
    @Roles(...ADMINS)
    async createItem(@Body(new ZodValidationPipe(CreateItemSchema)) body: CreateItemInput) {
        return new ResponseDto(await this.stockService.createItem(body), 'Item created successfully.');
    }

    @Patch('items/:id')
    @Roles(...ADMINS)
    async updateItem(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateItemSchema)) body: UpdateItemInput) {
        return new ResponseDto(await this.stockService.updateItem(id, body), 'Item updated successfully.');
    }

    @Delete('items/:id')
    @Roles(...ADMINS)
    async deleteItem(@Param('id') id: string) {
        return new ResponseDto(await this.stockService.deleteItem(id), 'Item deleted successfully.');
    }

    /* ---------------- Warehouses ---------------- */

    @Get('warehouses')
    async findWarehouses(@Query(new ZodValidationPipe(ListQuerySchema)) query: ListQuery) {
        const { data, meta } = await this.stockService.findWarehouses(query);
        return new ResponseDto(data, 'Warehouse list.', { meta });
    }

    @Post('warehouses')
    @Roles(...ADMINS)
    async createWarehouse(@Body(new ZodValidationPipe(CreateWarehouseSchema)) body: CreateWarehouseInput) {
        return new ResponseDto(await this.stockService.createWarehouse(body), 'Warehouse created successfully.');
    }

    @Patch('warehouses/:id')
    @Roles(...ADMINS)
    async updateWarehouse(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(UpdateWarehouseSchema)) body: UpdateWarehouseInput,
    ) {
        return new ResponseDto(await this.stockService.updateWarehouse(id, body), 'Warehouse updated successfully.');
    }

    @Delete('warehouses/:id')
    @Roles(...ADMINS)
    async deleteWarehouse(@Param('id') id: string) {
        return new ResponseDto(await this.stockService.deleteWarehouse(id), 'Warehouse deleted successfully.');
    }

    /* ---------------- Machines (readers) ---------------- */

    @Get('machines')
    async findMachines(
        @Query(new ZodValidationPipe(MachineQuerySchema))
        query: ListQuery & { status?: string; type?: string; warehouse_id?: string },
    ) {
        const { data, meta } = await this.stockService.findMachines(query);
        return new ResponseDto(data, 'Machine list.', { meta });
    }

    @Post('machines')
    @Roles(...ADMINS)
    async createMachine(@Body(new ZodValidationPipe(CreateMachineSchema)) body: CreateMachineInput) {
        return new ResponseDto(await this.stockService.createMachine(body), 'Machine created successfully.');
    }

    @Patch('machines/:id')
    @Roles(...ADMINS)
    async updateMachine(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateMachineSchema)) body: UpdateMachineInput) {
        return new ResponseDto(await this.stockService.updateMachine(id, body), 'Machine updated successfully.');
    }

    @Delete('machines/:id')
    @Roles(...ADMINS)
    async deleteMachine(@Param('id') id: string) {
        return new ResponseDto(await this.stockService.deleteMachine(id), 'Machine deleted successfully.');
    }

    /* ---------------- Tag reads → ledger ---------------- */

    /** Accepts one entry or an array: [{ epc_id, reader_id, tag_id?, type?, stock_entry_id? }] */
    @Post('push')
    @HttpCode(200)
    @Roles(...ALL_STAFF)
    async push(@Body(new ZodValidationPipe(PushSchema)) body: PushEntryInput[]) {
        const result = await this.stockService.pushEntries(body);
        return new ResponseDto(result, `${result.summary.recorded} recorded, ${result.summary.duplicates} duplicate, ${result.summary.errors} failed.`);
    }

    @Get('ledger')
    async findLedger(@Query(new ZodValidationPipe(LedgerQuerySchema)) query: LedgerQuery) {
        const { data, meta, summary } = await this.stockService.findLedger(query);
        return new ResponseDto(data, 'Stock ledger.', { meta, summary });
    }

    @Patch('ledger/:id')
    @Roles(...ADMINS)
    async updateLedger(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateLedgerSchema)) body: UpdateLedgerInput) {
        return new ResponseDto(await this.stockService.updateLedgerEntry(id, body), 'Stock entry updated successfully.');
    }

    @Delete('ledger/:id')
    @Roles(...ADMINS)
    async deleteLedger(@Param('id') id: string) {
        return new ResponseDto(await this.stockService.deleteLedgerEntry(id), 'Stock entry deleted successfully.');
    }

    /** Recalculate item and warehouse stock from the ledger. */
    @Post('resync')
    @HttpCode(200)
    @Roles(...ADMINS)
    async resync() {
        return new ResponseDto(await this.stockService.resyncStock(), 'Stock levels resynced.');
    }

    /** Delete every ledger entry and zero all stock. */
    @Post('reset-ledger')
    @HttpCode(200)
    @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
    async resetLedger() {
        return new ResponseDto(await this.stockService.resetLedger(), 'Stock ledger reset.');
    }
}
