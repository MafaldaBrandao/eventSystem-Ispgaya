import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Mail, SendHorizonal, Users, Pencil, Trash2, Plus, RotateCcw } from 'lucide-react';

import AdminPageHero from '../components/AdminPageHero.js';
import {
  adminActions,
  adminBtnDanger,
  adminBtnEdit,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminFieldSpaced,
  adminFormGridSpaced,
  adminInfo,
  adminInput,
  adminLabel,
  adminList,
  adminListDesc,
  adminListItem,
  adminListMeta,
  adminListTitle,
  adminListTools,
  adminListTop,
  adminPanelForm,
  adminTextarea,
  blockText,
  blockTitle,
} from '../../../styles/ui.js';
import {
  InfoCulturaApiError,
  InfoCulturaNewsletter,
  InfoCulturaNewsletterSubscriber,
  NewsletterPayload,
  NewsletterSubscriberPayload,
  createAdminNewsletter,
  createAdminNewsletterSubscriber,
  deleteAdminNewsletter,
  deleteAdminNewsletterSubscriber,
  fetchAdminNewsletterSubscribers,
  fetchAdminNewsletters,
  getStoredAccessToken,
  sendAdminNewsletter,
  uploadAdminImage,
  updateAdminNewsletter,
  updateAdminNewsletterSubscriber,
  resolveInfoCulturaAssetUrl,
} from '../../../api/infoculturaApi.js';
import { formatAdminDateTime } from '../utils.js';
import { getLocaleText, useLocale } from '../../../i18n/locale.js';

type NewsletterFormState = NewsletterPayload;
type SubscriberFormState = NewsletterSubscriberPayload;

const initialNewsletterForm: NewsletterFormState = {
  title: '',
  subject: '',
  content: '',
  image: '',
  status: 'draft',
};

const initialSubscriberForm: SubscriberFormState = {
  email: '',
  is_active: true,
};

function NewslettersPage() {
  const localeContext = useLocale();
  const locale = localeContext.locale || 'pt';
  const token = getStoredAccessToken();
  const [newsletters, setNewsletters] = useState<InfoCulturaNewsletter[]>([]);
  const [subscribers, setSubscribers] = useState<InfoCulturaNewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'newsletters' | 'subscribers'>('newsletters');
  const [newsletterForm, setNewsletterForm] = useState<NewsletterFormState>(initialNewsletterForm);
  const [subscriberForm, setSubscriberForm] =
    useState<SubscriberFormState>(initialSubscriberForm);
  const [editingNewsletterId, setEditingNewsletterId] = useState<number | null>(null);
  const [editingSubscriberId, setEditingSubscriberId] = useState<number | null>(null);
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [savingSubscriber, setSavingSubscriber] = useState(false);
  const [sendingNewsletterId, setSendingNewsletterId] = useState<number | null>(null);
  const [deletingNewsletterId, setDeletingNewsletterId] = useState<number | null>(null);
  const [deletingSubscriberId, setDeletingSubscriberId] = useState<number | null>(null);
  const [newsletterImageFileKey, setNewsletterImageFileKey] = useState(0);
  const [isUploadingNewsletterImage, setIsUploadingNewsletterImage] = useState(false);
  const [isDraggingNewsletterImage, setIsDraggingNewsletterImage] = useState(false);

  const activeSubscribers = useMemo(
    () => subscribers.filter((subscriber) => subscriber.is_active).length,
    [subscribers]
  );

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const [nextNewsletters, nextSubscribers] = await Promise.all([
        fetchAdminNewsletters(token, { page: 1, pageSize: 50 }),
        fetchAdminNewsletterSubscribers(token, { page: 1, pageSize: 100 }),
      ]);
      setNewsletters(nextNewsletters.items);
      setSubscribers(nextSubscribers.items);
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel carregar as newsletters.', 'Could not load newsletters.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const resetNewsletterForm = () => {
    setNewsletterForm(initialNewsletterForm);
    setEditingNewsletterId(null);
    setNewsletterImageFileKey((prev) => prev + 1);
    setIsDraggingNewsletterImage(false);
  };

  const resetSubscriberForm = () => {
    setSubscriberForm(initialSubscriberForm);
    setEditingSubscriberId(null);
  };

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSavingNewsletter(true);
    setError('');

    try {
      if (editingNewsletterId) {
        await updateAdminNewsletter(token, editingNewsletterId, newsletterForm);
      } else {
        await createAdminNewsletter(token, newsletterForm);
      }
      await loadData();
      resetNewsletterForm();
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel guardar a newsletter.', 'Could not save the newsletter.');
      setError(message);
    } finally {
      setSavingNewsletter(false);
    }
  };

  const handleSubscriberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSavingSubscriber(true);
    setError('');

    try {
      if (editingSubscriberId) {
        await updateAdminNewsletterSubscriber(token, editingSubscriberId, subscriberForm);
      } else {
        await createAdminNewsletterSubscriber(token, subscriberForm);
      }
      await loadData();
      resetSubscriberForm();
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel guardar o subscritor.', 'Could not save the subscriber.');
      setError(message);
    } finally {
      setSavingSubscriber(false);
    }
  };

  const handleEditNewsletter = (newsletter: InfoCulturaNewsletter) => {
    setEditingNewsletterId(newsletter.id);
    setNewsletterForm({
      title: newsletter.title,
      subject: newsletter.subject,
      content: newsletter.content,
      image: newsletter.image || '',
      status: newsletter.status,
    });
    setActiveTab('newsletters');
  };

  const handleUploadNewsletterImage = async (file: File | null) => {
    if (!token || !file) return;

    setIsUploadingNewsletterImage(true);
    setError('');

    try {
      const imagePath = await uploadAdminImage(token, file, 'news');
      setNewsletterForm((prev) => ({ ...prev, image: imagePath }));
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel carregar a imagem.', 'Could not upload the image.');
      setError(message);
    } finally {
      setIsUploadingNewsletterImage(false);
      setNewsletterImageFileKey((prev) => prev + 1);
      setIsDraggingNewsletterImage(false);
    }
  };

  const handleEditSubscriber = (subscriber: InfoCulturaNewsletterSubscriber) => {
    setEditingSubscriberId(subscriber.id);
    setSubscriberForm({
      email: subscriber.email,
      is_active: subscriber.is_active,
    });
    setActiveTab('subscribers');
  };

  const handleDeleteNewsletter = async (id: number) => {
    if (!token || !window.confirm('Apagar esta newsletter?')) return;
    setDeletingNewsletterId(id);
    setError('');

    try {
      await deleteAdminNewsletter(token, id);
      await loadData();
      if (editingNewsletterId === id) resetNewsletterForm();
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel apagar a newsletter.', 'Could not delete the newsletter.');
      setError(message);
    } finally {
      setDeletingNewsletterId(null);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!token || !window.confirm(getLocaleText(locale, 'Apagar este subscritor?', 'Delete this subscriber?'))) return;
    setDeletingSubscriberId(id);
    setError('');

    try {
      await deleteAdminNewsletterSubscriber(token, id);
      await loadData();
      if (editingSubscriberId === id) resetSubscriberForm();
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel apagar o subscritor.', 'Could not delete the subscriber.');
      setError(message);
    } finally {
      setDeletingSubscriberId(null);
    }
  };

  const handleSendNewsletter = async (id: number) => {
    if (!token) return;
    setSendingNewsletterId(id);
    setError('');

    try {
      await sendAdminNewsletter(token, id);
      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof InfoCulturaApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : getLocaleText(locale, 'Não foi possivel enviar a newsletter.', 'Could not send the newsletter.');
      setError(message);
    } finally {
      setSendingNewsletterId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Mail}
        title={getLocaleText(locale, 'Newsletters', 'Newsletters')}
        description={getLocaleText(locale, 'Criação, gestão e envio de campanhas por email para os subscritores ativos.', 'Creation, management and sending of email campaigns to active subscribers.')}
        tone="blue"
        stats={[
          { label: getLocaleText(locale, 'Newsletters', 'Newsletters'), value: newsletters.length },
          { label: getLocaleText(locale, 'Subscritores ativos', 'Active Subscribers'), value: activeSubscribers },
          {
            label: getLocaleText(locale, 'Enviadas', 'Sent'),
            value: newsletters.filter((newsletter) => newsletter.status === 'sent').length,
          },
        ]}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={activeTab === 'newsletters' ? adminBtnPrimary : adminBtnSecondary}
          onClick={() => setActiveTab('newsletters')}
        >
          Newsletters
        </button>
        <button
          type="button"
          className={activeTab === 'subscribers' ? adminBtnPrimary : adminBtnSecondary}
          onClick={() => setActiveTab('subscribers')}
        >
          {getLocaleText(locale, 'Subscritores', 'Subscribers')}
        </button>
      </div>

      {error ? <p className={adminError}>{error}</p> : null}

      {activeTab === 'newsletters' ? (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={handleNewsletterSubmit} className={adminPanelForm}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className={blockTitle}>{editingNewsletterId ? getLocaleText(locale, 'Editar newsletter', 'Edit Newsletter') : getLocaleText(locale, 'Nova newsletter', 'New Newsletter')}</h2>
                <p className={blockText}> {getLocaleText(locale, 'Define o titulo interno, assunto e conteudo da campanha.', 'Define the internal title, subject and content of the campaign.')}</p>
              </div>
              <button type="button" className={adminBtnSecondary} onClick={resetNewsletterForm}>
                <RotateCcw size={16} />
              </button>
            </div>

            <div className={adminFormGridSpaced}>
              <div className={adminField}>
                <label className={adminLabel} htmlFor="newsletter-title">
                  {getLocaleText(locale, 'Titulo', 'Title')}
                </label>
                <input
                  id="newsletter-title"
                  className={adminInput}
                  value={newsletterForm.title}
                  onChange={(event) =>
                    setNewsletterForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="newsletter-subject">
                  Assunto
                </label>
                <input
                  id="newsletter-subject"
                  className={adminInput}
                  value={newsletterForm.subject}
                  onChange={(event) =>
                    setNewsletterForm((prev) => ({ ...prev, subject: event.target.value }))
                  }
                />
              </div>

              <div className={adminField}>
                <label className={adminLabel} htmlFor="newsletter-status">
                  {getLocaleText(locale, 'Estado', 'Status')}
                </label>
                <select
                  id="newsletter-status"
                  className={adminInput}
                  value={newsletterForm.status}
                  onChange={(event) =>
                    setNewsletterForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <option value="draft">{getLocaleText(locale, 'Rascunho', 'Draft')}</option>
                  <option value="scheduled">{getLocaleText(locale, 'Agendada', 'Scheduled')}</option>
                  <option value="sent">{getLocaleText(locale, 'Enviada', 'Sent')}</option>
                  <option value="cancelled">{getLocaleText(locale, 'Cancelada', 'Cancelled')}</option>
                </select>
              </div>
            </div>

            <div className={adminFieldSpaced}>
              <p className={adminLabel}>{getLocaleText(locale, 'Imagem', 'Image')}</p>
              <input
                id="newsletter-image"
                key={newsletterImageFileKey}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  void handleUploadNewsletterImage(file);
                }}
              />
              <label
                htmlFor="newsletter-image"
                className={[
                  'group relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition',
                  isDraggingNewsletterImage
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                  isUploadingNewsletterImage ? 'pointer-events-none opacity-70' : '',
                ].join(' ')}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingNewsletterImage(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingNewsletterImage(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingNewsletterImage(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingNewsletterImage(false);
                  const file = event.dataTransfer.files?.[0] || null;
                  void handleUploadNewsletterImage(file);
                }}
              >
                {newsletterForm.image ? (
                  <>
                    <img
                      src={resolveInfoCulturaAssetUrl(newsletterForm.image)}
                      alt={getLocaleText(locale, 'Preview da newsletter', 'Newsletter preview')}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 px-3 text-center text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                      {isUploadingNewsletterImage
                        ? getLocaleText(locale, 'A carregar...', 'Uploading...')
                        : getLocaleText(locale, 'Clica para trocar', 'Click to replace')}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-600">
                    <Plus size={20} />
                    <span className="text-sm font-medium">
                      {isUploadingNewsletterImage
                        ? getLocaleText(locale, 'A carregar...', 'Uploading...')
                        : getLocaleText(locale, 'Carregar imagem', 'Upload image')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {getLocaleText(locale, 'Arrasta ou clica aqui', 'Drag or click here')}
                    </span>
                  </div>
                )}
              </label>
              <p className={blockText}>
                {isUploadingNewsletterImage
                  ? getLocaleText(locale, 'A carregar imagem...', 'Uploading image...')
                  : newsletterForm.image
                    ? getLocaleText(locale, 'Imagem carregada com sucesso.', 'Image uploaded successfully.')
                    : getLocaleText(locale, 'Usa este quadrado para fazer upload de uma imagem PNG ou JPG para a campanha.', 'Use this square to upload a PNG or JPG image for the campaign.')}
              </p>
            </div>

            <div className={adminFieldSpaced}>
              <label className={adminLabel} htmlFor="newsletter-content">
                {getLocaleText(locale, 'Conteudo', 'Content')}
              </label>
              <textarea
                id="newsletter-content"
                rows={12}
                className={adminTextarea}
                value={newsletterForm.content}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </div>

            <div className={adminActions}>
              <button type="submit" className={adminBtnPrimary} disabled={savingNewsletter}>
                <Plus size={16} />
                {savingNewsletter ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingNewsletterId ? getLocaleText(locale, 'Atualizar', 'Update') : getLocaleText(locale, 'Criar', 'Create')}
              </button>
            </div>
          </form>

          <div className={adminList}>
            <div className={adminListTop}>
              <div>
                <h3 className={adminListTitle}>{getLocaleText(locale, 'Campanhas registadas', 'Registered campaigns')}</h3>
                <p className={adminListMeta}>{getLocaleText(locale, 'Lista das newsletters preparadas para envio.', 'List of newsletters prepared for sending.')}</p>
              </div>
              {loading ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar...', 'Loading...')}</p> : null}
            </div>

            {newsletters.map((newsletter) => (
              <article key={newsletter.id} className={adminListItem}>
                <div className={adminListTop}>
                  <div>
                    <h4 className={adminListTitle}>{newsletter.title}</h4>
                    <p className={adminListMeta}>
                      {newsletter.subject} · {newsletter.status} · {newsletter.user_name || getLocaleText(locale, 'Sistema', 'System')}
                    </p>
                  </div>
                  <span className={adminListMeta}>
                    {newsletter.sent_at
                      ? `${getLocaleText(locale, 'Enviada', 'Sent')} ${formatAdminDateTime(newsletter.sent_at)}`
                      : formatAdminDateTime(newsletter.created_at)}
                  </span>
                </div>

                <p className={adminListDesc}>{newsletter.content}</p>

                <div className={adminListTools}>
                  <button
                    type="button"
                    className={adminBtnEdit}
                    onClick={() => handleEditNewsletter(newsletter)}
                  >
                    <Pencil size={16} />
                    {getLocaleText(locale, 'Editar', 'Edit')}
                  </button>
                  <button
                    type="button"
                    className={adminBtnPrimary}
                    onClick={() => handleSendNewsletter(newsletter.id)}
                    disabled={sendingNewsletterId === newsletter.id}
                  >
                    <SendHorizonal size={16} />
                    {sendingNewsletterId === newsletter.id ? getLocaleText(locale, 'A enviar...', 'Sending...') : getLocaleText(locale, 'Enviar', 'Send')}
                  </button>
                  <button
                    type="button"
                    className={adminBtnDanger}
                    onClick={() => handleDeleteNewsletter(newsletter.id)}
                    disabled={deletingNewsletterId === newsletter.id}
                  >
                    <Trash2 size={16} />
                    {deletingNewsletterId === newsletter.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                  </button>
                </div>
              </article>
            ))}

            {!loading && newsletters.length === 0 ? (
              <p className={adminInfo}>{getLocaleText(locale, 'Não existem newsletters registadas.', 'There are no registered newsletters.')}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={handleSubscriberSubmit} className={adminPanelForm}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className={blockTitle}>
                  {editingSubscriberId ? getLocaleText(locale, 'Editar subscritor', 'Edit subscriber') : getLocaleText(locale, 'Novo subscritor', 'New subscriber')}
                </h2>
                <p className={blockText}>
                  {getLocaleText(locale, 'Adiciona ou ativa emails para receberem as campanhas.', 'Add or activate emails to receive campaigns.')}
                </p>
              </div>
              <button type="button" className={adminBtnSecondary} onClick={resetSubscriberForm}>
                <RotateCcw size={16} />
              </button>
            </div>

            <div className={adminField}>
              <label className={adminLabel} htmlFor="subscriber-email">
                Email
              </label>
              <input
                id="subscriber-email"
                type="email"
                className={adminInput}
                value={subscriberForm.email}
                onChange={(event) =>
                  setSubscriberForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>

            <div className={adminField}>
              <label className={adminLabel} htmlFor="subscriber-active">
                {getLocaleText(locale, 'Ativo', 'Active')}
              </label>
              <select
                id="subscriber-active"
                className={adminInput}
                value={subscriberForm.is_active ? '1' : '0'}
                onChange={(event) =>
                  setSubscriberForm((prev) => ({
                    ...prev,
                    is_active: event.target.value === '1',
                  }))
                }
              >
                <option value="1">{getLocaleText(locale, 'Sim', 'Yes')}</option>
                <option value="0">{getLocaleText(locale, 'Não', 'No')}</option>
              </select>
            </div>

            <div className={adminActions}>
              <button type="submit" className={adminBtnPrimary} disabled={savingSubscriber}>
                <Plus size={16} />
                {savingSubscriber ? getLocaleText(locale, 'A guardar...', 'Saving...') : editingSubscriberId ? getLocaleText(locale, 'Atualizar', 'Update') : getLocaleText(locale, 'Criar', 'Create')}
              </button>
            </div>
          </form>

          <div className={adminList}>
            <div className={adminListTop}>
              <div>
                <h3 className={adminListTitle}>{getLocaleText(locale, 'Subscritores', 'Subscribers')}</h3>
                <p className={adminListMeta}>{getLocaleText(locale, 'Emails que recebem newsletters ativas.', 'Emails that receive active newsletters.')}</p>
              </div>
              {loading ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar...', 'Loading...')}</p> : null}
            </div>

            {subscribers.map((subscriber) => (
              <article key={subscriber.id} className={adminListItem}>
                <div className={adminListTop}>
                  <div>
                    <h4 className={adminListTitle}>{subscriber.email}</h4>
                    <p className={adminListMeta}>
                      {subscriber.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')} ·{' '}
                      {formatAdminDateTime(subscriber.subscribed_at)}
                    </p>
                  </div>
                  <Users size={18} />
                </div>

                <div className={adminListTools}>
                  <button
                    type="button"
                    className={adminBtnEdit}
                    onClick={() => handleEditSubscriber(subscriber)}
                  >
                    <Pencil size={16} />
                    {getLocaleText(locale, 'Editar', 'Edit')}
                  </button>
                  <button
                    type="button"
                    className={adminBtnDanger}
                    onClick={() => handleDeleteSubscriber(subscriber.id)}
                    disabled={deletingSubscriberId === subscriber.id}
                  >
                    <Trash2 size={16} />
                    {deletingSubscriberId === subscriber.id ? getLocaleText(locale, 'A apagar...', 'Deleting...') : getLocaleText(locale, 'Apagar', 'Delete')}
                  </button>
                </div>
              </article>
            ))}

            {!loading && subscribers.length === 0 ? (
              <p className={adminInfo}>{getLocaleText(locale, 'Não existem subscritores registados.', 'There are no registered subscribers.')}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewslettersPage;
