import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { AuthGuard } from '../../guard/auth.guard';
import { RolesGuard } from '../../guard/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../enum/role.enum';

@Controller('stock')
@UseGuards(AuthGuard, RolesGuard)
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Post('items')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    createItem(@Body() data: { item_id: string; item_name: string; uhf_range_start: number; uhf_range_end: number }) {
        return this.stockService.createItem(data);
    }

    @Get('items')
    findAllItems() {
        return this.stockService.findAllItems();
    }

    @Patch('items/:id')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    updateItem(@Param('id') id: string, @Body() data: any) {
        return this.stockService.updateItem(id, data);
    }

    @Post('push')
    @Roles(UserRole.ADMIN, UserRole.WORKER)
    pushTagRead(@Body() data: { tag_id: string; reader_id?: string }) {
        return this.stockService.pushTagRead(data.tag_id, data.reader_id);
    }

    @Get('dashboard')
    getDashboardStats() {
        return this.stockService.getDashboardStats();
    }
}
