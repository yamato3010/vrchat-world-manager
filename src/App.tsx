import { useState } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'
import { AddGroupModal } from './components/AddGroupModal'
import { DeleteGroupModal } from './components/DeleteGroupModal'
import { AddPhotoModal } from './components/AddPhotoModal'
import { WorldDetail } from './pages/WorldDetail'
import { Layout } from './components/Layout'
import { Group } from './types'
import './index.css'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeView, setActiveView] = useState<'all' | 'group'>('all')
    const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined)
    const [selectedWorldId, setSelectedWorldId] = useState<number | null>(null)
    const [startInEditMode, setStartInEditMode] = useState(false)

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
        setRefreshTrigger(prev => prev + 1)
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

    return (
        <Layout
            activeView={activeView}
            activeGroupId={activeGroupId}
            onNavigate={handleNavigate}
            onAddGroup={() => setIsGroupModalOpen(true)}
            onDeleteGroup={handleDeleteGroup}
            onAddWorld={() => setIsModalOpen(true)}
            onAddPhoto={() => setIsPhotoModalOpen(true)}
            refreshTrigger={refreshTrigger}
        >
            {selectedWorldId ? (
                <WorldDetail worldId={selectedWorldId} onBack={handleBackToList} startInEditMode={startInEditMode} />
            ) : (
                <WorldList
                    refreshTrigger={refreshTrigger}
                    onWorldClick={handleWorldClick}
                    groupId={activeView === 'group' ? activeGroupId : undefined}
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
        </Layout>
    )
}

export default App
