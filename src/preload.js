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
    printLabel: (html, quantity = 1, savePath = null, productInfo = null, settings = null) => {
      return ipcRenderer.invoke('print-label', { 
        html, 
        quantity, 
        savePath,
        productName: productInfo?.name,
        sku: productInfo?.sku,
        settings
      });
    },
    
    // Print label using unified template system
    printLabelWithTemplate: (product, quantity = 1, labelConfig = null, printerSettings = null) => {
      return ipcRenderer.invoke('print-label-with-template', {
        product,
        quantity,
        labelConfig,
        printerSettings
      });
    },
    
    // ZPL Label System
    generateZplLabel: (product, options = {}) => {
      return ipcRenderer.invoke('generate-zpl-label', { product, options });
    },
    generateZplPreview: (product, options = {}) => {
      return ipcRenderer.invoke('generate-zpl-preview', { product, options });
    },
    printZplLabel: (product, options = {}) => {
      return ipcRenderer.invoke('print-zpl-label', { product, options });
    },
    testZplPrinter: (options = {}) => {
      return ipcRenderer.invoke('test-zpl-printer', options);
    },
    cancelPrintJob: (options = {}) => {
      return ipcRenderer.invoke('cancel-print-job', options);
    },
    sendPrinterCommand: (commandType) => {
      return ipcRenderer.invoke('send-printer-command', commandType);
    },
    checkNetworkShare: (networkPath) => {
      return ipcRenderer.invoke('check-network-share', networkPath);
    },
    
    // Print jobs management
    getPrintJobs: () => {
      return ipcRenderer.invoke('get-print-jobs');
    },
    resetPrintSpooler: () => {
      return ipcRenderer.invoke('reset-print-spooler');
    },
    
    // Printer management
    getPrinters: () => {
      return ipcRenderer.invoke('get-printers');
    },
    refreshPrinters: () => {
      return ipcRenderer.invoke('refresh-printers');
    },
    
    // Utility functions
    saveProductsToCache: (products) => {
      return ipcRenderer.invoke('save-products-to-cache', products);
    },
    loadProductsFromCache: () => {
      return ipcRenderer.invoke('load-products-from-cache');
    },
    
    // Settings management
    saveSettings: (settings) => {
      return ipcRenderer.invoke('save-settings', settings);
    },
    loadSettings: () => {
      return ipcRenderer.invoke('load-settings');
    },
    
    // App configuration
    saveAppConfig: (config) => {
      return ipcRenderer.invoke('save-app-config', config);
    },
    loadAppConfig: () => {
      return ipcRenderer.invoke('load-app-config');
    },
    restartApp: () => {
      return ipcRenderer.invoke('restart-app');
    },
    resetAppConfig: () => {
      return ipcRenderer.invoke('reset-app-config');
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
    
    // Label Editor
    openLabelEditor: () => {
      return ipcRenderer.invoke('open-label-editor');
    },
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // System information
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
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