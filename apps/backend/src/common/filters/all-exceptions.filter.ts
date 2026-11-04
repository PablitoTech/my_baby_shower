import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '@mbs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { ApiException } from '../http/api.exception.js';

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ERROR_CODES.INVALID_IMAGE,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.TOO_MANY_REQUESTS,
};

/**
 * Normaliza todas las respuestas de error a { statusCode, code, message, details? }.
 * Nunca devuelve stack traces ni detalles internos al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      // Solo se registra en el servidor; el cliente recibe un mensaje genérico.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ApiException) {
      return exception.getResponse() as ApiErrorBody;
    }
    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: ERROR_CODES.TOO_MANY_REQUESTS,
        message: 'Too many requests',
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const rawMessage = typeof res === 'object' && res !== null ? (res as { message?: unknown }).message : res;
      const details = Array.isArray(rawMessage) ? rawMessage.map(String) : undefined;
      return {
        statusCode: status,
        code: STATUS_TO_CODE[status] ?? (status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.VALIDATION_FAILED),
        message: details ? 'Validation failed' : String(rawMessage ?? exception.message),
        ...(details ? { details } : {}),
      };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        return { statusCode: HttpStatus.NOT_FOUND, code: ERROR_CODES.NOT_FOUND, message: 'Not found' };
      }
      if (exception.code === 'P2002') {
        return { statusCode: HttpStatus.CONFLICT, code: ERROR_CODES.VALIDATION_FAILED, message: 'Duplicate value' };
      }
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }
}
