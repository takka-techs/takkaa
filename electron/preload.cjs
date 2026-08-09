const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
  getBackupPath: () => ipcRenderer.invoke('get-backup-path'),
  setBackupPath: () => ipcRenderer.invoke('set-backup-path')
});
