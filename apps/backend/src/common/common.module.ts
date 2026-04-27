import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

/**
 * Global logging module using Pino for structured, high-performance logging.
 *
 * Features:
 * - Pretty-printed logs in development (pino-pretty)
 * - JSON logs in production (for log aggregation)
 * - Request/response logging
 * - Performance timing
 * - Error tracking with stack traces
 *
 * Usage in services:
 * constructor(private readonly logger: LoggerService) {}
 * this.logger.info({ msg: 'Action completed', userId, companyId });
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        // Log level based on environment
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        // Pretty printing in development
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  singleLine: false,
                },
              }
            : undefined,

        // Custom serializers for request/response
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
              'content-type': req.headers['content-type'],
              'user-agent': req.headers['user-agent'],
            },
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },

        // Custom log messages
        customSuccessMessage: (req, res, responseTime) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${responseTime.toFixed(0)}ms`;
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
        },

        // Add request ID for tracing
        genReqId: (req) => {
          return (
            req.headers['x-request-id'] ||
            `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          );
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class CommonModule {}
