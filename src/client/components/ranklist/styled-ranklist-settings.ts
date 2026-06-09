import type {
  RanklistStatusCellPreset,
  RanklistUserAvatarPlacement,
} from '@algoux/standard-ranklist-renderer-component-vue';

export type StyledRanklistEmptyStatusPlaceholder = 'none' | 'dot' | 'dash';

export interface StyledRanklistSettings {
  professionalMode: boolean;
  statusCellPreset: RanklistStatusCellPreset;
  statusColorAsText: boolean;
  rowStriped: boolean;
  tableBordered: boolean;
  emptyStatusPlaceholder: StyledRanklistEmptyStatusPlaceholder;
  splitOrganization: boolean;
  userAvatarPlacement: RanklistUserAvatarPlacement;
}

export const DEFAULT_STYLED_RANKLIST_SETTINGS: StyledRanklistSettings = {
  professionalMode: false,
  statusCellPreset: 'classic',
  statusColorAsText: false,
  rowStriped: true,
  tableBordered: false,
  emptyStatusPlaceholder: 'none',
  splitOrganization: false,
  userAvatarPlacement: 'organization',
};

const STATUS_CELL_PRESETS: RanklistStatusCellPreset[] = ['classic', 'detailed', 'minimal', 'compact'];
const EMPTY_STATUS_PLACEHOLDERS: StyledRanklistEmptyStatusPlaceholder[] = ['none', 'dot', 'dash'];
const USER_AVATAR_PLACEMENTS: RanklistUserAvatarPlacement[] = ['user', 'organization'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeStyledRanklistSettings(settings: unknown): StyledRanklistSettings {
  const source = isRecord(settings) ? settings : {};
  const statusCellPreset = source.statusCellPreset;
  const emptyStatusPlaceholder = source.emptyStatusPlaceholder;
  const userAvatarPlacement = source.userAvatarPlacement === 'name' ? 'user' : source.userAvatarPlacement;

  return {
    professionalMode: source.professionalMode === true,
    statusCellPreset:
      typeof statusCellPreset === 'string' && STATUS_CELL_PRESETS.includes(statusCellPreset as RanklistStatusCellPreset)
        ? (statusCellPreset as RanklistStatusCellPreset)
        : DEFAULT_STYLED_RANKLIST_SETTINGS.statusCellPreset,
    statusColorAsText: source.statusColorAsText === true,
    rowStriped: source.rowStriped !== false,
    tableBordered: source.tableBordered === true,
    emptyStatusPlaceholder:
      typeof emptyStatusPlaceholder === 'string' &&
      EMPTY_STATUS_PLACEHOLDERS.includes(emptyStatusPlaceholder as StyledRanklistEmptyStatusPlaceholder)
        ? (emptyStatusPlaceholder as StyledRanklistEmptyStatusPlaceholder)
        : DEFAULT_STYLED_RANKLIST_SETTINGS.emptyStatusPlaceholder,
    splitOrganization: source.splitOrganization === true,
    userAvatarPlacement:
      typeof userAvatarPlacement === 'string' &&
      USER_AVATAR_PLACEMENTS.includes(userAvatarPlacement as RanklistUserAvatarPlacement)
        ? (userAvatarPlacement as RanklistUserAvatarPlacement)
        : DEFAULT_STYLED_RANKLIST_SETTINGS.userAvatarPlacement,
  };
}

export function getEmptyStatusPlaceholder(setting: StyledRanklistEmptyStatusPlaceholder): string | null {
  if (setting === 'dot') {
    return '·';
  }
  if (setting === 'dash') {
    return '-';
  }
  return null;
}
