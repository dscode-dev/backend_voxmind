import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export default class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: { username: true, id: true, isAdmin: true },
    });
  }

  async findByUsername(username: string) {
    return await this.prisma.findUnique({
      where: { username },
      select: { username: true, id: true, isAdmin: true },
    });
  }

  async create(username: string, password: string, isAdmin = false) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.create({
      date: { username, passwordHash, isAdmin, isActive: true },
    });
  }

  async update(
    id: number,
    data: Partial<{
      username: string;
      password: string;
      isAdmin: boolean;
      isActive: boolean;
    }>,
  ) {
    return await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        isAdmin: data.isAdmin,
        isActive: data.isActive,
        ...(data.password ? {} : undefined),
      },
    });
  }
}
