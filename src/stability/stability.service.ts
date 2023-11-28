import { Inject, Injectable } from '@nestjs/common';
import { AssetsData } from 'src/app.dto';
import { density1d } from 'src/kde';
import { PeriodsData, StabilityDocument } from './stability.dto';
import { CollectionReference } from '@google-cloud/firestore';
import { format, subYears } from 'date-fns';
import { std } from 'mathjs';

@Injectable()
export class StabilityService {
  constructor(
    @Inject(StabilityDocument.collectionName)
    private stabilityCollection: CollectionReference<StabilityDocument>,
  ) {}

  async list() {
    const assetsData = [];
    (await this.stabilityCollection.get()).forEach((data) =>
      assetsData.push(data.data()),
    );
    return assetsData;
  }

  async generate(data: AssetsData) {
    const periods = ['years1', 'years2', 'years3', 'all'];
    const promises = [];
    for (const asset in data) {
      const periodsData: PeriodsData = {};
      for (const period of periods) {
        const startDate = this.getStartDate(period);
        let filteredData = data[asset];
        if (startDate) {
          filteredData = filteredData.filter(
            (val) => val.time > format(startDate, 'yyyy-MM-dd'),
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
              .filter((val) => val >= 0.995 && val < 1.005)
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
      case 'years3':
        startDate = subYears(new Date(), 3);
        break;
    }

    return startDate;
  }
}
