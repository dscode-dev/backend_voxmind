import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const { method, originalUrl } = req;
    const startedAt = Date.now();
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    const correlationId = req.correlationId;

    // se você tiver auth por cookie/jwt, o JwtStrategy coloca req.user
    const userId = req.user?.id ?? '-';

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        const statusCode = res.statusCode;
        const contentLength = res.getHeader('content-length') || '-';
        // Nível pelo status
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

        this.logger[level](
          `${method} ${originalUrl} ${statusCode} ${contentLength} - ${ms}ms ` +
          `cid=${correlationId} user=${userId} ip=${ip} ua="${ua}"`
        );
      }),
      catchError((err) => {
        const ms = Date.now() - startedAt;
        const statusCode = err?.status ?? 500;
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} - ${ms}ms cid=${correlationId} user=${userId} err="${err?.message}"`
        );
        throw err;
      })
    );
  }
}
