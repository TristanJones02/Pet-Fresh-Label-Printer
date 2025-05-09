const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const os = require('os');

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

// HTML-to-PDF conversion for label printing
ipcMain.handle('print-label', async (event, { html, quantity = 1, savePath = null }) => {
  try {
    const startTime = Date.now();
    const timing = {
      htmlLoad: 0,
      imageGeneration: 0,
      pdfGeneration: 0,
      fileSave: 0,
      total: 0
    };
    
    // Create a temporary directory for the HTML file
    const tempDir = path.join(os.tmpdir(), 'pet-fresh-labels');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a temporary HTML file
    const tempHtmlPath = path.join(tempDir, `label-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, html, 'utf-8');
    
    // Record HTML load time start
    const htmlLoadStart = Date.now();
    
    // Load current settings to check for development image mode
    let settings = {};
    try {
      const settingsFile = path.join(app.getPath('userData'), 'settings.json');
      if (fs.existsSync(settingsFile)) {
        const settingsData = fs.readFileSync(settingsFile, 'utf8');
        settings = JSON.parse(settingsData);
      }
    } catch (err) {
      console.error('Error loading settings for print job:', err);
    }
    const useDevImageMode = settings?.application?.devImageGeneration || false;
    const devImagePath = settings?.application?.devImagePath || path.join(app.getPath('pictures'), 'PetFresh-Labels');
    const includeContentOnly = settings?.application?.includeContentOnly || true;
    const includeGraphics = settings?.application?.includeGraphics || false;
    
    // Create an offscreen BrowserWindow to load the HTML
    const offscreenWindow = new BrowserWindow({
      width: LABEL_CONFIG.width * 4, // Scale up for better quality
      height: LABEL_CONFIG.height * 4,
      show: false,
      webPreferences: {
        offscreen: true,
        enableRemoteModule: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the HTML file
    await offscreenWindow.loadFile(tempHtmlPath);
    timing.htmlLoad = Date.now() - htmlLoadStart;
    
    // If dev image mode is enabled, generate PNG instead of PDF
    if (useDevImageMode) {
      // Ensure the output directory exists
      if (!fs.existsSync(devImagePath)) {
        fs.mkdirSync(devImagePath, { recursive: true });
      }
      
      // Generate PNG
      const imageGenStart = Date.now();
      
      // If we're only including content, we need to execute some JS in the page
      // to hide the non-content elements before capture
      if (includeContentOnly) {
        // Execute script in the page to hide non-content elements and adjust view
        await offscreenWindow.webContents.executeJavaScript(`
          // Hide page margins, background, etc.
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          document.body.style.background = 'transparent';
          
          // Find the main content container (adjust selector based on your HTML structure)
          const contentContainer = document.querySelector('.label-content');
          if (contentContainer) {
            // Make sure content is visible
            contentContainer.style.display = 'block';
            contentContainer.style.visibility = 'visible';
            
            // Hide any non-content elements
            Array.from(document.body.children).forEach(el => {
              if (el !== contentContainer && !contentContainer.contains(el)) {
                el.style.display = 'none';
              }
            });
          }
          
          // If we need to include/exclude graphics overlay
          const graphicsOverlay = document.querySelector('.graphics-overlay');
          if (graphicsOverlay) {
            graphicsOverlay.style.display = ${includeGraphics ? "'block'" : "'none'"};
          }
          
          true; // Return something to confirm execution
        `);
      }
      
      const image = await offscreenWindow.webContents.capturePage();
      timing.imageGeneration = Date.now() - imageGenStart;
      
      // Save image to file
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/g, '');
      const outputPath = savePath || path.join(devImagePath, `label-${timestamp}.png`);
      
      const fileSaveStart = Date.now();
      fs.writeFileSync(outputPath, image.toPNG());
      timing.fileSave = Date.now() - fileSaveStart;
      
      // Generate additional copies if needed
      const imagePaths = [outputPath];
      if (quantity > 1) {
        for (let i = 1; i < quantity; i++) {
          const copyPath = outputPath.replace('.png', `-${i+1}.png`);
          fs.copyFileSync(outputPath, copyPath);
          imagePaths.push(copyPath);
        }
      }
      
      // Close the offscreen window
      offscreenWindow.close();
      
      // Clean up temporary HTML file
      try {
        fs.unlinkSync(tempHtmlPath);
      } catch (err) {
        console.error('Error removing temp HTML file:', err);
      }
      
      // Calculate total time
      timing.total = Date.now() - startTime;
      
      // Log timing information and file path
      console.log(`Generated PNG label in ${timing.total}ms`);
      console.log(`- HTML load: ${timing.htmlLoad}ms`);
      console.log(`- Image generation: ${timing.imageGeneration}ms`);
      console.log(`- File save: ${timing.fileSave}ms`);
      console.log(`PNG saved to: ${outputPath}`);
      
      return {
        success: true,
        imagePath: outputPath,
        imagePaths,
        timing,
        message: `Generated ${quantity} label PNG(s)`
      };
    } else {
      // Default PDF generation path
      // Calculate PDF options
      const pdfOptions = {
        printBackground: true,
        pageSize: {
          width: LABEL_CONFIG.width * 1000, // microns
          height: LABEL_CONFIG.height * 1000 // microns
        },
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        preferCSSPageSize: true
      };
      
      // Determine output path
      let outputPath = savePath;
      if (!outputPath) {
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/g, '');
        outputPath = path.join(tempDir, `label-${timestamp}.pdf`);
      }
      
      // Generate PDF 
      const pdfGenStart = Date.now();
      const pdfData = await offscreenWindow.webContents.printToPDF(pdfOptions);
      timing.pdfGeneration = Date.now() - pdfGenStart;
      
      // Save PDF to file
      const fileSaveStart = Date.now();
      fs.writeFileSync(outputPath, pdfData);
      timing.fileSave = Date.now() - fileSaveStart;
      
      // Close the offscreen window
      offscreenWindow.close();
      
      // If we need multiple copies, duplicate the PDF file
      const pdfPaths = [outputPath];
      
      if (quantity > 1) {
        for (let i = 1; i < quantity; i++) {
          const copyPath = outputPath.replace('.pdf', `-${i+1}.pdf`);
          fs.copyFileSync(outputPath, copyPath);
          pdfPaths.push(copyPath);
        }
      }
      
      // Clean up temporary HTML file
      try {
        fs.unlinkSync(tempHtmlPath);
      } catch (err) {
        console.error('Error removing temp HTML file:', err);
      }
      
      // Calculate total time
      timing.total = Date.now() - startTime;
      
      // Log timing information and file path
      console.log(`Generated PDF label in ${timing.total}ms`);
      console.log(`- HTML load: ${timing.htmlLoad}ms`);
      console.log(`- PDF generation: ${timing.pdfGeneration}ms`);
      console.log(`- File save: ${timing.fileSave}ms`);
      console.log(`PDF saved to: ${outputPath}`);
      
      return {
        success: true,
        pdfPath: outputPath,
        pdfPaths,
        timing,
        message: `Generated ${quantity} label PDF(s)`
      };
    }
  } catch (error) {
    console.error('Error generating label:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get available printers
ipcMain.handle('get-printers', async () => {
  try {
    // In a real application, we would use a printer library to get printers
    // For this demo, we'll return mock data
    return [
      { name: 'KITCHEN', isDefault: true },
      { name: 'OFFICE', isDefault: false },
      { name: 'PACKAGING', isDefault: false }
    ];
  } catch (error) {
    console.error('Error getting printers:', error);
    return {
      error: error.message
    };
  }
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
          defaultPrinter: 'KITCHEN',
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