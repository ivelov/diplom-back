import { Inject, Injectable } from '@nestjs/common';
import { AssetsData, CoinmetricsDataDocument } from 'src/app.dto';
import { density1d } from 'src/kde';
import { PeriodsData, StabilityDocument } from './stability.dto';
import { CollectionReference } from '@google-cloud/firestore';
import { format, subYears } from 'date-fns';
import { std } from 'mathjs';
import { AssetsDocument } from 'src/assets/assets.dto';

@Injectable()
export class StabilityService {
  constructor(
    @Inject(StabilityDocument.collectionName)
    private stabilityCollection: CollectionReference<StabilityDocument>,
    @Inject(CoinmetricsDataDocument.collectionName)
    private coinmetricsDataCollection: CollectionReference<CoinmetricsDataDocument>,
  ) {}

  async list() {
    const assetsData = [];
    (await this.stabilityCollection.get()).forEach((data) =>
      assetsData.push(data.data()),
    );
    return assetsData;
  }

  async generate(data: AssetsData, assets: AssetsDocument[]) {
    const periods = ['years1', 'years2', 'all'];
    const promises = [];
    for (const asset in data) {
      const periodsData: PeriodsData = {};
      for (const period of periods) {
        const startDate = this.getStartDate(period);
        let filteredData = data[asset];
        if (startDate) {
          filteredData = filteredData.filter(
            (val) => val.time.split('T')[0] > format(startDate, 'yyyy-MM-dd'),
          );
        }

        const allCosts: number[] = [];
        let totalCost = 0;
        for (const timestamp of filteredData) {
          const cost = parseFloat(timestamp.PriceUSD);
          if (!cost) {
            continue;
          }
          allCosts.push(cost);
          totalCost += cost;
        }

        const density = Array.from(
          density1d(
            allCosts
              // .filter((val) => val >= 0.995 && val < 1.005)
              .map((cost) => cost * 1000),
            { bandwidth: 1, extent: [995, 1005] },
          ),
        );

        let standardDeviation: number | any = 0;
        if (allCosts.length) {
          standardDeviation = std(allCosts);
        }

        periodsData[period] = {
          data: density.map((val) => ({
            x: Math.round(val.x * 10000) / 10000000,
            y: Math.exp(val.y),
          })),
          standardDeviation: Math.round(standardDeviation * 100000) / 100000,
          cost: Math.round((totalCost / allCosts.length) * 10000) / 10000,
        };
      }
      promises.push(
        this.stabilityCollection.doc(asset).set({
          id: asset,
          title: assets.find((val) => val.id === asset)?.title,
          periods: periodsData,
        }),
      );
    }

    await Promise.all(promises);
  }

  private getStartDate(period) {
    let startDate = null;
    switch (period) {
      case 'years1':
        startDate = subYears(new Date(), 1);
        break;
      case 'years2':
        startDate = subYears(new Date(), 2);
        break;
    }

    return startDate;
  }

  async calculate(
    asset: string,
    condition: string,
    percentageStr: string,
    period: string,
  ) {
    const percentage = parseFloat(percentageStr);
    let startDate: Date = null;
    switch (period) {
      case '1 year':
        startDate = subYears(new Date(), 1);
        break;
      case '2 years':
        startDate = subYears(new Date(), 2);
        break;
    }
    let timestampsData: CoinmetricsDataDocument[] = [];
    (await this.coinmetricsDataCollection.get()).forEach((val) =>
      timestampsData.push(val.data()),
    );
    if (startDate) {
      timestampsData = timestampsData.filter(
        (val) => val.timestamp > startDate.getTime(),
      );
    }

    const instances = [];
    let overallDays = 0;
    let maxContinuousDays = 0;
    let currentContinuousDays = 0;
    let intervalFinished = true;

    for (const timestampData of timestampsData) {
      const cost = timestampData.assets[asset]?.PriceUSD;
      if (!cost) {
        continue;
      }

      if (this.isOutOfRangeStability(cost, percentage, condition)) {
        overallDays++;
        currentContinuousDays++;
        if (currentContinuousDays > maxContinuousDays) {
          maxContinuousDays = currentContinuousDays;
        }
        if (intervalFinished) {
          intervalFinished = false;
        }
      } else if (!intervalFinished) {
        instances.push(currentContinuousDays);
        intervalFinished = true;
        currentContinuousDays = 0;
      }
    }

    instances.sort((a, b) => a - b);
    const medianIndex = (instances.length - 1) / 2;
    let medianContinuousTime = 0;
    if (instances.length) {
      if (medianIndex % 1) {
        medianContinuousTime =
          (instances[Math.floor(medianIndex)] +
            instances[Math.ceil(medianIndex)]) /
          2;
        medianContinuousTime = Math.round(medianContinuousTime * 100) / 100;
      } else {
        medianContinuousTime = instances[medianIndex];
      }
    }

    const data = {
      instances: instances.length,
      overallTime: overallDays,
      maxContinuousTime: maxContinuousDays,
      medianContinuousTime,
    };

    return {
      data,
    };
  }

  isOutOfRangeStability(data: number, percentage: number, condition: string) {
    if (!data) {
      return false;
    }
    switch (condition) {
      case 'below':
        return data < 1 - percentage / 100;
      case 'above':
        return data >= 1 + percentage / 100;
      default:
        return data < 1 - percentage / 100 || data >= 1 + percentage / 100;
    }
  }
}
