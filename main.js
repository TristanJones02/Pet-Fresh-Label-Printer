const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
let settingsWindow = null;

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

// Function to create settings window
function createSettingsWindow() {
  // Only create a new settings window if one doesn't already exist
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  // Create settings window
  settingsWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'src/preload.js')
    }
  });

  // Load settings HTML file
  settingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/settings.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Show window when ready
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  // Handle window close
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    settingsWindow.webContents.openDevTools();
  }
}

// Create window when Electron has finished initialization
app.on('ready', createWindow);

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

// Handle settings window
ipcMain.handle('open-settings', async () => {
  createSettingsWindow();
  return true;
});

ipcMain.handle('close-settings', async () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
  return true;
});

// Handle app version request
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Handle print requests
ipcMain.on('print-label', (event, labelContent) => {
  // TODO: Implement actual printing functionality
  console.log('Printing label:', labelContent);
  // For now we just log the print request
  event.reply('print-response', { success: true });
}); 