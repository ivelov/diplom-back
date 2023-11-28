import { Controller, Get } from '@nestjs/common';
import { StabilityService } from './stability.service';

@Controller('stability')
export class StabilityController {
  constructor(private readonly stabilityService: StabilityService) {}

  @Get()
  list() {
    return this.stabilityService.list();
  }
}
