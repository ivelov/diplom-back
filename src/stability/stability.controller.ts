import { Controller, Get, Query } from '@nestjs/common';
import { StabilityService } from './stability.service';
import { CalculatorParams } from './stability.dto';

@Controller('stability')
export class StabilityController {
  constructor(private readonly stabilityService: StabilityService) {}

  @Get('/chart')
  list() {
    return this.stabilityService.list();
  }

  @Get('/calculator')
  calculate(@Query() params: CalculatorParams) {
    return this.stabilityService.calculate(
      params.asset,
      params.condition,
      params.percentage,
      params.period,
    );
  }
}
