import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import axios from 'axios'
import { checkForAppUpdate, isNewerVersion } from '../../../electron/updateChecker'

vi.mock('axios')

describe('updateChecker', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('isNewerVersion', () => {
        it('メジャーバージョンが新しい場合、trueを返す (UPD-001)', () => {
            expect(isNewerVersion('v2.0.0', '1.9.9')).toBe(true)
        })

        it('マイナーバージョンが新しい場合、trueを返す (UPD-002)', () => {
            expect(isNewerVersion('v1.2.0', '1.1.9')).toBe(true)
        })

        it('パッチバージョンが新しい場合、trueを返す (UPD-003)', () => {
            expect(isNewerVersion('v1.1.1', '1.1.0')).toBe(true)
        })

        it('同じバージョンの場合、falseを返す (UPD-004)', () => {
            expect(isNewerVersion('v1.1.0', '1.1.0')).toBe(false)
        })

        it('現在のバージョンの方が新しい場合、falseを返す (UPD-005)', () => {
            expect(isNewerVersion('v1.0.0', '1.1.0')).toBe(false)
        })
    })

    describe('checkForAppUpdate', () => {
        it('新しいバージョンがある場合、availableとリリース情報を返す (UPD-011)', async () => {
            ; (axios.get as Mock).mockResolvedValueOnce({
                data: {
                    tag_name: 'v1.2.0',
                    html_url: 'https://github.com/yamato3010/vrchat-world-manager/releases/tag/v1.2.0',
                },
            })

            const result = await checkForAppUpdate('1.1.0')

            expect(result.available).toBe(true)
            expect(result.latestVersion).toBe('v1.2.0')
            expect(result.releaseUrl).toBe('https://github.com/yamato3010/vrchat-world-manager/releases/tag/v1.2.0')
        })

        it('最新バージョンの場合、availableはfalseを返す (UPD-012)', async () => {
            ; (axios.get as Mock).mockResolvedValueOnce({
                data: {
                    tag_name: 'v1.1.0',
                    html_url: 'https://github.com/yamato3010/vrchat-world-manager/releases/tag/v1.1.0',
                },
            })

            const result = await checkForAppUpdate('1.1.0')

            expect(result.available).toBe(false)
        })

        it('API呼び出しに失敗した場合、availableはfalseを返す (UPD-013)', async () => {
            ; (axios.get as Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await checkForAppUpdate('1.1.0')

            expect(result.available).toBe(false)
        })
    })
})
