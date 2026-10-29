import { BadRequestException, Injectable } from "@nestjs/common";
import type { PipeTransform } from "@nestjs/common";
import type { z } from "zod";

@Injectable()
export class SchemaValidationPipe<T> implements PipeTransform<T, T> {
  private readonly schema: z.ZodType<T>;
  constructor(schema: z.ZodType<T>) {
    this.schema = schema;
  }
  transform(value: T): T {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException();
    }

    return parsed.data;
  }
}
