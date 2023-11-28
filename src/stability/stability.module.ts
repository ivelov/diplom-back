import { Module } from '@nestjs/common';
import { StabilityController } from './stability.controller';
import { StabilityService } from './stability.service';

@Module({
  imports: [],
  controllers: [StabilityController],
  providers: [StabilityService],
  exports: [StabilityService],
})
export class StabilityModule {}
