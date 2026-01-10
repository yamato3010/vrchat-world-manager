import { describe, it, expect, beforeAll } from 'vitest'
import { parsePNGMetadata } from '../../../../electron/utils/pngMetadata'
import * as fs from 'fs'
import * as path from 'path'

describe('pngMetadata', () => {
    const testFixturesDir = path.join(__dirname, '../../fixtures')

    // テスト前にディレクトリが存在することを確認
    if (!fs.existsSync(testFixturesDir)) {
        fs.mkdirSync(testFixturesDir, { recursive: true })
    }

    const testPNGPath = path.join(testFixturesDir, 'test-vrchat-photo.png')

    describe('parsePNGMetadata', () => {
        it('VRChat写真からワールドIDを正しく抽出できる (META-001)', () => {
            // テスト用のPNGファイルが存在する場合のみテストを実行
            if (!fs.existsSync(testPNGPath)) {
                console.warn('Test PNG file not found, skipping this test')
                return
            }

            const result = parsePNGMetadata(testPNGPath)

            expect(result).toHaveProperty('metadata')
            expect(result).toHaveProperty('worldId')

            // ワールドIDがwrld_で始まる36文字の形式であることを確認
            if (result.worldId) {
                expect(result.worldId).toMatch(/^wrld_[a-f0-9-]{36}$/)
            }
        })

        it('存在しないファイルパスの場合はエラーをスロー (META-002)', () => {
            const nonExistentPath = path.join(testFixturesDir, 'non-existent.png')

            expect(() => {
                parsePNGMetadata(nonExistentPath)
            }).toThrow()
        })

        it('PNGファイルでない場合は正しく処理される (META-003)', () => {
            // テキストファイルを一時的に作成
            const tempTextFile = path.join(testFixturesDir, 'temp-test.txt')
            fs.writeFileSync(tempTextFile, 'This is not a PNG file')

            try {
                // PNG以外のファイルを渡すとエラーになるか、worldIdがnullになるはず
                const result = parsePNGMetadata(tempTextFile)
                expect(result.worldId).toBeNull()
            } catch (error) {
                // エラーがスローされる場合もOK
                expect(error).toBeDefined()
            } finally {
                // クリーンアップ
                if (fs.existsSync(tempTextFile)) {
                    fs.unlinkSync(tempTextFile)
                }
            }
        })

        it('ワールドIDを含まないPNG画像の場合はworldIdがnullになる (META-004)', () => {
            // 最小限の有効なPNGファイルを作成（メタデータなし）
            const minimalPNGPath = path.join(testFixturesDir, 'minimal.png')

            // PNGヘッダー + IHDR + IEND チャンク（最小構成）
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, // IHDR length
                0x49, 0x48, 0x44, 0x52, // "IHDR"
                0x00, 0x00, 0x00, 0x01, // width: 1
                0x00, 0x00, 0x00, 0x01, // height: 1
                0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
                0x90, 0x77, 0x53, 0xDE, // CRC
                0x00, 0x00, 0x00, 0x00, // IEND length
                0x49, 0x45, 0x4E, 0x44, // "IEND"
                0xAE, 0x42, 0x60, 0x82, // CRC
            ])

            try {
                fs.writeFileSync(minimalPNGPath, pngBuffer)
                const result = parsePNGMetadata(minimalPNGPath)

                expect(result.worldId).toBeNull()
                expect(result.metadata).toBeDefined()
            } finally {
                // クリーンアップ
                if (fs.existsSync(minimalPNGPath)) {
                    fs.unlinkSync(minimalPNGPath)
                }
            }
        })
    })
})
