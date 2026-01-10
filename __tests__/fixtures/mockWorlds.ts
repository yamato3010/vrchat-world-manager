/**
 * テスト用のモックワールドデータ
 */
export const mockWorlds = [
    {
        id: 1,
        vrchatWorldId: 'wrld_test-world-01',
        name: 'Test World 1',
        authorName: 'TestAuthor1',
        description: 'First test world',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        userMemo: 'My favorite world',
        tags: JSON.stringify(['tag1', 'tag2']),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 2,
        vrchatWorldId: 'wrld_test-world-02',
        name: 'Test World 2',
        authorName: 'TestAuthor2',
        description: 'Second test world',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        userMemo: null,
        tags: JSON.stringify(['tag3']),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
    {
        id: 3,
        vrchatWorldId: null, // Manual entry
        name: 'Manual World',
        authorName: null,
        description: 'Manually added world',
        thumbnailUrl: null,
        userMemo: 'Added manually',
        tags: null,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
    },
]

/**
 * テスト用のモックグループデータ
 */
export const mockGroups = [
    {
        id: 1,
        name: 'Favorites',
        description: 'My favorite worlds',
        icon: '⭐',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 2,
        name: 'To Visit',
        description: 'Worlds I want to visit',
        icon: '📍',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
]

/**
 * テスト用のモック写真データ
 */
export const mockPhotos = [
    {
        id: 1,
        filePath: '/test/path/photo1.png',
        originalFileName: 'VRChat_2024-01-01_12-00-00.png',
        takenAt: new Date('2024-01-01T12:00:00Z'),
        metadata: JSON.stringify({ worldId: 'wrld_test-world-01' }),
        worldId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
]

/**
 * テスト用の設定データ
 */
export const mockConfig = {
    photoDirectoryPath: '/test/vrchat/photos',
    scanPeriodDays: 14,
    dismissedWorldIds: ['wrld_dismissed-01', 'wrld_dismissed-02'],
}

/**
 * VRChat APIレスポンスのモックデータ
 */
export const mockVRChatAPIResponse = {
    id: 'wrld_api-test-world',
    name: 'API Test World',
    authorName: 'APITestAuthor',
    description: 'World fetched from API',
    thumbnailImageUrl: 'https://api.vrchat.cloud/api/1/file/file_test/1/file',
    tags: ['test_tag', 'author_tag_APITestAuthor', 'game'],
    capacity: 16,
    releaseStatus: 'public',
}
