export type CulturalArea = 'tuna' | 'clube-leitura' | 'teatro';

export type CulturalItem = {
  id: string;
  area: CulturalArea;
  title: string;
  description: string;
  date: string;
  status: 'rascunho' | 'publicado';
  updatedAt: string;
};

const STORAGE_KEY = 'ispgaya_cultural_items_v1';

const seedItems: CulturalItem[] = [
  {
    id: 'seed-tuna-1',
    area: 'tuna',
    title: 'Ensaios Semanais da Tuna',
    description:
      'Inscricoes abertas para novos elementos. Ensaios a decorrer todas as quartas-feiras.',
    date: '2026-03-20',
    status: 'publicado',
    updatedAt: '2026-03-05T10:00:00.000Z'
  },
  {
    id: 'seed-leitura-1',
    area: 'clube-leitura',
    title: 'Livro do Mes: Literatura Portuguesa',
    description:
      'Sessao dedicada a autores contemporaneos, com debate orientado por docente convidado.',
    date: '2026-03-25',
    status: 'publicado',
    updatedAt: '2026-03-05T10:00:00.000Z'
  },
  {
    id: 'seed-teatro-1',
    area: 'teatro',
    title: 'Audicoes para Grupo de Teatro',
    description:
      'Candidaturas abertas para atores e equipa tecnica da nova producao academica.',
    date: '2026-03-28',
    status: 'publicado',
    updatedAt: '2026-03-05T10:00:00.000Z'
  }
];

function safeParse(value: string | null): CulturalItem[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as CulturalItem[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCulturalItems(): CulturalItem[] {
  if (typeof window === 'undefined') return seedItems;

  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));

  if (parsed && parsed.length > 0) {
    return parsed;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedItems));
  return seedItems;
}

export function saveCulturalItems(items: CulturalItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCulturalItemsByArea(area: CulturalArea): CulturalItem[] {
  return getCulturalItems().filter((item) => item.area === area);
}

export function getAreaLabel(area: CulturalArea): string {
  if (area === 'tuna') return 'Tuna Academica';
  if (area === 'clube-leitura') return 'Clube de Leitura';
  return 'Teatro';
}

export function createId(): string {
  return `cultura-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
