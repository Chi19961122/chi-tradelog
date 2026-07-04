/**
 * 後端 API 基底 URL。設定了才會呼叫後端，否則前端以 mock / 本地 store 運作。
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
