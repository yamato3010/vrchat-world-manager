import { useState } from 'react'

interface AddWorldModalProps {
    isOpen: boolean
    onClose: () => void
    onWorldAdded: () => void
    groupId?: number
}

export function AddWorldModal({ isOpen, onClose, onWorldAdded, groupId }: AddWorldModalProps) {
    const [vrchatUrlOrId, setVrchatUrlOrId] = useState('')
    const [manualData, setManualData] = useState({
        name: '',
        authorName: '',
        description: '',
        thumbnailUrl: '',
        userMemo: '',
        tags: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleFetch = async () => {
        setLoading(true)
        setError('')
        try {
            // Extract ID from URL if needed (simple regex)
            let worldId = vrchatUrlOrId
            const match = vrchatUrlOrId.match(/(wrld_[a-f0-9-]+)/)
            if (match) {
                worldId = match[1]
            }

            if (!worldId.startsWith('wrld_')) {
                throw new Error('ワールドのURLまたはIDが無効です！')
            }

            const data = await window.electronAPI.fetchVRChatWorld(worldId)
            setManualData({
                ...manualData,
                name: data.name,
                authorName: data.authorName,
                description: data.description,
                thumbnailUrl: data.thumbnailImageUrl,
                tags: data.tags ? data.tags.join(', ') : '',
            })
        } catch (err: any) {
            setError('ワールドの取得に失敗しました: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setVrchatUrlOrId('')
        setManualData({
            name: '',
            authorName: '',
            description: '',
            thumbnailUrl: '',
            userMemo: '',
            tags: '',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // カンマ区切りタグをJSON文字列配列に変換する
            const tagsArray = manualData.tags.split(',').map(t => t.trim()).filter(t => t)
            const tagsJson = JSON.stringify(tagsArray)

            const createdWorld = await window.electronAPI.createWorld({
                vrchatWorldId: vrchatUrlOrId.match(/(wrld_[a-f0-9-]+)/)?.[1] || undefined,
                ...manualData,
                tags: tagsJson,
            })

            // If groupId is provided, automatically add world to that group
            if (groupId && createdWorld) {
                try {
                    await window.electronAPI.addWorldToGroup(createdWorld.id, groupId)
                } catch (err) {
                    console.error('Failed to add world to group:', err)
                    // Don't fail the entire operation if group assignment fails
                }
            }

            onWorldAdded()
            onClose()
            resetForm()
        } catch (err: any) {
            setError('Failed to save world: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">ワールドを追加</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">ワールドのURL または ID（任意）</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-gray-700 rounded px-3 py-2"
                            value={vrchatUrlOrId}
                            onChange={(e) => setVrchatUrlOrId(e.target.value)}
                            placeholder="https://vrchat.com/home/world/wrld_..."
                        />
                        <button
                            onClick={handleFetch}
                            disabled={loading || !vrchatUrlOrId}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
                        >
                            ワールド情報取得
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">ワールド名 *</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                value={manualData.name}
                                onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">作者</label>
                            <input
                                type="text"
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                value={manualData.authorName}
                                onChange={(e) => setManualData({ ...manualData, authorName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">説明</label>
                        <textarea
                            className="w-full bg-gray-700 rounded px-3 py-2 h-20"
                            value={manualData.description}
                            onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">サムネイル URL</label>
                        <input
                            type="text"
                            className="w-full bg-gray-700 rounded px-3 py-2"
                            value={manualData.thumbnailUrl}
                            onChange={(e) => setManualData({ ...manualData, thumbnailUrl: e.target.value })}
                        />
                    </div>

                    {manualData.thumbnailUrl && (
                        <img src={manualData.thumbnailUrl} alt="Preview" className="h-32 object-cover rounded" />
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">メモ</label>
                        <textarea
                            className="w-full bg-gray-700 rounded px-3 py-2"
                            value={manualData.userMemo}
                            onChange={(e) => setManualData({ ...manualData, userMemo: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">タグ (カンマ区切り)</label>
                        <input
                            type="text"
                            className="w-full bg-gray-700 rounded px-3 py-2"
                            value={manualData.tags}
                            onChange={(e) => setManualData({ ...manualData, tags: e.target.value })}
                            placeholder="VRChat, Game, Horror"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? '保存中...' : 'ワールドを保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
