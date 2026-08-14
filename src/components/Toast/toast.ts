import { pushToast } from './toastStore';

// Remplacement drop-in de window.alert() : import { toast } from '.../components/Toast/toast'
export const toast = {
  success: (message: string, title?: string) => pushToast('success', message, title, 4000),
  error: (message: string, title?: string) => pushToast('error', message, title, 6000),
  warning: (message: string, title?: string) => pushToast('warning', message, title, 5000),
  info: (message: string, title?: string) => pushToast('info', message, title, 4000),
};
