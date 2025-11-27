import { useEffect, useState } from 'react'
import { World } from '../types'

interface WorldListProps {
    refreshTrigger: number
    onWorldClick: (worldId: number, shouldEdit?: boolean) => void
    groupId?: number
}

export function WorldList({ refreshTrigger, onWorldClick, groupId }: WorldListProps) {
    const [worlds, setWorlds] = useState<World[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorlds()
    }, [refreshTrigger, groupId])

    const loadWorlds = async () => {
        setLoading(true)
        try {
            const data = await window.electronAPI.getWorlds(groupId)
            setWorlds(data)
        } catch (error) {
            console.error('Failed to load worlds:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (confirm('本当にこのワールドを削除しますか？')) {
            await window.electronAPI.deleteWorld(id)
            loadWorlds()
        }
    }

    if (loading) return <div className="text-center p-4">読み込み中...</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {worlds.map((world) => (
                <div key={world.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 cursor-pointer hover:border-purple-500 transition-colors">
                    <div className="h-48 bg-gray-700 relative group" onClick={() => onWorldClick(world.id)}>
                        {world.thumbnailUrl ? (
                            <img src={world.thumbnailUrl} alt={world.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                画像なし
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2 items-center">
                                {world.vrchatWorldId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.electronAPI.openExternalLink(`https://vrchat.com/home/world/${world.vrchatWorldId}/info`)
                                        }}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                        title="公式サイト"
                                    >
                                        🌐
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onWorldClick(world.id, true)
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                    編集
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(world.id)
                                    }}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4" onClick={() => onWorldClick(world.id)}>
                        <h3 className="font-bold text-lg truncate" title={world.name}>{world.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{world.authorName}</p>
                        {world.userMemo && (
                            <div className="mt-2 text-sm bg-gray-700 p-2 rounded">
                                <span className="text-yellow-500 text-xs font-bold">メモ:</span> {world.userMemo}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {worlds.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                    まだワールドが追加されていません。「ワールドを追加」をクリックして始めましょう。
                </div>
            )}
        </div>
    )
}
