import { useState, useEffect } from 'react'
import { Config } from '../types'

interface PhotoDirectorySetupModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (config: Config) => void
    initialConfig?: Config
}

export function PhotoDirectorySetupModal({ isOpen, onClose, onSave, initialConfig }: PhotoDirectorySetupModalProps) {
    const [selectedPath, setSelectedPath] = useState(initialConfig?.photoDirectoryPath || '')
    const [scanPeriodDays, setScanPeriodDays] = useState(initialConfig?.scanPeriodDays || 14)

    // initialConfigが変更されたらstateを更新
    useEffect(() => {
        if (initialConfig) {
            setSelectedPath(initialConfig.photoDirectoryPath || '')
            setScanPeriodDays(initialConfig.scanPeriodDays || 14)
        }
    }, [initialConfig])

    if (!isOpen) return null

    const handleSelectDirectory = async () => {
        const path = await window.electronAPI.selectDirectory()
        if (path) {
            setSelectedPath(path)
        }
    }

    const handleSave = () => {
        onSave({
            photoDirectoryPath: selectedPath,
            scanPeriodDays,
        })
        onClose()
    }

    const handleSkip = () => {
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-white">写真ディレクトリ設定</h2>

                <p className="text-gray-300 text-sm mb-4">
                    VRChatの写真が保存されているディレクトリを設定すると、新しく撮影した写真からワールド情報を自動提案できます。
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            写真ディレクトリ
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={selectedPath}
                                readOnly
                                placeholder="ディレクトリを選択してください"
                                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                            />
                            <button
                                onClick={handleSelectDirectory}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors text-sm"
                            >
                                選択
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            スキャン期間（日数）
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={scanPeriodDays}
                            onChange={(e) => setScanPeriodDays(parseInt(e.target.value) || 14)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            この期間内に撮影された写真のみがスキャン対象になります
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleSkip}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        閉じる
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedPath}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
}
