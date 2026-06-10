import { FormEvent, useEffect, useState } from 'react';
import { getLocaleText, useLocale } from '../../i18n/locale.js';
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminInput,
  adminLabel,
  adminTextarea
} from '../../styles/ui';

export type ClubRegistrationFormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type ClubRegistrationModalProps = {
  clubName: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  submitError?: string;
  entityLabel?: string;
  kickerLabel?: string;
  helperText?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (data: ClubRegistrationFormData) => Promise<void> | void;
};

const initialFormState: ClubRegistrationFormData = {
  name: '',
  email: '',
  phone: '',
  message: ''
};

function ClubRegistrationModal({
  clubName,
  isOpen,
  isSubmitting = false,
  submitError = '',
  entityLabel = '',
  kickerLabel = '',
  helperText = '',
  submitLabel = '',
  onClose,
  onSubmit
}: ClubRegistrationModalProps) {
  const { locale } = useLocale();
  const resolvedEntityLabel = entityLabel || getLocaleText(locale, 'clube', 'club');
  const resolvedKickerLabel = kickerLabel || getLocaleText(locale, 'Inscrição', 'Registration');
  const resolvedHelperText =
    helperText ||
    getLocaleText(
      locale,
      'Preenche os teus dados para enviar um pedido de inscrição ao clube.',
      'Fill in your details to send a registration request to the club.'
    );
  const resolvedSubmitLabel =
    submitLabel || getLocaleText(locale, 'Enviar inscrição', 'Send registration');
  const [form, setForm] = useState<ClubRegistrationFormData>(initialFormState);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm(initialFormState);
      setLocalError('');
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim()
    };

    if (!payload.name) {
      setLocalError(getLocaleText(locale, 'O nome é obrigatório.', 'Name is required.'));
      return;
    }

    if (!payload.email) {
      setLocalError(getLocaleText(locale, 'O email é obrigatório.', 'Email is required.'));
      return;
    }

    setLocalError('');
    await onSubmit(payload);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-registration-title"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#dd8609]">
              {resolvedKickerLabel}
            </p>
            <h2 id="club-registration-title" className="mt-2 text-2xl font-semibold text-slate-900">
              {getLocaleText(locale, 'Inscrever em', 'Register for')} {clubName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {resolvedHelperText.replace(/clube/gi, resolvedEntityLabel)}
            </p>
          </div>

          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {getLocaleText(locale, 'Fechar', 'Close')}
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className={adminLabel} htmlFor="club-registration-name">
                {getLocaleText(locale, 'Nome', 'Name')}
              </label>
              <input
                id="club-registration-name"
                className={adminInput}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className={adminLabel} htmlFor="club-registration-email">
                {getLocaleText(locale, 'Email', 'Email')}
              </label>
              <input
                id="club-registration-email"
                type="email"
                className={adminInput}
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
              <label className={adminLabel} htmlFor="club-registration-phone">
              {getLocaleText(locale, 'Telefone', 'Phone')}
              </label>
            <input
              id="club-registration-phone"
              className={adminInput}
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>

          <div className="space-y-1">
              <label className={adminLabel} htmlFor="club-registration-message">
              {getLocaleText(locale, 'Mensagem', 'Message')}
              </label>
            <textarea
              id="club-registration-message"
              rows={4}
              className={adminTextarea}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            />
          </div>

          {localError ? <p className={adminError}>{localError}</p> : null}
          {submitError ? <p className={adminError}>{submitError}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={adminBtnPrimary} disabled={isSubmitting}>
              {isSubmitting ? getLocaleText(locale, 'A enviar...', 'Sending...') : resolvedSubmitLabel}
            </button>
            <button
              type="button"
              className={adminBtnSecondary}
              onClick={onClose}
              disabled={isSubmitting}
            >
              {getLocaleText(locale, 'Cancelar', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClubRegistrationModal;
