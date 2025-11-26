import { useState } from 'react'

interface PhotoUploadZoneProps {
    onPhotoUploaded: () => void
    worldId?: number
}

export function PhotoUploadZone({ onPhotoUploaded, worldId }: PhotoUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const pngFiles = files.filter(f => f.name.toLowerCase().endsWith('.png'))

        if (pngFiles.length === 0) {
            alert('PNGファイルのみアップロード可能です')
            return
        }

        // 最初のPNGファイルのみ処理する
        const file = pngFiles[0]
        setUploading(true)
        setLastResult(null)

        try {
            // ElectronのwebUtilsを使用してファイルパスを取得する
            const filePath = window.electronAPI.getPathForFile(file)
            const result = await window.electronAPI.importPhoto(filePath, worldId)
            setLastResult(result)

            if (result.success) {
                onPhotoUploaded()
            }
        } catch (error: any) {
            setLastResult({
                success: false,
                error: error.message,
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                    ? 'border-purple-500 bg-purple-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-800'
                    } ${uploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-lg mb-1">写真をここにドラッグ&ドロップ</p>
                <p className="text-sm text-gray-400">PNG形式のみ対応</p>
                {uploading && <p className="mt-4 text-purple-400">アップロード中...</p>}
            </div>

            {lastResult && (
                <div className={`p-4 rounded-lg ${lastResult.success ? 'bg-green-900 bg-opacity-30 border border-green-600' : 'bg-red-900 bg-opacity-30 border border-red-600'}`}>
                    {lastResult.success ? (
                        <div>
                            <p className="font-bold text-green-400 mb-2">✓ 写真をアップロードしました</p>
                            {lastResult.extractedWorldId && (
                                <p className="text-sm text-gray-300">
                                    World ID: <code className="bg-gray-700 px-2 py-1 rounded">{lastResult.extractedWorldId}</code>
                                </p>
                            )}
                            {lastResult.metadata && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300">
                                        デバッグ: メタデータを表示
                                    </summary>
                                    <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-auto max-h-64">
                                        {JSON.stringify(lastResult.metadata, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-red-400 mb-2">✗ アップロードに失敗しました</p>
                            <p className="text-sm text-gray-300">{lastResult.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
