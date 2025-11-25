import { useState, useEffect } from 'react'
import { Group } from '../types'

interface SidebarProps {
    activeView: 'all' | 'group'
    activeGroupId?: number
    onNavigate: (view: 'all' | 'group', groupId?: number) => void
    onAddGroup: () => void
    onDeleteGroup: (group: Group) => void
    refreshTrigger?: number // Add refresh trigger to reload groups
}

export function Sidebar({ activeView, activeGroupId, onNavigate, onAddGroup, onDeleteGroup, refreshTrigger }: SidebarProps) {
    const [groups, setGroups] = useState<Group[]>([])

    useEffect(() => {
        loadGroups()
    }, [refreshTrigger])

    const loadGroups = async () => {
        try {
            const data = await window.electronAPI.getGroups()
            setGroups(data)
        } catch (error) {
            console.error('Failed to load groups:', error)
        }
    }

    return (
        <aside className="w-64 bg-gray-800 flex flex-col h-full border-r border-gray-700">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">Library</h2>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => onNavigate('all')}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${activeView === 'all' ? 'bg-gray-700 text-purple-400 font-medium' : 'text-gray-300'
                                }`}
                        >
                            All Worlds
                        </button>
                    </li>

                    <li className="pt-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Groups</span>
                    </li>

                    {groups.map((group) => (
                        <li key={group.id} className="group/item relative">
                            <button
                                onClick={() => onNavigate('group', group.id)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex justify-between items-center ${activeView === 'group' && activeGroupId === group.id
                                    ? 'bg-gray-700 text-purple-400 font-medium'
                                    : 'text-gray-300'
                                    }`}
                            >
                                <span className="truncate flex-1">{group.name}</span>
                                <div className="flex items-center gap-2">
                                    {group._count && group._count.worlds > 0 && (
                                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full text-gray-300">
                                            {group._count.worlds}
                                        </span>
                                    )}
                                    <div
                                        role="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteGroup(group)
                                        }}
                                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-600 rounded transition-all text-gray-400 hover:text-white cursor-pointer"
                                        title="Delete group"
                                    >
                                        🗑️
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}

                    <li className="px-4 pt-2">
                        <button
                            onClick={onAddGroup}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <span className="text-lg">+</span> Create Group
                        </button>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                VRChat World Manager v1.0
            </div>
        </aside>
    )
}
