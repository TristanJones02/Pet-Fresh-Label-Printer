/**
 * @fileoverview Barcode generation utility
 * Provides functions to generate barcodes directly in-browser and on-device
 * without external web API dependencies
 */

// Cache for generated barcodes to improve performance
const barcodeCache = new Map();

/**
 * Format a string as a valid EAN-13 barcode
 * @param {string} barcode - Raw barcode string to format
 * @returns {string} - Formatted 13-digit barcode with check digit
 */
function formatBarcode(barcode) {
  // Remove non-digit characters
  let digits = String(barcode).replace(/\D/g, '');
  
  // Pad to 12 digits for EAN-13
  if (digits.length < 12) {
    digits = digits.padStart(12, '0');
  }
  
  // Take first 12 digits if longer
  if (digits.length > 12) {
    digits = digits.substring(0, 12);
  }
  
  // Calculate check digit (13th digit) for EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  // Return the full 13-digit barcode
  return digits + checkDigit;
}

/**
 * Generate SVG barcode for EAN-13
 * @param {string} barcode - The barcode number to generate
 * @returns {string} - SVG content as string
 */
function generateBarcodeSvg(barcode) {
  const formattedBarcode = formatBarcode(barcode);
  
  // Create a unique cache key
  const cacheKey = `svg-${formattedBarcode}`;
  
  // Check cache first
  if (barcodeCache.has(cacheKey)) {
    return barcodeCache.get(cacheKey);
  }
  
  // EAN-13 patterns
  const leftHandPatterns = [
    '0001101', '0011001', '0010011', '0111101', '0100011',
    '0110001', '0101111', '0111011', '0110111', '0001011'
  ];
  
  const rightHandPatterns = [
    '1110010', '1100110', '1101100', '1000010', '1011100',
    '1001110', '1010000', '1000100', '1001000', '1110100'
  ];
  
  // First digit determines the pattern for left group
  const firstDigit = parseInt(formattedBarcode[0]);
  const leftGroupPatterns = [
    'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
    'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
  ];
  
  // Barcode dimensions - make them larger for better visibility
  const barWidth = 2; // Increased from 1 to 2 for better visibility
  const barHeight = 80; // Increased from 50 to 80 for better height
  const quietZone = 10;
  const textHeight = 15;
  
  let svg = '';
  let x = quietZone;
  
  // Start guard pattern (101)
  const startGuard = '101';
  for (let i = 0; i < startGuard.length; i++) {
    if (startGuard[i] === '1') {
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="black"></rect>`;
    }
    x += barWidth;
  }
  
  // Left data patterns (6 digits)
  const leftPattern = leftGroupPatterns[firstDigit];
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(formattedBarcode[i + 1]);
    let pattern;
    
    if (leftPattern[i] === 'L') {
      pattern = leftHandPatterns[digit];
    } else {
      // G pattern (inverted L pattern)
      pattern = leftHandPatterns[digit].split('').map(c => c === '0' ? '1' : '0').join('');
    }
    
    for (let j = 0; j < pattern.length; j++) {
      if (pattern[j] === '1') {
        svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="black"></rect>`;
      }
      x += barWidth;
    }
  }
  
  // Center guard pattern (01010)
  const centerGuard = '01010';
  for (let i = 0; i < centerGuard.length; i++) {
    if (centerGuard[i] === '1') {
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="black"></rect>`;
    }
    x += barWidth;
  }
  
  // Right data patterns (6 digits)
  for (let i = 6; i < 12; i++) {
    const digit = parseInt(formattedBarcode[i + 1]);
    const pattern = rightHandPatterns[digit];
    
    for (let j = 0; j < pattern.length; j++) {
      if (pattern[j] === '1') {
        svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="black"></rect>`;
      }
      x += barWidth;
    }
  }
  
  // End guard pattern (101)
  const endGuard = '101';
  for (let i = 0; i < endGuard.length; i++) {
    if (endGuard[i] === '1') {
      svg += `<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" fill="black"></rect>`;
    }
    x += barWidth;
  }
  
  // Calculate total width for viewBox
  const totalWidth = x + quietZone;
  const totalHeight = barHeight + textHeight;
  
  // Add text below the barcode with increased spacing
  const textY = barHeight + 18;
  const textSvg = `
    <text x="${totalWidth / 2}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="black">${formattedBarcode}</text>
  `;
  
  // Complete SVG document with increased bar width for better visibility
  const fullSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" style="display: block; background: white;">
      <rect width="100%" height="100%" fill="white"/>
      ${svg}
      ${textSvg}
    </svg>
  `;
  
  // Cache the result
  barcodeCache.set(cacheKey, fullSvg);
  
  return fullSvg;
}

/**
 * Generate a random barcode number for new products
 * @returns {string} - A valid EAN-13 barcode
 */
function generateRandomBarcode() {
  // Use a timestamp and random numbers to generate a unique barcode
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const barcode = '4' + timestamp.slice(-7) + random;
  
  // Format it to ensure it's valid
  return formatBarcode(barcode);
}

/**
 * Render a barcode into an SVG element
 * @param {Object} product - The product with barcode data
 * @param {Object} svgRef - React ref to the SVG element to populate
 * @returns {boolean} - Success indicator
 */
function renderBarcodeToSvgRef(product, svgRef) {
  try {
    console.log('renderBarcodeToSvgRef called with:', { product: product?.name, hasRef: !!svgRef.current });
    
    if (!svgRef.current) {
      console.log('No SVG ref available');
      return false;
    }
    
    // Get or generate barcode
    const barcode = product.barcode || generateRandomBarcode();
    console.log('Using barcode:', barcode);
    
    // Create a unique ID for caching based on product
    const productId = product.id || product._id || JSON.stringify(product);
    const cacheKey = `svg-ref-${productId}`;
    
    // Check cache first
    if (barcodeCache.has(cacheKey)) {
      console.log('Using cached barcode');
      const cachedSvg = barcodeCache.get(cacheKey);
      
      // Parse the cached SVG and copy attributes and content
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(cachedSvg, 'image/svg+xml');
      const newSvgElement = svgDoc.querySelector('svg');
      
      if (newSvgElement) {
        // Copy all attributes from the generated SVG to our target SVG
        Array.from(newSvgElement.attributes).forEach(attr => {
          if (attr.name !== 'class' && attr.name !== 'style') {
            svgRef.current.setAttribute(attr.name, attr.value);
          }
        });
        
        // Copy the inner content
        svgRef.current.innerHTML = newSvgElement.innerHTML;
      }
      
      return true;
    }
    
    // Generate SVG content
    console.log('Generating new barcode SVG');
    const svgContent = generateBarcodeSvg(barcode);
    console.log('Generated SVG content length:', svgContent.length);
    
    // Parse the SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const newSvgElement = svgDoc.querySelector('svg');
    
    if (!newSvgElement) {
      console.error('Failed to parse SVG content');
      console.log('SVG content was:', svgContent);
      return false;
    }
    
    console.log('Parsed SVG element:', newSvgElement);
    console.log('SVG viewBox:', newSvgElement.getAttribute('viewBox'));
    console.log('SVG innerHTML length:', newSvgElement.innerHTML.length);
    
    // Copy all attributes from the generated SVG to our target SVG
    Array.from(newSvgElement.attributes).forEach(attr => {
      if (attr.name !== 'class' && attr.name !== 'style') {
        console.log(`Setting attribute ${attr.name} = ${attr.value}`);
        svgRef.current.setAttribute(attr.name, attr.value);
      }
    });
    
    // Copy the inner content
    svgRef.current.innerHTML = newSvgElement.innerHTML;
    
    console.log('Barcode rendered successfully');
    console.log('Final SVG viewBox:', svgRef.current.getAttribute('viewBox'));
    console.log('Final SVG innerHTML length:', svgRef.current.innerHTML.length);
    
    // Force a repaint to ensure visibility
    svgRef.current.style.display = 'none';
    svgRef.current.offsetHeight; // Trigger reflow
    svgRef.current.style.display = 'block';
    
    // Store in cache for future use
    barcodeCache.set(cacheKey, svgContent);
    
    return true;
  } catch (error) {
    console.error('Error rendering barcode:', error);
    return false;
  }
}

// Export functions using ES6 syntax
export {
  formatBarcode,
  generateBarcodeSvg,
  generateRandomBarcode,
  renderBarcodeToSvgRef
};

// Also provide CommonJS exports for Node.js compatibility (main.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatBarcode,
    generateBarcodeSvg,
    generateRandomBarcode,
    renderBarcodeToSvgRef
  };
} 