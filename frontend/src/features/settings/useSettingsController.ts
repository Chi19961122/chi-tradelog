import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import {
  apiAddSymbol,
  apiAddTag,
  apiCreateAccount,
  apiCreatePlatform,
  apiDeleteAccount,
  apiDeletePlatform,
  apiGetSettings,
  apiRemoveSymbol,
  apiRemoveTag,
  apiRenameAccount,
  apiRenamePlatform,
  apiUpdateCapital,
} from './settingsApi';

/** mock 模式用的簡易唯一 id。 */
function genId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function logError(error: unknown) {
  // 設定同步失敗不阻斷 UI；記錄以利除錯。
  console.error(error);
}

/**
 * 提供 Settings 頁使用的設定維護動作，並在 API 模式下於掛載時由後端載入。
 * - API 模式：呼叫後端，並以後端結果更新 store（新增類使用後端產生的 id）。
 * - mock 模式：直接更新本地 store（id 由前端產生）。
 */
export function useSettingsController() {
  useEffect(() => {
    if (!API_BASE_URL) return;
    apiGetSettings()
      .then((data) => useUiStore.getState().setSettings(data))
      .catch(logError);
  }, []);

  const store = useUiStore.getState;

  return {
    setCapital(value: number) {
      store().setInitialCapital(value);
      if (API_BASE_URL) apiUpdateCapital(value).catch(logError);
    },

    async addPlatform(name: string) {
      const clean = name.trim();
      if (!clean) return;
      if (API_BASE_URL) {
        try {
          const platform = await apiCreatePlatform(clean);
          store().addPlatform(platform);
        } catch (error) {
          logError(error);
        }
      } else {
        store().addPlatform({ id: genId('p'), name: clean, accounts: [] });
      }
    },

    removePlatform(id: string) {
      store().removePlatform(id);
      if (API_BASE_URL) apiDeletePlatform(id).catch(logError);
    },

    renamePlatform(id: string, name: string) {
      const clean = name.trim();
      if (!clean) return;
      store().renamePlatform(id, clean);
      if (API_BASE_URL) apiRenamePlatform(id, clean).catch(logError);
    },

    async addAccount(platformId: string, name: string) {
      const clean = name.trim();
      if (!clean) return;
      if (API_BASE_URL) {
        try {
          const account = await apiCreateAccount(platformId, clean);
          store().addAccount(platformId, account);
        } catch (error) {
          logError(error);
        }
      } else {
        store().addAccount(platformId, { id: genId('a'), name: clean });
      }
    },

    removeAccount(id: string) {
      store().removeAccount(id);
      if (API_BASE_URL) apiDeleteAccount(id).catch(logError);
    },

    renameAccount(id: string, name: string) {
      const clean = name.trim();
      if (!clean) return;
      store().renameAccount(id, clean);
      if (API_BASE_URL) apiRenameAccount(id, clean).catch(logError);
    },

    addSymbol(symbol: string) {
      const clean = symbol.trim().toUpperCase();
      if (!clean) return;
      store().addSymbol(clean);
      if (API_BASE_URL) apiAddSymbol(clean).catch(logError);
    },

    removeSymbol(symbol: string) {
      store().removeSymbol(symbol);
      if (API_BASE_URL) apiRemoveSymbol(symbol).catch(logError);
    },

    addTag(tag: string) {
      const clean = tag.trim();
      if (!clean) return;
      store().addTag(clean);
      if (API_BASE_URL) apiAddTag(clean).catch(logError);
    },

    removeTag(tag: string) {
      store().removeTag(tag);
      if (API_BASE_URL) apiRemoveTag(tag).catch(logError);
    },
  };
}
