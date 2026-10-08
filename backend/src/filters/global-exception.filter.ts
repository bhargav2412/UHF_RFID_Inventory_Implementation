import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string> | null = null;

    // ─── NestJS / HTTP Exception ────────────────────────────────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : (body as any)?.message ?? exception.message;
    }

    // ─── Mongoose Validation Error ──────────────────────────────────────────
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = Object.fromEntries(
        Object.entries(exception.errors).map(([field, err]) => [
          field,
          err.message,
        ]),
      );
    }

    // ─── Mongoose CastError (e.g. invalid ObjectId) ─────────────────────────
    else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid value for field '${exception.path}': '${exception.value}'`;
    }

    // ─── MongoDB Duplicate Key Error ─────────────────────────────────────────
    else if (exception instanceof MongoServerError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      const duplicatedField = Object.keys(exception.keyValue ?? {}).join(', ');
      message = `Duplicate value for field(s): ${duplicatedField}`;
    }

    // ─── Generic / Unknown Error ─────────────────────────────────────────────
    else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception.stack,
      );
      message = exception.message ?? 'Internal server error';
    }

    const errorMessage = errors
      ? Object.values(errors).join(', ')
      : message;

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
    });
  }
}
