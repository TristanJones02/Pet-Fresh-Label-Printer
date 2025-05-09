const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Function to get product data from main app
function getProductData() {
  try {
    // Try to load mock products directly from the mockData.js file
    const mockDataPath = path.join(__dirname, '../../mockData.js');
    
    if (fs.existsSync(mockDataPath)) {
      console.log('Mock data file exists at:', mockDataPath);
      
      // Read the file content
      const content = fs.readFileSync(mockDataPath, 'utf8');
      
      // Use a simpler approach - extract the array data using string manipulation
      const mockProductsString = content.split('export const mockProducts =')[1];
      if (mockProductsString) {
        // Find the end of the array by matching brackets
        let bracketCount = 0;
        let endIndex = 0;
        
        for (let i = 0; i < mockProductsString.length; i++) {
          const char = mockProductsString[i];
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          if (bracketCount === 0 && i > 0) {
            endIndex = i + 1;
            break;
          }
        }
        
        // Get just the array part
        const arrayString = mockProductsString.substring(0, endIndex);
        
        // Use Function constructor to safely evaluate the array
        // This is safer than eval() while still allowing us to parse the array
        try {
          const mockProductsArray = (new Function('return ' + arrayString))();
          console.log(`Loaded ${mockProductsArray.length} products from mock data`);
          return mockProductsArray;
        } catch (evalError) {
          console.error('Error evaluating mock products array:', evalError);
          
          // Fallback to hard-coded sample products if evaluation fails
          return createSampleProducts();
        }
      }
    }
    
    console.warn('Mock data file not found. Using sample products.');
    return createSampleProducts();
  } catch (error) {
    console.error('Error getting product data:', error);
    return createSampleProducts();
  }
}

// Create some sample products if we can't load the real ones
function createSampleProducts() {
  console.log('Creating sample products');
  return [
    {
      id: 1,
      name: 'RAW CHICKEN',
      type: 'Raw Meat',
      category: 'raw',
      price: '$8.99',
      weight: '500g',
      barcode: '9351280000012',
      ingredients: 'Chicken, Bone, Organ Meat',
      expiryDays: 30
    },
    {
      id: 2,
      name: 'ORGANIC CAT FOOD',
      type: 'Cat Food',
      category: 'cat',
      price: '$12.50',
      weight: '450g',
      barcode: '9351280000029',
      ingredients: 'Salmon, Rice, Vegetables',
      expiryDays: 60
    },
    {
      id: 3,
      name: 'PREMIUM DOG KIBBLE',
      type: 'Dog Food',
      category: 'dog',
      price: '$15.99',
      weight: '1kg',
      barcode: '9351280000036',
      ingredients: 'Beef, Sweet Potato, Peas',
      expiryDays: 90
    },
    {
      id: 4,
      name: 'KANGAROO MINCE',
      type: 'Raw Meat',
      category: 'raw',
      price: '$10.99',
      weight: '750g',
      barcode: '9351280000043',
      ingredients: '100% Ground Kangaroo Meat',
      expiryDays: 21
    }
  ];
}

// Function to create the main window
function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Allow loading local images
    },
    title: 'Product Image Generator',
  });

  // Load the generator HTML file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Send product data to the renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded, getting product data...');
    try {
      const products = getProductData();
      console.log(`Sending ${products.length} products to renderer process`);
      
      // Add debugging info in dev mode
      if (process.env.NODE_ENV === 'development') {
        if (products.length > 0) {
          console.log('Sample product:', products[0]);
        }
      }
      
      mainWindow.webContents.send('product-data', products);
    } catch (error) {
      console.error('Error preparing product data:', error);
      mainWindow.webContents.send('product-data-error', { 
        message: error.message,
        stack: error.stack 
      });
    }
  });

  // Open DevTools for debugging in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Set up IPC event handlers
  setupIpcHandlers();

  app.on('activate', function () {
    // On macOS re-create a window when the dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Set up IPC handlers for file operations
function setupIpcHandlers() {
  // Handle base image selection
  ipcMain.handle('select-base-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
      title: 'Select Base Image',
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      // Read file as base64 for preview
      const fileData = fs.readFileSync(filePath);
      const base64Data = `data:image/${path.extname(filePath).substring(1)};base64,${fileData.toString('base64')}`;
      
      return {
        path: filePath,
        base64: base64Data,
        filename: path.basename(filePath)
      };
    }
    return null;
  });

  // Handle overlay image selection
  ipcMain.handle('select-overlay-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png'] }],
      title: 'Select Label Overlay Image',
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      // Read file as base64 for preview
      const fileData = fs.readFileSync(filePath);
      const base64Data = `data:image/png;base64,${fileData.toString('base64')}`;
      
      return {
        path: filePath,
        base64: base64Data,
        filename: path.basename(filePath)
      };
    }
    return null;
  });

  // Handle image saving
  ipcMain.handle('save-generated-image', async (event, imgDataUrl) => {
    // Convert the data URL to a buffer
    const base64Data = imgDataUrl.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const result = await dialog.showSaveDialog({
      title: 'Save Generated Image',
      defaultPath: 'product-image.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, imageBuffer);
      return {
        success: true,
        path: result.filePath
      };
    }
    
    return {
      success: false
    };
  });

  // Get label config
  ipcMain.handle('get-label-config', () => {
    try {
      const configPath = path.join(__dirname, '../../label/config.json');
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error('Error reading label config:', error);
      return null;
    }
  });
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 