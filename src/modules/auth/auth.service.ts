import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../providers/prisma/prisma.service';
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

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) throw new HttpException('Invalid username or password', HttpStatus.UNAUTHORIZED);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.username,
      tokenVersion: "",
    });

    return accessToken;
  }
}
