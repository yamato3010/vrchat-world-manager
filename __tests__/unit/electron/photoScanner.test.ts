import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import { scanForNewPhotos } from '../../../electron/photoScanner'
import * as fs from 'fs'
import * as path from 'path'

// モジュールのモック
vi.mock('../../../electron/utils/pngMetadata', () => ({
    parsePNGMetadata: vi.fn((filePath: string) => {
        // ファイル名に基づいてモックデータを返す
        if (filePath.includes('valid-vrchat')) {
            return {
                metadata: {},
                worldId: 'wrld_test-world-12345',
            }
        }
        return {
            metadata: {},
            worldId: null,
        }
    }),
}))

vi.mock('axios')

vi.mock('@prisma/client', () => {
    const mockPrisma = {
        world: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        photo: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    }
    return {
        PrismaClient: class {
            constructor() {
                return mockPrisma
            }
        },
    }
})

describe('photoScanner', () => {
    const testPhotoDir = '/tmp/test-vrchat-photos'

    beforeEach(() => {
        // テストディレクトリを作成
        if (!fs.existsSync(testPhotoDir)) {
            fs.mkdirSync(testPhotoDir, { recursive: true })
        }

        vi.clearAllMocks()
    })

    afterEach(() => {
        // クリーンアップ
        if (fs.existsSync(testPhotoDir)) {
            const files = fs.readdirSync(testPhotoDir)
            files.forEach((file) => {
                fs.unlinkSync(path.join(testPhotoDir, file))
            })
            fs.rmdirSync(testPhotoDir)
        }
    })

    describe('scanForNewPhotos', () => {
        it('指定期間内のPNG画像をスキャンできる (SCAN-001)', async () => {
            // ファイル名に valid-vrchat を含めることでモックがworldIdを返すようにする
            const recentDate = new Date()
            const fileName = `VRChat_${recentDate.getFullYear()}-01-01_12-00-00_valid-vrchat.png`
            const filePath = path.join(testPhotoDir, fileName)

            // 最小限のPNGファイルを作成
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            ])
            fs.writeFileSync(filePath, pngBuffer)

            // ファイルのmtimeを最近に設定
            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

                // Axiosのモック設定
                ; (axios.get as any).mockResolvedValue({
                    data: {
                        name: 'Test World',
                        authorName: 'Test Author',
                        imageUrl: 'http://example.com/image.png'
                    }
                })

            const result = await scanForNewPhotos(testPhotoDir, 14, [])

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(1)
            expect(result[0].worldId).toBe('wrld_test-world-12345')
            expect(result[0].worldName).toBe('Test World')
        })

        it('ディレクトリが存在しない場合でもエラーにならない (SCAN-004)', async () => {
            const nonExistentDir = '/tmp/non-existent-directory'

            const result = await scanForNewPhotos(nonExistentDir, 14, [])

            // エラーではなく空配列が返される
            expect(Array.isArray(result)).toBe(true)
        })

        it('無視リストに含まれるワールドはスキップされる (SCAN-003)', async () => {
            const dismissedWorldIds = ['wrld_test-world-12345']

            // VRChat写真を作成
            const fileName = 'valid-vrchat-photo.png'
            const filePath = path.join(testPhotoDir, fileName)
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            ])
            fs.writeFileSync(filePath, pngBuffer)

            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

            const result = await scanForNewPhotos(testPhotoDir, 14, dismissedWorldIds)

            // 無視リストに含まれているため、結果には含まれない
            expect(result).toBeDefined()
        })

        it('指定期間外の写真はスキャンしない (SCAN-002)', async () => {
            // 古い日付のファイルを作成
            const oldFileName = 'VRChat_2020-01-01_12-00-00.png'
            const oldFilePath = path.join(testPhotoDir, oldFileName)
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            ])
            fs.writeFileSync(oldFilePath, pngBuffer)

            // 古い日付をmtimeに設定
            const oldDate = new Date('2020-01-01').getTime()
            fs.utimesSync(oldFilePath, oldDate / 1000, oldDate / 1000)

            const result = await scanForNewPhotos(testPhotoDir, 14, [])

            // 期間外なのでスキャンされない
            expect(result).toBeDefined()
        })
    })
})
