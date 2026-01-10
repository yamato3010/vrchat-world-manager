import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadConfig, saveConfig } from '../../../electron/configManager'
import * as fs from 'fs'
import * as path from 'path'

// Electronモジュールのモック
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn(() => '/tmp/test-app-data'),
    },
}))

describe('configManager', () => {
    const testConfigDir = '/tmp/test-app-data' // モックと一致させる
    const testConfigPath = path.join(testConfigDir, 'config.json')

    beforeEach(() => {
        // テストディレクトリを作成
        if (!fs.existsSync(testConfigDir)) {
            fs.mkdirSync(testConfigDir, { recursive: true })
        }
    })

    afterEach(() => {
        // テストファイルをクリーンアップ
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath)
        }
        if (fs.existsSync(testConfigDir)) {
            fs.rmdirSync(testConfigDir)
        }
    })

    describe('loadConfig', () => {
        it('設定ファイルが存在しない場合、デフォルト値を返す (CONF-001)', async () => {
            const config = await loadConfig()

            // オプショナルな値はundefinedであることを確認
            expect(config.photoDirectoryPath).toBeUndefined()
            // デフォルト値を持つプロパティを確認
            expect(config.scanPeriodDays).toBe(14)
            expect(config.dismissedWorldIds).toEqual([])
        })

        it('空のJSONファイルの場合、デフォルト値を返す (CONF-002)', async () => {
            // 空ファイルを作成
            fs.writeFileSync(testConfigPath, '')

            const config = await loadConfig()

            expect(config.scanPeriodDays).toBe(14)
            expect(config.dismissedWorldIds).toEqual([])
        })

        it('設定ファイルが存在する場合、その内容を読み込む (CONF-003)', async () => {
            const testConfig = {
                photoDirectoryPath: '/test/path',
                scanPeriodDays: 30,
                dismissedWorldIds: ['wrld_test-01', 'wrld_test-02'],
            }

            // 手動で設定ファイルを作成
            fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

            const config = await loadConfig()

            expect(config.photoDirectoryPath).toBe('/test/path')
            expect(config.scanPeriodDays).toBe(30)
            expect(config.dismissedWorldIds).toEqual(['wrld_test-01', 'wrld_test-02'])
        })

        it('一部のプロパティのみ存在する場合、デフォルト値とマージされる (CONF-004)', async () => {
            const partialConfig = {
                scanPeriodDays: 7,
            }

            fs.writeFileSync(testConfigPath, JSON.stringify(partialConfig, null, 2))

            const config = await loadConfig()

            expect(config.scanPeriodDays).toBe(7)
            expect(config.dismissedWorldIds).toEqual([]) // デフォルト値
        })

        it('不正なJSON形式の場合、デフォルト値を返す (CONF-005)', async () => {
            // 不正なJSONを書き込み
            fs.writeFileSync(testConfigPath, 'invalid json {')

            const config = await loadConfig()

            // エラーが発生してもデフォルト値が返される
            expect(config.scanPeriodDays).toBe(14)
        })
    })

    describe('saveConfig', () => {
        it('設定を正しくファイルに保存できる (CONF-011)', async () => {
            const configToSave = {
                photoDirectoryPath: '/new/path',
                scanPeriodDays: 21,
                dismissedWorldIds: ['wrld_new-01'],
            }

            await saveConfig(configToSave)

            expect(fs.existsSync(testConfigPath)).toBe(true)

            const savedContent = fs.readFileSync(testConfigPath, 'utf-8')
            const savedConfig = JSON.parse(savedContent)

            expect(savedConfig.photoDirectoryPath).toBe('/new/path')
            expect(savedConfig.scanPeriodDays).toBe(21)
            expect(savedConfig.dismissedWorldIds).toEqual(['wrld_new-01'])
        })

        it('ディレクトリが存在しない場合、自動的に作成される (CONF-012)', async () => {
            // ディレクトリを削除
            if (fs.existsSync(testConfigDir)) {
                fs.rmSync(testConfigDir, { recursive: true, force: true })
            }

            const configToSave = {
                scanPeriodDays: 14,
            }

            await saveConfig(configToSave)

            expect(fs.existsSync(testConfigDir)).toBe(true)
            expect(fs.existsSync(testConfigPath)).toBe(true)
        })

        it('書き込み権限がない場合、エラーがスローされる (CONF-013)', async () => {
            // ディレクトリを読み取り専用にする (chmod 0o555) 
            // 注意: ルート権限やCI環境によっては動作しない場合があるため、
            // ここでは fs.promises.writeFile をモックしてエラーを発生させるアプローチをとる

            const originalWriteFile = fs.promises.writeFile
            // @ts-ignore
            fs.promises.writeFile = vi.fn().mockRejectedValue(new Error('Permission denied'))

            const configToSave = { scanPeriodDays: 14 }

            await expect(saveConfig(configToSave)).rejects.toThrow('Permission denied')

            // モックを戻す
            // @ts-ignore
            fs.promises.writeFile = originalWriteFile
        })
    })
})
