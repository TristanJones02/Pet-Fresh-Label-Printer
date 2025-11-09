const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { initPrinting } = require('../electron/printing');
const configManager = require('../electron/config-manager');
const ProductDataService = require('./services/productDataService');
const loggingService = require('./services/loggingService');

// Get the package.json for version info
const packageJson = require('../package.json');

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.petfresh.labelprinter');
}

// Keep a global reference of the window objects
let mainWindow;
let configWindow;
let productDataService;

// Initialize global app exit flag (used in kiosk mode)
global.allowAppExit = false;

// Initialize logging service
loggingService.loadLoggingPreference().then(() => {
  if (loggingService.isEnabled()) {
    loggingService.info('Application started', { version: packageJson.version });
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  loggingService.logError(error, { type: 'uncaughtException' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  loggingService.logError(new Error(String(reason)), { type: 'unhandledRejection' });
});

/**
 * Create the main application window based on configuration
 */
function createWindow() {
  // Ensure configuration file exists
  configManager.createDefaultConfigIfNeeded();
  
  // Check if app is configured
  if (!configManager.isAppConfigured()) {
    console.log('App not configured. Launching configuration window...');
    createConfigWindow();
    return;
  }
  
  // Load configuration
  const config = configManager.loadConfig();
  
  // Configure window options based on usage type
  const windowOptions = {
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../public/assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  };
  
  // Apply kiosk mode settings if configured
  if (config.usageType === 'kiosk') {
    windowOptions.fullscreen = true;
    windowOptions.kiosk = true;
    windowOptions.autoHideMenuBar = true;
  }
  
  // Create the browser window
  mainWindow = new BrowserWindow(windowOptions);

  // Load the index.html file
  const indexPath = path.join(__dirname, '../public/index.html');
  mainWindow.loadFile(indexPath);
  
  // Open DevTools in development mode or if debugging is enabled
  if (process.env.NODE_ENV === 'development' || configManager.isDebuggingEnabled()) {
    mainWindow.webContents.openDevTools();
  } else {
    // Disable DevTools if not in debugging mode
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  // Prevent F11 from exiting kiosk mode if enabled
  if (config.usageType === 'kiosk') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F11' && input.type === 'keyDown') {
        // Prevent default action (exiting kiosk mode)
        event.preventDefault();
      }
    });
    
    // Register a special key combination to exit the application
    // (Ctrl+Alt+Shift+X) - difficult to press accidentally
    globalShortcut.register('CommandOrControl+Alt+Shift+X', () => {
      global.allowAppExit = true;
      app.quit();
    });
    
    // Also prevent Alt+F4 from closing the app in kiosk mode
    mainWindow.on('close', (e) => {
      // Only prevent closing if explicit exit hasn't been requested
      if (!global.allowAppExit) {
        e.preventDefault();
      }
    });
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

/**
 * Create the configuration window
 */
function createConfigWindow() {
  // Create the browser window for configuration
  configWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: true, // Start in fullscreen
    icon: path.join(__dirname, '../public/assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Log preload path to verify it exists
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Loading preload script from:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));

  // Load the config HTML file
  const configPath = path.join(__dirname, '../public/app-config.html');
  console.log('Loading config HTML from:', configPath);
  console.log('Config HTML exists:', fs.existsSync(configPath));
  
  configWindow.loadFile(configPath);

  // Don't show menu bar in config window
  configWindow.setMenuBarVisibility(false);
  
  // Handle F11 key for toggling fullscreen
  configWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      configWindow.setFullScreen(!configWindow.isFullScreen());
      event.preventDefault();
    }
  });
  
  // Log when the window is ready
  configWindow.webContents.on('did-finish-load', () => {
    console.log('Configuration window loaded');
  });

  // Emitted when the window is closed
  configWindow.on('closed', function () {
    configWindow = null;
    
    // If main window isn't created and app is still not configured, quit the app
    if (!mainWindow && !configManager.isAppConfigured()) {
      app.quit();
    }
  });
}

// Function to clean up existing IPC handlers to prevent duplicate registration warnings
function cleanupIpcHandlers() {
  const handlersToCleanup = [
    'test-zpl-printer',
    'check-network-share'
  ];
  
  handlersToCleanup.forEach(handlerName => {
    try {
      ipcMain.removeHandler(handlerName);
    } catch (error) {
      // Handler might not exist yet, ignore
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Set application icon for Windows
  if (process.platform === 'win32') {
    const iconPath = path.join(__dirname, '../public/assets/icon.ico');
    if (fs.existsSync(iconPath)) {
      app.setAppUserModelId('com.petfresh.labelprinter');
    }
  }
  
  createWindow();
  
  // Initialize printing module
  initPrinting();

  // Initialize product data service
  productDataService = new ProductDataService();
  await productDataService.initialize();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up when the app is about to quit
app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  // Clean up IPC handlers
  cleanupIpcHandlers();
  
  // Clean up product data service
  if (productDataService) {
    productDataService.destroy();
  }
});

// Save app configuration
ipcMain.handle('save-app-config', async (event, config) => {
  try {
    const result = configManager.saveConfig(config);
    return { success: result };
  } catch (error) {
    console.error('Error saving app configuration:', error);
    return { success: false, error: error.message };
  }
});

// Load app configuration
ipcMain.handle('load-app-config', async () => {
  try {
    return configManager.loadConfig();
  } catch (error) {
    console.error('Error loading app configuration:', error);
    return {
      error: error.message
    };
  }
});

// Restart the app
ipcMain.handle('restart-app', async () => {
  app.relaunch();
  app.exit();
});

// Close the app (for kiosk mode exit)
ipcMain.handle('close-app', async () => {
  global.allowAppExit = true;
  app.quit();
});

// Restart computer for long-running app maintenance
ipcMain.handle('restart-computer', async () => {
  const { exec } = require('child_process');
  const os = require('os');
  
  console.log('🔄 Computer restart requested by user...');
  
  try {
    const platform = os.platform();
    let command;
    
    switch (platform) {
      case 'win32':
        command = 'shutdown /r /t 10 /c "Label printer app restart requested"';
        break;
      case 'darwin': // macOS
        command = 'sudo shutdown -r +1 "Label printer app restart requested"';
        break;
      case 'linux':
        command = 'sudo shutdown -r +1 "Label printer app restart requested"';
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          console.error('Error restarting computer:', error);
          reject(error);
        } else {
          console.log('Computer restart initiated');
          resolve({ success: true, message: 'Computer restart initiated' });
        }
      });
    });
    
  } catch (error) {
    console.error('Error initiating computer restart:', error);
    throw error;
  }
});

// Reset configuration and restart app
ipcMain.handle('reset-app-config', async () => {
  try {
    // Set allowAppExit to true for kiosk mode
    global.allowAppExit = true;
    
    // Reset by removing usageType (will trigger setup on next launch)
    const config = configManager.loadConfig();
    config.usageType = null;
    
    // Save the modified config
    const result = configManager.saveConfig(config);
    
    if (result) {
      // Restart the app to show the config screen
      app.relaunch();
      app.exit();
      return { success: true };
    } else {
      return { success: false, error: 'Failed to save configuration' };
    }
  } catch (error) {
    console.error('Error resetting app configuration:', error);
    return { success: false, error: error.message };
  }
});

// Initialize the templates directory in userData folder
const templatesDir = path.join(app.getPath('userData'), 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// IPC Event Handlers
// Print labels
ipcMain.handle('print-labels', async (event, { productData, quantity = 1, printerName }) => {
  try {
    // This is now handled by the React-based print-label-with-template system
    console.log('Legacy print-labels handler called - redirecting to React-based system');
    
    return {
      success: true,
      message: `Use print-label-with-template for React-based printing`
    };
  } catch (error) {
    console.error('Error in legacy print-labels handler:', error);
    return {
      error: error.message
    };
  }
});

// Add an IPC handler for system info
ipcMain.handle('get-system-info', async () => {
  try {
    // Get all local IP addresses
    const networkInterfaces = os.networkInterfaces();
    let privateIpAddresses = [];
    let primaryPrivateIp = 'Not connected';
    
    // Find all non-internal IPv4 addresses
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      for (let i = 0; i < interfaces.length; i++) {
        const iface = interfaces[i];
        // Only include IPv4 addresses
        if (iface.family === 'IPv4') {
          // Check if this is a private IP
          const isPrivate = 
            /^10\./.test(iface.address) || 
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(iface.address) || 
            /^192\.168\./.test(iface.address) ||
            /^127\./.test(iface.address) ||
            /^169\.254\./.test(iface.address); // Link-local addresses
            
          privateIpAddresses.push({
            name: interfaceName,
            address: iface.address,
            internal: iface.internal,
            isPrivate: isPrivate
          });
          
          // Use non-internal addresses as primary when available
          // Prioritize actual private addresses
          if (!iface.internal && isPrivate && primaryPrivateIp === 'Not connected') {
            // Skip localhost
            if (!iface.address.startsWith('127.')) {
              primaryPrivateIp = iface.address;
            }
          }
        }
      }
    });
    
    // Try to get public IP from external API
    let publicIp = 'Fetching...';
    try {
      const https = require('https');
      publicIp = await new Promise((resolve, reject) => {
        // Try multiple services in case one is down
        const services = [
          'https://api.ipify.org',
          'https://api.my-ip.io/ip',
          'https://ipinfo.io/ip',
          'https://icanhazip.com'
        ];
        
        let serviceIndex = 0;
        const tryNextService = () => {
          if (serviceIndex >= services.length) {
            resolve('Could not determine');
            return;
          }
          
          const service = services[serviceIndex];
          https.get(service, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              if (res.statusCode === 200) {
                const ip = data.trim();
                // Basic validation that it looks like an IP
                if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                  resolve(ip);
                } else {
                  serviceIndex++;
                  tryNextService();
                }
              } else {
                serviceIndex++;
                tryNextService();
              }
            });
          }).on('error', (err) => {
            console.error(`Error fetching public IP from ${service}:`, err);
            serviceIndex++;
            tryNextService();
          });
        };
        
        tryNextService();
      });
    } catch (err) {
      console.error('Error fetching public IP:', err);
      publicIp = 'Could not determine';
    }
    
    return {
      publicIpAddress: publicIp,
      privateIpAddress: primaryPrivateIp,
      allIpAddresses: privateIpAddresses,
      hostname: os.hostname(),
      platform: os.platform(),
      osVersion: os.release(),
      cpuCount: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB'
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      error: error.message
    };
  }
});

// HTML-to-PDF conversion for label printing is now handled in electron/printing.js
// ipcMain.handle('print-label', async (event, { html, quantity = 1, savePath = null }) => {
//   ... removed code ...
// });

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

// Print label using unified template system
ipcMain.handle('print-label-with-template', async (event, { product, quantity = 1, labelConfig = null, printerSettings = null }) => {
  try {
    // Set up DOM environment for React server-side rendering
    const { JSDOM } = require('jsdom');
    const ReactDOMServer = require('react-dom/server');
    const React = require('react');
    
    // Create a DOM environment for React
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    // Set up global environment for React
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.HTMLElement = dom.window.HTMLElement;
    global.React = React;
    
    // Import the React template generator
    const { generateReactLabel, generateBarcodeSvg } = require('./label/template-node.js');
    
    // Load current config file to get latest printer adjustments
    let config;
    if (labelConfig) {
      config = labelConfig;
    } else {
      try {
        // Load the current config file to get latest printer adjustments
        const configPath = path.join(app.getPath('userData'), 'label-config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configData);
      } catch (error) {
        console.warn('Could not load current config, using default:', error);
        config = LABEL_CONFIG;
      }
    }
    
    // Debug: Log printer adjustment values
    console.log('🖨️ Print Config - Printer Adjustments:', {
      printerAdjustmentLeft: config.printerAdjustmentLeft,
      printerAdjustmentTop: config.printerAdjustmentTop,
      isPrintMode: true
    });
    
    // Calculate expiry date
    let expiryDate;
    
    // Handle both new API format and legacy format
    if (product.expirationDuration && product.expirationType) {
      // New format: Calculate based on duration and type
      const today = new Date();
      expiryDate = new Date(today);
      
      switch (product.expirationType) {
        case 'days':
          expiryDate.setDate(today.getDate() + product.expirationDuration);
          break;
        case 'weeks':
          expiryDate.setDate(today.getDate() + (product.expirationDuration * 7));
          break;
        case 'months':
          expiryDate.setMonth(today.getMonth() + product.expirationDuration);
          break;
        case 'years':
          expiryDate.setFullYear(today.getFullYear() + product.expirationDuration);
          break;
        default:
          // Default to days if type is unknown
          expiryDate.setDate(today.getDate() + product.expirationDuration);
      }
    } else if (product.expiryDays) {
      // Legacy format: Calculate based on expiryDays
      const today = new Date();
      expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + product.expiryDays);
    } else {
      // Default: 30 days if no expiry information provided
      const today = new Date();
      expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + 30);
    }
    
    // Format the expiry date
    const formattedExpiryDate = expiryDate.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    
    // Format the price
    const formattedPrice = product.price || '$0.00';
    
    // Options for the template generator
    const templateOptions = {
      formattedPrice,
      formattedExpiryDate,
      isPrintMode: true
    };
    
    // Generate barcode SVG content
    const barcode = product.barcode || product.sku || '0000000000000';
    const barcodeSvgContent = generateBarcodeSvg(barcode);
    
    // Generate the React component
    const LabelComponent = generateReactLabel(product, config, templateOptions);
    
    // Render the React component to static HTML
    const labelHTML = ReactDOMServer.renderToStaticMarkup(
      React.createElement(LabelComponent, { 
        showOverlay: false,
        barcodeSvgContent: barcodeSvgContent
      })
    );
    
    // Create complete HTML document with print-optimized styles
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Label</title>
          <style>
            @page {
              size: ${config.width}mm ${config.height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              width: ${config.width}mm;
              height: ${config.height}mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .label-container {
              position: relative;
              width: 100%;
              height: 100%;
              background-color: white;
            }
            
            /* Force all background images to print */
            [style*="background-image"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
        </head>
        <body>${labelHTML}</body>
      </html>
    `;
    
    // Create product info for the print job
    const productInfo = {
      name: product.name || product.title || 'Unknown Product',
      sku: product.sku || product.id || '',
      category: product.category || '',
      details: `${product.weight || ''} ${product.unit || ''}`
    };
    
    // Clean up global environment
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.HTMLElement;
    delete global.React;
    
    // Return the generated HTML and product info so the frontend can call printLabel
    return {
      success: true,
      html,
      productInfo,
      message: 'React template generated successfully'
    };
    
  } catch (error) {
    console.error('Error in print-label-with-template (React):', error);
    
    // Clean up global environment in case of error
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.HTMLElement;
    delete global.React;
    
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
});

// Product cache management
ipcMain.handle('save-products-to-cache', async (event, products) => {
  try {
    const productsFile = path.join(app.getPath('userData'), 'products.json');
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving products to cache:', error);
    return { error: error.message };
  }
});

// Settings management
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsFile = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    
    // Handle logging preference change
    if (settings.application?.enableLogging !== undefined) {
      await loggingService.saveLoggingPreference(settings.application.enableLogging);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    loggingService.logError(error, { context: 'save-settings' });
    return { error: error.message };
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    const settingsFile = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsFile)) {
      const settingsData = fs.readFileSync(settingsFile, 'utf8');
      return JSON.parse(settingsData);
    } else {
      // Return default settings if file doesn't exist yet
      return {
        printer: {
          defaultPrinter: '',
          showConfirmation: false,
          margins: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
          }
        },
        application: {
          darkMode: false,
          enableLogging: false,
          devImageGeneration: false,
          devImagePath: path.join(app.getPath('pictures'), 'PetFresh-Labels'),
          includeContentOnly: true,
          includeGraphics: false
        }
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    return { error: error.message };
  }
});

ipcMain.handle('load-products-from-cache', async () => {
  try {
    const productsFile = path.join(app.getPath('userData'), 'products.json');
    if (fs.existsSync(productsFile)) {
      const productsData = fs.readFileSync(productsFile, 'utf8');
      return JSON.parse(productsData);
    } else {
      // Return empty object if file doesn't exist yet
      return {};
    }
  } catch (error) {
    console.error('Error loading products from cache:', error);
    return { error: error.message };
  }
});

// Generate a barcode for a product
function generateBarcode(productData) {
  // Use our new on-device barcode generator instead of the old implementation
  return generateRandomBarcode();
}

// Add IPC handler to get app version
ipcMain.handle('get-app-version', async () => {
  return packageJson.version;
});

// Logging management handlers
ipcMain.handle('get-log-file-path', async () => {
  return loggingService.getLogFilePath();
});

ipcMain.handle('open-log-file', async () => {
  try {
    const logPath = loggingService.getLogFilePath();
    if (fs.existsSync(logPath)) {
      shell.openPath(logPath);
      return { success: true };
    } else {
      return { success: false, error: 'Log file not found' };
    }
  } catch (error) {
    loggingService.logError(error, { context: 'open-log-file' });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-recent-logs', async (event, lines = 100) => {
  try {
    return loggingService.getRecentLogs(lines);
  } catch (error) {
    loggingService.logError(error, { context: 'get-recent-logs' });
    return [];
  }
});

ipcMain.handle('clear-logs', async () => {
  try {
    loggingService.clearLogs();
    return { success: true };
  } catch (error) {
    loggingService.logError(error, { context: 'clear-logs' });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('log-from-renderer', async (event, { level, message, context }) => {
  try {
    loggingService.log(level, `[Renderer] ${message}`, context);
    return { success: true };
  } catch (error) {
    console.error('Error logging from renderer:', error);
    return { success: false, error: error.message };
  }
});

// Add IPC handler to load label config
ipcMain.handle('load-label-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'label-config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } else {
      return { error: 'Config file not found' };
    }
  } catch (error) {
    console.error('Error loading label config:', error);
    return { error: error.message };
  }
});

// Add IPC handler to save label config
ipcMain.handle('save-label-config', async (event, config) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'label-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving label config:', error);
    return { error: error.message };
  }
});

// Product Data Service IPC Handlers
ipcMain.handle('product-data-refetch-all', async () => {
  try {
    if (productDataService) {
      return await productDataService.refetchAll();
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-refetch-all:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-sync-latest', async () => {
  try {
    if (productDataService) {
      return await productDataService.syncWithLatest();
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-sync-latest:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-clear-local', async () => {
  try {
    if (productDataService) {
      return await productDataService.clearLocalData();
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-clear-local:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-get-local', async () => {
  try {
    if (productDataService) {
      return { success: true, data: productDataService.getLocalData() };
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-get-local:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-get-products-with-validation', async () => {
  try {
    if (productDataService) {
      return { success: true, data: productDataService.getProductsWithValidation() };
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-get-products-with-validation:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-get-categories', async () => {
  try {
    if (productDataService) {
      return { success: true, data: productDataService.getCategories() };
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-get-categories:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('product-data-get-sync-status', async () => {
  try {
    if (productDataService) {
      return { success: true, data: productDataService.getSyncStatus() };
    } else {
      return { success: false, error: 'Product data service not initialized' };
    }
  } catch (error) {
    console.error('Error in product-data-get-sync-status:', error);
    return { success: false, error: error.message };
  }
});

// Check if network share exists
try {
  ipcMain.handle('check-network-share', async (event, networkPath) => {
    try {
      // Check if the network share path exists
      const exists = fs.existsSync(networkPath);
      return { exists };
    } catch (error) {
      console.error('Error checking network share:', error);
      return { exists: false, error: error.message };
    }
  });
} catch (error) {
  if (error.message.includes('already be registered')) {
    console.log('Handler for check-network-share already registered, skipping...');
  } else {
    console.error('Error registering check-network-share handler:', error);
  }
}

// User preferences management
ipcMain.handle('load-user-preferences', async () => {
  try {
    const preferencesFile = path.join(app.getPath('userData'), 'user-preferences.json');
    
    if (fs.existsSync(preferencesFile)) {
      const preferences = JSON.parse(fs.readFileSync(preferencesFile, 'utf8'));
      return { success: true, data: preferences };
    } else {
      // Return default preferences
      const defaultPreferences = {
        categoryOrder: {},
        hiddenDepartments: []
      };
      return { success: true, data: defaultPreferences };
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-user-preferences', async (event, preferences) => {
  try {
    const preferencesFile = path.join(app.getPath('userData'), 'user-preferences.json');
    fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return { success: false, error: error.message };
  }
});

// Get memory usage information
ipcMain.handle('get-memory-usage', async () => {
  try {
    const usage = process.memoryUsage();
    const totalMemory = os.totalmem();
    
    return {
      success: true,
      data: {
        used: usage.heapUsed + usage.external,
        total: totalMemory,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      }
    };
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return { success: false, error: error.message };
  }
});

// Test ZPL printer connection (check if network share is accessible)
try {
  ipcMain.handle('test-zpl-printer', async (event, options = {}) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const { getSystemHostname } = require('./utils/systemConfig');
    const hostname = getSystemHostname();
    
    // Check if the network share exists using net view
    try {
      const { stdout } = await execAsync(`net view \\\\${hostname}`);
      
      // Check if zebra_print share is listed
      if (stdout.toLowerCase().includes('zebra_print')) {
        // Share exists, now check if it's accessible
        const sharePath = `\\\\${hostname}\\zebra_print`;
        try {
          fs.accessSync(sharePath, fs.constants.R_OK);
          return { success: true, status: 'connected' };
        } catch {
          return { success: false, status: 'disconnected', error: 'Share exists but is not accessible' };
        }
      } else {
        return { success: false, status: 'not_found', error: 'zebra_print share not found' };
      }
    } catch (error) {
      // net view failed - might mean the host is not accessible
      return { success: false, status: 'not_found', error: 'Cannot access host or share not configured' };
    }
  } catch (error) {
    console.error('Error testing printer share:', error);
    return { success: false, status: 'error', error: error.message };
  }
  });
} catch (error) {
  if (error.message.includes('already be registered')) {
    console.log('Handler for test-zpl-printer already registered, skipping...');
  } else {
    console.error('Error registering test-zpl-printer handler:', error);
  }
} 