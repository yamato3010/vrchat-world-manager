import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
    children: ReactNode
    activeView: 'all' | 'group'
    activeGroupId?: number
    onNavigate: (view: 'all' | 'group', groupId?: number) => void
    onAddGroup: () => void
    onDeleteGroup: (group: any) => void
    onAddWorld: () => void
    refreshTrigger?: number
}

export function Layout({
    children,
    activeView,
    activeGroupId,
    onNavigate,
    onAddGroup,
    onDeleteGroup,
    onAddWorld,
    refreshTrigger
}: LayoutProps) {
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Sidebar
                activeView={activeView}
                activeGroupId={activeGroupId}
                onNavigate={onNavigate}
                onAddGroup={onAddGroup}
                onDeleteGroup={onDeleteGroup}
                refreshTrigger={refreshTrigger}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-sm z-10">
                    <h1 className="text-xl font-bold text-white">
                        {activeView === 'all' ? 'All Worlds' : 'Group View'}
                    </h1>
                    <button
                        onClick={onAddWorld}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2"
                    >
                        <span>+</span> Add World
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
