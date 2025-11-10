import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

const CORRELATION_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.headers[CORRELATION_HEADER] as string | undefined;
    const id = incoming || randomUUID();
    req.correlationId = id;
    res.setHeader(CORRELATION_HEADER, id);
    next();
  }
}

export { CORRELATION_HEADER };
