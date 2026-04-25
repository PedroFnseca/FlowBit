import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const telegramIdHeader = request.headers['x-telegram-user-id'];
    const telegramId = Array.isArray(telegramIdHeader) ? telegramIdHeader[0] : telegramIdHeader;

    if (!telegramId) {
      throw new UnauthorizedException('Missing Telegram user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { telegramId: String(telegramId) }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.telegramUser = user;
    return true;
  }
}
