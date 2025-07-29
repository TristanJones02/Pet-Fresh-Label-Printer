/**
 * Label printing functionality
 * Contains methods for generating print-ready label HTML and handling print jobs
 */

// Import barcode utilities
import { generateBarcodeSvg, formatBarcode } from './utils/barcodeGenerator';
import labelConfig from './config.json';

// Use the centralized config instead of hardcoded values
const DEFAULT_LABEL_CONFIG = labelConfig;

/**
 * Generate a print-ready HTML template for a label using the React-based system
 * @param {Object} product - The product data
 * @param {Object} options - Additional options for label generation
 * @returns {Object} - Object containing HTML content and metadata
 */
export const generatePrintableLabel = async (product, options = {}) => {
  if (!product) {
    throw new Error('Product data is required');
  }
  
  const {
    showBarcode = true,
    useOverlay = false,
    labelConfig = DEFAULT_LABEL_CONFIG,
  } = options;
  
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
  
  // Use the React-based template system via the main process
  if (window.api?.printLabelWithTemplate) {
    try {
      const result = await window.api.printLabelWithTemplate(
        product,
        1, // quantity (not used for HTML generation)
        labelConfig,
        null // printer settings
      );
      
      if (result.success) {
  return {
          html: result.html,
          productInfo: result.productInfo,
    timestamp: new Date().toISOString()
  };
      } else {
        throw new Error(result.error || 'Failed to generate label HTML');
      }
    } catch (error) {
      console.error('Error using React-based template system:', error);
      throw error;
    }
  } else {
    throw new Error('React-based template system not available');
  }
};

/**
 * Generate a barcode as SVG with higher quality rendering
 * @param {string} barcode - Barcode to generate
 * @returns {string} - SVG string representation of barcode
 */
const generateBarcodeAsSVG = (barcode) => {
  // Use our new unified barcode generator
  return generateBarcodeSvg(barcode);
};

/**
 * Print a label (main function to be called from the application)
 * @param {Object} product - Product to print
 * @param {number} quantity - Number of copies to print
 * @param {Object} options - Print options
 * @returns {Promise<Object>} - Status of the print job
 */
export const printLabel = async (product, quantity = 1, options = {}) => {
  try {
    // Generate the label
    const labelData = await generatePrintableLabel(product, options);
    
    // If running in Electron, use the electron API
    if (window.api?.printLabels) {
      return await window.api.printLabels({
        labelData,
        quantity,
        printerName: options.printerName
      });
    } 
    
    // For browser-only version or testing
    console.log('Print label:', labelData, 'Quantity:', quantity);
    return {
      success: true,
      message: `Printed ${quantity} labels (simulation)`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error printing label:', error);
    throw error;
  }
}; 