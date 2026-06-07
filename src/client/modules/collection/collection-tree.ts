import { CollectionItemType, type IApiCollection, type IApiCollectionItem } from '@common/rankland-api';

const COLLECTION_ID_TRANSLATIONS: Record<string, string> = {
  official: 'official',
  由官方整理和维护的: 'official',
};

export function normalizeCollectionId(id: string): string {
  return COLLECTION_ID_TRANSLATIONS[id] || id;
}

export function getFlatRanklistUniqueKeys(collection: IApiCollection): string[] {
  const visit = (item: IApiCollectionItem): string[] => {
    if (item.type === CollectionItemType.Directory) {
      return (item.children || []).flatMap(visit);
    }

    return [item.uniqueKey];
  };

  return collection.root.children.flatMap(visit);
}

export function isRanklistInCollection(collection: IApiCollection, rankId: string): boolean {
  return getFlatRanklistUniqueKeys(collection).includes(rankId);
}

export function getAncestorDirectoryKeys(collection: IApiCollection, rankId: string): string[] {
  const walk = (item: IApiCollectionItem): string[] | undefined => {
    if (item.type !== CollectionItemType.Directory) {
      return item.uniqueKey === rankId ? [] : undefined;
    }

    for (const child of item.children || []) {
      const childPath = walk(child);
      if (childPath) {
        return [item.uniqueKey, ...childPath];
      }
    }

    return undefined;
  };

  for (const child of collection.root.children) {
    const path = walk(child);
    if (path) {
      return path;
    }
  }

  return [];
}
