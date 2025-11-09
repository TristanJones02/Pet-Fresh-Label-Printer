/**
 * New Label Processing System
 * Handles the complete workflow from new API data to network printing
 */

const fs = require('fs').promises;
const path = require('path');
const { transformProductData, processZplWithTransformedData } = require('./dataTransformer');
const { printToNetworkPrinter, sendStopCommand, testNetworkPrinter } = require('./networkPrinter');

/**
 * Load ZPL template file
 * @param {string} templateName - Template filename without extension
 * @returns {Promise<string>} - ZPL template content
 */
async function loadZplTemplate(templateName = 'label_template') {
  try {
    // Try multiple paths for template loading
    let templatePath;
    
    // First try: relative to current file (development)
    templatePath = path.join(__dirname, 'templates', `${templateName}.zpl`);
    
    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      return templateContent;
    } catch (devError) {
      // Second try: in resources folder (packaged app)
      try {
        const { app } = require('electron');
        if (app && app.isPackaged) {
          templatePath = path.join(process.resourcesPath, 'app', 'src', 'zpl', 'templates', `${templateName}.zpl`);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          return templateContent;
        }
      } catch (packagedError) {
        console.warn('Could not load from packaged resources, trying user data folder');
      }
      
      // Third try: user data folder
      try {
        const { app } = require('electron');
        if (app && app.getPath) {
          templatePath = path.join(app.getPath('userData'), 'templates', `${templateName}.zpl`);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          return templateContent;
        }
      } catch (userDataError) {
        console.error('All template loading attempts failed');
      }
      
      throw devError; // Re-throw original error if all attempts fail
    }
  } catch (error) {
    console.error(`Error loading ZPL template ${templateName}:`, error);
    throw new Error(`Failed to load ZPL template: ${templateName}`);
  }
}

/**
 * Generate ZPL content from new API product data
 * @param {Object} product - Product data in new API format
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Complete ZPL ready for printing
 */
async function generateZplFromNewApiData(product, options = {}) {
  const { templateName = 'label_template', quantity = 1, margins = {} } = options;

  try {
    // Transform the product data to ZPL field mappings
    const transformedData = transformProductData(product);
    console.log('Transformed product data:', transformedData);

    // Load the ZPL template
    const zplTemplate = await loadZplTemplate(templateName);

    // Process the template with the transformed data and margins
    let processedZpl = processZplWithTransformedData(zplTemplate, transformedData, margins);

    // Handle quantity if > 1
    if (quantity > 1) {
      // Update the print quantity in the ZPL (look for ^PQ command and replace, or add it)
      if (processedZpl.includes('^PQ')) {
        processedZpl = processedZpl.replace(/\^PQ\d+/, `^PQ${quantity}`);
      } else {
        // Add quantity command after ^XA
        processedZpl = processedZpl.replace('^XA', `^XA\n^PQ${quantity}`);
      }
    }

    return processedZpl;

  } catch (error) {
    console.error('Error generating ZPL from new API data:', error);
    throw error;
  }
}

/**
 * Complete label printing workflow with new API data
 * @param {Object} product - Product data in new API format
 * @param {Object} options - Complete workflow options
 * @returns {Promise<Object>} - Complete workflow result
 */
async function printLabelFromNewApiData(product, options = {}) {
  try {
    console.log('Starting label printing workflow with new API data...');
    console.log('Product data:', product);

    // Generate ZPL content
    const zplContent = await generateZplFromNewApiData(product, options);
    console.log('Generated ZPL content length:', zplContent.length);

    // Print to network printer
    const printResult = await printToNetworkPrinter(zplContent, options.print);

    return {
      success: true,
      message: 'Label printed successfully using new API data',
      product: {
        name: product.productname,
        sku: product.sku,
        price: product.productprice
      },
      printResult: printResult,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in complete printing workflow:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Cancel current print job
 * @param {Object} options - Cancel options
 * @returns {Promise<Object>} - Cancel result
 */
async function cancelPrintJob(options = {}) {
  try {
    console.log('Cancelling print job...');
    return await sendStopCommand(options);
  } catch (error) {
    console.error('Error cancelling print job:', error);
    throw error;
  }
}

/**
 * Test the complete new system
 * @param {Object} options - Test options  
 * @returns {Promise<Object>} - Test result
 */
async function testNewSystem(options = {}) {
  console.log('Testing new label system...');
  
  // Sample product data in new API format
  const testProduct = {
    productname: "Premium Dog Treats Natural Chicken",
    productprice: 1595, // $15.95 in cents
    sku: "PDT001",
    barcodes: ["100004"],
    productIngredients: "100% AUSTRALIAN SOURCED CHICKEN - DEHYDRATED",
    productStorageInstructions: "100% NATURAL\\nNO ARTIFICIAL COLOURS\\nWA OWNED AND PRODUCED",
    productSize: 80,
    productUnit: "g",
    expirationDuration: 12,
    expirationType: "months"
  };

  try {
    // Test ZPL generation
    const zplContent = await generateZplFromNewApiData(testProduct);
    console.log('Test ZPL generation successful, length:', zplContent.length);

    // Test network printing if requested
    if (options.testPrint) {
      const printResult = await printToNetworkPrinter(zplContent);
      return {
        success: true,
        message: 'Complete system test successful',
        zplGenerated: true,
        printResult: printResult
      };
    }

    return {
      success: true,
      message: 'ZPL generation test successful',
      zplGenerated: true,
      zplLength: zplContent.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateZplFromNewApiData,
  printLabelFromNewApiData,
  cancelPrintJob,
  testNewSystem,
  loadZplTemplate
};