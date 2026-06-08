import type { ApiService, IApiCollection, IApiCollectionItem, IApiRanklist } from '@/services/ranklist-api';
import { CollectionItemType } from '@/services/ranklist-api';

export interface CollectionPageData {
  collection: IApiCollection;
  ranklist?: IApiRanklist;
  ranklistHasError: boolean;
  ranklistIdInvalid: boolean;
}

const COLLECTION_ID_ALIASES: Record<string, string> = {
  official: 'official',
  '由官方整理和维护的': 'official',
};

export function normalizeCollectionId(id: string) {
  return COLLECTION_ID_ALIASES[id] || id;
}

export function flattenCollectionRanklistKeys(collection: IApiCollection) {
  const collect = (item: IApiCollectionItem): string[] => {
    if (item.type === CollectionItemType.Directory) {
      return (item.children || []).flatMap(collect);
    }
    return [item.uniqueKey];
  };
  return collection.root.children.flatMap(collect);
}

export function findCollectionAncestorKeys(collection: IApiCollection, rankId: string) {
  const find = (item: IApiCollectionItem, ancestors: string[]): string[] | undefined => {
    if (item.type !== CollectionItemType.Directory) {
      return item.uniqueKey === rankId ? ancestors : undefined;
    }
    const nextAncestors = [...ancestors, item.uniqueKey];
    for (const child of item.children || []) {
      const result = find(child, nextAncestors);
      if (result) {
        return result;
      }
    }
    return undefined;
  };

  for (const child of collection.root.children) {
    const result = find(child, []);
    if (result) {
      return result;
    }
  }
  return [];
}

export async function loadCollectionPageData({
  api,
  id,
  rankId,
}: {
  api: ApiService;
  id: string;
  rankId?: string;
}): Promise<CollectionPageData> {
  const realId = normalizeCollectionId(id);
  const [collection, ranklistResult] = await Promise.all([
    api.getCollection({ uniqueKey: realId }),
    rankId
      ? api.getRanklist({ uniqueKey: rankId })
          .then((data) => ({ data }))
          .catch((error: Error) => ({ error }))
      : Promise.resolve(undefined),
  ]);

  let ranklist: IApiRanklist | undefined;
  let ranklistHasError = false;
  let ranklistIdInvalid = false;
  if (rankId) {
    const validRanklistKeys = flattenCollectionRanklistKeys(collection);
    if (!validRanklistKeys.includes(rankId)) {
      ranklistIdInvalid = true;
    } else if (ranklistResult && 'data' in ranklistResult) {
      ranklist = ranklistResult.data;
    } else {
      ranklistHasError = true;
    }
  }

  return {
    collection,
    ranklist,
    ranklistHasError,
    ranklistIdInvalid,
  };
}
