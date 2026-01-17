import * as fs from 'fs'
import * as path from 'path'
import { parsePNGMetadata } from './utils/pngMetadata'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

// const prisma = new PrismaClient()

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



export async function scanForNewPhotos(prisma: PrismaClient, dirPath: string, scanPeriodDays: number = 14, dismissedWorldIds: string[] = []): Promise<WorldSuggestion[]> {
    try {
        if (!dirPath || !fs.existsSync(dirPath)) {
            console.log('Photo directory not found or not set:', dirPath)
            return []
        }

        // ディレクトリ内のファイルを取得 (再帰的)
        // @ts-ignore: recursive option is available in Node 18.17+
        const files = await fs.promises.readdir(dirPath, { recursive: true }) as string[]
        const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'))

        const candidates: { worldId: string, filePath: string, fileName: string }[] = []
        const now = Date.now()
        const scanPeriodMs = scanPeriodDays * 24 * 60 * 60 * 1000
        const processedWorldIds = new Set<string>()

        // 1. 候補となるワールドを収集
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

                // 重複チェック (今回のスキャン内で既に処理済みか)
                if (processedWorldIds.has(worldId)) {
                    continue
                }

                // 既存ワールドと重複チェック (DB)
                const existingWorld = await prisma.world.findUnique({
                    where: { vrchatWorldId: worldId },
                })

                if (existingWorld) {
                    // 既にDBに登録されている場合はスキップ
                    continue // Setには追加しない（他のファイルで同じWorldIDが出たときにまたDBチェックするのを防ぐため、本来はSetに追加すべきだが、candidatesに追加しないならOK）
                    // ↑ 訂正: 同じWorldIDの別ファイルが後で来た時、DBチェックをスキップするためにはprocessedWorldIdsに追加すべき
                }

                // 無視リストに含まれている場合はスキップ
                if (dismissedWorldIds.includes(worldId)) {
                    continue
                }

                // すべてのチェックを通過
                processedWorldIds.add(worldId)
                candidates.push({ worldId, filePath, fileName: file })

            } catch (fileError) {
                console.error(`Failed to process file ${file}:`, fileError)
                continue
            }
        }

        // 2. 候補からランダムに最大4つ選択
        // Fisher-Yates shuffle
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const selectedCandidates = candidates.slice(0, 4)
        const suggestions: WorldSuggestion[] = []

        // 3. 選択された候補の詳細情報を取得
        for (const candidate of selectedCandidates) {
            try {
                // VRChat APIからワールド情報を取得
                const response = await axios.get(`https://api.vrchat.cloud/api/1/worlds/${candidate.worldId}`, {
                    headers: {
                        'User-Agent': 'VRChatWorldManager/1.0 (yamato3010)',
                    },
                })
                const worldData = response.data

                suggestions.push({
                    id: `${candidate.worldId}_${candidate.fileName}`,
                    photoFilePath: candidate.filePath,
                    photoFileName: candidate.fileName,
                    worldId: candidate.worldId,
                    worldName: worldData.name || 'Unknown World',
                    worldAuthor: worldData.authorName,
                    worldThumbnail: worldData.thumbnailImageUrl || worldData.imageUrl,
                    detectedAt: new Date().toISOString(),
                })
            } catch (apiError) {
                console.error(`Failed to fetch world info for ${candidate.worldId}:`, apiError)
                // API取得に失敗しても、基本情報で提案を作成
                suggestions.push({
                    id: `${candidate.worldId}_${candidate.fileName}`,
                    photoFilePath: candidate.filePath,
                    photoFileName: candidate.fileName,
                    worldId: candidate.worldId,
                    worldName: 'Unknown World',
                    detectedAt: new Date().toISOString(),
                })
            }
        }

        console.log(`Found ${candidates.length} candidates, suggesting ${suggestions.length} worlds`)
        return suggestions
    } catch (error) {
        console.error('Failed to scan for new photos:', error)
        return []
    }
}
