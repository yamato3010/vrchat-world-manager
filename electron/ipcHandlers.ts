import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

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
            // First, get all worlds in this group
            const worldsInGroup = await prisma.worldOnGroup.findMany({
                where: { groupId: id },
                select: { worldId: true },
            })

            const worldIds = worldsInGroup.map(wog => wog.worldId)

            // Delete the group (this will cascade delete WorldOnGroup entries)
            await prisma.group.delete({ where: { id } })

            // Delete all worlds that were in this group
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
            // Just delete the group (WorldOnGroup entries will be cascade deleted by Prisma)
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

    // VRChat API
    ipcMain.handle('fetch-vrchat-world', async (_, worldId: string) => {
        try {
            const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${worldId}`, {
                headers: {
                    'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching VRChat world:', error)
            throw error
        }
    })
}
