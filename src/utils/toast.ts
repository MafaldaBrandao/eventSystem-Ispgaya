export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastPayload = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

export type ToastEventDetail = ToastPayload & {
  id?: string;
};

export const TOAST_EVENT_NAME = 'ispgaya:toast';

export function pushToast(payload: ToastPayload): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT_NAME, {
      detail: {
        ...payload,
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      }
    })
  );
}

