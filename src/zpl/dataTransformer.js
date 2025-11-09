/**
 * Data Transformation System for New API Structure
 * Converts the new API product data to ZPL template field mappings
 */

const os = require('os');

/**
 * Transform new API product data to ZPL template fields
 * @param {Object} product - Product data from new API structure
 * @returns {Object} - Mapped data for ZPL template
 */
function transformProductData(product) {
  if (!product) {
    throw new Error('Product data is required');
  }

  // Use pre-split product names from API (max 13 chars each)
  const nameL1 = product.productNameL1 || '';
  const nameL2 = product.productNameL2 || '';

  // Convert price from cents to dollars with $ symbol
  const priceInCents = product.productprice || 0;
  const formattedPrice = `$${(priceInCents / 100).toFixed(2)}`;

  // Get first barcode from array
  const barcode = product.barcodes && product.barcodes.length > 0 ? product.barcodes[0] : '';

  // Split storage instructions into 3 lines by \n
  const storageInstructions = product.productStorageInstructions || '';
  const instructionLines = storageInstructions.split('\\n').filter(line => line.trim());
  const specialMessage1 = instructionLines[0] || '';
  const specialMessage2 = instructionLines[1] || '';
  const specialMessage3 = instructionLines[2] || '';

  // Calculate expiry date
  const expiryDate = calculateExpiryDate(product.expirationDuration, product.expirationType);

  // Format weight
  const weight = formatWeight(product.productSize, product.productUnit);

  return {
    'NAME_L1_VAR': nameL1.substring(0, 13), // Max 13 characters
    'NAME_L2_VAR': nameL2.substring(0, 13), // Max 13 characters
    'PRICE_VAR': formattedPrice, // Includes $ symbol
    'BARCODE_VAR': barcode,
    'INGREDIENTS_VAR': product.productIngredients || '',
    'SPECIAL_MSG1_VAR': specialMessage1.substring(0, 50),
    'SPECIAL_MSG2_VAR': specialMessage2.substring(0, 50), 
    'SPECIAL_MSG3_VAR': specialMessage3.substring(0, 50),
    'EXP_VAR': expiryDate,
    'WGT_VAR': weight
  };
}

/**
 * Calculate expiry date based on duration and type
 * @param {number} duration - Duration number
 * @param {string} type - Type (days, weeks, months, years)
 * @returns {string} - Formatted expiry date DD/MM/YYYY
 */
function calculateExpiryDate(duration, type) {
  if (!duration || !type) {
    return '';
  }

  const today = new Date();
  const expiryDate = new Date(today);

  switch (type.toLowerCase()) {
    case 'days':
      expiryDate.setDate(today.getDate() + duration);
      break;
    case 'weeks':
      expiryDate.setDate(today.getDate() + (duration * 7));
      break;
    case 'months':
      expiryDate.setMonth(today.getMonth() + duration);
      break;
    case 'years':
      expiryDate.setFullYear(today.getFullYear() + duration);
      break;
    default:
      expiryDate.setDate(today.getDate() + duration);
  }

  return expiryDate.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format weight with unit
 * @param {number} size - Product size
 * @param {string} unit - Product unit (g, kg, etc.)
 * @returns {string} - Formatted weight string
 */
function formatWeight(size, unit) {
  if (!size || !unit) {
    return '';
  }
  return `${size}${unit}`;
}

/**
 * Get system hostname for network printing
 * @returns {string} - System hostname
 */
function getHostname() {
  return os.hostname();
}

/**
 * Apply margin adjustments to ZPL by modifying field positions
 * @param {string} zpl - ZPL content
 * @param {Object} margins - Margin adjustments in mm
 * @returns {string} - ZPL with adjusted positions
 */
function applyMarginsToZpl(zpl, margins) {
  if (!margins) return zpl;
  
  // Convert mm to dots (203 dpi = 8 dots per mm)
  const dotsPerMm = 8;
  const leftAdjust = Math.round((margins.left || 0) * dotsPerMm);
  const topAdjust = Math.round((margins.top || 0) * dotsPerMm);
  
  let adjustedZpl = zpl;
  
  // Adjust all ^FO (Field Origin) commands
  // Pattern: ^FOx,y where x and y are numbers
  adjustedZpl = adjustedZpl.replace(/\^FO(\d+),(\d+)/g, (match, x, y) => {
    const newX = Math.max(0, parseInt(x) + leftAdjust);
    const newY = Math.max(0, parseInt(y) + topAdjust);
    return `^FO${newX},${newY}`;
  });
  
  // Adjust label home position if margins are set
  if (leftAdjust !== 0 || topAdjust !== 0) {
    // Add or update ^LH (Label Home) command
    if (adjustedZpl.includes('^LH')) {
      adjustedZpl = adjustedZpl.replace(/\^LH(\d+),(\d+)/g, (match, x, y) => {
        const newX = Math.max(0, parseInt(x) + leftAdjust);
        const newY = Math.max(0, parseInt(y) + topAdjust);
        return `^LH${newX},${newY}`;
      });
    } else {
      // Add ^LH after ^XA if not present
      adjustedZpl = adjustedZpl.replace(/\^XA/, `^XA\n^LH${leftAdjust},${topAdjust}`);
    }
  }
  
  return adjustedZpl;
}

/**
 * Process ZPL template with transformed data
 * @param {string} zplTemplate - ZPL template content
 * @param {Object} transformedData - Data from transformProductData
 * @param {Object} margins - Margin adjustments in mm
 * @returns {string} - Processed ZPL ready for printing
 */
function processZplWithTransformedData(zplTemplate, transformedData, margins = {}) {
  let processedZpl = zplTemplate;

  // Replace field placeholders with simple string replacement for now
  Object.entries(transformedData).forEach(([field, value]) => {
    console.log(`Replacing field: ${field} with value: ${value}`);
    
    // Simple string replacement - no special cases needed
    const searchPattern = `^FD${field}^FS`;
    const replacePattern = `^FD${value}^FS`;
    
    if (processedZpl.includes(searchPattern)) {
      processedZpl = processedZpl.replace(searchPattern, replacePattern);
      console.log(`Successfully replaced ${searchPattern} with ${replacePattern}`);
    } else {
      console.log(`Pattern not found: ${searchPattern}`);
    }
  });

  // Apply margin adjustments if provided
  if (margins && (margins.top || margins.left || margins.bottom || margins.right)) {
    processedZpl = applyMarginsToZpl(processedZpl, margins);
  }
  
  return processedZpl;
}

module.exports = {
  transformProductData,
  calculateExpiryDate,
  formatWeight,
  getHostname,
  processZplWithTransformedData,
  applyMarginsToZpl
};