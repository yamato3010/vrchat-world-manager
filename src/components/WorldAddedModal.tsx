interface WorldAddedModalProps {
    isOpen: boolean
    onClose: () => void
    world: {
        id: number
        name: string
        authorName?: string
        thumbnailUrl?: string
    } | null
}

export function WorldAddedModal({ isOpen, onClose, world }: WorldAddedModalProps) {
    if (!isOpen || !world) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
                <h2 className="text-xl font-bold mb-4 text-green-400">✓ ワールドを追加しました</h2>

                <div className="bg-gray-700 rounded-lg overflow-hidden">
                    {world.thumbnailUrl && (
                        <div className="h-48 bg-gray-900">
                            <img
                                src={world.thumbnailUrl}
                                alt={world.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className="p-4">
                        <h3 className="font-bold text-lg">{world.name}</h3>
                        {world.authorName && (
                            <p className="text-sm text-gray-400 mt-1">作者: {world.authorName}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}
