import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';

import { TelegramUser } from '../../common/decorators/telegram-user.decorator';
import { TelegramAuthGuard } from '../../common/guards/telegram-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

type AuthenticatedTelegramUser = {
  telegramId: string;
};

@UseGuards(TelegramAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@TelegramUser() user: AuthenticatedTelegramUser, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.telegramId, dto);
  }

  @Get()
  findAll(@TelegramUser() user: AuthenticatedTelegramUser) {
    return this.transactionsService.findAll(user.telegramId);
  }

  @Delete(':id')
  async remove(
    @TelegramUser() user: AuthenticatedTelegramUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.transactionsService.delete(user.telegramId, id);
  }
}
