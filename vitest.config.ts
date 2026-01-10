import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        // テスト環境の設定
        environment: 'jsdom',

        // グローバルセットアップ
        setupFiles: ['__tests__/setup/vitest.setup.ts'],

        // カバレッジ設定
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'json-summary'],
            exclude: [
                'node_modules/',
                '__tests__/',
                'dist/',
                'dist-electron/',
                'out/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData.ts',
                '**/fixtures/**',
            ],
            // カバレッジ目標
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 60,
                statements: 60,
            },
        },

        // グローバルAPI（describe, it, expectなど）を自動インポート
        globals: true,

        // テストタイムアウト
        testTimeout: 10000,
    },
})
