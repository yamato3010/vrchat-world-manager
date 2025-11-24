import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getWorlds: (groupId?: number) => ipcRenderer.invoke('get-worlds', groupId),
    createWorld: (data: any) => ipcRenderer.invoke('create-world', data),
    deleteWorld: (id: number) => ipcRenderer.invoke('delete-world', id),
    fetchVRChatWorld: (worldId: string) => ipcRenderer.invoke('fetch-vrchat-world', worldId),
})

console.log('Preload script loaded');
