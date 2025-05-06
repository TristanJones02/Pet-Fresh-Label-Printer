const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Define label dimensions in mm
const LABEL_CONFIG = {
  width: 62,  // mm
  height: 29, // mm
  dpi: 300,   // dots per inch
};

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
  
  // Create a basic label template if it doesn't exist
  const basicTemplate = path.join(templatesDir, 'basic.ejs');
  if (!fs.existsSync(basicTemplate)) {
    const templateContent = `
      <div class="label" style="width: <%= config.width %>mm; height: <%= config.height %>mm; position: relative; font-family: Arial, sans-serif;">
        <!-- Logo -->
        <div style="position: absolute; top: 2mm; left: 2mm; height: 8mm;">
          <img src="<%= logoPath %>" height="100%" />
        </div>
        
        <!-- Product Name -->
        <div style="position: absolute; top: 3mm; left: 12mm; font-size: 3.5mm; font-weight: bold;">
          <%= product.name %>
        </div>
        
        <!-- Category -->
        <div style="position: absolute; top: 7mm; left: 12mm; font-size: 2.5mm; color: <%= product.categoryColor %>;">
          <%= product.category %>
        </div>
        
        <!-- Barcode -->
        <div style="position: absolute; bottom: 2mm; left: 2mm; width: 58mm; text-align: center;">
          <!-- Simple barcode representation -->
          <div style="background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px); height: 8mm; width: 80%; margin: 0 auto;"></div>
          <div style="font-size: 2mm; margin-top: 1mm;"><%= product.barcode %></div>
        </div>
        
        <!-- Website -->
        <div style="position: absolute; top: 11mm; left: 12mm; font-size: 2mm;">
          www.petfresh.com.au
        </div>
      </div>
    `;
    fs.writeFileSync(basicTemplate, templateContent);
  }
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