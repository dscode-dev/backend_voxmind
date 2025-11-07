import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { Request } from 'express';

type JwtPayload = { sub: string; username: string; tokenVersion?: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwtFromCookie,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, username: true, isAdmin: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid Username or Password');
    }

    return { id: user.id, username: user.username, isAdmin: user.isAdmin };
  }
}

function ExtractJwtFromCookie(req: Request): string | null {
  if (!req || !req.cookies) return null;
  return req.cookies['auth_token'] || null;
}
