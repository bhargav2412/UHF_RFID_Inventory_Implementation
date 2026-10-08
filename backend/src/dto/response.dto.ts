import { ApiProperty } from "@nestjs/swagger";

export class ResponseDto<TData> {
  constructor(data: TData | TData[] | null, message: string = 'Success', meta?: any) {
    this.message = message;
    this.data = data;
    if (meta) {
        Object.assign(this, meta);
    }
  }

  @ApiProperty()
  result: string = 'success';

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: TData | TData[] | null;
}
