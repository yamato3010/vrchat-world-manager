import { useEffect, useState } from 'react'
import { World } from '../types'

interface WorldListProps {
    refreshTrigger: number
}

export function WorldList({ refreshTrigger }: WorldListProps) {
    const [worlds, setWorlds] = useState<World[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorlds()
    }, [refreshTrigger])

    const loadWorlds = async () => {
        setLoading(true)
        try {
            const data = await window.electronAPI.getWorlds()
            setWorlds(data)
        } catch (error) {
            console.error('Failed to load worlds:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this world?')) {
            await window.electronAPI.deleteWorld(id)
            loadWorlds()
        }
    }

    if (loading) return <div className="text-center p-4">Loading worlds...</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {worlds.map((world) => (
                <div key={world.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
                    <div className="h-48 bg-gray-700 relative group">
                        {world.thumbnailUrl ? (
                            <img src={world.thumbnailUrl} alt={world.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No Image
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => handleDelete(world.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-lg truncate" title={world.name}>{world.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{world.authorName}</p>
                        {world.userMemo && (
                            <div className="mt-2 text-sm bg-gray-700 p-2 rounded">
                                <span className="text-yellow-500 text-xs font-bold">MEMO:</span> {world.userMemo}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {worlds.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                    No worlds added yet. Click "Add World" to get started.
                </div>
            )}
        </div>
    )
}
