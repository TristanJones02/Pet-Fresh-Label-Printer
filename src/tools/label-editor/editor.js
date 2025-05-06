const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Function to extract label dimensions from renderer.js
function extractLabelDimensionsFromRenderer() {
  try {
    // Read the renderer.js file
    const rendererPath = path.join(__dirname, '../../renderer.js');
    const rendererContent = fs.readFileSync(rendererPath, 'utf8');
    
    // Extract label dimensions using regex
    const dimensions = {
      labelWidth: extractValue(rendererContent, 'const labelWidth = ([0-9.]+);'),
      labelHeight: extractValue(rendererContent, 'const labelHeight = ([0-9.]+);'),
      horizontalMargin: extractValue(rendererContent, 'const horizontalMargin = ([0-9.]+);'),
      gutterHeight: extractValue(rendererContent, 'const gutterHeight = ([0-9.]+);'),
      productTitleHeight: extractValue(rendererContent, 'const productTitleHeight = ([0-9.]+);'),
      ingredientsHeight: extractValue(rendererContent, 'const ingredientsHeight = ([0-9.]+);'),
      petFoodOnlyHeight: extractValue(rendererContent, 'const petFoodOnlyHeight = ([0-9.]+);'),
      storageInstructionsHeight: extractValue(rendererContent, 'const storageInstructionsHeight = ([0-9.]+);'),
      dataHeight: extractValue(rendererContent, 'const dataHeight = ([0-9.]+);'),
      priceHeight: extractValue(rendererContent, 'const priceHeight = ([0-9.]+);'),
      contentStartY: extractValue(rendererContent, 'const contentStartY = ([0-9.]+);')
    };
    
    return dimensions;
  } catch (error) {
    console.error('Error extracting dimensions:', error);
    return null;
  }
}

// Helper function to extract numeric values from string using regex
function extractValue(content, pattern) {
  const match = content.match(new RegExp(pattern));
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

function createWindow() {
  // Extract label dimensions from renderer.js
  const dimensions = extractLabelDimensionsFromRenderer();
  
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
    console.log('Exporting dimensions to renderer.js:', dimensions);
    
    try {
      // Read the renderer.js file
      const rendererPath = path.join(__dirname, '../../renderer.js');
      let rendererContent = fs.readFileSync(rendererPath, 'utf8');
      
      // Update each dimension in the file
      rendererContent = updateDimension(rendererContent, 'labelWidth', dimensions.labelWidth);
      rendererContent = updateDimension(rendererContent, 'labelHeight', dimensions.labelHeight);
      rendererContent = updateDimension(rendererContent, 'horizontalMargin', dimensions.horizontalMargin);
      rendererContent = updateDimension(rendererContent, 'gutterHeight', dimensions.gutterHeight);
      rendererContent = updateDimension(rendererContent, 'contentStartY', dimensions.contentStartY);
      rendererContent = updateDimension(rendererContent, 'productTitleHeight', dimensions.productTitleHeight);
      rendererContent = updateDimension(rendererContent, 'ingredientsHeight', dimensions.ingredientsHeight);
      rendererContent = updateDimension(rendererContent, 'petFoodOnlyHeight', dimensions.petFoodOnlyHeight);
      rendererContent = updateDimension(rendererContent, 'storageInstructionsHeight', dimensions.storageInstructionsHeight);
      rendererContent = updateDimension(rendererContent, 'dataHeight', dimensions.dataHeight);
      rendererContent = updateDimension(rendererContent, 'priceHeight', dimensions.priceHeight);
      
      // Write the updated content back to the file
      fs.writeFileSync(rendererPath, rendererContent, 'utf8');
      event.reply('export-dimensions-result', { success: true });
    } catch (error) {
      console.error('Error updating renderer.js:', error);
      event.reply('export-dimensions-result', { success: false, error: error.message });
    }
  });

  app.on('activate', function () {
    // On macOS re-create a window when the dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Helper function to update a dimension in the file content
function updateDimension(content, name, value) {
  if (value === null || value === undefined) return content;
  
  // Round to 0.5 increment
  value = Math.round(value * 2) / 2;
  
  // Replace the dimension value
  const pattern = new RegExp(`(const ${name} = )([0-9.]+)(;)`);
  return content.replace(pattern, `$1${value}$3`);
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 