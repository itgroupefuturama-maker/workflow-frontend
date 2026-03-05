// src/service/apiHelper.ts

export const unwrapApiResponse = <T>(
  data: { success: boolean; message?: string; data?: T },
  fallbackMessage: string
): T => {
  if (!data.success) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data as T;
};