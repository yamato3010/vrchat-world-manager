import { useEffect, useState } from 'react'
import { World } from '../types'

interface WorldListProps {
    refreshTrigger: number
    onWorldClick: (worldId: number, shouldEdit?: boolean) => void
    groupId?: number
    viewMode: 'grid' | 'list'
    searchQuery: string
}

export function WorldList({ refreshTrigger, onWorldClick, groupId, viewMode, searchQuery }: WorldListProps) {
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

    if (worlds.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                まだワールドが追加されていません。「ワールドを追加」をクリックして始めましょう。
            </div>
        )
    }

    const parseTags = (tagsString?: string): string[] => {
        if (!tagsString) return []
        try {
            const parsed = JSON.parse(tagsString)
            if (Array.isArray(parsed)) return parsed
            return []
        } catch (e) {
            return tagsString.split(',').map(t => t.trim()).filter(t => t)
        }
    }

    // 検索ロジック
    const filteredWorlds = worlds.filter(world => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()

        // ワールド名で検索
        if (world.name.toLowerCase().includes(query)) return true

        // 作者名で検索
        if (world.authorName?.toLowerCase().includes(query)) return true

        // メモで検索
        if (world.userMemo?.toLowerCase().includes(query)) return true

        // タグで検索
        const tags = parseTags(world.tags)
        if (tags.some(tag => tag.toLowerCase().includes(query))) return true

        return false
    })

    if (viewMode === 'list') {
        return (
            <div className="p-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                            <th className="p-3 w-24">画像</th>
                            <th className="p-3">ワールド名</th>
                            <th className="p-3">作者</th>
                            <th className="p-3">タグ</th>
                            <th className="p-3">メモ</th>
                            <th className="p-3 w-40">アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorlds.map((world) => {
                            const tags = parseTags(world.tags)
                            return (
                                <tr
                                    key={world.id}
                                    className="border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                                    onClick={() => onWorldClick(world.id)}
                                >
                                    <td className="p-3">
                                        <div className="w-16 h-12 bg-gray-700 rounded overflow-hidden">
                                            {world.thumbnailUrl ? (
                                                <img src={world.thumbnailUrl} alt={world.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 font-medium">{world.name}</td>
                                    <td className="p-3 text-gray-400">{world.authorName}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                                                    {tag}
                                                </span>
                                            ))}
                                            {tags.length > 3 && (
                                                <span className="text-xs text-gray-500">+{tags.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-400 truncate max-w-xs">{world.userMemo}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            {world.vrchatWorldId && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.electronAPI.openExternalLink(`https://vrchat.com/home/world/${world.vrchatWorldId}/info`)
                                                    }}
                                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
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
                                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(world.id)
                                                }}
                                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredWorlds.map((world) => {
                const tags = parseTags(world.tags)
                return (
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

                            {tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                                            {tag}
                                        </span>
                                    ))}
                                    {tags.length > 3 && (
                                        <span className="text-xs text-gray-500">+{tags.length - 3}</span>
                                    )}
                                </div>
                            )}

                            {world.userMemo && (
                                <div className="mt-2 text-sm bg-gray-700 p-2 rounded">
                                    <span className="text-yellow-500 text-xs font-bold">メモ:</span> {world.userMemo}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
