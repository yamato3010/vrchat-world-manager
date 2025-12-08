import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { parsePNGMetadata } from './utils/pngMetadata'
import * as path from 'path'
import * as fs from 'fs'
import { loadConfig, saveConfig } from './configManager'
import { scanForNewPhotos } from './photoScanner'

const prisma = new PrismaClient()

export function registerIpcHandlers() {
    // World CRUD
    ipcMain.handle('get-worlds', async (_, groupId?: number) => {
        if (groupId) {
            return prisma.world.findMany({
                where: {
                    groups: {
                        some: {
                            groupId: groupId,
                        },
                    },
                },
                include: { groups: true },
            })
        }
        return prisma.world.findMany({ include: { groups: true } })
    })

    ipcMain.handle('create-world', async (_, data: any) => {
        return prisma.world.create({
            data: {
                vrchatWorldId: data.vrchatWorldId,
                name: data.name,
                authorName: data.authorName,
                description: data.description,
                thumbnailUrl: data.thumbnailUrl,
                userMemo: data.userMemo,
                tags: data.tags,
            },
        })
    })

    ipcMain.handle('delete-world', async (_, id: number) => {
        return prisma.world.delete({ where: { id } })
    })

    ipcMain.handle('get-world-by-id', async (_, id: number) => {
        return prisma.world.findUnique({
            where: { id },
            include: {
                groups: {
                    include: {
                        group: true,
                    },
                },
            },
        })
    })

    ipcMain.handle('update-world', async (_, { id, data }: { id: number; data: any }) => {
        return prisma.world.update({
            where: { id },
            data: {
                name: data.name,
                authorName: data.authorName,
                description: data.description,
                userMemo: data.userMemo,
                tags: data.tags,
            },
        })
    })

    // Group CRUD
    ipcMain.handle('get-groups', async () => {
        return prisma.group.findMany({
            include: {
                _count: {
                    select: { worlds: true },
                },
            },
        })
    })

    ipcMain.handle('get-group-by-id', async (_, id: number) => {
        return prisma.group.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { worlds: true },
                },
            },
        })
    })

    ipcMain.handle('create-group', async (_, data: { name: string; description?: string; icon?: string }) => {
        return prisma.group.create({
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
            },
        })
    })

    ipcMain.handle('update-group', async (_, { id, data }: { id: number; data: any }) => {
        return prisma.group.update({
            where: { id },
            data,
        })
    })

    ipcMain.handle('delete-group', async (_, { id, deleteWorlds }: { id: number; deleteWorlds: boolean }) => {
        if (deleteWorlds) {
            // このグループに属する全てのワールドを取得
            const worldsInGroup = await prisma.worldOnGroup.findMany({
                where: { groupId: id },
                select: { worldId: true },
            })

            const worldIds = worldsInGroup.map(wog => wog.worldId)

            // グループを削除する
            await prisma.group.delete({ where: { id } })

            // グループに属する全てのワールドを削除する
            if (worldIds.length > 0) {
                await prisma.world.deleteMany({
                    where: {
                        id: {
                            in: worldIds,
                        },
                    },
                })
            }
        } else {
            // グループの削除
            await prisma.group.delete({ where: { id } })
        }

        return { success: true }
    })

    // World-Group Association
    ipcMain.handle('add-world-to-group', async (_, { worldId, groupId }: { worldId: number; groupId: number }) => {
        return prisma.worldOnGroup.create({
            data: {
                worldId,
                groupId,
            },
        })
    })

    ipcMain.handle('remove-world-from-group', async (_, { worldId, groupId }: { worldId: number; groupId: number }) => {
        return prisma.worldOnGroup.delete({
            where: {
                worldId_groupId: {
                    worldId,
                    groupId,
                },
            },
        })
    })

    // author_tag_から始まるタグだけを抽出する
    const filterTags = (tags: string[]): string[] => {
        if (!Array.isArray(tags)) return []
        return tags
            .filter(tag => tag.startsWith('author_tag_'))
            .map(tag => tag.replace('author_tag_', ''))
    }

    // VRChat API
    ipcMain.handle('fetch-vrchat-world', async (_, worldId: string) => {
        try {
            const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${worldId}`, {
                headers: {
                    'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                },
            })
            const data = response.data
            if (data.tags) {
                data.tags = filterTags(data.tags)
            }
            return data
        } catch (error) {
            console.error('Error fetching VRChat world:', error)
            throw error
        }
    })

    // Photo management
    ipcMain.handle('import-photo', async (_, filePath: string, targetWorldId?: number) => {
        try {
            // 1. PNGからメタデータを取得
            console.log('Parsing PNG metadata開始')
            const { metadata, worldId: extractedWorldId } = parsePNGMetadata(filePath)
            const originalFileName = path.basename(filePath)

            let worldId: number

            // targetWorldIdが指定されている場合は、それを優先して使用する（メタデータチェックをスキップ）
            if (targetWorldId) {
                worldId = targetWorldId
            } else if (extractedWorldId) {
                // 2. ワールドIDがDBに既に存在するか確認
                let world = await prisma.world.findUnique({
                    where: { vrchatWorldId: extractedWorldId },
                })

                if (!world) {
                    // 3. DBにない場合VRChat APIからワールド情報を取得して新規作成
                    try {
                        const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${extractedWorldId}`, {
                            headers: {
                                'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                            },
                        })
                        const worldData = response.data
                        const filteredTags = filterTags(worldData.tags || [])

                        world = await prisma.world.create({
                            data: {
                                vrchatWorldId: extractedWorldId,
                                name: worldData.name || 'Unknown World',
                                authorName: worldData.authorName,
                                description: worldData.description,
                                thumbnailUrl: worldData.thumbnailImageUrl || worldData.imageUrl,
                                tags: JSON.stringify(filteredTags),
                            },
                        })
                    } catch (apiError) {
                        console.error('Failed to fetch world info from VRChat API:', apiError)
                        throw new Error(`World ID ${extractedWorldId} found in metadata but failed to fetch details from VRChat API`)
                    }
                }
                worldId = world.id
            } else {
                throw new Error('World ID not found in PNG metadata')
            }

            // 4. 写真をDBに保存
            const photo = await prisma.photo.create({
                data: {
                    filePath,
                    originalFileName,
                    metadata: JSON.stringify(metadata),
                    worldId,
                },
            })

            // 紐付いたワールド情報を取得（名前などを返すため）
            const world = await prisma.world.findUnique({
                where: { id: worldId },
            })

            return {
                success: true,
                photo,
                metadata,
                extractedWorldId,
                world,
            }
        } catch (error: any) {
            console.error('Failed to import photo:', error)
            return {
                success: false,
                error: error.message,
                metadata: null,
                extractedWorldId: null,
            }
        }
    })

    ipcMain.handle('get-photos-by-world', async (_, worldId: number) => {
        return prisma.photo.findMany({
            where: { worldId },
            orderBy: { createdAt: 'desc' },
        })
    })

    ipcMain.handle('delete-photo', async (_, id: number) => {
        return prisma.photo.delete({ where: { id } })
    })

    ipcMain.handle('read-image-base64', async (_, filePath: string) => {
        try {
            const image = await fs.promises.readFile(filePath)
            return image.toString('base64')
        } catch (error) {
            console.error('Failed to read image:', error)
            throw error
        }
    })

    // Config management
    ipcMain.handle('select-directory', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return null

        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory'],
        }) as unknown as Electron.OpenDialogReturnValue

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }
        return result.filePaths[0]
    })

    ipcMain.handle('get-config', async () => {
        return loadConfig()
    })

    ipcMain.handle('update-config', async (_, config: any) => {
        await saveConfig(config)
        return { success: true }
    })

    // World suggestions
    ipcMain.handle('get-world-suggestions', async () => {
        const config = await loadConfig()
        if (!config.photoDirectoryPath) {
            return []
        }
        return scanForNewPhotos(config.photoDirectoryPath, config.scanPeriodDays || 14, config.dismissedWorldIds || [])
    })

    ipcMain.handle('accept-suggestion', async (_, { worldId, worldName, worldAuthor, worldThumbnail, groupId }: any) => {
        try {
            // VRChat APIからワールド情報を取得
            const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${worldId}`, {
                headers: {
                    'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                },
            })
            const worldData = response.data
            const filteredTags = filterTags(worldData.tags || [])

            // ワールドを作成
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: worldId,
                    name: worldName || worldData.name || 'Unknown World',
                    authorName: worldAuthor || worldData.authorName,
                    description: worldData.description,
                    thumbnailUrl: worldThumbnail || worldData.thumbnailImageUrl || worldData.imageUrl,
                    tags: JSON.stringify(filteredTags),
                },
            })

            // グループに追加（指定されている場合）
            if (groupId) {
                await prisma.worldOnGroup.create({
                    data: {
                        worldId: world.id,
                        groupId,
                    },
                })
            }

            return world
        } catch (error) {
            console.error('Failed to accept suggestion:', error)
            throw error
        }
    })

    ipcMain.handle('dismiss-suggestion', async (_, worldId: string) => {
        try {
            const config = await loadConfig()
            const dismissedWorldIds = config.dismissedWorldIds || []

            // 既に無視リストに含まれていない場合のみ追加
            if (!dismissedWorldIds.includes(worldId)) {
                dismissedWorldIds.push(worldId)
                await saveConfig({ ...config, dismissedWorldIds })
            }

            return { success: true }
        } catch (error) {
            console.error('Failed to dismiss suggestion:', error)
            throw error
        }
    })

    ipcMain.handle('open-external-link', async (_, url: string) => {
        await shell.openExternal(url)
    })
}
