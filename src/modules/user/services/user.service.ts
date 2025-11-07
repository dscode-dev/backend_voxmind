import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import UserRepository from '../user.repository';

@Injectable()
export class UsersService {
  constructor(private repo: UserRepository) {}

  async register(username: string, password: string, isAdmin = false) {
    const exists = await this.repo.findByUsername(username);
    if (exists) throw new ConflictException('username already exists');
    return this.repo.create(username, password, isAdmin);
  }

  async validate(username: string, password: string) {
    const user = await this.repo.findByUsername(username);
    if (!user || !user.isActive) throw new BadRequestException('invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new BadRequestException('invalid credentials');
    return user;
  }

  async getById(id: number) {
    const u = await this.repo.findById(id);
    if (!u) throw new NotFoundException('user not found');
    return u;
  }
}
