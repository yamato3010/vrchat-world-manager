import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase, resetTestDatabase, getTestPrisma } from '../setup/testDatabase'

describe('Database Integration Tests', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = await setupTestDatabase()
    })

    afterAll(async () => {
        await cleanupTestDatabase()
    })

    beforeEach(async () => {
        await resetTestDatabase()
    })

    describe('World CRUD operations', () => {
        it('ワールドを作成できる', async () => {
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_test-integration-01',
                    name: 'Integration Test World',
                    authorName: 'TestAuthor',
                    description: 'Test description',
                    thumbnailUrl: 'https://example.com/thumb.jpg',
                },
            })

            expect(world).toBeDefined()
            expect(world.id).toBeDefined()
            expect(world.name).toBe('Integration Test World')
        })

        it('ワールドを取得できる', async () => {
            // まずワールドを作成
            await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_test-integration-02',
                    name: 'Test World 2',
                },
            })

            // 取得
            const world = await prisma.world.findUnique({
                where: { vrchatWorldId: 'wrld_test-integration-02' },
            })

            expect(world).toBeDefined()
            expect(world.name).toBe('Test World 2')
        })

        it('ワールドを更新できる', async () => {
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_test-integration-03',
                    name: 'Original Name',
                },
            })

            const updated = await prisma.world.update({
                where: { id: world.id },
                data: { name: 'Updated Name' },
            })

            expect(updated.name).toBe('Updated Name')
        })

        it('ワールドを削除できる', async () => {
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_test-integration-04',
                    name: 'To Delete',
                },
            })

            await prisma.world.delete({
                where: { id: world.id },
            })

            const found = await prisma.world.findUnique({
                where: { id: world.id },
            })

            expect(found).toBeNull()
        })
    })

    describe('Group operations', () => {
        it('グループを作成できる', async () => {
            const group = await prisma.group.create({
                data: {
                    name: 'Test Group',
                    description: 'Test description',
                    icon: '⭐',
                },
            })

            expect(group).toBeDefined()
            expect(group.name).toBe('Test Group')
        })

        it('ワールドをグループに追加できる', async () => {
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_test-group-01',
                    name: 'World for Group',
                },
            })

            const group = await prisma.group.create({
                data: {
                    name: 'Favorites',
                },
            })

            await prisma.worldOnGroup.create({
                data: {
                    worldId: world.id,
                    groupId: group.id,
                },
            })

            const worldWithGroups = await prisma.world.findUnique({
                where: { id: world.id },
                include: { groups: true },
            })

            expect(worldWithGroups?.groups).toHaveLength(1)
            expect(worldWithGroups?.groups[0].groupId).toBe(group.id)
        })
    })

    describe('Cascade delete', () => {
        it('ワールドを削除すると関連する写真も削除される', async () => {
            const world = await prisma.world.create({
                data: {
                    vrchatWorldId: 'wrld_cascade-test',
                    name: 'World with Photos',
                },
            })

            await prisma.photo.create({
                data: {
                    filePath: '/test/photo.png',
                    originalFileName: 'photo.png',
                    worldId: world.id,
                },
            })

            // ワールドを削除
            await prisma.world.delete({
                where: { id: world.id },
            })

            // 写真も削除されているか確認
            const photos = await prisma.photo.findMany({
                where: { worldId: world.id },
            })

            expect(photos).toHaveLength(0)
        })
    })
})
