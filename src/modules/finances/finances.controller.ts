import { Controller, Get, UseGuards } from '@nestjs/common';

import { TelegramUser } from '../../common/decorators/telegram-user.decorator';
import { TelegramAuthGuard } from '../../common/guards/telegram-auth.guard';
import { FinancesService } from './finances.service';

type AuthenticatedTelegramUser = {
  telegramId: string;
};

@UseGuards(TelegramAuthGuard)
@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('summary')
  getSummary(@TelegramUser() user: AuthenticatedTelegramUser) {
    return this.financesService.getSummary(user.telegramId);
  }
}
