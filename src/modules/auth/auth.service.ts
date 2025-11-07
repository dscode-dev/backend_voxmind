import { HttpException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async sign(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: payload.username },
    });
    if (!user) throw new Error('Username not found');

    const valid = await bcrypt.compare(payload.password, user.password);
    if (!valid) throw new Error('Invalid username or password');

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    return accessToken;
  }
}
