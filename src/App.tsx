import { useState, useEffect } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'
import { AddGroupModal } from './components/AddGroupModal'
import { DeleteGroupModal } from './components/DeleteGroupModal'
import { AddPhotoModal } from './components/AddPhotoModal'
import { WorldDetail } from './pages/WorldDetail'
import { Layout } from './components/Layout'
import { PhotoDirectorySetupModal } from './components/PhotoDirectorySetupModal'
import { Group, WorldSuggestion, Config } from './types'
import './index.css'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false)
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeView, setActiveView] = useState<'all' | 'group'>('all')
    const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined)
    const [selectedWorldId, setSelectedWorldId] = useState<number | null>(null)
    const [startInEditMode, setStartInEditMode] = useState(false)
    const [suggestions, setSuggestions] = useState<WorldSuggestion[]>([])
    const [config, setConfig] = useState<Config>({})

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')

    // グループ変更イベントをリッスン
    useEffect(() => {
        const handleGroupsChanged = () => {
            setRefreshTrigger(prev => prev + 1)
        }
        window.addEventListener('groups-changed', handleGroupsChanged)
        return () => window.removeEventListener('groups-changed', handleGroupsChanged)
    }, [])

    // 起動時に設定を読み込んで写真をスキャン
    useEffect(() => {
        const loadConfigAndScan = async () => {
            try {
                const loadedConfig = await window.electronAPI.getConfig()
                setConfig(loadedConfig)

                if (loadedConfig.photoDirectoryPath) {
                    const worldSuggestions = await window.electronAPI.getWorldSuggestions()
                    setSuggestions(worldSuggestions)
                }
            } catch (error) {
                console.error('Failed to load config or scan photos:', error)
            }
        }
        loadConfigAndScan()
    }, [])

    const handleWorldAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handlePhotoAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleGroupAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleNavigate = (view: 'all' | 'group', groupId?: number) => {
        setActiveView(view)
        setActiveGroupId(groupId)
        setSelectedWorldId(null) // 遷移したらワールドの選択状態をリセット
    }

    const handleWorldClick = (worldId: number, shouldEdit: boolean = false) => {
        setSelectedWorldId(worldId)
        setStartInEditMode(shouldEdit)
    }

    const handleBackToList = () => {
        setSelectedWorldId(null)
        setStartInEditMode(false)
        setRefreshTrigger(prev => prev + 1) // グループのワールド数を更新
    }

    const handleDeleteGroup = (group: Group) => {
        setGroupToDelete(group)
        setIsDeleteGroupModalOpen(true)
    }

    const handleConfirmDeleteGroup = async (deleteWorlds: boolean) => {
        if (!groupToDelete) return

        try {
            await window.electronAPI.deleteGroup(groupToDelete.id, deleteWorlds)

            // 遷移していたグループが削除された場合は、全てのワールド一覧に移動する
            if (activeView === 'group' && activeGroupId === groupToDelete.id) {
                handleNavigate('all')
            }

            setRefreshTrigger(prev => prev + 1)
            setIsDeleteGroupModalOpen(false)
            setGroupToDelete(null)
        } catch (error) {
            console.error('Failed to delete group:', error)
        }
    }

    const handleAcceptSuggestion = async (suggestion: WorldSuggestion) => {
        try {
            await window.electronAPI.acceptSuggestion({
                worldId: suggestion.worldId,
                worldName: suggestion.worldName,
                worldAuthor: suggestion.worldAuthor,
                worldThumbnail: suggestion.worldThumbnail,
                groupId: activeView === 'group' ? activeGroupId : undefined,
            })

            // 提案リストから削除
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
            // ワールドリストを更新
            setRefreshTrigger(prev => prev + 1)
        } catch (error) {
            console.error('Failed to accept suggestion:', error)
            alert('ワールドの追加に失敗しました')
        }
    }

    const handleDismissSuggestion = async (suggestion: WorldSuggestion) => {
        try {
            await window.electronAPI.dismissSuggestion(suggestion.worldId)
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
        } catch (error) {
            console.error('Failed to dismiss suggestion:', error)
        }
    }

    const handleSaveConfig = async (newConfig: Config) => {
        try {
            await window.electronAPI.updateConfig(newConfig)
            setConfig(newConfig)

            // 設定保存後にスキャンを実行
            if (newConfig.photoDirectoryPath) {
                const worldSuggestions = await window.electronAPI.getWorldSuggestions()
                setSuggestions(worldSuggestions)
            }
        } catch (error) {
            console.error('Failed to save config:', error)
        }
    }

    return (
        <Layout
            activeView={activeView}
            activeGroupId={activeGroupId}
            onNavigate={handleNavigate}
            onAddGroup={() => setIsGroupModalOpen(true)}
            onDeleteGroup={handleDeleteGroup}
            onAddWorld={() => setIsModalOpen(true)}
            onAddPhoto={() => setIsPhotoModalOpen(true)}
            onOpenSettings={() => setIsSetupModalOpen(true)}
            refreshTrigger={refreshTrigger}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
        >
            {selectedWorldId ? (
                <WorldDetail worldId={selectedWorldId} onBack={handleBackToList} startInEditMode={startInEditMode} />
            ) : (
                <WorldList
                    refreshTrigger={refreshTrigger}
                    onWorldClick={handleWorldClick}
                    groupId={activeView === 'group' ? activeGroupId : undefined}
                    viewMode={viewMode}
                    searchQuery={searchQuery}
                    suggestions={activeView === 'all' ? suggestions : undefined}
                    onAcceptSuggestion={handleAcceptSuggestion}
                    onDismissSuggestion={handleDismissSuggestion}
                />
            )}

            <AddWorldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onWorldAdded={handleWorldAdded}
                groupId={activeView === 'group' ? activeGroupId : undefined}
            />

            <AddGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onGroupAdded={handleGroupAdded}
            />

            <DeleteGroupModal
                isOpen={isDeleteGroupModalOpen}
                group={groupToDelete}
                onClose={() => {
                    setIsDeleteGroupModalOpen(false)
                    setGroupToDelete(null)
                }}
                onConfirm={handleConfirmDeleteGroup}
            />

            <AddPhotoModal
                isOpen={isPhotoModalOpen}
                onClose={() => setIsPhotoModalOpen(false)}
                onPhotoAdded={handlePhotoAdded}
            />

            <PhotoDirectorySetupModal
                isOpen={isSetupModalOpen}
                onClose={() => setIsSetupModalOpen(false)}
                onSave={handleSaveConfig}
                initialConfig={config}
            />
        </Layout>
    )
}

export default App
