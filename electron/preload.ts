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
    createGroup: (data: any) => ipcRenderer.invoke('create-group', data),
    updateGroup: (id: number, data: any) => ipcRenderer.invoke('update-group', { id, data }),
    deleteGroup: (id: number, deleteWorlds: boolean) => ipcRenderer.invoke('delete-group', { id, deleteWorlds }),
    addWorldToGroup: (worldId: number, groupId: number) => ipcRenderer.invoke('add-world-to-group', { worldId, groupId }),
    removeWorldFromGroup: (worldId: number, groupId: number) => ipcRenderer.invoke('remove-world-from-group', worldId, groupId),

    // Photo API
    importPhoto: (filePath: string, worldId?: number) => ipcRenderer.invoke('import-photo', filePath, worldId),
    getPhotosByWorld: (worldId: number) => ipcRenderer.invoke('get-photos-by-world', worldId),
    deletePhoto: (id: number) => ipcRenderer.invoke('delete-photo', id),

    // File utilities
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
})

console.log('Preload script loaded');
