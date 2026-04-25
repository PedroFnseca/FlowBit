import { Module } from '@nestjs/common';

import { FinancesController } from './finances.controller';
import { FinancesService } from './finances.service';

@Module({
  controllers: [FinancesController],
  providers: [FinancesService],
  exports: [FinancesService]
})
export class FinancesModule {}
