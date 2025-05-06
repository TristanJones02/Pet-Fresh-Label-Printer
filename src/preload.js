const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Label generation
    generateLabelPreview: (productData) => {
      return ipcRenderer.invoke('generate-label-preview', productData);
    },
    printLabels: (options) => {
      return ipcRenderer.invoke('print-labels', options);
    },
    
    // Printer management
    getPrinters: () => {
      return ipcRenderer.invoke('get-printers');
    },
    
    // Utility functions
    saveProductsToCache: (products) => {
      return ipcRenderer.invoke('save-products-to-cache', products);
    },
    loadProductsFromCache: () => {
      return ipcRenderer.invoke('load-products-from-cache');
    },
    
    // Add more IPC functions as needed
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  }
); 