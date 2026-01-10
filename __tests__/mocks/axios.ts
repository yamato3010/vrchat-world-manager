import { vi } from 'vitest'
import axios from 'axios'

/**
 * Axiosのモック
 * VRChat API呼び出しをシミュレートする
 */
export const mockAxios = vi.mocked(axios, true)

/**
 * VRChat APIのモックレスポンス
 */
export const mockVRChatWorldResponse = {
    id: 'wrld_test-world-id-12345',
    name: 'Test World',
    authorName: 'TestAuthor',
    description: 'This is a test world',
    thumbnailImageUrl: 'https://example.com/thumbnail.jpg',
    tags: ['test_tag', 'author_tag_TestAuthor'],
}

/**
 * VRChat APIの成功レスポンスをモック
 */
export function mockVRChatAPISuccess(worldData = mockVRChatWorldResponse) {
    mockAxios.get.mockResolvedValueOnce({
        data: worldData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
    })
}

/**
 * VRChat APIのエラーレスポンスをモック
 */
export function mockVRChatAPIError(errorMessage = 'API Error', statusCode = 500) {
    mockAxios.get.mockRejectedValueOnce({
        response: {
            status: statusCode,
            data: { error: errorMessage },
        },
    })
}

/**
 * Axiosモックをリセット
 */
export function resetAxiosMock() {
    vi.clearAllMocks()
}

// Axiosをモジュールレベルでモック
vi.mock('axios')
