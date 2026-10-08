import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Item, ItemSchema } from './item.entity';
import { TagRead, TagReadSchema } from './tag-read.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: Item.name, schema: ItemSchema },
        { name: TagRead.name, schema: TagReadSchema },
    ]),
    AuthModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
