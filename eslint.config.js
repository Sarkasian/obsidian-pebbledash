import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'main.js',
      'node_modules/**',
      '*.d.ts',
      'esbuild.config.mjs',
      'version-bump.mjs',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Allow explicit any for Obsidian API compatibility
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Allow empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Obsidian plugins often use require() for dynamic imports
      '@typescript-eslint/no-require-imports': 'off',
      // Allow non-null assertions in Obsidian context
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      // Allow any in test files
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

