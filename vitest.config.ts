import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Include test files from src/__tests__
    include: ['src/**/*.{test,spec}.ts'],
    // Environment
    environment: 'node',
    // TypeScript support
    globals: true,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/__tests__/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        // Set reasonable thresholds for the codebase
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      // Mock obsidian module since it's not available in Node
      obsidian: path.resolve(__dirname, 'src/__tests__/__mocks__/obsidian.ts'),
    },
  },
});

