import type { InfoCulturaPhoto } from '../api/infoculturaApi';

function normalizeSection(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function expandSectionAliases(values: string[]): string[] {
  const aliases = new Set<string>();

  values
    .map((value) => normalizeSection(value))
    .filter(Boolean)
    .forEach((value) => {
      aliases.add(value);
      aliases.add(value.replace(/\s+/g, '-'));
      aliases.add(value.replace(/\s+/g, '_'));
      aliases.add(value.replace(/\s+/g, ''));
    });

  return Array.from(aliases);
}

export function buildClubPhotoSectionAliases(
  clubName?: string | null,
  extraTerms: string[] = [],
  clubId?: number | null
): string[] {
  const normalizedClub = normalizeSection(clubName || '');
  const aliases = new Set<string>(expandSectionAliases(extraTerms));

  if (typeof clubId === 'number' && Number.isFinite(clubId)) {
    aliases.add(`club-${clubId}`);
    aliases.add(`club_${clubId}`);
    aliases.add(`club${clubId}`);
  }

  if (normalizedClub) {
    expandSectionAliases([normalizedClub]).forEach((value) => aliases.add(value));

    if (normalizedClub.includes('teatro')) {
      expandSectionAliases(['teatro', 'clube teatro', 'clube de teatro']).forEach((value) =>
        aliases.add(value)
      );
    }

    if (normalizedClub.includes('leitura')) {
      expandSectionAliases(['leitura', 'clube leitura', 'clube de leitura']).forEach((value) =>
        aliases.add(value)
      );
    }

    if (normalizedClub.includes('tuna')) {
      expandSectionAliases(['tuna', 'tuna academica', 'tuna académica']).forEach((value) =>
        aliases.add(value)
      );
    }
  }

  return Array.from(aliases);
}

export function filterPhotosBySections(
  photos: InfoCulturaPhoto[],
  sectionAliases: string[]
): InfoCulturaPhoto[] {
  const validAliases = new Set(expandSectionAliases(sectionAliases));

  return photos.filter((photo) => validAliases.has(normalizeSection(photo.section)));
}
