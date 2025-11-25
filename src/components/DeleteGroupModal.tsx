import { useState } from 'react'
import { Group } from '../types'

interface DeleteGroupModalProps {
    isOpen: boolean
    group: Group | null
    onClose: () => void
    onDelete: (deleteWorlds: boolean) => void
}

export function DeleteGroupModal({ isOpen, group, onClose, onDelete }: DeleteGroupModalProps) {
    const [loading, setLoading] = useState(false)

    if (!isOpen || !group) return null

    const handleDelete = async (deleteWorlds: boolean) => {
        setLoading(true)
        try {
            await onDelete(deleteWorlds)
            onClose()
        } catch (error) {
            console.error('Failed to delete group:', error)
        } finally {
            setLoading(false)
        }
    }

    const worldCount = group._count?.worlds || 0

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white border border-gray-700 shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-red-400">Delete Group</h2>

                <p className="mb-4 text-gray-300">
                    Are you sure you want to delete the group <strong className="text-white">"{group.name}"</strong>?
                </p>

                {worldCount > 0 && (
                    <div className="mb-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
                        <p className="text-yellow-200 text-sm mb-2">
                            ⚠️ This group contains <strong>{worldCount}</strong> world{worldCount > 1 ? 's' : ''}.
                        </p>
                        <p className="text-yellow-300 text-sm">
                            What would you like to do with them?
                        </p>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => handleDelete(false)}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded disabled:opacity-50 transition-colors text-left"
                    >
                        <div className="font-medium">Delete group only</div>
                        <div className="text-sm text-gray-300 mt-1">
                            {worldCount > 0
                                ? `Keep ${worldCount} world${worldCount > 1 ? 's' : ''} in "All Worlds"`
                                : 'The group is empty'}
                        </div>
                    </button>

                    {worldCount > 0 && (
                        <button
                            onClick={() => handleDelete(true)}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded disabled:opacity-50 transition-colors text-left"
                        >
                            <div className="font-medium">Delete group and all worlds</div>
                            <div className="text-sm text-gray-300 mt-1">
                                Permanently delete {worldCount} world{worldCount > 1 ? 's' : ''} from the database
                            </div>
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
