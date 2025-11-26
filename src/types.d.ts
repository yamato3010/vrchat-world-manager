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

export interface Photo {
    id: number
    filePath: string
    originalFileName: string
    takenAt?: Date
    metadata?: string
    worldId: number
    createdAt: Date
    updatedAt: Date
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
    getWorldById: (id: number) => Promise<World | null>
    updateWorld: (id: number, data: Partial<CreateWorldData>) => Promise<World>
    fetchVRChatWorld: (worldId: string) => Promise<any>

    // Group API
    getGroups: () => Promise<Group[]>
    createGroup: (data: CreateGroupData) => Promise<Group>
    updateGroup: (id: number, data: Partial<CreateGroupData>) => Promise<Group>
    deleteGroup: (id: number, deleteWorlds: boolean) => Promise<{ success: boolean }>
    addWorldToGroup: (worldId: number, groupId: number) => Promise<void>
    removeWorldFromGroup: (worldId: number, groupId: number) => Promise<void>

    // Photo API
    importPhoto: (filePath: string) => Promise<{
        success: boolean
        photo?: Photo
        metadata?: any
        extractedWorldId?: string | null
        error?: string
    }>
    getPhotosByWorld: (worldId: number) => Promise<Photo[]>
    deletePhoto: (id: number) => Promise<Photo>

    // File utilities
    getPathForFile: (file: File) => string
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
