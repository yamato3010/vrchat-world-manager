import { useState } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'
import { AddGroupModal } from './components/AddGroupModal'
import { WorldDetail } from './pages/WorldDetail'
import { Layout } from './components/Layout'
import './index.css'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
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

    return (
        <Layout
            activeView={activeView}
            activeGroupId={activeGroupId}
            onNavigate={handleNavigate}
            onAddGroup={() => setIsGroupModalOpen(true)}
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
        </Layout>
    )
}

export default App
