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
    const mockPrisma = {
        world: {
            findUnique: vi.fn().mockResolvedValue(null),
        },
    } as any

    beforeEach(() => {
        // テストディレクトリを作成
        if (fs.existsSync(testPhotoDir)) {
            fs.rmSync(testPhotoDir, { recursive: true, force: true })
        }
        fs.mkdirSync(testPhotoDir, { recursive: true })

        vi.clearAllMocks()
    })

    afterEach(() => {
        // クリーンアップ
        if (fs.existsSync(testPhotoDir)) {
            fs.rmSync(testPhotoDir, { recursive: true, force: true })
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

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(1)
            expect(result[0].worldId).toBe('wrld_test-world-12345')
            expect(result[0].worldName).toBe('Test World')
        })

        it('ディレクトリが存在しない場合でもエラーにならない (SCAN-004)', async () => {
            const nonExistentDir = '/tmp/non-existent-directory'

            const result = await scanForNewPhotos(mockPrisma, nonExistentDir, 14, [])

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

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, dismissedWorldIds)

            // 無視リストに含まれているため、空配列が返される
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(0)
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

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            // 期間外なのでスキャンされない（空配列が返される）
            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(0)
        })
        it('サブディレクトリ内のPNG画像もスキャンされる (SCAN-005)', async () => {
            const subDir = path.join(testPhotoDir, 'subdir')
            fs.mkdirSync(subDir)

            const fileName = 'valid-vrchat-sub.png'

            const filePath = path.join(subDir, fileName)
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
            ])
            fs.writeFileSync(filePath, pngBuffer)

            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

                // Axiosのモック設定
                ; (axios.get as any).mockResolvedValue({
                    data: {
                        name: 'Subdir World',
                        authorName: 'Subdir Author',
                        imageUrl: 'http://example.com/sub.png'
                    }
                })

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            expect(result).toBeDefined()
            expect(result.length).toBeGreaterThan(0)
            const found = result.find(r => r.photoFilePath === filePath)
            expect(found).toBeDefined()
        })

        it('提案は最大4件まで制限される (SCAN-006)', async () => {
            // 5つの異なるファイルを作成
            for (let i = 0; i < 5; i++) {
                const fileName = `VRChat_2024-01-01_12-00-0${i}_limit-test.png`
                const filePath = path.join(testPhotoDir, fileName)
                const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
                fs.writeFileSync(filePath, pngBuffer)
                const now = Date.now()
                fs.utimesSync(filePath, now / 1000, now / 1000)
            }

            // pngMetadataモックを拡張して、ファイルごとに異なるworldIdを返すようにする
            // 既存のモック実装を一時的に上書き
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation((filePath: string) => {
                if (filePath.includes('limit-test')) {
                    // ファイル名からインデックスを抽出して一意のIDを生成
                    const match = filePath.match(/12-00-0(\d)/)
                    const index = match ? match[1] : '0'
                    return {
                        metadata: {},
                        worldId: `wrld_limit-test-${index}`,
                    }
                }
                return {
                    metadata: {},
                    worldId: null
                }
            })

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            expect(result.length).toBeLessThanOrEqual(4)
        })

        it('worldIdがnullの写真はスキップされる (SCAN-007)', async () => {
            const fileName = 'no-metadata.png'
            const filePath = path.join(testPhotoDir, fileName)
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            fs.writeFileSync(filePath, pngBuffer)

            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

            // モックを上書きしてworldIdがnullを返すようにする
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation(() => {
                return {
                    metadata: {},
                    worldId: null  // worldIdなし
                }
            })

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            // worldIdがnullなのでスキップされる
            expect(result.length).toBe(0)
        })

        it('重複するworldIdは1つだけ提案される (SCAN-008)', async () => {
            // 同じworldIdを持つ3つのファイルを作成
            for (let i = 0; i < 3; i++) {
                const fileName = `duplicate-${i}.png`
                const filePath = path.join(testPhotoDir, fileName)
                const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
                fs.writeFileSync(filePath, pngBuffer)
                const now = Date.now()
                fs.utimesSync(filePath, now / 1000, now / 1000)
            }

            // モックを上書きして全て同じworldIdを返すようにする
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation(() => {
                return {
                    metadata: {},
                    worldId: 'wrld_duplicate-world-id'
                }
            });

            (axios.get as any).mockResolvedValue({
                data: {
                    name: 'Duplicate World',
                    authorName: 'Test Author',
                    imageUrl: 'http://example.com/image.png'
                }
            })

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            // 重複は除外されるので1件のみ
            expect(result.length).toBe(1)
            expect(result[0].worldId).toBe('wrld_duplicate-world-id')
        })

        it('DBに既に登録されているワールドはスキップされる (SCAN-009)', async () => {
            const fileName = 'existing-world.png'
            const filePath = path.join(testPhotoDir, fileName)
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            fs.writeFileSync(filePath, pngBuffer)
            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

            // モックを上書き
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation(() => {
                return {
                    metadata: {},
                    worldId: 'wrld_existing-in-db'
                }
            })

            // prismaのモックを変更して、ワールドが既に存在することを示す
            const mockPrismaWithExisting = {
                world: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 1,
                        vrchatWorldId: 'wrld_existing-in-db',
                        name: 'Existing World'
                    })
                }
            } as any

            const result = await scanForNewPhotos(mockPrismaWithExisting, testPhotoDir, 14, [])

            // DBに既に存在するのでスキップされる
            expect(result.length).toBe(0)
        })

        it('API取得失敗時は基本情報で提案を作成する (SCAN-010)', async () => {
            const fileName = 'api-fail.png'
            const filePath = path.join(testPhotoDir, fileName)
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            fs.writeFileSync(filePath, pngBuffer)
            const now = Date.now()
            fs.utimesSync(filePath, now / 1000, now / 1000)

            // モックを上書き
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation(() => {
                return {
                    metadata: {},
                    worldId: 'wrld_api-fail-test'
                }
            })

                // axiosのモックをAPI失敗にする
                ; (axios.get as any).mockRejectedValue(new Error('API Error'))

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            // API失敗でも提案は作成される
            expect(result.length).toBe(1)
            expect(result[0].worldId).toBe('wrld_api-fail-test')
            expect(result[0].worldName).toBe('Unknown World')
            // API失敗時はauthorやthumbnailは設定されない
            expect(result[0].worldAuthor).toBeUndefined()
            expect(result[0].worldThumbnail).toBeUndefined()
        })

        it('ファイル処理エラー時はそのファイルをスキップして続行する (SCAN-011)', async () => {
            // 正常なファイルを作成
            const validFileName = 'valid-file.png'
            const validFilePath = path.join(testPhotoDir, validFileName)
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            fs.writeFileSync(validFilePath, pngBuffer)
            const now = Date.now()
            fs.utimesSync(validFilePath, now / 1000, now / 1000)

            // エラーを起こすファイル名を作成（実際のファイルは作らない）
            const errorFileName = 'error-file.png'

            // モックを上書きして、error-fileの時だけエラーをスローする
            const metadataMock = await import('../../../electron/utils/pngMetadata')
            const originalMock = metadataMock.parsePNGMetadata as any
            originalMock.mockImplementation((filePath: string) => {
                if (filePath.includes('error-file')) {
                    throw new Error('Parse Error')
                }
                return {
                    metadata: {},
                    worldId: 'wrld_valid-file'
                }
            })

            // fs.promises.readdirをモックして、両方のファイルを返す
            const originalReaddir = fs.promises.readdir
            vi.spyOn(fs.promises, 'readdir').mockResolvedValue([validFileName, errorFileName] as any)

            // fs.promises.statをモックして、error-fileの時はエラーを投げる
            const originalStat = fs.promises.stat
            vi.spyOn(fs.promises, 'stat').mockImplementation(async (filePath: any) => {
                if (filePath.includes('error-file')) {
                    throw new Error('File stat error')
                }
                return originalStat(filePath)
            });

            (axios.get as any).mockResolvedValue({
                data: {
                    name: 'Valid World',
                    authorName: 'Test Author',
                    imageUrl: 'http://example.com/image.png'
                }
            })

            const result = await scanForNewPhotos(mockPrisma, testPhotoDir, 14, [])

            // エラーファイルはスキップされ、正常なファイルだけ処理される
            expect(result.length).toBe(1)
            expect(result[0].worldId).toBe('wrld_valid-file')

            // モックをリストア
            vi.spyOn(fs.promises, 'readdir').mockRestore()
            vi.spyOn(fs.promises, 'stat').mockRestore()
        })
    })
})
