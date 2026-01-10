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

            // Capture handlers
            ; (ipcMain.handle as Mock).mockImplementation((channel, listener) => {
                handlers[channel] = listener
            })

        // Initialize handlers
        registerIpcHandlers()

        // Get prisma instance
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

    describe('World CRUD', () => {
        it('get-worlds: filters by group if provided', async () => {
            prisma.world.findMany.mockResolvedValue([])
            await invoke('get-worlds', 123)
            expect(prisma.world.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { groups: { some: { groupId: 123 } } }
            }))

            await invoke('get-worlds')
            expect(prisma.world.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: { groups: true }
            }))
        })

        it('create-world: creates a world', async () => {
            prisma.world.create.mockResolvedValue({ id: 1 })
            await invoke('create-world', { vrchatWorldId: 'w1', name: 'N' })
            expect(prisma.world.create).toHaveBeenCalled()
        })

        it('delete-world: deletes a world', async () => {
            prisma.world.delete.mockResolvedValue({ id: 1 })
            await invoke('delete-world', 1)
            expect(prisma.world.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        })

        it('get-world-by-id: returns world', async () => {
            prisma.world.findUnique.mockResolvedValue({ id: 1 })
            await invoke('get-world-by-id', 1)
            expect(prisma.world.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }))
        })

        it('update-world: updates a world', async () => {
            prisma.world.update.mockResolvedValue({ id: 1 })
            await invoke('update-world', { id: 1, data: { name: 'U' } })
            expect(prisma.world.update).toHaveBeenCalled()
        })
    })

    describe('Group CRUD', () => {
        it('get-groups: returns groups', async () => {
            prisma.group.findMany.mockResolvedValue([])
            await invoke('get-groups')
            expect(prisma.group.findMany).toHaveBeenCalled()
        })

        it('get-group-by-id: returns group', async () => {
            prisma.group.findUnique.mockResolvedValue({ id: 1 })
            await invoke('get-group-by-id', 1)
            expect(prisma.group.findUnique).toHaveBeenCalled()
        })

        it('create-group: creates a group', async () => {
            await invoke('create-group', { name: 'G1' })
            expect(prisma.group.create).toHaveBeenCalled()
        })

        it('update-group: updates a group', async () => {
            await invoke('update-group', { id: 1, data: { name: 'G2' } })
            expect(prisma.group.update).toHaveBeenCalled()
        })

        it('delete-group: deletes group only', async () => {
            await invoke('delete-group', { id: 1, deleteWorlds: false })
            expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 1 } })
            expect(prisma.world.deleteMany).not.toHaveBeenCalled()
        })

        it('delete-group: deletes group and worlds', async () => {
            prisma.worldOnGroup.findMany.mockResolvedValue([{ worldId: 10 }])
            await invoke('delete-group', { id: 1, deleteWorlds: true })
            expect(prisma.group.delete).toHaveBeenCalled()
            expect(prisma.world.deleteMany).toHaveBeenCalled()
        })
    })

    describe('Photo Management', () => {
        it('import-photo: imports successfully', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_ex' })
            prisma.world.findUnique.mockResolvedValue({ id: 100, vrchatWorldId: 'wrld_ex' })
            prisma.photo.create.mockResolvedValue({ id: 1, worldId: 100 })

            const result = await invoke('import-photo', '/p.png')
            expect(result.success).toBe(true)
            expect(prisma.photo.create).toHaveBeenCalled()
        })

        it('get-photos-by-world: returns photos', async () => { // Corrected channel name
            prisma.photo.findMany.mockResolvedValue([])
            await invoke('get-photos-by-world', 100)
            expect(prisma.photo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { worldId: 100 } }))
        })

        it('delete-photo: deletes photo', async () => {
            await invoke('delete-photo', 1)
            expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 1 } })
        })

        it('read-image-base64: reads file', async () => { // Corrected channel name
            const buffer = Buffer.from('test')
                ; (fs.promises.readFile as Mock).mockResolvedValue(buffer)

            const result = await invoke('read-image-base64', '/p.png')
            expect(result).toBe(buffer.toString('base64'))
        })
    })

    describe('Associations', () => {
        it('add-world-to-group', async () => {
            await invoke('add-world-to-group', { worldId: 1, groupId: 2 })
            expect(prisma.worldOnGroup.create).toHaveBeenCalled()
        })
        it('remove-world-from-group', async () => {
            await invoke('remove-world-from-group', { worldId: 1, groupId: 2 })
            expect(prisma.worldOnGroup.delete).toHaveBeenCalled()
        })
    })

    describe('Suggestions', () => {
        it('get-world-suggestions', async () => {
            (scanForNewPhotos as Mock).mockResolvedValue([])
            await invoke('get-world-suggestions')
            expect(scanForNewPhotos).toHaveBeenCalled()
        })

        it('accept-suggestion', async () => {
            (axios.get as Mock).mockResolvedValue({ data: { tags: [] } })
            prisma.world.create.mockResolvedValue({ id: 1 })

            // Correct payload: worldId should be the VRChat ID string for API fetch
            await invoke('accept-suggestion', { worldId: 'wrld_s', groupId: 1 })

            expect(prisma.world.create).toHaveBeenCalled()
            expect(prisma.worldOnGroup.create).toHaveBeenCalled() // if groupId provided
        })

        it('dismiss-suggestion', async () => {
            (loadConfig as Mock).mockResolvedValue({ dismissedWorldIds: [] })
            await invoke('dismiss-suggestion', 'wrld_d')
            expect(saveConfig).toHaveBeenCalled()
        })
    })

    describe('Error Handling & Edge Cases', () => {
        it('fetch-vrchat-world: handles API error', async () => {
            (axios.get as Mock).mockRejectedValue(new Error('API Error'))
            await expect(invoke('fetch-vrchat-world', 'w1')).rejects.toThrow('API Error')
        })

        it('import-photo: uses targetWorldId if provided', async () => {
            const result = await invoke('import-photo', '/p.png', 999)
            expect(result.success).toBe(true)
            // Should fetch world 999 from DB or API. 
            // Mock DB finding it to be simple.
            expect(prisma.world.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 999 } }))
        })

        it('import-photo: creates new world if not in DB', async () => {
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

        it('import-photo: handles missing world ID in metadata', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: null })
            const result = await invoke('import-photo', '/no_id.png')
            expect(result.success).toBe(false)
            expect(result.error).toContain('World ID not found')
        })

        it('import-photo: handles API error during new world creation', async () => {
            (parsePNGMetadata as Mock).mockReturnValue({ metadata: {}, worldId: 'wrld_err' })
            prisma.world.findUnique.mockResolvedValue(null)
                ; (axios.get as Mock).mockRejectedValue(new Error('API Fail'))

            const result = await invoke('import-photo', '/err.png')
            expect(result.success).toBe(false)
            expect(result.error).toContain('failed to fetch details')
        })

        it('delete-group: handles empty world list when deleting worlds', async () => {
            prisma.worldOnGroup.findMany.mockResolvedValue([])
            await invoke('delete-group', { id: 1, deleteWorlds: true })
            expect(prisma.group.delete).toHaveBeenCalled()
            // prisma.world.deleteMany should NOT be called if logic checks length > 0
            expect(prisma.world.deleteMany).not.toHaveBeenCalled()
        })

        it('select-directory: handles cancellation', async () => {
            ; (BrowserWindow.fromWebContents as Mock).mockReturnValue({})
                ; (dialog.showOpenDialog as Mock).mockResolvedValue({ canceled: true, filePaths: [] })
            const res = await invoke('select-directory')
            expect(res).toBeNull()
        })

        it('fetch-vrchat-world: handles no tags', async () => {
            ; (axios.get as Mock).mockResolvedValue({
                data: { id: 'w2', name: 'No Tags', tags: null }
            })
            const result = await invoke('fetch-vrchat-world', 'w2')
            expect(result.tags).toBeNull()
        })

        it('select-directory: handles no browser window', async () => {
            (BrowserWindow.fromWebContents as Mock).mockReturnValue(null)
            const res = await invoke('select-directory')
            expect(res).toBeNull()
        })

        it('get-world-suggestions: returns empty if no config path', async () => {
            (loadConfig as Mock).mockResolvedValue({}) // No photoDirectoryPath
            const res = await invoke('get-world-suggestions')
            expect(res).toEqual([])
        })

        it('dismiss-suggestion: ignores duplicate dismissal', async () => {
            (loadConfig as Mock).mockResolvedValue({ dismissedWorldIds: ['w1'] })
            await invoke('dismiss-suggestion', 'w1')
            // Should not save since already there
            expect(saveConfig).not.toHaveBeenCalled()
        })

        it('dismiss-suggestion: handles error', async () => {
            (loadConfig as Mock).mockRejectedValue(new Error('Config Error'))
            await expect(invoke('dismiss-suggestion', 'w1')).rejects.toThrow('Config Error')
        })

        it('accept-suggestion: handles error', async () => {
            (axios.get as Mock).mockRejectedValue(new Error('API Error'))
            await expect(invoke('accept-suggestion', { worldId: 'w1' })).rejects.toThrow('API Error')
        })

        it('read-image-base64: handles error', async () => {
            (fs.promises.readFile as Mock).mockRejectedValue(new Error('Read Error'))
            await expect(invoke('read-image-base64', '/bad.png')).rejects.toThrow('Read Error')
        })
        it('fetch-vrchat-world: handles invalid tags (non-array)', async () => {
            ; (axios.get as Mock).mockResolvedValue({
                data: { id: 'w3', tags: 'invalid' }
            })
            const result = await invoke('fetch-vrchat-world', 'w3')
            expect(result.tags).toEqual([])
        })

        it('import-photo: uses defaults for missing world data', async () => {
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

        it('get-world-suggestions: uses provided config values', async () => {
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

    describe('Config & Other', () => {
        it('select-directory', async () => {
            ; (dialog.showOpenDialog as Mock).mockResolvedValue({ canceled: false, filePaths: ['/path'] })
                ; (BrowserWindow.fromWebContents as Mock).mockReturnValue({})
            const res = await invoke('select-directory')
            expect(res).toBe('/path')
        })

        it('update-config', async () => {
            await invoke('update-config', { key: 'val' })
            expect(saveConfig).toHaveBeenCalled()
        })

        it('open-external-link', async () => {
            await invoke('open-external-link', 'https://example.com')
            expect(shell.openExternal).toHaveBeenCalledWith('https://example.com')
        })
    })
})
