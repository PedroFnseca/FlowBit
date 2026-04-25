import { Module } from '@nestjs/common';

import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { FinancesModule } from './modules/finances/finances.module';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, HealthModule, UsersModule, TransactionsModule, FinancesModule, TelegramModule]
})
export class AppModule {}

