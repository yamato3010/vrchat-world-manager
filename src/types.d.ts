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

export interface Group {
    id: number
    name: string
    description?: string
    icon?: string
    createdAt: string
    updatedAt: string
    _count?: {
        worlds: number
    }
}

export interface CreateGroupData {
    name: string
    description?: string
    icon?: string
}

export interface ElectronAPI {
    getWorlds: (groupId?: number) => Promise<World[]>
    createWorld: (data: CreateWorldData) => Promise<World>
    deleteWorld: (id: number) => Promise<World>
    fetchVRChatWorld: (worldId: string) => Promise<any>

    // Group API
    getGroups: () => Promise<Group[]>
    createGroup: (data: CreateGroupData) => Promise<Group>
    updateGroup: (id: number, data: Partial<CreateGroupData>) => Promise<Group>
    deleteGroup: (id: number) => Promise<Group>
    addWorldToGroup: (worldId: number, groupId: number) => Promise<any>
    removeWorldFromGroup: (worldId: number, groupId: number) => Promise<any>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
