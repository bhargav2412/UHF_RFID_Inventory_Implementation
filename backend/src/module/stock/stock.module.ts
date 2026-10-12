import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Item, ItemSchema } from './item.entity';
import { Warehouse, WarehouseSchema } from './warehouse.entity';
import { Machine, MachineSchema } from './machine.entity';
import { StockEntry, StockEntrySchema } from './stock-entry.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Machine.name, schema: MachineSchema },
      { name: StockEntry.name, schema: StockEntrySchema },
    ]),
    AuthModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
