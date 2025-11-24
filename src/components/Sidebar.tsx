import { useState } from 'react'

interface SidebarProps {
    activeView: 'all' | 'group'
    activeGroupId?: number
    onNavigate: (view: 'all' | 'group', groupId?: number) => void
    onAddGroup: () => void
}

export function Sidebar({ activeView, activeGroupId, onNavigate, onAddGroup }: SidebarProps) {
    // Placeholder for groups - in Phase 1.5 we might not have groups fully working in UI yet
    // but we should prepare the structure.
    const [groups] = useState<{ id: number; name: string }[]>([
        // Mock data for UI dev, or empty if we want to fetch real data later
    ])

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

                    <li className="pt-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Groups
                    </li>

                    {groups.map((group) => (
                        <li key={group.id}>
                            <button
                                onClick={() => onNavigate('group', group.id)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${activeView === 'group' && activeGroupId === group.id
                                        ? 'bg-gray-700 text-purple-400 font-medium'
                                        : 'text-gray-300'
                                    }`}
                            >
                                {group.name}
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
