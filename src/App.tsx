import { useState } from 'react'
import { WorldList } from './components/WorldList'
import { AddWorldModal } from './components/AddWorldModal'

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleWorldAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-purple-400">
                    VRChat World Manager
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium transition-colors"
                >
                    + Add World
                </button>
            </header>

            <main className="container mx-auto py-6">
                <WorldList refreshTrigger={refreshTrigger} />
            </main>

            <AddWorldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onWorldAdded={handleWorldAdded}
            />
        </div>
    )
}

export default App
