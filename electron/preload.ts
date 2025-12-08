import { contextBridge, ipcRenderer } from 'electron';
import { webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getWorlds: (groupId?: number) => ipcRenderer.invoke('get-worlds', groupId),
    createWorld: (data: any) => ipcRenderer.invoke('create-world', data),
    deleteWorld: (id: number) => ipcRenderer.invoke('delete-world', id),
    getWorldById: (id: number) => ipcRenderer.invoke('get-world-by-id', id),
    updateWorld: (id: number, data: any) => ipcRenderer.invoke('update-world', { id, data }),
    fetchVRChatWorld: (worldId: string) => ipcRenderer.invoke('fetch-vrchat-world', worldId),

    // Group API
    getGroups: () => ipcRenderer.invoke('get-groups'),
    getGroupById: (id: number) => ipcRenderer.invoke('get-group-by-id', id),
    createGroup: (data: any) => ipcRenderer.invoke('create-group', data),
    updateGroup: (id: number, data: any) => ipcRenderer.invoke('update-group', { id, data }),
    deleteGroup: (id: number, deleteWorlds: boolean) => ipcRenderer.invoke('delete-group', { id, deleteWorlds }),
    addWorldToGroup: (worldId: number, groupId: number) => ipcRenderer.invoke('add-world-to-group', { worldId, groupId }),
    removeWorldFromGroup: (worldId: number, groupId: number) => ipcRenderer.invoke('remove-world-from-group', { worldId, groupId }),

    // Photo API
    importPhoto: (filePath: string, worldId?: number) => ipcRenderer.invoke('import-photo', filePath, worldId),
    getPhotosByWorld: (worldId: number) => ipcRenderer.invoke('get-photos-by-world', worldId),
    deletePhoto: (id: number) => ipcRenderer.invoke('delete-photo', id),

    // File utilities
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    readImageBase64: (filePath: string) => ipcRenderer.invoke('read-image-base64', filePath),
    openExternalLink: (url: string) => ipcRenderer.invoke('open-external-link', url),

    // Config management
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config: any) => ipcRenderer.invoke('update-config', config),

    // World suggestions
    getWorldSuggestions: () => ipcRenderer.invoke('get-world-suggestions'),
    acceptSuggestion: (suggestion: any) => ipcRenderer.invoke('accept-suggestion', suggestion),
    dismissSuggestion: (worldId: string) => ipcRenderer.invoke('dismiss-suggestion', worldId),
})

console.log('Preload script loaded');
