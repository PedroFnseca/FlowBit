import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { FinancesService } from '../finances.service';

describe('FinancesService', () => {
  let service: FinancesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FinancesService,
        {
          provide: PrismaService,
          useValue: { user: { findUniqueOrThrow: jest.fn() }, transaction: { groupBy: jest.fn() } }
        }
      ]
    }).compile();

    service = module.get(FinancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
