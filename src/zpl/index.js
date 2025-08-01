/**
 * ZPL Label System - Main Export Module
 * Uses the new API-compatible system for label generation and network printing
 */

const newLabelSystem = require('./newLabelSystem');
const networkPrinter = require('./networkPrinter');
const dataTransformer = require('./dataTransformer');

module.exports = {
  // New API-compatible functions
  generateZplForProduct: newLabelSystem.generateZplFromNewApiData,
  generateLabelData: async (product, options = {}) => {
    const zplContent = await newLabelSystem.generateZplFromNewApiData(product, options);
    return {
      product: {
        id: product.id,
        name: product.productname,
        nameL1: product.productNameL1,
        nameL2: product.productNameL2
      },
      zpl: zplContent,
      quantity: options.quantity || 1,
      timestamp: new Date().toISOString(),
      preview: null // Preview generation will be handled separately
    };
  },
  
  // Printing functions
  printLabel: networkPrinter.printToNetworkPrinter,
  printProductLabel: newLabelSystem.printLabelFromNewApiData,
  
  // Test functions
  testPrinterCommunication: networkPrinter.testNetworkPrinter,
  
  // Preview functions (placeholder - will need to be implemented if needed)
  generateZplPreviewDataUrl: async (zplContent, options = {}) => {
    // For now, return null - preview can be implemented later
    console.log('Preview generation not implemented in new system yet');
    return null;
  },

  // Individual modules for advanced usage
  newLabelSystem,
  networkPrinter,
  dataTransformer
};