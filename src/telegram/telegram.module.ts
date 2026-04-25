import { Module } from '@nestjs/common';

import { FinancesModule } from '../modules/finances/finances.module';
import { UsersModule } from '../modules/users/users.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [UsersModule, FinancesModule],
  providers: [TelegramService]
})
export class TelegramModule {}
