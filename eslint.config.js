import mufan, {configs} from '@mufan/eslint-plugin';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig([
  globalIgnores(['bld/']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {'@mufan': mufan},
    extends: [configs.javascript],
  },
  {
    files: ['eslint.config.js'],
    plugins: {'@mufan': mufan},
    extends: [configs.dev],
  },
  // src/library
  {
    files: ['src/library/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/library/**/*.test.{ts,tsx}'],
    extends: [configs.dev],
  },
]);
