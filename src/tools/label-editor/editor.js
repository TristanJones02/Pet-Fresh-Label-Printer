const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Function to extract label dimensions from config.json
function extractLabelDimensionsFromConfig() {
  try {
    // Read the config.json file
    const configPath = path.join(__dirname, '../../../src/label/config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Parse the JSON content
    const config = JSON.parse(configContent);
    
    // Flatten nested properties for easier editing in the UI
    const dimensions = {
      labelWidth: config.width,
      labelHeight: config.height,
      horizontalMargin: config.horizontalMargin,
      verticalMargin: config.verticalMargin,
      contentStartY: config.contentStartY,
      productTitleHeight: config.productTitleHeight,
      ingredientsY: config.ingredientsY,
      ingredientsHeight: config.ingredientsHeight,
      petFoodOnlyY: config.petFoodOnlyY,
      petFoodOnlyHeight: config.petFoodOnlyHeight,
      storageInstructionsY: config.storageInstructionsY,
      storageInstructionsHeight: config.storageInstructionsHeight,
      dataY: config.dataY,
      dataHeight: config.dataHeight,
      priceY: config.priceY,
      priceHeight: config.priceHeight,
      barcodeWidth: config.barcode?.width || 28,
      barcodeHeight: config.barcode?.height || 15.5
    };
    
    return dimensions;
  } catch (error) {
    console.error('Error extracting dimensions from config.json:', error);
    
    // Return default dimensions if we can't read the file
    return {
      labelWidth: 60,
      labelHeight: 162,
      horizontalMargin: 5,
      verticalMargin: 5,
      contentStartY: 50,
      productTitleHeight: 20.5,
      ingredientsY: 70.5,
      ingredientsHeight: 15.5,
      petFoodOnlyY: 86,
      petFoodOnlyHeight: 6.5,
      storageInstructionsY: 92.5,
      storageInstructionsHeight: 12.5,
      dataY: 105,
      dataHeight: 19.5,
      priceY: 124.5,
      priceHeight: 3,
      barcodeWidth: 28,
      barcodeHeight: 15.5
    };
  }
}

function createWindow() {
  // Extract label dimensions from config
  const dimensions = extractLabelDimensionsFromConfig();
  
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the editor HTML file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Pass label dimensions to the renderer process when ready
  mainWindow.webContents.on('did-finish-load', () => {
    if (dimensions) {
      mainWindow.webContents.send('label-dimensions', dimensions);
    } else {
      mainWindow.webContents.send('dimensions-error', {
        message: 'Could not load dimensions from config'
      });
    }
  });

  // Open DevTools for debugging
  // mainWindow.webContents.openDevTools();
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Listen for dimension export request
  const { ipcMain } = require('electron');
  
  ipcMain.on('export-dimensions', (event, dimensions) => {
    console.log('Exporting dimensions to config.json:', dimensions);
    
    try {
      // Convert the flat dimensions back to the nested structure
      const updatedConfig = {
        width: Number(dimensions.labelWidth),
        height: Number(dimensions.labelHeight),
        horizontalMargin: Number(dimensions.horizontalMargin),
        verticalMargin: Number(dimensions.verticalMargin),
        contentStartY: Number(dimensions.contentStartY),
        productTitleHeight: Number(dimensions.productTitleHeight),
        ingredientsY: Number(dimensions.ingredientsY),
        ingredientsHeight: Number(dimensions.ingredientsHeight),
        petFoodOnlyY: Number(dimensions.petFoodOnlyY),
        petFoodOnlyHeight: Number(dimensions.petFoodOnlyHeight),
        storageInstructionsY: Number(dimensions.storageInstructionsY),
        storageInstructionsHeight: Number(dimensions.storageInstructionsHeight),
        dataY: Number(dimensions.dataY),
        dataHeight: Number(dimensions.dataHeight),
        priceY: Number(dimensions.priceY),
        priceHeight: Number(dimensions.priceHeight),
        barcode: {
          width: Number(dimensions.barcodeWidth),
          height: Number(dimensions.barcodeHeight)
        },
        // Preserve the nested font settings from the original config
        fonts: readOriginalFontSettings()
      };
      
      // Read the config.json file
      const configPath = path.join(__dirname, '../../../src/label/config.json');
      
      // Write the updated content back to the file with pretty formatting
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');
      console.log('Successfully saved config to:', configPath);
      event.reply('export-dimensions-result', { success: true });
    } catch (error) {
      console.error('Error updating config.json:', error);
      event.reply('export-dimensions-result', { success: false, error: error.message });
    }
  });

  app.on('activate', function () {
    // On macOS re-create a window when the dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Helper function to read the original font settings to preserve them
function readOriginalFontSettings() {
  try {
    const configPath = path.join(__dirname, '../../../src/label/config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    return config.fonts || defaultFontSettings();
  } catch (error) {
    return defaultFontSettings();
  }
}

// Default font settings in case we can't read the original
function defaultFontSettings() {
  return {
    productTitle: {
      size: 7,
      lineHeight: 1.15
    },
    ingredients: {
      headerSize: 3.5,
      contentSize: 2.5,
      lineHeight: 3
    },
    petFoodOnly: {
      size: 5
    },
    storage: {
      size: 2.5,
      lineHeight: 3
    },
    data: {
      labelSize: 2.2,
      valueSize: 2.5
    },
    price: {
      valueSize: 5.5,
      labelSize: 2.2
    }
  };
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 