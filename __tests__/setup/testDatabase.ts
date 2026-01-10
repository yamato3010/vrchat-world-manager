import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const TEST_DB_PATH = path.join(__dirname, '../../prisma/test.db')

let prisma: PrismaClient

/**
 * テスト用データベースをセットアップ
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
    // 既存のテストDBを削除
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
    }

    // 環境変数を設定
    process.env.DATABASE_URL = `file:${TEST_DB_PATH}`

    // データベースをプッシュ（マイグレーション適用）
    execSync('npx prisma db push --skip-generate', {
        env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
        stdio: 'ignore',
    })

    // Prismaクライアントを作成
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: `file:${TEST_DB_PATH}`,
            },
        },
    })

    return prisma
}

/**
 * テスト用データベースをクリーンアップ
 */
export async function cleanupTestDatabase() {
    if (prisma) {
        await prisma.$disconnect()
    }

    // テストDB削除
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH)
    }
}

/**
 * データベースをリセット（全テーブルのデータ削除）
 */
export async function resetTestDatabase() {
    if (!prisma) {
        throw new Error('Test database not initialized')
    }

    // 全テーブルのデータを削除
    await prisma.photo.deleteMany()
    await prisma.worldOnGroup.deleteMany()
    await prisma.world.deleteMany()
    await prisma.group.deleteMany()
}

/**
 * テスト用データベースのPrismaクライアントを取得
 */
export function getTestPrisma(): PrismaClient {
    if (!prisma) {
        throw new Error('Test database not initialized. Call setupTestDatabase() first.')
    }
    return prisma
}
