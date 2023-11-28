export class StabilityDocument {
  static collectionName = 'Stability';

  id: string;
  periods: PeriodsData;
}

export class PeriodsData {
  [period: string]: {
    data: { [x: string]: number }[];
    standardDeviation?: any;
    cost?: number;
  };
}
