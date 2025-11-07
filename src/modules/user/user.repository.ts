import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
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
    return await this.prisma.user.findUnique({
      where: { username },
      //select: { username: true, id: true, isAdmin: true, isActive: true },
    });
  }

  async create(username: string, password: string, isAdmin = false) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, passwordHash, isAdmin, isActive: true },
    });

    return { message: `User ${user.username} created` };
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
