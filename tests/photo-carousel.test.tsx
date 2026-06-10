import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import PhotoCarousel from '../src/components/ui/PhotoCarousel.js';
import PhotoGalleryPage from '../src/pages/adminCultura/pages/PhotoGalleryPage.js';
import NewsPage from '../src/pages/adminCultura/NewsPage.js';



test('PhotoCarousel renders active slide title and caption', () => {
  const items = [
    {
      id: 'photo-1',
      title: 'Primeira Foto',
      caption: 'Legenda da primeira foto',
      image: '/media/photo1.jpg',
      alt_text: 'Alt da primeira foto',
    },
    {
      id: 'photo-2',
      title: 'Segunda Foto',
      caption: 'Legenda da segunda foto',
      image: '/media/photo2.jpg',
      alt_text: 'Alt da segunda foto',
    }
  ];

  const output = renderToStaticMarkup(
    <PhotoCarousel items={items} />
  );

  assert.match(output, /Primeira Foto/);
  assert.match(output, /Legenda da primeira foto/);
  assert.match(output, /Alt da primeira foto/);
  
  // Checking that buttons exist for next/prev when multiple items
  assert.match(output, /aria-label="Imagem anterior"/);
  assert.match(output, /aria-label="Próxima imagem"/);
});

test('PhotoCarousel returns null when items are empty', () => {
  const output = renderToStaticMarkup(
    <PhotoCarousel items={[]} />
  );

  assert.equal(output, '');
});

test('PhotoGalleryPage renders form fields when showForm is true', () => {
  const formState = {
    section: 'laboratorio-cultural',
    title: 'Imagem Nova',
    caption: 'Uma bela imagem',
    image: '/media/img.jpg',
    alt_text: 'Alt',
    display_order: '5',
    is_active: true,
  };

  const output = renderToStaticMarkup(
    <PhotoGalleryPage
      photos={[]}
      form={formState}
      setForm={() => {}}
      editingPhotoId={null}
      isSaving={false}
      isUploading={false}
      isLoading={false}
      error=""
      uploadingKey={1}
      deletingPhotoId={null}
      showForm={true}
      showList={false}
      onSubmit={() => {}}
      onImageUpload={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  );

  assert.match(output, /Nova Foto/);
  assert.match(output, /Título/);
  assert.match(output, /Ordem/);
  assert.match(output, /Alt text/);
  assert.match(output, /Legenda/);
  assert.match(output, /value="Imagem Nova"/);
  assert.match(output, /value="5"/);
});

test('NewsPage renders file input with correct accept property and scheduling helper text', () => {
  const newsFormState = {
    title: 'Noticia Importante',
    summary: 'Resumo da noticia',
    image: '',
    content: 'Conteudo longo',
    news_status: 'draft',
    published_at: '2026-06-05T12:00',
    club_id: '1',
  };


  const output = renderToStaticMarkup(
    <NewsPage
      canManageUsers={true}
      newsOverviewStats={[]}
      showNewsForm={true}
      showNewsList={false}
      handleSaveNews={() => {}}
      editingNewsId={null}
      newsForm={newsFormState}
      setNewsForm={() => {}}
      clubs={[]}
      isLoadingNewsStatuses={false}
      availableNewsStatuses={[]}
      newsFormError=""
      isSavingNews={false}
      resetNewsForm={() => {}}
      newsImageFileKey={1}
      isUploadingNewsImage={false}
      handleUploadNewsImage={() => {}}
      newsError=""
      handleApplyNewsSearch={() => {}}
      newsSearchInput=""
      setNewsSearchInput={() => {}}
      setNewsSearch={() => {}}
      setNewsPage={() => {}}
      newsClubFilter=""
      setNewsClubFilter={() => {}}
      newsStatusFilter=""
      setNewsStatusFilter={() => {}}
      newsStatuses={[]}
      newsDateFrom=""
      setNewsDateFrom={() => {}}
      newsDateTo=""
      setNewsDateTo={() => {}}
      newsOrder=""
      setNewsOrder={() => {}}
      selectedNewsIds={[]}
      setSelectedNewsIds={() => {}}
      sortedNews={[]}
      bulkNewsStatus=""
      setBulkNewsStatus={() => {}}
      isApplyingBulkNews={false}
      handleApplyBulkNewsStatus={() => {}}
      isDeletingBulkNews={false}
      handleBulkDeleteNews={() => {}}
      deletingNewsId={null}
      changingNewsStatusId={null}
      handleToggleNewsActive={() => {}}
      handleDeleteNews={() => {}}
      handleEditNews={() => {}}
      newsTotal={0}
      newsPage={1}
      newsTotalPages={1}
      isLoadingNews={false}
      toggleSelectedId={() => {}}
    />
  );

  // Asserting accept attribute on file input
  assert.match(output, /accept="image\/png, image\/jpeg"/);
  
  // Asserting image hint text
  assert.match(output, /Seleciona uma imagem PNG ou JPG/);

  // Asserting scheduling helper text
  assert.match(output, /Escolhe a data\/hora de publicação. Para publicar imediatamente, usa (&quot;|")Publicar agora(&quot;|"); para agendar, escolhe um momento futuro/);
});



