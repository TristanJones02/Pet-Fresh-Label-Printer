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
    'NAME_L1*_VAR': nameL1.substring(0, 13), // Max 13 characters
    'NAME_L2*_VAR': nameL2.substring(0, 13), // Max 13 characters
    'PRICE_VAR': formattedPrice, // Includes $ symbol
    'BARCODE*_VAR': barcode,
    'INGREDIENTS*_VAR': product.productIngredients || '',
    'SPECIAL_MSG1*_VAR': specialMessage1.substring(0, 50),
    'SPECIAL_MSG2*_VAR': specialMessage2.substring(0, 50), 
    'SPECIAL_MSG3*_VAR': specialMessage3.substring(0, 50),
    'EXP*_VAR': expiryDate,
    'WGT*_VAR': weight
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
    return 'N/A';
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
 * Process ZPL template with transformed data
 * @param {string} zplTemplate - ZPL template content
 * @param {Object} transformedData - Data from transformProductData
 * @returns {string} - Processed ZPL ready for printing
 */
function processZplWithTransformedData(zplTemplate, transformedData) {
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

  return processedZpl;
}

module.exports = {
  transformProductData,
  calculateExpiryDate,
  formatWeight,
  getHostname,
  processZplWithTransformedData
};