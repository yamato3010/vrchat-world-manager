import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    getWorlds: function (groupId) { return ipcRenderer.invoke('get-worlds', groupId); },
    createWorld: function (data) { return ipcRenderer.invoke('create-world', data); },
    deleteWorld: function (id) { return ipcRenderer.invoke('delete-world', id); },
    fetchVRChatWorld: function (worldId) { return ipcRenderer.invoke('fetch-vrchat-world', worldId); },
});
console.log('Preload script loaded');
