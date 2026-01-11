import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface Config {
    photoDirectoryPath?: string
    scanPeriodDays?: number
    dismissedWorldIds?: string[]  // 無視したワールドIDのリスト
}

const DEFAULT_CONFIG: Config = {
    scanPeriodDays: 14,
    dismissedWorldIds: [],
}

let configPath: string

function getConfigPath(): string {
    if (!configPath) {
        const userDataPath = app.getPath('userData')
        configPath = path.join(userDataPath, 'config.json')
    }
    return configPath
}

export async function loadConfig(): Promise<Config> {
    const filePath = getConfigPath()
    try {
        // ファイルが存在しない場合はデフォルト値を返す（正常系）
        const data = await fs.promises.readFile(filePath, 'utf-8')

        if (!data.trim()) {
            return DEFAULT_CONFIG
        }

        try {
            const config = JSON.parse(data)
            return { ...DEFAULT_CONFIG, ...config }
        } catch (parseError) {
            console.warn('Config file is corrupted, using defaults:', parseError)
            return DEFAULT_CONFIG
        }
    } catch (error: any) {
        // ファイルが存在しない場合はデフォルト値を返す
        if (error.code === 'ENOENT') {
            return DEFAULT_CONFIG
        }

        // 権限エラーなどは異常系としてスローする
        console.error('Failed to load config:', error)
        throw error
    }
}

export async function saveConfig(config: Config): Promise<void> {
    const filePath = getConfigPath()
    try {
        const dirPath = path.dirname(filePath)
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true })
        }
        const data = JSON.stringify(config, null, 2)
        await fs.promises.writeFile(filePath, data, 'utf-8')
    } catch (error) {
        console.error('Failed to save config:', error)
        throw error
    }
}
