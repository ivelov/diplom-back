export interface CoinmetricsDataDto {
  asset: string;
  time: string;
  CapAct1yrUSD: string;
  PriceUSD: string;
  SplyAct1yr: string;
  TxTfrCnt: string;
  TxTfrValAdjUSD: string;
  VelCur1yr: string;
}

export interface TimestampData {
  timestamp: string;
  assets: {
    [asset: string]: Omit<CoinmetricsDataDto, 'asset' | 'time'>;
  };
}

export interface AssetsData {
  [asset: string]: CoinmetricsDataDto[];
}

export interface CoinmetricsDataParsed {
  CapAct1yrUSD: number;
  PriceUSD: number;
  SplyAct1yr: number;
  TxTfrCnt: number;
  TxTfrValAdjUSD: number;
  VelCur1yr: number;
}

export class CoinmetricsDataDocument {
  static collectionName = 'CoinmetricsData';

  timestamp: number;
  assets: {
    [asset: string]: CoinmetricsDataParsed;
  };
}
