import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(telegramId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });

    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _sum: { amount: true }
    });

    const totalCredit = grouped.find((item) => item.type === TransactionType.CREDIT)?._sum.amount ?? 0;
    const totalDebit = grouped.find((item) => item.type === TransactionType.DEBIT)?._sum.amount ?? 0;

    const credit = Number(totalCredit);
    const debit = Number(totalDebit);

    return {
      totalCredit: credit.toFixed(2),
      totalDebit: debit.toFixed(2),
      balance: (credit - debit).toFixed(2)
    };
  }
}
