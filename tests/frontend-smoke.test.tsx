import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import AdminPageHero from '../src/pages/adminCultura/components/AdminPageHero.js';
import LogsPage from '../src/pages/adminCultura/pages/LogsPage.js';
import MetricsPage from '../src/pages/adminCultura/pages/MetricsPage.js';
import NewslettersPage from '../src/pages/adminCultura/pages/NewslettersPage.js';
import PaginatedCollection from '../src/components/containers/PaginatedCollection.js';
import PublicMediaListItem from '../src/components/containers/PublicMediaListItem.js';
import { FolderKanban } from 'lucide-react';

test('AdminPageHero renders title, description and stats', () => {
  const output = renderToStaticMarkup(
    <AdminPageHero
      icon={FolderKanban}
      title="Painel"
      description="Resumo do estado atual"
      stats={[
        { label: 'Eventos', value: 4 },
        { label: 'Noticias', value: 2 }
      ]}
    />
  );

  assert.match(output, /Painel/);
  assert.match(output, /Resumo do estado atual/);
  assert.match(output, /Eventos/);
  assert.match(output, /Noticias/);
});

test('PublicMediaListItem renders the link and metadata', () => {
  const output = renderToStaticMarkup(
    <MemoryRouter>
      <PublicMediaListItem
        title="Sessao Aberta"
        href="/laboratorio-cultural/sessoes/1"
        imageUrl="/media/example.jpg"
        imageAlt="Sessao aberta"
        dateTime="2026-05-11"
        formattedDate="11/05/2026"
        description="Descricao da sessao"
      />
    </MemoryRouter>
  );

  assert.match(output, /Sessao Aberta/);
  assert.match(output, /11\/05\/2026/);
  assert.match(output, /Descricao da sessao/);
  assert.match(output, /Ler Mais/);
});

test('PaginatedCollection renders the current slice of items', () => {
  const output = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/admin?page=2']}>
      <PaginatedCollection
        items={['A', 'B', 'C', 'D', 'E']}
        isLoading={false}
        error=""
        loadingMessage="A carregar"
        emptyMessage="Vazio"
        itemsPerPage={2}
        renderItem={(item) => <div key={item}>{item}</div>}
      />
    </MemoryRouter>
  );

  assert.match(output, />C<\/div>/);
  assert.match(output, />D<\/div>/);
  assert.doesNotMatch(output, />A<\/div>/);
  assert.doesNotMatch(output, />B<\/div>/);
});

test('NewslettersPage renders the newsletters dashboard shell', () => {
  const output = renderToStaticMarkup(<NewslettersPage />);

  assert.match(output, /Newsletters/);
  assert.match(output, /Subscritores/);
});

test('MetricsPage renders the metrics dashboard shell', () => {
  const output = renderToStaticMarkup(<MetricsPage />);

  assert.match(output, /Métricas/);
  assert.match(output, /Visualizações totais/);
  assert.match(output, /Top páginas/);
});

test('LogsPage renders the logs dashboard shell', () => {
  const output = renderToStaticMarkup(<LogsPage />);

  assert.match(output, /Logs/);
  assert.match(output, /Atividade recente/);
  assert.match(output, /Histórico centralizado/);
});
