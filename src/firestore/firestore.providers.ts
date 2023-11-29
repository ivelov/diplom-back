import { CoinmetricsDataDocument } from 'src/app.dto';
import { AssetsDocument } from 'src/assets/assets.dto';
import { StabilityDocument } from 'src/stability/stability.dto';

export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions';
export const FirestoreCollectionProviders: string[] = [
  AssetsDocument.collectionName,
  StabilityDocument.collectionName,
  CoinmetricsDataDocument.collectionName,
];
