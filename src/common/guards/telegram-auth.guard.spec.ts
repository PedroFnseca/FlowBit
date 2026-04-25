import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { TelegramAuthGuard } from './telegram-auth.guard';

describe('TelegramAuthGuard', () => {
  const prisma = {
    user: {
      findUnique: jest.fn()
    }
  };

  const guard = new TelegramAuthGuard(prisma as any);

  it('throws when header is missing', async () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) })
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
