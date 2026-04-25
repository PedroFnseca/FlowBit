import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsService } from '../transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUniqueOrThrow: jest.fn() },
            transaction: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() }
          }
        }
      ]
    }).compile();

    service = module.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
