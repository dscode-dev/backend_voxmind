import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET!,
      signOptions: {expiresIn: "43800m"},
    }),
    PrismaModule
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
