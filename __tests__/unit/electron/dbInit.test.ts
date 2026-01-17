import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'

// モック定義用の変数
const { mockConfig, mockGetPath } = vi.hoisted(() => {
    return {
        mockConfig: { isPackaged: false, resourcesPath: '/resources' },
        mockGetPath: vi.fn(),
    }
})

// モック依存関係
vi.mock('electron', () => ({
    app: {
        get isPackaged() { return mockConfig.isPackaged },
        getPath: (...args: any[]) => mockGetPath(...args),
        get resourcesPath() { return mockConfig.resourcesPath }
    },
    ipcMain: { handle: vi.fn() },
    shell: { openExternal: vi.fn() },
    dialog: { showOpenDialog: vi.fn() },
    BrowserWindow: { fromWebContents: vi.fn() },
}))

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    promises: { readFile: vi.fn() },
    default: {
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
    }
}))

vi.mock('@prisma/client', () => ({
    PrismaClient: class { constructor() { } }
}))

vi.mock('../../../electron/utils/pngMetadata', () => ({ parsePNGMetadata: vi.fn() }))
vi.mock('../../../electron/configManager', () => ({ loadConfig: vi.fn(), saveConfig: vi.fn() }))
vi.mock('../../../electron/photoScanner', () => ({ scanForNewPhotos: vi.fn() }))

import { initializeDatabasePath } from '../../../electron/ipcHandlers'

describe('Database Initialization', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // デフォルト値にリセット
        mockConfig.isPackaged = false
        mockConfig.resourcesPath = '/resources'
        mockGetPath.mockReturnValue('/userData')
        vi.mocked(fs.existsSync).mockReturnValue(false)

        // Mock process.resourcesPath
        Object.defineProperty(process, 'resourcesPath', {
            value: '/resources',
            configurable: true
        })
    })

    it('DB-001: 開発環境では dev.db を使用し、コピー処理は行わない', () => {
        mockConfig.isPackaged = false

        const result = initializeDatabasePath()

        expect(result).toMatch(/dev\.db$/)
        expect(fs.copyFileSync).not.toHaveBeenCalled()
    })

    it('DB-002: 本番環境・DBファイルありなら database.db を使用し、コピーしない', () => {
        mockConfig.isPackaged = true
        mockGetPath.mockReturnValue('/userData')
        vi.mocked(fs.existsSync).mockReturnValue(true)

        const result = initializeDatabasePath()

        expect(result).toBe(path.join('/userData', 'database.db'))
        expect(fs.copyFileSync).not.toHaveBeenCalled()
    })

    it('DB-003: 本番環境・DBファイルなしなら テンプレートからコピーする', () => {
        mockConfig.isPackaged = true
        mockGetPath.mockReturnValue('/userData')
        vi.mocked(fs.existsSync).mockImplementation((p) => {
            const pStr = p.toString()
            if (pStr.endsWith('database.db')) return false
            if (pStr.endsWith('userData')) return true
            return false
        })

        const result = initializeDatabasePath()

        expect(result).toBe(path.join('/userData', 'database.db'))
        expect(fs.copyFileSync).toHaveBeenCalledWith(
            path.join('/resources', 'prisma', 'template.db'),
            path.join('/userData', 'database.db')
        )
    })

    it('DB-004: 本番環境・ディレクトリなしなら作成してコピーする', () => {
        mockConfig.isPackaged = true
        mockGetPath.mockReturnValue('/userData')
        vi.mocked(fs.existsSync).mockReturnValue(false)

        initializeDatabasePath()

        expect(fs.mkdirSync).toHaveBeenCalledWith('/userData', { recursive: true })
        expect(fs.copyFileSync).toHaveBeenCalled()
    })

    it('DB-005: コピー失敗時はエラーログを出力しエラーを投げない', () => {
        mockConfig.isPackaged = true
        vi.mocked(fs.existsSync).mockReturnValue(false)
        vi.mocked(fs.copyFileSync).mockImplementation(() => { throw new Error('Copy Failed') })
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        expect(() => initializeDatabasePath()).not.toThrow()
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to copy'), expect.any(Error))
    })
})
