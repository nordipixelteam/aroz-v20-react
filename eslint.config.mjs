import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['app/avault/**/*.{ts,tsx}', 'app/api/admin/**/*.ts', 'lib/avault/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores(['.next/**', 'dist/**', 'node_modules/**', '.avault-kit/**', 'src/**', 'public/assets/**']),
]);