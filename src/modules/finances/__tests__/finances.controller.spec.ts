import { Test } from '@nestjs/testing';

import { TelegramAuthGuard } from '../../../common/guards/telegram-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinancesController } from '../finances.controller';
import { FinancesService } from '../finances.service';

describe('FinancesController', () => {
  let controller: FinancesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FinancesController],
      providers: [
        { provide: FinancesService, useValue: { getSummary: jest.fn() } },
        { provide: TelegramAuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } }
      ]
    }).compile();

    controller = module.get(FinancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
