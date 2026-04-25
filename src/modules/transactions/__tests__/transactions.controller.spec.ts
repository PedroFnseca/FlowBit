import { Test } from '@nestjs/testing';

import { TelegramAuthGuard } from '../../../common/guards/telegram-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsController } from '../transactions.controller';
import { TransactionsService } from '../transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: { create: jest.fn(), findAll: jest.fn() } },
        { provide: TelegramAuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } }
      ]
    }).compile();

    controller = module.get(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
