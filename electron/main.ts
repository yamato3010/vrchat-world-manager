import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js')

    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Added to troubleshooting preload loading
        },
        width: 1100,
        minWidth: 1100,
        height: 600,
        minHeight: 600,
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST!, 'index.html'))
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

import { registerIpcHandlers } from './ipcHandlers'

// Register IPC handlers before app is ready
registerIpcHandlers()

// Auto-updater configuration
function initAutoUpdater() {
    // 開発環境では自動更新を無効化
    if (VITE_DEV_SERVER_URL) {
        console.log('Auto-update disabled in development mode')
        return
    }

    // 自動ダウンロードを有効化
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...')
    })

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info)
    })

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available:', info)
    })

    autoUpdater.on('error', (err) => {
        console.error('Error in auto-updater:', err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
        console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`)
    })

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info)
        // アプリ終了時に自動的にインストールされる
    })

    // 起動時に更新をチェック
    autoUpdater.checkForUpdatesAndNotify()

    // 15分ごとに更新をチェック
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify()
    }, 15 * 60 * 1000)
}

app.whenReady().then(() => {
    createWindow()
    initAutoUpdater()
})
