import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    env: Object.fromEntries(
      (await import('fs')).readFileSync(resolve(__dirname, '../../.env'), 'utf-8')
        .split('\n')
        .filter((line: string) => line && !line.startsWith('#'))
        .map((line: string) => line.split('=').map((s: string) => s.trim()))
        .filter((parts: string[]) => parts.length === 2),
    ),
  },
});
