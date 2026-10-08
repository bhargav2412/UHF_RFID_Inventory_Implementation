import { ApiProperty } from "@nestjs/swagger";
import { SortOrder } from "src/enum/sort-order.enum";

export class MetadataDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  rows_per_page: number;

  @ApiProperty()
  search_text: string;

  @ApiProperty()
  sort_by: string;

  @ApiProperty()
  sort_order: 'asc' | 'desc';

}

export const defaultMetaData = { page: 1, rows_per_page: 0, sort_by: 'created_at', sort_order: SortOrder.DESC, search_text: '' };