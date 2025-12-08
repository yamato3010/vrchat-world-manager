import * as fs from 'fs'
import * as path from 'path'
import { parsePNGMetadata } from './utils/pngMetadata'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

export interface WorldSuggestion {
    id: string // 一意の提案ID（ファイルパスのハッシュなど）
    photoFilePath: string
    photoFileName: string
    worldId: string // VRChat World ID
    worldName?: string
    worldAuthor?: string
    worldThumbnail?: string
    detectedAt: string
}

const filterTags = (tags: string[]): string[] => {
    if (!Array.isArray(tags)) return []
    return tags
        .filter(tag => tag.startsWith('author_tag_'))
        .map(tag => tag.replace('author_tag_', ''))
}

export async function scanForNewPhotos(dirPath: string, scanPeriodDays: number = 14, dismissedWorldIds: string[] = []): Promise<WorldSuggestion[]> {
    try {
        if (!dirPath || !fs.existsSync(dirPath)) {
            console.log('Photo directory not found or not set:', dirPath)
            return []
        }

        // ディレクトリ内のファイルを取得
        const files = await fs.promises.readdir(dirPath)
        const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'))

        const suggestions: WorldSuggestion[] = []
        const now = Date.now()
        const scanPeriodMs = scanPeriodDays * 24 * 60 * 60 * 1000

        for (const file of pngFiles) {
            const filePath = path.join(dirPath, file)

            try {
                // ファイルの作成日時を確認
                const stats = await fs.promises.stat(filePath)
                const fileAge = now - stats.mtimeMs

                // 設定期間内のファイルのみを対象
                if (fileAge > scanPeriodMs) {
                    continue
                }

                // PNGメタデータからワールドIDを取得
                const { worldId } = parsePNGMetadata(filePath)

                if (!worldId) {
                    continue
                }

                // 既存ワールドと重複チェック
                const existingWorld = await prisma.world.findUnique({
                    where: { vrchatWorldId: worldId },
                })

                if (existingWorld) {
                    // 既にDBに登録されている場合はスキップ
                    continue
                }

                // 無視リストに含まれている場合はスキップ
                if (dismissedWorldIds.includes(worldId)) {
                    continue
                }

                // VRChat APIからワールド情報を取得
                try {
                    const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${worldId}`, {
                        headers: {
                            'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                        },
                    })
                    const worldData = response.data

                    suggestions.push({
                        id: `${worldId}_${file}`,
                        photoFilePath: filePath,
                        photoFileName: file,
                        worldId: worldId,
                        worldName: worldData.name || 'Unknown World',
                        worldAuthor: worldData.authorName,
                        worldThumbnail: worldData.thumbnailImageUrl || worldData.imageUrl,
                        detectedAt: new Date().toISOString(),
                    })
                } catch (apiError) {
                    console.error(`Failed to fetch world info for ${worldId}:`, apiError)
                    // API取得に失敗しても、基本情報で提案を作成
                    suggestions.push({
                        id: `${worldId}_${file}`,
                        photoFilePath: filePath,
                        photoFileName: file,
                        worldId: worldId,
                        worldName: 'Unknown World',
                        detectedAt: new Date().toISOString(),
                    })
                }
            } catch (fileError) {
                console.error(`Failed to process file ${file}:`, fileError)
                continue
            }
        }

        console.log(`Found ${suggestions.length} world suggestions`)
        return suggestions
    } catch (error) {
        console.error('Failed to scan for new photos:', error)
        return []
    }
}
