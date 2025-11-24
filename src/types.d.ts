export interface World {
    id: number
    vrchatWorldId?: string
    name: string
    authorName?: string
    description?: string
    thumbnailUrl?: string
    userMemo?: string
    tags?: string
    createdAt: string
    updatedAt: string
}

export interface CreateWorldData {
    vrchatWorldId?: string
    name: string
    authorName?: string
    description?: string
    thumbnailUrl?: string
    userMemo?: string
    tags?: string
}

export interface ElectronAPI {
    getWorlds: (groupId?: number) => Promise<World[]>
    createWorld: (data: CreateWorldData) => Promise<World>
    deleteWorld: (id: number) => Promise<World>
    fetchVRChatWorld: (worldId: string) => Promise<any>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
