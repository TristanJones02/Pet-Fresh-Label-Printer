const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const os = require('os');
const { initPrinting } = require('../electron/printing');

// Import label config from the common configuration file
const LABEL_CONFIG = require('./label/config.json');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  const indexPath = path.join(__dirname, '../public/index.html');
  mainWindow.loadFile(indexPath);
  
  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Initialize printing module
  initPrinting();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Initialize the templates directory
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Generate label preview for a product
async function generateLabelPreview(productData) {
  try {
    // Generate a barcode for the product if it doesn't have one
    const barcode = productData.barcode || generateBarcode(productData);
    
    // Prepare data for template
    const templateData = {
      product: {
        ...productData,
        barcode
      },
      config: LABEL_CONFIG,
      logoPath: path.join(__dirname, 'assets/logo.svg')
    };
    
    // Render the template
    const templatePath = path.join(__dirname, 'templates/basic.ejs');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return {
        error: "No template found. Please create a template file."
      };
    }
    
    const renderedHtml = await renderTemplate(templatePath, templateData);
    
    return {
      html: renderedHtml,
      barcode
    };
  } catch (error) {
    console.error('Error generating label preview:', error);
    return {
      error: error.message
    };
  }
}

// IPC Event Handlers
// Generate label preview for a product
ipcMain.handle('generate-label-preview', async (event, productData) => {
  return generateLabelPreview(productData);
});

// Print labels
ipcMain.handle('print-labels', async (event, { productData, quantity = 1, printerName }) => {
  try {
    // Generate label preview first
    const { html } = await generateLabelPreview(productData);
    
    // Create print options
    const printOptions = {
      silent: false,
      printBackground: true,
      deviceName: printerName,
      copies: quantity,
      pageSize: {
        width: LABEL_CONFIG.width * 1000, // microns
        height: LABEL_CONFIG.height * 1000 // microns
      }
    };
    
    // In a real implementation, we would use a printer library
    // For demo purposes, we'll just simulate success
    
    return {
      success: true,
      message: `Printed ${quantity} labels to ${printerName || 'default printer'}`
    };
  } catch (error) {
    console.error('Error printing labels:', error);
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

// Command runner for printer tools
ipcMain.handle('run-command', async (event, command) => {
  try {
    console.log('Running command:', command);
    
    // Import child_process methods
    const { exec } = require('child_process');
    
    // Handle different types of commands
    if (command.startsWith('rundll32') && command.includes('printui.dll')) {
      // For printer dialog commands, use the exact PowerShell command format that works
      
      // Extract the printer name and command type
      let printerName = '';
      let cmdType = '';
      
      if (command.includes('/n "')) {
        const match = command.match(/\/n "([^"]+)"/);
        printerName = match ? match[1] : '';
      }
      
      let windowTitle = '';
      if (command.includes('/p ')) {
        windowTitle = `${printerName} Properties`;
      } else if (command.includes('/e ')) {
        windowTitle = "Printing Preferences";
      } else if (command.includes('/o ')) {
        windowTitle = printerName;
      }
      
      // Use the exact PowerShell command format that works
      const psCommand = `Start-Process "rundll32.exe" '${command.split(' ').slice(1).join(' ')}'; Start-Sleep -Seconds 1; Add-Type '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);' -Name WinAPI -Namespace User32; $h=[User32.WinAPI]::FindWindow($null,"${windowTitle}"); if ($h -ne [IntPtr]::Zero) {[User32.WinAPI]::SetForegroundWindow($h) | Out-Null}`;
      
      return new Promise((resolve, reject) => {
        exec(`powershell.exe -Command "${psCommand.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
          if (error) {
            console.error('Error running printer dialog command:', error);
            return reject({ success: false, error: error.message });
          }
          
          console.log('Command output:', stdout);
          resolve({ success: true });
        });
      });
    }
    else if (command.includes('ZebraSetupUtilities.exe')) {
      // For Zebra setup utilities - use a similar approach with SetForegroundWindow
      const exePath = 'C:\\Program Files\\Zebra Technologies\\Zebra Setup Utilities\\ZebraSetupUtilities.exe';
      const windowTitle = 'Zebra Setup Utilities';
      
      const psCommand = `Start-Process "${exePath}"; Start-Sleep -Seconds 1; Add-Type '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);' -Name WinAPI -Namespace User32; $h=[User32.WinAPI]::FindWindow($null,"${windowTitle}"); if ($h -ne [IntPtr]::Zero) {[User32.WinAPI]::SetForegroundWindow($h) | Out-Null}`;
      
      return new Promise((resolve, reject) => {
        exec(`powershell.exe -Command "${psCommand.replace(/"/g, '\\"')}"`, (error) => {
          if (error) {
            console.error('Error running Zebra utilities:', error);
            return reject({ success: false, error: error.message });
          }
          
          resolve({ success: true });
        });
      });
    }
    else if (command.includes('PrnInst.exe')) {
      // For Zebra printer installer, find the path first then launch it with the same pattern
      return new Promise((resolve, reject) => {
        // Use powershell to run the command (gets the installer path)
        const psCmd = `powershell.exe -Command "${command}"`;
        exec(psCmd, (error, stdout, stderr) => {
          if (error) {
            console.error('Error running printer installer:', error);
            return reject({ success: false, error: error.message });
          }
          
          // If stdout contains a path to PrnInst.exe, run it using the pattern
          const path = stdout.trim();
          if (path && path.includes('PrnInst.exe')) {
            const windowTitle = 'Printer Installation Wizard';
            const launchCmd = `Start-Process "${path}"; Start-Sleep -Seconds 1; Add-Type '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);' -Name WinAPI -Namespace User32; $h=[User32.WinAPI]::FindWindow($null,"${windowTitle}"); if ($h -ne [IntPtr]::Zero) {[User32.WinAPI]::SetForegroundWindow($h) | Out-Null}`;
            
            exec(`powershell.exe -Command "${launchCmd.replace(/"/g, '\\"')}"`, (launchError) => {
              if (launchError) {
                console.error('Error launching printer installer:', launchError);
                return reject({ success: false, error: launchError.message });
              }
              
              resolve({ success: true });
            });
          } else {
            console.error('PrnInst.exe not found:', path);
            reject({ success: false, error: 'PrnInst.exe not found' });
          }
        });
      });
    }
    else {
      // For any other command
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Error running command:', error);
            return reject({ success: false, error: error.message });
          }
          
          resolve({ success: true, output: stdout });
        });
      });
    }
  } catch (error) {
    console.error('Error running command:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
});

// Settings management
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsFile = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
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
          showConfirmation: false
        },
        application: {
          darkMode: false,
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

// Generate a random barcode for a product
function generateBarcode(productData) {
  // Use the product info to create a deterministic barcode
  // In a real system, this would connect to your inventory system
  const prefix = '299'; // Example prefix for pet products
  const categoryCode = productData.category.substring(0, 2).toUpperCase();
  
  // Generate a random 7-character code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let productCode = '';
  for (let i = 0; i < 7; i++) {
    productCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}${categoryCode}${productCode}`;
}

// Render an EJS template
async function renderTemplate(templatePath, data) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, {}, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
} 