import { ApiClient } from '@common/api/api-client';
import { describe, expect, it, vi } from 'vitest';

describe('collection API contract', () => {
  it('generates all public and admin collection requests with the expected routes', async () => {
    const request = vi.fn(async () => ({ success: true, code: 0, data: null }));
    const responseParser = {
      pat: vi.fn((_dto, response) => response.data),
    };
    const client = new ApiClient({ request }, responseParser as any);

    await client.createCollection({ uk: 'official', content: { ranks: [] } });
    await client.updateCollection({ uk: 'official', content: ['rank-a'] });
    await client.getCollections();
    await client.getPublicCollections();
    await client.getCollection({ uk: 'official' });
    await client.getPublicCollection({ uk: 'official' });
    await client.deleteCollection({ uk: 'official' });

    expect(
      request.mock.calls.map(([args]) => ({
        name: args.metadata.name,
        method: args.method,
        url: args.url,
        data: args.data,
      })),
    ).toEqual([
      {
        name: 'createCollection',
        method: 'POST',
        url: '/api/v2/collections',
        data: { uk: 'official', content: { ranks: [] } },
      },
      {
        name: 'updateCollection',
        method: 'PATCH',
        url: '/api/v2/collections/official',
        data: { content: ['rank-a'] },
      },
      {
        name: 'getCollections',
        method: 'GET',
        url: '/api/v2/collections',
        data: {},
      },
      {
        name: 'getPublicCollections',
        method: 'GET',
        url: '/api/v2/public/collections',
        data: {},
      },
      {
        name: 'getCollection',
        method: 'GET',
        url: '/api/v2/collections/official',
        data: {},
      },
      {
        name: 'getPublicCollection',
        method: 'GET',
        url: '/api/v2/public/collections/official',
        data: {},
      },
      {
        name: 'deleteCollection',
        method: 'DELETE',
        url: '/api/v2/collections/official',
        data: {},
      },
    ]);
  });
});
