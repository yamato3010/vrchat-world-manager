import { useState } from 'react'
import { CreateGroupData } from '../types'

interface AddGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onGroupAdded: () => void
}

export function AddGroupModal({ isOpen, onClose, onGroupAdded }: AddGroupModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data: CreateGroupData = {
                name,
                description,
            }
            await window.electronAPI.createGroup(data)
            onGroupAdded()
            onClose()
            setName('')
            setDescription('')
        } catch (err: any) {
            setError('Failed to create group: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white border border-gray-700 shadow-xl">
                <h2 className="text-xl font-bold mb-4">Create New Group</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Group Name *</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Favorites, Horror, Chill"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full bg-gray-700 rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-gray-700 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
