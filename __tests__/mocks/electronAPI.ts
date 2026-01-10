import { vi } from 'vitest'

/**
 * ElectronAPIのモック
 * テストでelectronAPIの動作をシミュレートする
 */
export const mockElectronAPI = {
    // World関連
    getWorlds: vi.fn(),
    addWorld: vi.fn(),
    updateWorld: vi.fn(),
    deleteWorld: vi.fn(),

    // Group関連
    getGroups: vi.fn(),
    addGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),

    // WorldOnGroup関連
    addWorldToGroup: vi.fn(),
    removeWorldFromGroup: vi.fn(),

    // Photo関連
    getPhotos: vi.fn(),
    importPhoto: vi.fn(),

    // Config関連
    getConfig: vi.fn(),
    updateConfig: vi.fn(),

    // ユーティリティ
    openExternal: vi.fn(),
    selectDirectory: vi.fn(),
    scanForNewPhotos: vi.fn(),
}

/**
 * ElectronAPIモックをリセット
 */
export function resetElectronAPIMock() {
    Object.values(mockElectronAPI).forEach((mock) => {
        if (typeof mock === 'function' && 'mockClear' in mock) {
            mock.mockClear()
        }
    })
}

/**
 * window.electronAPIにモックを設定
 */
export function setupElectronAPIMock() {
    ; (global as any).window = {
        ...((global as any).window || {}),
        electronAPI: mockElectronAPI,
    }
}
