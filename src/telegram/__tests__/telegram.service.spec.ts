import { Test } from '@nestjs/testing';

import { FinancesService } from '../../modules/finances/finances.service';
import { UsersService } from '../../modules/users/users.service';
import { TelegramService } from '../telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: UsersService, useValue: { create: jest.fn() } },
        { provide: FinancesService, useValue: { getSummary: jest.fn() } }
      ]
    }).compile();

    service = module.get(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
