const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  getState: () => ipcRenderer.invoke('navigation:get-state'),
  open: (url) => ipcRenderer.invoke('navigation:open', url),
  back: () => ipcRenderer.invoke('navigation:back'),
  forward: () => ipcRenderer.invoke('navigation:forward'),
  reload: () => ipcRenderer.invoke('navigation:reload'),
  onState: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('navigation:state', listener);
    return () => ipcRenderer.removeListener('navigation:state', listener);
  },
});
