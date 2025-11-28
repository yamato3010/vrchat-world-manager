import { ReactNode, useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
    children: ReactNode
    activeView: 'all' | 'group'
    activeGroupId?: number
    onNavigate: (view: 'all' | 'group', groupId?: number) => void
    onAddGroup: () => void
    onDeleteGroup: (group: any) => void
    onAddWorld: () => void
    onAddPhoto: () => void
    refreshTrigger: number
    viewMode: 'grid' | 'list'
    onViewModeChange: (mode: 'grid' | 'list') => void
}

export function Layout({
    children,
    activeView,
    activeGroupId,
    onNavigate,
    onAddGroup,
    onDeleteGroup,
    onAddWorld,
    onAddPhoto,
    refreshTrigger,
    viewMode,
    onViewModeChange
}: LayoutProps) {
    const [groupName, setGroupName] = useState<string>('')

    useEffect(() => {
        const loadGroupName = async () => {
            if (activeView === 'group' && activeGroupId) {
                try {
                    const group = await window.electronAPI.getGroupById(activeGroupId)
                    if (group) {
                        setGroupName(group.name)
                    }
                } catch (error) {
                    console.error('Failed to load group name:', error)
                }
            }
        }
        loadGroupName()
    }, [activeView, activeGroupId, refreshTrigger])

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
                        {activeView === 'all' ? 'All Worlds' : groupName || 'Group View'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-700 rounded-lg p-1 flex mr-2">
                            <button
                                onClick={() => onViewModeChange('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                title="グリッド表示"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                title="リスト表示"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={onAddPhoto}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2"
                        >
                            <span>+</span> 写真を追加
                        </button>
                        <button
                            onClick={onAddWorld}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2"
                        >
                            <span>+</span> ワールドを追加
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
