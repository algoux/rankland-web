import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import {
  CreateCollectionReqDTO,
  GetCollectionReqDTO,
  UpdateCollectionReqDTO,
} from '@common/modules/collection/collection.dto';

async function validationProperties(instance: object): Promise<string[]> {
  const errors = await validate(instance as any);
  return errors.map((error) => error.property);
}

describe('collection DTOs', () => {
  it.each([null, true, 42, 'text', ['rank-a', { nested: false }], { title: 'Official', ranklists: ['rank-a'] }])(
    'accepts JSON content %j',
    async (content) => {
      const dto = plainToInstance(CreateCollectionReqDTO, { uk: 'official', content });

      await expect(validationProperties(dto)).resolves.toEqual([]);
    },
  );

  it('requires valid JSON content on create and update', async () => {
    const missingCreate = plainToInstance(CreateCollectionReqDTO, { uk: 'official' });
    const missingUpdate = plainToInstance(UpdateCollectionReqDTO, { uk: 'official' });
    const nonJsonCreate = plainToInstance(CreateCollectionReqDTO, {
      uk: 'official',
      content: { invalid: undefined },
    });

    await expect(validationProperties(missingCreate)).resolves.toContain('content');
    await expect(validationProperties(missingUpdate)).resolves.toContain('content');
    await expect(validationProperties(nonJsonCreate)).resolves.toContain('content');
  });

  it('accepts non-empty uk values up to the database limit', async () => {
    await expect(
      validationProperties(plainToInstance(CreateCollectionReqDTO, { uk: 'a', content: {} })),
    ).resolves.toEqual([]);
    await expect(validationProperties(plainToInstance(GetCollectionReqDTO, { uk: 'a'.repeat(64) }))).resolves.toEqual(
      [],
    );
    await expect(
      validationProperties(plainToInstance(CreateCollectionReqDTO, { uk: '', content: {} })),
    ).resolves.toContain('uk');
    await expect(validationProperties(plainToInstance(GetCollectionReqDTO, { uk: 'a'.repeat(65) }))).resolves.toContain(
      'uk',
    );
  });
});
