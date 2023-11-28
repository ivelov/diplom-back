import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { CoinmetricsDataDto } from './app.dto';
import { AssetsService } from './assets/assets.service';
import { StabilityService } from './stability/stability.service';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly assetsService: AssetsService,
    private readonly stabilityService: StabilityService,
  ) {}

  async generate() {
    const assets = await this.assetsService.list();
    // const asset = 'usdc';
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
                start_time: '2023-11-01T00:00:00Z',
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
    this.stabilityService.generate(assetsData);
    return;
  }
}
