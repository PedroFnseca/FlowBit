import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(telegramId: string, dto: CreateTransactionDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });
    return this.prisma.transaction.create({
      data: {
        userId: user.id,
        amount: dto.amount,
        category: dto.category,
        description: dto.description,
        type: dto.type
      }
    });
  }

  async findAll(telegramId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });
    return this.prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(telegramId: string, transactionId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.delete({ where: { id: transactionId } });
  }
}
