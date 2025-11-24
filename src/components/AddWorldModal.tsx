import { useState } from 'react'

interface AddWorldModalProps {
    isOpen: boolean
    onClose: () => void
    onWorldAdded: () => void
}

export function AddWorldModal({ isOpen, onClose, onWorldAdded }: AddWorldModalProps) {
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
                throw new Error('Invalid World ID format')
            }

            const data = await window.electronAPI.fetchVRChatWorld(worldId)
            setManualData({
                ...manualData,
                name: data.name,
                authorName: data.authorName,
                description: data.description,
                thumbnailUrl: data.thumbnailImageUrl,
            })
        } catch (err: any) {
            setError('Failed to fetch world: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await window.electronAPI.createWorld({
                vrchatWorldId: vrchatUrlOrId.match(/(wrld_[a-f0-9-]+)/)?.[1] || undefined,
                ...manualData,
            })
            onWorldAdded()
            onClose()
            // Reset form
            setVrchatUrlOrId('')
            setManualData({
                name: '',
                authorName: '',
                description: '',
                thumbnailUrl: '',
                userMemo: '',
                tags: '',
            })
        } catch (err: any) {
            setError('Failed to save world: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white">
                <h2 className="text-xl font-bold mb-4">Add World</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">VRChat URL or ID (Optional)</label>
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
                            Fetch
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">World Name *</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                value={manualData.name}
                                onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Author</label>
                            <input
                                type="text"
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                value={manualData.authorName}
                                onChange={(e) => setManualData({ ...manualData, authorName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full bg-gray-700 rounded px-3 py-2 h-20"
                            value={manualData.description}
                            onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
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
                        <label className="block text-sm font-medium mb-1">My Memo</label>
                        <textarea
                            className="w-full bg-gray-700 rounded px-3 py-2"
                            value={manualData.userMemo}
                            onChange={(e) => setManualData({ ...manualData, userMemo: e.target.value })}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save World'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
