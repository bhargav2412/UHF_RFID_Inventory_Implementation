import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      // Readable messages, e.g. ["EPC prefix must be hexadecimal (0-9, A-F), e.g. E280"]
      const messages = result.error.errors.map((e) =>
        e.message === 'Required' && e.path.length ? `${e.path.join('.')} is required` : e.message,
      );
      throw new BadRequestException(messages);
    }
    return result.data;
  }
}
