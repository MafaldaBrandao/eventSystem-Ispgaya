import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  TOAST_EVENT_NAME,
  type ToastEventDetail,
  type ToastTone
} from '../../utils/toast';

type ToastItem = Required<Pick<ToastEventDetail, 'id'>> & {
  title?: string;
  message: string;
  tone: ToastTone;
};

const toneConfig: Record<
  ToastTone,
  { border: string; bg: string; text: string; icon: JSX.Element }
> = {
  success: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    text: 'text-green-800',
    icon: <CheckCircle2 className="h-5 w-5" />
  },
  error: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: <XCircle className="h-5 w-5" />
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: <AlertTriangle className="h-5 w-5" />
  },
  info: {
    border: 'border-slate-200',
    bg: 'bg-white',
    text: 'text-slate-800',
    icon: <Info className="h-5 w-5" />
  }
};

function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function removeToast(id: string) {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      const timer = timersRef.current.get(id);
      if (timer) {
        window.clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }

    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      const id = detail.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const tone = detail.tone || 'info';
      const durationMs = detail.durationMs ?? 4200;

      setToasts((current) => [...current, { id, message: detail.message, title: detail.title, tone }]);

      const timer = window.setTimeout(() => {
        removeToast(id);
      }, durationMs);

      timersRef.current.set(id, timer);
    }

    window.addEventListener(TOAST_EVENT_NAME, handleToast as EventListener);

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToast as EventListener);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6 sm:w-full">
      {toasts.map((toast) => {
        const config = toneConfig[toast.tone];

        return (
          <article
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${config.border} ${config.bg}`}
            role="status"
            aria-live="polite"
          >
            <div className={`mt-0.5 shrink-0 ${config.text}`}>{config.icon}</div>
            <div className="min-w-0 flex-1">
              {toast.title ? (
                <h3 className={`text-sm font-semibold ${config.text}`}>{toast.title}</h3>
              ) : null}
              <p className={`mt-1 text-sm leading-6 ${config.text}`}>{toast.message}</p>
            </div>
            <button
              type="button"
              className={`shrink-0 rounded-full p-1 transition-colors hover:bg-black/5 ${config.text}`}
              onClick={() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
                const timer = timersRef.current.get(toast.id);
                if (timer) {
                  window.clearTimeout(timer);
                  timersRef.current.delete(toast.id);
                }
              }}
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default ToastViewport;
