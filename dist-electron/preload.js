"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getWorlds: (groupId) => electron.ipcRenderer.invoke("get-worlds", groupId),
  createWorld: (data) => electron.ipcRenderer.invoke("create-world", data),
  deleteWorld: (id) => electron.ipcRenderer.invoke("delete-world", id),
  fetchVRChatWorld: (worldId) => electron.ipcRenderer.invoke("fetch-vrchat-world", worldId)
});
console.log("Preload script loaded");
