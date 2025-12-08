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
    onOpenSettings: () => void
    refreshTrigger: number
    viewMode: 'grid' | 'list'
    onViewModeChange: (mode: 'grid' | 'list') => void
    searchQuery: string
    onSearchChange: (query: string) => void
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
    onOpenSettings,
    refreshTrigger,
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange
}: LayoutProps) {
    const [groupName, setGroupName] = useState<string>('')
    const [searchExpanded, setSearchExpanded] = useState(false)

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
                        <button
                            onClick={onOpenSettings}
                            className="bg-gray-700 rounded-lg h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-200"
                            title="設定"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        {searchExpanded ? (
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onBlur={() => {
                                    if (!searchQuery) setSearchExpanded(false)
                                }}
                                placeholder="ワールド名、タグ、メモで検索..."
                                className="bg-gray-700 text-white px-3 h-9 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm w-64"
                                autoFocus
                            />
                        ) : (
                            <button
                                onClick={() => setSearchExpanded(true)}
                                className="bg-gray-700 rounded-lg h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-200"
                                title="検索"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        )}
                        <div className="bg-gray-700 rounded-lg h-9 flex">
                            <button
                                onClick={() => onViewModeChange('grid')}
                                className={`px-2 rounded flex items-center justify-center ${viewMode === 'grid' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                title="グリッド表示"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={`px-2 rounded flex items-center justify-center ${viewMode === 'list' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                title="リスト表示"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={onAddPhoto}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 h-9 rounded shadow transition-colors flex items-center gap-2"
                        >
                            <span>+</span> 写真を追加
                        </button>
                        <button
                            onClick={onAddWorld}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-9 rounded shadow transition-colors flex items-center gap-2"
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
