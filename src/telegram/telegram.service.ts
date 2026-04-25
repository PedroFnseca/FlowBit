import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';

import { FinancesService } from '../modules/finances/finances.service';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot?: Telegraf<Context>;

  constructor(
    private readonly usersService: UsersService,
    private readonly financesService: FinancesService
  ) {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }
  }

  onModuleInit(): void {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not defined. Bot startup skipped.');
      return;
    }

    this.bot.command('start', (ctx) => this.handleStart(ctx));
    this.bot.command('balance', (ctx) => this.handleBalance(ctx));

    void this.bot.launch();
    this.logger.log('Telegram bot started');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
  }

  private async handleStart(ctx: Context): Promise<void> {
    const telegramId = String(ctx.from?.id ?? '');
    if (!telegramId) {
      await ctx.reply('Nao foi possivel identificar seu usuario.');
      return;
    }

    await this.usersService.create({
      telegramId,
      firstName: ctx.from?.first_name ?? 'Usuario',
      username: ctx.from?.username
    });

    await ctx.reply('Conta criada com sucesso. Use /balance para ver seu saldo.');
  }

  private async handleBalance(ctx: Context): Promise<void> {
    const telegramId = String(ctx.from?.id ?? '');
    if (!telegramId) {
      await ctx.reply('Nao foi possivel identificar seu usuario.');
      return;
    }

    const summary = await this.financesService.getSummary(telegramId);
    await ctx.reply(`Saldo atual: R$ ${summary.balance}`);
  }
}
