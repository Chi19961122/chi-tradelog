// ESLint flat config：TypeScript + React hooks。
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 元件皆為 named export；允許同檔輸出常數（如 store）。
      'react-refresh/only-export-components': 'off',
      // 本專案的 modal 於開啟時以 effect 初始化表單狀態（既有慣例），暫不採用此新規則。
      'react-hooks/set-state-in-effect': 'off',
      // 允許刻意留空的 catch（例如 JSON 解析失敗走預設）。
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
