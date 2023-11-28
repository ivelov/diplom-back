import { Injectable, Inject } from '@nestjs/common';
import { AssetsDocument } from './assets.dto';
import { CollectionReference } from '@google-cloud/firestore';

@Injectable()
export class AssetsService {
  constructor(
    @Inject(AssetsDocument.collectionName)
    private questionsCollection: CollectionReference<AssetsDocument>,
  ) {}

  async list() {
    const assets: AssetsDocument[] = [];
    (await this.questionsCollection.get()).forEach((doc) =>
      assets.push(doc.data()),
    );
    return assets;
  }
}
