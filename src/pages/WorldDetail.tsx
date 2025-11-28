import { useEffect, useState } from 'react'
import { World, Group, Photo } from '../types'
import { PhotoUploadZone } from '../components/PhotoUploadZone'

interface WorldDetailProps {
    worldId: number
    onBack: () => void
    startInEditMode?: boolean
}

function PhotoItem({ photo, onDelete }: { photo: Photo; onDelete: () => void }) {
    const [imageData, setImageData] = useState<string | null>(null)

    useEffect(() => {
        const loadImage = async () => {
            // ローカルの画像を表示するためにbase64に変換する
            try {
                const base64 = await window.electronAPI.readImageBase64(photo.filePath)
                setImageData(`data:image/png;base64,${base64}`)
            } catch (error) {
                console.error('Failed to load image:', error)
            }
        }
        loadImage()
    }, [photo.filePath])

    return (
        <div className="relative group">
            {imageData ? (
                <img
                    src={imageData}
                    alt={photo.originalFileName}
                    className="w-full h-32 object-cover rounded"
                />
            ) : (
                <div className="w-full h-32 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Loading...</span>
                </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                    onClick={onDelete}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                    削除
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">{photo.originalFileName}</p>
        </div>
    )
}

export function WorldDetail({ worldId, onBack, startInEditMode = false }: WorldDetailProps) {
    const [world, setWorld] = useState<World | null>(null)
    const [groups, setGroups] = useState<Group[]>([])
    const [assignedGroupIds, setAssignedGroupIds] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(startInEditMode)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [editData, setEditData] = useState({
        name: '',
        authorName: '',
        description: '',
        userMemo: '',
    })

    const [tags, setTags] = useState<string[]>([])
    const [newTagInput, setNewTagInput] = useState('')

    useEffect(() => {
        loadWorldDetail()
        loadGroups()
        loadPhotos()
    }, [worldId])

    const loadWorldDetail = async () => {
        try {
            const data = await window.electronAPI.getWorldById(worldId)
            if (data) {
                setWorld(data)

                // Parse tags
                let parsedTags: string[] = []
                if (data.tags) {
                    try {
                        const parsed = JSON.parse(data.tags)
                        if (Array.isArray(parsed)) {
                            parsedTags = parsed
                        }
                    } catch (e) {
                        // カンマ区切りの古いフォーマットのフォールバックがある場合
                        parsedTags = data.tags.split(',').map(t => t.trim()).filter(t => t)
                    }
                }
                setTags(parsedTags)

                setEditData({
                    name: data.name,
                    authorName: data.authorName || '',
                    description: data.description || '',
                    userMemo: data.userMemo || '',
                })
                // ワールドデータから割り当てられたグループIDを抽出する
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

    const loadPhotos = async () => {
        try {
            const data = await window.electronAPI.getPhotosByWorld(worldId)
            setPhotos(data)
        } catch (error) {
            console.error('Failed to load photos:', error)
        }
    }

    const handlePhotoUploaded = () => {
        loadPhotos()
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
            // サイドバーのグループリストを更新するためにonBackを一度呼んで戻す
            window.dispatchEvent(new Event('groups-changed'))
        } catch (error) {
            console.error('Failed to update group assignment:', error)
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        if (world) {
            setEditData({
                name: world.name,
                authorName: world.authorName || '',
                description: world.description || '',
                userMemo: world.userMemo || '',
            })
            let parsedTags: string[] = []
            if (world.tags) {
                try {
                    const parsed = JSON.parse(world.tags)
                    if (Array.isArray(parsed)) parsedTags = parsed
                } catch (e) {
                    parsedTags = world.tags.split(',').map(t => t.trim()).filter(t => t)
                }
            }
            setTags(parsedTags)
        }
        setIsEditing(false)
    }

    const handleSaveEdit = async () => {
        try {
            const updatePayload = {
                ...editData,
                tags: JSON.stringify(tags)
            }
            const updatedWorld = await window.electronAPI.updateWorld(worldId, updatePayload)
            setWorld(updatedWorld)
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update world:', error)
        }
    }

    const handleAddTag = () => {
        if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
            setTags([...tags, newTagInput.trim()])
            setNewTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
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
                    <div className="flex justify-between items-start mb-4">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="text-3xl font-bold bg-gray-700 rounded px-3 py-2 flex-1 mr-4"
                            />
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold">{world.name}</h1>
                                <div className="flex space-x-2">
                                    {world.vrchatWorldId && (
                                        <button
                                            onClick={() => window.electronAPI.openExternalLink(`https://vrchat.com/home/world/${world.vrchatWorldId}/info`)}
                                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                                            title="VRChat公式サイトで開く"
                                        >
                                            <span className="mr-2">🌐</span> サイトで開く
                                        </button>
                                    )}
                                    <button
                                        onClick={handleEdit}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        編集
                                    </button>
                                </div>
                            </>
                        )}

                        {isEditing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                                >
                                    保存
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">作者</label>
                            <input
                                type="text"
                                value={editData.authorName}
                                onChange={(e) => setEditData({ ...editData, authorName: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            />
                        </div>
                    ) : (
                        world.authorName && (
                            <p className="text-gray-400 mb-4">作者: {world.authorName}</p>
                        )
                    )}

                    {isEditing ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">説明</label>
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2 h-32"
                            />
                        </div>
                    ) : (
                        world.description && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-2">説明</h2>
                                <p className="text-gray-300 whitespace-pre-wrap">{world.description}</p>
                            </div>
                        )
                    )}

                    {isEditing ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1 text-yellow-400">メモ</label>
                            <textarea
                                value={editData.userMemo}
                                onChange={(e) => setEditData({ ...editData, userMemo: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2 h-24"
                            />
                        </div>
                    ) : (
                        world.userMemo && (
                            <div className="mb-6 bg-gray-700 p-4 rounded">
                                <h2 className="text-xl font-semibold mb-2 text-yellow-400">メモ</h2>
                                <p className="text-gray-200 whitespace-pre-wrap">{world.userMemo}</p>
                            </div>
                        )
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

                    {/* 写真アップロードとギャラリー */}
                    <div className="mb-6 border-t border-gray-700 pt-6">
                        <h2 className="text-xl font-semibold mb-4">写真</h2>

                        <PhotoUploadZone onPhotoUploaded={handlePhotoUploaded} worldId={world.id} />

                        {photos.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3">ギャラリー ({photos.length})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {photos.map((photo) => (
                                        <PhotoItem
                                            key={photo.id}
                                            photo={photo}
                                            onDelete={async () => {
                                                if (confirm('この写真を削除しますか？')) {
                                                    await window.electronAPI.deletePhoto(photo.id)
                                                    loadPhotos()
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {world.vrchatWorldId && (
                        <div className="text-sm text-gray-500 mt-6">
                            VRChat ID: <code className="bg-gray-700 px-2 py-1 rounded">{world.vrchatWorldId}</code>
                        </div>
                    )}

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-2">タグ</h2>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span key={index} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                                    {tag}
                                    {isEditing && (
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-2 text-gray-500 hover:text-red-400 focus:outline-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                            {isEditing && (
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="タグを追加"
                                        className="bg-gray-700 text-white px-3 py-1 rounded-l-full text-sm focus:outline-none w-32"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded-r-full text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                        {!isEditing && tags.length === 0 && (
                            <p className="text-gray-500 text-sm italic">タグはありません</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
