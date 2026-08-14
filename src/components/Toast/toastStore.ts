export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function pushToast(type: ToastType, message: string, title?: string, duration = 5000) {
  const id = nextId++;
  toasts = [...toasts, { id, type, title, message, duration }];
  emit();
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}
