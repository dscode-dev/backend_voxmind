import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.service.register(dto.username, dto.password, dto.isAdmin ?? false);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }
}
