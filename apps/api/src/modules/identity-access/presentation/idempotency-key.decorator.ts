import { BadRequestException, createParamDecorator } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";

const keySchema = z.uuid();

export const IdempotencyKey = createParamDecorator(
  (_data: undefined, context: ExecutionContext): string => {
    const input = context.switchToHttp().getRequest<FastifyRequest>().headers[
      "idempotency-key"
    ];

    const result = keySchema.safeParse(input);

    if (!result.success) {
      throw new BadRequestException();
    }

    return result.data;
  }
);
