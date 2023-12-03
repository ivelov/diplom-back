import { IsNotEmpty } from 'class-validator';

export class StabilityDocument {
  static collectionName = 'Stability';

  id: string;
  title: string;
  periods: PeriodsData;
}

export class PeriodsData {
  [period: string]: {
    data: { [x: string]: number }[];
    standardDeviation?: any;
    cost?: number;
  };
}

export class CalculatorParams {
  @IsNotEmpty()
  asset: string;

  @IsNotEmpty()
  condition: 'above' | 'below' | 'all';

  @IsNotEmpty()
  percentage: string;

  period?: '1 year' | '2 years';
}
