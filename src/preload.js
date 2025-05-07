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
    
    // New print-label function for HTML-to-PDF conversion
    printLabel: (html, quantity = 1, savePath = null) => {
      return ipcRenderer.invoke('print-label', { html, quantity, savePath });
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
    
    // Dialogs management
    openDialog: (dialogType, props) => {
      return ipcRenderer.invoke('open-dialog', { dialogType, props });
    },
    closeDialog: (dialogType) => {
      return ipcRenderer.invoke('close-dialog', { dialogType });
    },
    
    // IPC event listeners for dialogs
    onShowDialog: null, // This will be set in renderer
    offShowDialog: null, // This will be set in renderer
    onHideDialog: null, // This will be set in renderer
    offHideDialog: null, // This will be set in renderer
    
    // Settings management (legacy - will be replaced by dialog system)
    openSettings: () => {
      return ipcRenderer.invoke('open-settings');
    },
    closeSettings: () => {
      return ipcRenderer.invoke('close-settings');
    },
    
    // Label Editor
    openLabelEditor: () => {
      return ipcRenderer.invoke('open-label-editor');
    },
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Get label configuration
    getLabelConfig: () => ipcRenderer.invoke('get-label-config')
  }
);

// Set up IPC event listeners
ipcRenderer.on('show-dialog', (event, data) => {
  if (window.electron?.receive) {
    window.electron.receive('show-dialog', data);
  }
});

ipcRenderer.on('hide-dialog', (event, data) => {
  if (window.electron?.receive) {
    window.electron.receive('hide-dialog', data);
  }
}); 