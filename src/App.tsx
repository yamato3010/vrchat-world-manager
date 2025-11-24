import { useState } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'
import { Layout } from './components/Layout'
import './index.css'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeView, setActiveView] = useState<'all' | 'group'>('all')
    const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined)

    const handleWorldAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const handleNavigate = (view: 'all' | 'group', groupId?: number) => {
        setActiveView(view)
        setActiveGroupId(groupId)
    }

    const handleAddGroup = () => {
        alert('Group creation will be implemented in the next step!')
    }

    return (
        <Layout
            activeView={activeView}
            activeGroupId={activeGroupId}
            onNavigate={handleNavigate}
            onAddGroup={handleAddGroup}
            onAddWorld={() => setIsModalOpen(true)}
        >
            <WorldList refreshTrigger={refreshTrigger} />

            <AddWorldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onWorldAdded={handleWorldAdded}
            />
        </Layout>
    )
}

export default App
