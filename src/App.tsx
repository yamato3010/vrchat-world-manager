import { useState } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'
import { AddGroupModal } from './components/AddGroupModal'
import { DeleteGroupModal } from './components/DeleteGroupModal'
import { WorldDetail } from './pages/WorldDetail'
import { Layout } from './components/Layout'
import { Group } from './types'
import './index.css'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeView, setActiveView] = useState<'all' | 'group'>('all')
    const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined)
    const [selectedWorldId, setSelectedWorldId] = useState<number | null>(null)

    const handleWorldAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleGroupAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleNavigate = (view: 'all' | 'group', groupId?: number) => {
        setActiveView(view)
        setActiveGroupId(groupId)
        setSelectedWorldId(null) // Reset world detail when navigating
    }

    const handleWorldClick = (worldId: number) => {
        setSelectedWorldId(worldId)
    }

    const handleBackToList = () => {
        setSelectedWorldId(null)
        setRefreshTrigger(prev => prev + 1) // Refresh list to show updated group assignments
    }

    const handleDeleteGroup = (group: Group) => {
        setGroupToDelete(group)
        setIsDeleteGroupModalOpen(true)
    }

    const handleConfirmDeleteGroup = async (deleteWorlds: boolean) => {
        if (!groupToDelete) return

        try {
            await window.electronAPI.deleteGroup(groupToDelete.id, deleteWorlds)

            // If we were viewing the deleted group, navigate to "All Worlds"
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
            refreshTrigger={refreshTrigger}
        >
            {selectedWorldId ? (
                <WorldDetail worldId={selectedWorldId} onBack={handleBackToList} />
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
                onDelete={handleConfirmDeleteGroup}
            />
        </Layout>
    )
}

export default App
