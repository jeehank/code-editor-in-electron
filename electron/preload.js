const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  confirmClose: () => ipcRenderer.invoke('window:close-confirm'),
  showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options),
  onWindowCloseRequest: (callback) => {
    ipcRenderer.on('window-close-request', () => callback());
  },
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('fs:saveFile', filePath, content),
  searchWorkspace: (dirPath, query) => ipcRenderer.invoke('fs:searchWorkspace', dirPath, query),
  spawnTerminal: (cwd) => ipcRenderer.invoke('terminal:spawn', cwd),
  writeTerminal: (data) => ipcRenderer.invoke('terminal:write', data),
  resizeTerminal: (cols, rows) => ipcRenderer.invoke('terminal:resize', cols, rows),
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal:data', (event, data) => callback(data));
  }
});
