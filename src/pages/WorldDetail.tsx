import { useEffect, useState } from 'react'
import { World, Group } from '../types'

interface WorldDetailProps {
    worldId: number
    onBack: () => void
}

export function WorldDetail({ worldId, onBack }: WorldDetailProps) {
    const [world, setWorld] = useState<World | null>(null)
    const [groups, setGroups] = useState<Group[]>([])
    const [assignedGroupIds, setAssignedGroupIds] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorldDetail()
        loadGroups()
    }, [worldId])

    const loadWorldDetail = async () => {
        try {
            const data = await window.electronAPI.getWorldById(worldId)
            if (data) {
                setWorld(data)
                // Extract assigned group IDs from the world data
                const groupIds = new Set<number>(
                    (data as any).groups?.map((wog: any) => wog.groupId as number) || []
                )
                setAssignedGroupIds(groupIds)
            }
        } catch (error) {
            console.error('Failed to load world:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadGroups = async () => {
        try {
            const data = await window.electronAPI.getGroups()
            setGroups(data)
        } catch (error) {
            console.error('Failed to load groups:', error)
        }
    }

    const handleGroupToggle = async (groupId: number, isChecked: boolean) => {
        try {
            if (isChecked) {
                await window.electronAPI.addWorldToGroup(worldId, groupId)
                setAssignedGroupIds(prev => new Set([...prev, groupId]))
            } else {
                await window.electronAPI.removeWorldFromGroup(worldId, groupId)
                setAssignedGroupIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(groupId)
                    return newSet
                })
            }
        } catch (error) {
            console.error('Failed to update group assignment:', error)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full">読み込み中...</div>
    }

    if (!world) {
        return <div className="flex items-center justify-center h-full">ワールドが見つかりません</div>
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="mb-4 text-purple-400 hover:text-purple-300 flex items-center gap-2"
            >
                ← 一覧に戻る
            </button>

            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                {world.thumbnailUrl && (
                    <img
                        src={world.thumbnailUrl}
                        alt={world.name}
                        className="w-full h-64 object-cover"
                    />
                )}

                <div className="p-6">
                    <h1 className="text-3xl font-bold mb-2">{world.name}</h1>
                    {world.authorName && (
                        <p className="text-gray-400 mb-4">作者: {world.authorName}</p>
                    )}

                    {world.description && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">説明</h2>
                            <p className="text-gray-300 whitespace-pre-wrap">{world.description}</p>
                        </div>
                    )}

                    {world.userMemo && (
                        <div className="mb-6 bg-gray-700 p-4 rounded">
                            <h2 className="text-xl font-semibold mb-2 text-yellow-400">メモ</h2>
                            <p className="text-gray-200 whitespace-pre-wrap">{world.userMemo}</p>
                        </div>
                    )}

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">グループに割り当て</h2>
                        {groups.length === 0 ? (
                            <p className="text-gray-500 italic">グループがまだ作成されていません。サイドバーでグループを作成してください。</p>
                        ) : (
                            <div className="space-y-2">
                                {groups.map(group => (
                                    <label
                                        key={group.id}
                                        className="flex items-center gap-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={assignedGroupIds.has(group.id)}
                                            onChange={(e) => handleGroupToggle(group.id, e.target.checked)}
                                            className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{group.name}</div>
                                            {group.description && (
                                                <div className="text-sm text-gray-400">{group.description}</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {world.vrchatWorldId && (
                        <div className="text-sm text-gray-500 mt-6">
                            VRChat ID: <code className="bg-gray-700 px-2 py-1 rounded">{world.vrchatWorldId}</code>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
