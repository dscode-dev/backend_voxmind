import { Module } from '@nestjs/common';
import { UsersController } from './controllers/user.controller';
import { UsersService } from './services/user.service';
import UserRepository from './user.repository';
import { PrismaModule } from 'src/providers/prisma/prisma.module';


@Module({
  imports: [UserModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService]
})
export class UserModule {}
