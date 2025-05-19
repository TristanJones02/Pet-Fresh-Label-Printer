const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { initPrinting } = require('./electron/printing');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// Define label dimensions in mm
const LABEL_CONFIG = {
  width: 60,             // Width of the label in mm
  height: 162,           // Height of the label in mm (including the bottom area)
  gutterHeight: 34.5,    // Height of the bottom gutter area
  horizontalMargin: 5,   // Left and right margins
  contentStartY: 50,     // Content starts at 50mm from top
  
  // Section heights (in mm)
  productTitleHeight: 20.5,         // Product title section height
  ingredientsHeight: 15.5,          // Ingredients section height
  petFoodOnlyHeight: 6.5,           // "Pet Food Only" section height
  storageInstructionsHeight: 12.5,  // Storage instructions section height
  dataHeight: 19.5,                 // Date and weight section height
  priceHeight: 3,                   // Price section height
  
  // Barcode settings
  barcode: {
    width: 30,            // Width of barcode area
    height: 45            // Height of barcode
  },
  
  // Calculated properties
  get contentWidth() { return this.width - (this.horizontalMargin * 2); },
  get contentHeight() { return this.height - this.gutterHeight; },
  
  // Calculate section positions
  get titleY() { return this.contentStartY; },
  get ingredientsY() { return this.titleY + this.productTitleHeight; },
  get petFoodOnlyY() { return this.ingredientsY + this.ingredientsHeight; },
  get storageInstructionsY() { return this.petFoodOnlyY + this.petFoodOnlyHeight; },
  get dataY() { return this.storageInstructionsY + this.storageInstructionsHeight; },
  get priceY() { return this.dataY + this.dataHeight; },

  // Font settings
  fonts: {
    productTitle: {
      size: 2.5,
      lineHeight: 1.2
    },
    petFoodOnly: {
      size: 2.2
    },
    ingredients: {
      contentSize: 1.5,
      lineHeight: 1.4,
    },
    data: {
      labelSize: 1.5,
      valueSize: 1.8,
    },
    storage: {
      size: 1.6,
      lineHeight: 1.3
    },
    price: {
      valueSize: 2.8,
      labelSize: 1.6
    }
  }
};

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'src/preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'public/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });
}

// Initialize app
function initApp() {
  createWindow();
  
  // Initialize printing functionality
  initPrinting();
}

// Create window when Electron has finished initialization
app.on('ready', initApp);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS applications keep their menu bar active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS recreate the window when dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Dialog system handlers
ipcMain.handle('open-dialog', async (event, { dialogType, props }) => {
  // Send message to renderer to show dialog
  mainWindow.webContents.send('show-dialog', { dialogType, props });
  return true;
});

ipcMain.handle('close-dialog', async (event, { dialogType }) => {
  // Send message to renderer to close dialog
  mainWindow.webContents.send('hide-dialog', { dialogType });
  return true;
});

// Open Label Editor
ipcMain.handle('open-label-editor', async () => {
  const { execFile } = require('child_process');
  const electron = require('electron');
  const editorPath = path.join(__dirname, 'src/tools/label-editor/editor.js');
  
  execFile(electron, [editorPath], (error) => {
    if (error) {
      console.error('Failed to open label editor:', error);
    }
  });
  
  return true;
});

// Handle app version request
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Get label configuration
ipcMain.handle('get-label-config', async () => {
  try {
    return LABEL_CONFIG;
  } catch (error) {
    console.error('Error getting label config:', error);
    return {
      error: error.message
    };
  }
});

// Handle print requests
ipcMain.on('print-label', (event, labelContent) => {
  // TODO: Implement actual printing functionality
  console.log('Printing label:', labelContent);
  // For now we just log the print request
  event.reply('print-response', { success: true });
}); 