import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { registerIpcHandlers } from '../../../electron/ipcHandlers'
import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as fs from 'fs'
import { parsePNGMetadata } from '../../../electron/utils/pngMetadata'
import { loadConfig, saveConfig } from '../../../electron/configManager'
import { scanForNewPhotos } from '../../../electron/photoScanner'

// Mock dependencies
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        getPath: vi.fn().mockReturnValue('/mock/userData'),
        get isPackaged() { return false },
    },
    shell: {
        openExternal: vi.fn(),
    },
    dialog: {
        showOpenDialog: vi.fn(),
    },
    BrowserWindow: {
        fromWebContents: vi.fn(),
    },
}))

vi.mock('@prisma/client', () => {
    const mPrismaClient = {
        world: {
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        group: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        worldOnGroup: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        photo: {
            create: vi.fn(),
            findMany: vi.fn(),
            delete: vi.fn(),
            findUnique: vi.fn(),
        },
    }
    return {
        PrismaClient: class {
            constructor() {
                return mPrismaClient
            }
        }
    }
})

vi.mock('axios')

// Mock fs module (ESM workaround)
vi.mock('fs', () => ({
    promises: {
        readFile: vi.fn(),
    },
    unlinkSync: vi.fn(),
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
}))

vi.mock('../../../electron/utils/pngMetadata', () => ({
    parsePNGMetadata: vi.fn(),
}))

vi.mock('../../../electron/configManager', () => ({
    loadConfig: vi.fn(),
    saveConfig: vi.fn(),
}))

vi.mock('../../../electron/photoScanner', () => ({
    scanForNewPhotos: vi.fn(),
}))

describe('ipcHandlers', () => {
    let prisma: any
    let handlers: { [key: string]: Function } = {}

    beforeEach(() => {
        vi.clearAllMocks()

            // IPCHandlersをキャプチャ
            ; (ipcMain.handle as Mock).mockImplementation((channel, listener) => {
                handlers[channel] = listener
            })

        // IPCHandlersを登録
        registerIpcHandlers()

        // Prismaインスタンスを取得
        prisma = new PrismaClient()

            // Default Config Mock
            ; (loadConfig as Mock).mockResolvedValue({ photoDirectoryPath: '/tmp/photos' })
            ; (saveConfig as Mock).mockResolvedValue(true)
    })

    const invoke = async (channel: string, ...args: any[]) => {
        if (!handlers[channel]) {
            throw new Error(`Handler for ${channel} not registered`)
        }
        return handlers[channel]({}, ...args)
    }

    describe('ワールド管理 (World CRUD)', () => {
        it('get-worlds: グループIDでフィルタリングできる (WORLD-002)', async () => {
            prisma.world.findMany.mockResolvedValue([])
            await invoke('get-worlds', 123)
            expect(prisma.world.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { groups: { some: { groupId: 123 } } }
            }))

            await invoke('get-worlds') // WORLD-001
            expect(prisma.world.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: { groups: true }
            }))
        })

        it('create-world: ワールドを作成できる (WORLD-011)', async () => {
            prisma.world.create.mockResolvedValue({ id: 1 })
            await invoke('create-world', { vrchatWorldId: 'w1', name: 'N' })
            expect(prisma.world.create).toHaveBeenCalled()
        })

        it('delete-world: ワールドを削除できる (WORLD-031)', async () => {
            prisma.world.delete.mockResolvedValue({ id: 1 })
            await invoke('delete-world', 1)
            expect(prisma.world.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        })

        it('get-world-by-id: ワールドを取得できる', async () => {
            prisma.world.findUnique.mockResolvedValue({ id: 1 })
            await invoke('get-world-by-id', 1)
            expect(prisma.world.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }))
        })

        it('update-world: ワールドを更新できる (WORLD-021)', async () => {
            prisma.world.update.mockResolvedValue({ id: 1 })
            await invoke('update-world', { id: 1, data: { name: 'U' } })
            expect(prisma.world.update).toHaveBeenCalled()
        })
    })

    describe('グループ管理 (Group CRUD)', () => {
        it('get-groups: グループ一覧を取得できる', async () => {
            prisma.group.findMany.mockResolvedValue([])
            await invoke('get-groups')
            expect(prisma.group.findMany).toHaveBeenCalled()
        })

        it('get-group-by-id: グループを取得できる', async () => {
            prisma.group.findUnique.mockResolvedValue({ id: 1 })
            await invoke('get-group-by-id', 1)
            expect(prisma.group.findUnique).toHaveBeenCalled()
        })

        it('create-group: グループを作成できる (GROUP-001)', async () => {
            await invoke('create-group', { name: 'G1' })
            expect(prisma.group.create).toHaveBeenCalled()
        })

        it('update-group: グループを更新できる', async () => {
            await invoke('update-group', { id: 1, data: { name: 'G2' } })
            expect(prisma.group.update).toHaveBeenCalled()
        })

        it('delete-group: グループのみ削除できる (GROUP-011)', async () => {
            await invoke('delete-group', { id: 1, deleteWorlds: false })
            expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 1 } })
            expect(prisma.world.deleteMany).not.toHaveBeenCalled()
        })

        it('delete-group: グループと関連ワールドを削除できる (GROUP-012)', async () => {
            prisma.worldOnGroup.findMany.mockResolvedValue([{ worldId: 10 }])
            await invoke('delete-group', { id: 1, deleteWorlds: true })
            expect(prisma.group.delete).toHaveBeenCalled()
            expect(prisma.world.deleteMany).toHaveBeenCalled()
        })
    })

    describe('写真管理 (Photo Management)', () => {
        it('import-photo: 写真をインポートできる (PHOTO-001)', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_ex' })
            prisma.world.findUnique.mockResolvedValue({ id: 100, vrchatWorldId: 'wrld_ex' })
            prisma.photo.create.mockResolvedValue({ id: 1, worldId: 100 })

            const result = await invoke('import-photo', '/p.png')
            expect(result.success).toBe(true)
            expect(prisma.photo.create).toHaveBeenCalled()
        })

        it('get-photos-by-world: ワールドIDに紐づく写真を取得できる (PHOTO-011)', async () => { // Corrected channel name
            prisma.photo.findMany.mockResolvedValue([])
            await invoke('get-photos-by-world', 100)
            expect(prisma.photo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { worldId: 100 } }))
        })

        it('delete-photo: 写真を削除できる (PHOTO-021)', async () => {
            await invoke('delete-photo', 1)
            expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        })

        it('read-image-base64: 画像を読み込んでBase64で返せる (PHOTO-031)', async () => { // Corrected channel name
            const buffer = Buffer.from('test')
                ; (fs.promises.readFile as Mock).mockResolvedValue(buffer)

            const result = await invoke('read-image-base64', '/p.png')
            expect(result).toBe(buffer.toString('base64'))
        })
    })

    describe('関連付け (Associations)', () => {
        it('add-world-to-group: グループにワールドを追加できる (ASSOC-001)', async () => {
            await invoke('add-world-to-group', { worldId: 1, groupId: 2 })
            expect(prisma.worldOnGroup.create).toHaveBeenCalled()
        })
        it('remove-world-from-group: グループからワールドを削除できる (ASSOC-002)', async () => {
            await invoke('remove-world-from-group', { worldId: 1, groupId: 2 })
            expect(prisma.worldOnGroup.delete).toHaveBeenCalled()
        })
    })

    describe('提案機能 (Suggestions)', () => {
        it('get-world-suggestions: 提案リストを取得できる (SUGG-001)', async () => {
            (scanForNewPhotos as Mock).mockResolvedValue([])
            await invoke('get-world-suggestions')
            expect(scanForNewPhotos).toHaveBeenCalled()
        })

        it('accept-suggestion: 提案を採用してワールド登録できる (SUGG-011)', async () => {
            (axios.get as Mock).mockResolvedValue({ data: { tags: [] } })
            prisma.world.create.mockResolvedValue({ id: 1 })

            // Correct payload: worldId should be the VRChat ID string for API fetch
            await invoke('accept-suggestion', { worldId: 'wrld_s', groupId: 1 })

            expect(prisma.world.create).toHaveBeenCalled()
            expect(prisma.worldOnGroup.create).toHaveBeenCalled() // if groupId provided
        })

        it('dismiss-suggestion: 提案を却下して無視リストに追加できる (SUGG-021)', async () => {
            (loadConfig as Mock).mockResolvedValue({ dismissedWorldIds: [] })
            await invoke('dismiss-suggestion', 'wrld_d')
            expect(saveConfig).toHaveBeenCalled()
        })
    })

    describe('エラー処理・エッジケース (Error Handling & Edge Cases)', () => {
        it('fetch-vrchat-world: APIエラーを処理できる (API-001)', async () => {
            (axios.get as Mock).mockRejectedValue(new Error('API Error'))
            await expect(invoke('fetch-vrchat-world', 'w1')).rejects.toThrow('API Error')
        })

        it('import-photo: worldIdが指定された場合それを使用する (PHOTO-003)', async () => {
            const result = await invoke('import-photo', '/p.png', 999)
            expect(result.success).toBe(true)
            expect(prisma.world.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 999 } }))
        })

        it('import-photo: DBにないワールドの場合新規作成する (PHOTO-002)', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_new' })
            prisma.world.findUnique.mockResolvedValueOnce(null) // Not in DB

                // Mock API response
                ; (axios.get as Mock).mockResolvedValue({
                    data: { id: 'wrld_new', name: 'New', tags: ['author_tag_test'] }
                })

            // Mock creation
            prisma.world.create.mockResolvedValue({ id: 200, vrchatWorldId: 'wrld_new' })
            prisma.photo.create.mockResolvedValue({ id: 2, worldId: 200 })

            const result = await invoke('import-photo', '/new.png')
            expect(result.success).toBe(true)
            expect(axios.get).toHaveBeenCalled()
            expect(prisma.world.create).toHaveBeenCalled()
        })

        it('import-photo: メタデータにworldIdがない場合エラーになる (PHOTO-004)', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: null })
            const result = await invoke('import-photo', '/no_id.png')
            expect(result.success).toBe(false)
            expect(result.error).toContain('World ID not found')
        })

        it('import-photo: 新規ワールド作成時のAPIエラーを処理できる (PHOTO-005)', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_err' })
            prisma.world.findUnique.mockResolvedValue(null)
                ; (axios.get as Mock).mockRejectedValue(new Error('API Fail'))

            const result = await invoke('import-photo', '/err.png')
            expect(result.success).toBe(false)
            expect(result.error).toContain('failed to fetch details')
        })

        it('delete-group: 削除対象のワールドがない場合も正常に動作する (GROUP-013)', async () => {
            prisma.worldOnGroup.findMany.mockResolvedValue([])
            await invoke('delete-group', { id: 1, deleteWorlds: true })
            expect(prisma.group.delete).toHaveBeenCalled()
            expect(prisma.world.deleteMany).not.toHaveBeenCalled()
        })

        it('select-directory: キャンセルされた場合はnullを返す (SYS-001)', async () => {
            ; (BrowserWindow.fromWebContents as Mock).mockReturnValue({})
                ; (dialog.showOpenDialog as Mock).mockResolvedValue({ canceled: true, filePaths: [] })
            const res = await invoke('select-directory')
            expect(res).toBeNull()
        })

        it('fetch-vrchat-world: タグがない場合も正常に処理する (API-002)', async () => {
            ; (axios.get as Mock).mockResolvedValue({
                data: { id: 'w2', name: 'No Tags', tags: null }
            })
            const result = await invoke('fetch-vrchat-world', 'w2')
            expect(result.tags).toBeNull()
        })

        it('select-directory: ブラウザウィンドウがない場合nullを返す (SYS-002)', async () => {
            (BrowserWindow.fromWebContents as Mock).mockReturnValue(null)
            const res = await invoke('select-directory')
            expect(res).toBeNull()
        })

        it('get-world-suggestions: configパスがない場合空配列を返す (SUGG-002)', async () => {
            (loadConfig as Mock).mockResolvedValue({}) // No photoDirectoryPath
            const res = await invoke('get-world-suggestions')
            expect(res).toEqual([])
        })

        it('dismiss-suggestion: 既に無視リストにある場合は追加しない (SUGG-022)', async () => {
            (loadConfig as Mock).mockResolvedValue({ dismissedWorldIds: ['w1'] })
            await invoke('dismiss-suggestion', 'w1')
            // すでに存在するため保存しない
            expect(saveConfig).not.toHaveBeenCalled()
        })

        it('dismiss-suggestion: Configエラーを処理できる (SUGG-023)', async () => {
            (loadConfig as Mock).mockRejectedValue(new Error('Config Error'))
            await expect(invoke('dismiss-suggestion', 'w1')).rejects.toThrow('Config Error')
        })

        it('accept-suggestion: APIエラーを処理できる (SUGG-012)', async () => {
            (axios.get as Mock).mockRejectedValue(new Error('API Error'))
            await expect(invoke('accept-suggestion', { worldId: 'w1' })).rejects.toThrow('API Error')
        })

        it('read-image-base64: 読み込みエラーを処理できる (PHOTO-032)', async () => {
            (fs.promises.readFile as Mock).mockRejectedValue(new Error('Read Error'))
            await expect(invoke('read-image-base64', '/bad.png')).rejects.toThrow('Read Error')
        })
        it('fetch-vrchat-world: 不正なタグ形式の場合空配列を返す (API-003)', async () => {
            ; (axios.get as Mock).mockResolvedValue({
                data: { id: 'w3', tags: 'invalid' }
            })
            const result = await invoke('fetch-vrchat-world', 'w3')
            expect(result.tags).toEqual([])
        })

        it('import-photo: ワールド詳細が不足している場合はデフォルト値を使用する (PHOTO-006)', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_unk' })
            prisma.world.findUnique.mockResolvedValue(null)
                ; (axios.get as Mock).mockResolvedValue({
                    data: { id: 'wrld_unk', tags: [] } // No name, no thumbnail
                })
            prisma.world.create.mockResolvedValue({ id: 201 })
            prisma.photo.create.mockResolvedValue({ id: 3 })

            await invoke('import-photo', '/unk.png')

            expect(prisma.world.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ name: 'Unknown World' })
            }))
        })

        it('get-world-suggestions: 設定値を使用してスキャンを行う (SUGG-003)', async () => {
            (loadConfig as Mock).mockResolvedValue({
                photoDirectoryPath: '/path',
                scanPeriodDays: 30,
                dismissedWorldIds: ['d1']
            })
                ; (scanForNewPhotos as Mock).mockResolvedValue([])

            await invoke('get-world-suggestions')
            expect(scanForNewPhotos).toHaveBeenCalledWith('/path', 30, ['d1'])
        })
    })

    describe('設定・その他 (Config & Other)', () => {
        it('select-directory: ディレクトリを選択できる', async () => {
            ; (dialog.showOpenDialog as Mock).mockResolvedValue({ canceled: false, filePaths: ['/path'] })
                ; (BrowserWindow.fromWebContents as Mock).mockReturnValue({})
            const res = await invoke('select-directory')
            expect(res).toBe('/path')
        })

        it('update-config: 設定を更新できる', async () => {
            await invoke('update-config', { key: 'val' })
            expect(saveConfig).toHaveBeenCalled()
        })

        it('open-external-link: 外部リンクを開ける', async () => {
            await invoke('open-external-link', 'https://example.com')
            expect(shell.openExternal).toHaveBeenCalledWith('https://example.com')
        })
    })
})
