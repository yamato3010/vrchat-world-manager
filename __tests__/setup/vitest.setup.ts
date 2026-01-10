import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// React Testing Libraryのクリーンアップを各テスト後に実行
afterEach(() => {
    cleanup()
})

// Electronのグローバルモック
global.window.electronAPI = {
    // 必要に応じてモック関数を追加
    getWorlds: vi.fn(),
    addWorld: vi.fn(),
    updateWorld: vi.fn(),
    deleteWorld: vi.fn(),
    getGroups: vi.fn(),
    addGroup: vi.fn(),
    deleteGroup: vi.fn(),
    addWorldToGroup: vi.fn(),
    removeWorldFromGroup: vi.fn(),
    getPhotos: vi.fn(),
    importPhoto: vi.fn(),
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    openExternal: vi.fn(),
    selectDirectory: vi.fn(),
    scanForNewPhotos: vi.fn(),
} as any
