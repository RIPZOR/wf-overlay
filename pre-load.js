const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  focusInput: () => ipcRenderer.on('focus-input', () => {
    const el = document.getElementById('messageinput');
    if (el) el.focus();
  })
});