import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import {
  AssetsData,
  CoinmetricsDataDocument,
  CoinmetricsDataDto,
} from './app.dto';
import { AssetsService } from './assets/assets.service';
import { StabilityService } from './stability/stability.service';
import { CollectionReference } from '@google-cloud/firestore';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly assetsService: AssetsService,
    private readonly stabilityService: StabilityService,
    @Inject(CoinmetricsDataDocument.collectionName)
    private coinmetricsDataCollection: CollectionReference<CoinmetricsDataDocument>,
  ) {}

  async generate() {
    const assets = await this.assetsService.list();
    const assetsData = {};
    for (const asset of assets) {
      const { data } = await firstValueFrom(
        this.httpService
          .get<{ data: CoinmetricsDataDto[] }>(
            'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics',
            {
              params: {
                assets: asset.id,
                metrics:
                  'CapAct1yrUSD,TxTfrValAdjUSD,TxTfrCnt,PriceUSD,SplyAct1yr,VelCur1yr',
                start_time: '2020-01-01T00:00:00Z',
                frequency: '1d',
                page_size: '10000',
              },
            },
          )
          .pipe(
            catchError((error) => {
              console.log(error);
              throw error;
            }),
          ),
      );
      assetsData[asset.id] = data.data;
    }

    await Promise.all([
      this.stabilityService.generate(assetsData),
      this.saveData(assetsData),
    ]);

    return;
  }

  async saveData(data: AssetsData) {
    const assetIds = Object.keys(data);
    const promises = [];
    for (let i = 0; i < data[assetIds[0]].length; i++) {
      const result: CoinmetricsDataDocument = {
        timestamp: new Date(data[assetIds[0]][i].time).getTime(),
        assets: {},
      };
      for (const assetId of assetIds) {
        if (!data[assetId][i]) {
          result.assets[assetId] = {
            CapAct1yrUSD: null,
            PriceUSD: null,
            SplyAct1yr: null,
            TxTfrCnt: null,
            TxTfrValAdjUSD: null,
            VelCur1yr: null,
          };
        } else {
          result.assets[assetId] = data[assetId][i];
        }
      }
      promises.push(
        this.coinmetricsDataCollection
          .doc(new Date(data[assetIds[0]][i].time).toISOString().split('T')[0])
          .set(result),
      );
    }
    await Promise.all(promises);
  }
}
