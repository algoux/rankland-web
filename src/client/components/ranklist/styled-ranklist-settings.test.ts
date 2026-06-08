import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STYLED_RANKLIST_SETTINGS,
  getEmptyStatusPlaceholder,
  normalizeStyledRanklistSettings,
} from './styled-ranklist-settings';

describe('styled ranklist settings', () => {
  it('falls back to the source-compatible defaults for unknown input', () => {
    expect(normalizeStyledRanklistSettings(null)).toEqual(DEFAULT_STYLED_RANKLIST_SETTINGS);
    expect(normalizeStyledRanklistSettings({ rowStriped: undefined })).toEqual(DEFAULT_STYLED_RANKLIST_SETTINGS);
  });

  it('normalizes persisted values and legacy avatar placement', () => {
    expect(
      normalizeStyledRanklistSettings({
        professionalMode: true,
        statusCellPreset: 'minimal',
        statusColorAsText: true,
        rowStriped: false,
        tableBordered: true,
        emptyStatusPlaceholder: 'dash',
        splitOrganization: true,
        userAvatarPlacement: 'name',
      }),
    ).toEqual({
      professionalMode: true,
      statusCellPreset: 'minimal',
      statusColorAsText: true,
      rowStriped: false,
      tableBordered: true,
      emptyStatusPlaceholder: 'dash',
      splitOrganization: true,
      userAvatarPlacement: 'user',
    });
  });

  it('rejects unsupported enum-like values', () => {
    const settings = normalizeStyledRanklistSettings({
      statusCellPreset: 'huge',
      emptyStatusPlaceholder: 'blank',
      userAvatarPlacement: 'badge',
    });

    expect(settings.statusCellPreset).toBe('classic');
    expect(settings.emptyStatusPlaceholder).toBe('none');
    expect(settings.userAvatarPlacement).toBe('organization');
  });

  it('maps empty-status placeholders to renderer values', () => {
    expect(getEmptyStatusPlaceholder('dot')).toBe('·');
    expect(getEmptyStatusPlaceholder('dash')).toBe('-');
    expect(getEmptyStatusPlaceholder('none')).toBeNull();
  });
});
