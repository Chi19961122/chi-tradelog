/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 後端 API 基底 URL；未設定時前端使用本地 seeded 假資料。 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
