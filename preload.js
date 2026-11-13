const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printDirect: (options) => ipcRenderer.invoke('print-direct', options),
  openCashDrawer: (options) => ipcRenderer.invoke('open-cash-drawer', options)
});
