import { Images, Trash2 } from 'lucide-react';
import { useMemo, type Dispatch, type FormEvent, type SetStateAction } from 'react';

import type { InfoCulturaPhoto } from '../../../api/infoculturaApi';
import PhotoCarousel from '../../../components/ui/PhotoCarousel';
import { resolveInfoCulturaAssetUrl } from '../../../api/client';
import {
  adminActions,
  adminBtnDanger,
  adminBtnEdit,
  adminBtnPrimary,
  adminError,
  adminField,
  adminFieldSpaced,
  adminFormGridSpaced,
  adminInfo,
  adminInput,
  adminLabel,
  adminList,
  adminListDesc,
  adminListHeader,
  adminListItem,
  adminListMeta,
  adminListTitle,
  adminListTools,
  adminListTop,
  adminPanelCard,
  adminPanelForm,
  adminTextarea,
  blockText,
  blockTitle,
} from '../../../styles/ui';
import type { PhotoFormState } from '../types';
import { getLocaleText, useLocale } from '../../../i18n/locale';

type PhotoGalleryPageProps = {
  photos: InfoCulturaPhoto[];
  form: PhotoFormState;
  setForm: Dispatch<SetStateAction<PhotoFormState>>;
  editingPhotoId: string | null;
  isSaving: boolean;
  isUploading: boolean;
  isLoading: boolean;
  error: string;
  uploadingKey: number;
  deletingPhotoId: string | null;
  showForm: boolean;
  showList: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onImageUpload: (file: File) => void;
  onEdit: (photo: InfoCulturaPhoto) => void;
  onDelete: (id: string) => void;
};

function PhotoGalleryPage({
  photos,
  form,
  setForm,
  editingPhotoId,
  isSaving,
  isUploading,
  isLoading,
  error,
  uploadingKey,
  deletingPhotoId,
  showForm,
  showList,
  onSubmit,
  onImageUpload,
  onEdit,
  onDelete,
}: PhotoGalleryPageProps) {
  const { locale } = useLocale();
  const activePhotos = photos.filter((photo) => photo.is_active).sort((a, b) => a.display_order - b.display_order);
  const previewPhotos = activePhotos.filter((photo) => photo.section.trim() === 'laboratorio-cultural');
  const photoSectionOptions = useMemo(() => {
    const baseSections = [
      'laboratorio-cultural',
      'teatro',
      'clube-leitura',
      'clube-cultural',
      'homepage',
    ];
    const merged = new Set(
      [...baseSections, ...photos.map((photo) => photo.section.trim())].filter(Boolean)
    );
    return Array.from(merged).sort((left, right) => left.localeCompare(right, 'pt-PT'));
  }, [photos]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Images className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">{getLocaleText(locale, 'Galeria', 'Gallery')}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {getLocaleText(locale, 'Gestão das imagens usadas em carrosséis e secções visuais.', 'Manage images used in carousels and visual sections.')}
            </p>
          </div>
        </div>
      </section>

      {error ? <p className={adminError}>{error}</p> : null}

      {showForm ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <form onSubmit={onSubmit} className={adminPanelForm}>
            <h3 className={blockTitle}>{editingPhotoId ? getLocaleText(locale, 'Editar Foto', 'Edit Photo') : getLocaleText(locale, 'Nova Foto', 'New Photo')}</h3>
            <p className={blockText}>{getLocaleText(locale, 'Cria imagens para carrosséis e secções visuais, escolhendo a secção onde devem aparecer.', 'Create images for carousels and visual sections, choosing the section where they should appear.')}</p>

            <div className={adminFormGridSpaced}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="photo-section">
                  {getLocaleText(locale, 'Secção', 'Section')}
                </label>
                <input
                  id="photo-section"
                  className={adminInput}
                  list="photo-section-suggestions"
                  value={form.section}
                  onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
                  placeholder={getLocaleText(locale, 'Ex.: laboratorio-cultural, club-3, teatro', 'Ex.: laboratorio-cultural, club-3, teatro')}
                />
                <datalist id="photo-section-suggestions">
                  {photoSectionOptions.map((section) => (
                    <option key={section} value={section} />
                  ))}
                </datalist>
                <p className={adminInfo}>
                  {getLocaleText(locale, 'Podes escolher uma secção existente ou escrever uma nova.', 'You can choose an existing section or type a new one.')}
                </p>
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="photo-order">
                  {getLocaleText(locale, 'Ordem', 'Order')}
                </label>
                <input
                  id="photo-order"
                  type="number"
                  min="0"
                  className={adminInput}
                  value={form.display_order}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, display_order: event.target.value }))
                  }
                />
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="photo-title">
                  {getLocaleText(locale, 'Título', 'Title')}
                </label>
                <input
                  id="photo-title"
                  className={adminInput}
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="photo-alt-text">
                  Alt text
                </label>
                <input
                  id="photo-alt-text"
                  className={adminInput}
                  value={form.alt_text}
                  onChange={(event) => setForm((prev) => ({ ...prev, alt_text: event.target.value }))}
                />
              </div>
            </div>

            <div className={adminFieldSpaced}>
              <label className={adminLabel} htmlFor="photo-caption">
                {getLocaleText(locale, 'Legenda', 'Caption')}
              </label>
              <textarea
                id="photo-caption"
                rows={4}
                className={adminTextarea}
                value={form.caption}
                onChange={(event) => setForm((prev) => ({ ...prev, caption: event.target.value }))}
              />
            </div>

            <div className={adminFieldSpaced}>
              <label className={adminLabel} htmlFor="photo-image">
                {getLocaleText(locale, 'Imagem', 'Image')}
              </label>
              <input
                key={uploadingKey}
                id="photo-image"
                type="file"
                accept="image/*"
                className={adminInput}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImageUpload(file);
                  }
                }}
              />
              <p className={adminInfo}>
                {isUploading
                  ? getLocaleText(locale, 'A carregar imagem...', 'Uploading image...')
                  : form.image
                    ? getLocaleText(locale, 'Imagem carregada com sucesso.', 'Image uploaded successfully.')
                    : getLocaleText(locale, 'Seleciona a imagem para o carrossel.', 'Select the image for the carousel.')}
              </p>
              {form.image ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={resolveInfoCulturaAssetUrl(form.image)}
                    alt={form.alt_text || form.title || getLocaleText(locale, 'Pré-visualização', 'Preview')}
                    className="h-64 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className={adminFieldSpaced}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
                {getLocaleText(locale, 'Foto ativa', 'Active photo')}
              </label>
            </div>

            <div className={adminActions}>
              <button type="submit" className={adminBtnPrimary} disabled={isSaving}>
                {isSaving ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingPhotoId ? getLocaleText(locale, 'Guardar alterações', 'Save changes') : getLocaleText(locale, 'Criar foto', 'Create photo')}
              </button>
            </div>
          </form>

          <aside className={adminPanelCard}>
            <h3 className={blockTitle}>{getLocaleText(locale, 'Pré-visualização', 'Preview')}</h3>
            <p className={blockText}>
              {getLocaleText(locale, 'O preview mostra as fotos ativas do carrossel pela ordem definida.', 'The preview shows active carousel photos in the defined order.')}
            </p>
            {previewPhotos.length > 0 ? (
              <PhotoCarousel items={previewPhotos} className="mt-5" aspectClassName="aspect-[4/3]" />
            ) : (
              <p className="mt-5 text-sm text-slate-500">{getLocaleText(locale, 'Ainda não existem fotos ativas no carrossel.', 'There are no active carousel photos yet.')}</p>
            )}
          </aside>
        </div>
      ) : null}

      {showList ? (
        <section className={adminPanelCard}>
          <h3 className={blockTitle}>{getLocaleText(locale, 'Fotos registadas', 'Registered photos')}</h3>
          <p className={blockText}>{getLocaleText(locale, 'Lista organizada por secção e ordem de apresentação.', 'List organized by section and display order.')}</p>

          {isLoading ? <p className="mt-4 text-sm text-slate-500">{getLocaleText(locale, 'A carregar fotos...', 'Loading photos...')}</p> : null}

          <div className={adminList}>
            {photos.map((photo) => (
              <article key={photo.id} className={adminListItem}>
                <div className={adminListTop}>
                  <div className={adminListHeader}>
                    <p className={adminListTitle}>{photo.title}</p>
                    <p className={adminListMeta}>
                      {getLocaleText(locale, 'Secção:', 'Section:')} {photo.section} · {getLocaleText(locale, 'Ordem:', 'Order:')} {photo.display_order} · {photo.is_active ? getLocaleText(locale, 'Ativa', 'Active') : getLocaleText(locale, 'Inativa', 'Inactive')}
                    </p>
                  </div>
                  <div className={adminListTools}>
                    <button type="button" className={adminBtnEdit} onClick={() => onEdit(photo)}>
                      {getLocaleText(locale, 'Editar', 'Edit')}
                    </button>
                    <button
                      type="button"
                      className={adminBtnDanger}
                      onClick={() => onDelete(photo.id)}
                      disabled={deletingPhotoId === photo.id}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingPhotoId === photo.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                      </span>
                    </button>
                  </div>
                </div>

                {photo.image ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={resolveInfoCulturaAssetUrl(photo.image)}
                      alt={photo.alt_text || photo.title}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : null}

                {photo.caption ? <p className={adminListDesc}>{photo.caption}</p> : null}
              </article>
            ))}

            {!isLoading && photos.length === 0 ? (
              <p className="text-sm text-slate-500">{getLocaleText(locale, 'Ainda não existem fotos registadas.', 'There are no registered photos yet.')}</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default PhotoGalleryPage;
