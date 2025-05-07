/**
 * Label printing functionality
 * Contains methods for generating print-ready label HTML and handling print jobs
 */

// Default label configuration
const DEFAULT_LABEL_CONFIG = {
  width: 60, // width in mm
  height: 162, // height in mm
  horizontalMargin: 5, // horizontal margin in mm
  verticalMargin: 5, // vertical margin in mm
};

/**
 * Generate a print-ready HTML template for a label
 * @param {Object} product - The product data
 * @param {Object} options - Additional options for label generation
 * @returns {Object} - Object containing HTML content and metadata
 */
export const generatePrintableLabel = (product, options = {}) => {
  if (!product) {
    throw new Error('Product data is required');
  }
  
  const {
    showBarcode = true,
    useOverlay = false,
    labelConfig = DEFAULT_LABEL_CONFIG,
  } = options;
  
  // Calculate expiry date
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + (product.expiryDays || 30));
  
  // Format the expiry date
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
  
  // Format the price
  const formattedPrice = product.price || '$0.00';
  
  // Generate HTML content for printing
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pet Fresh Label</title>
      <style>
        @page {
          size: ${labelConfig.width}mm ${labelConfig.height}mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          width: ${labelConfig.width}mm;
          height: ${labelConfig.height}mm;
        }
        .label-container {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: white;
        }
        /* Add more styling as needed based on LabelTemplate.js */
      </style>
    </head>
    <body>
      <div class="label-container">
        <!-- Product Name -->
        <div style="
          position: absolute;
          top: 50mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 20.5mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 7mm;
          line-height: 1.15;
        ">
          ${product.name}
        </div>
        
        <!-- Ingredients Section -->
        <div style="
          position: absolute;
          top: 70.5mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 15.5mm;
        ">
          <div style="
            font-size: 3.5mm;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 1mm;
            text-align: center;
          ">
            INGREDIENTS
          </div>
          <div style="
            font-size: 2.5mm;
            line-height: 3mm;
            text-align: center;
            padding: 0 2mm;
          ">
            ${product.ingredients || 'Mixed Animal Proteins'}
          </div>
        </div>
        
        <!-- Pet Food Only -->
        <div style="
          position: absolute;
          top: 86mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 6.5mm;
          display: flex;
          justify-content: center;
          align-items: center;
        ">
          <div style="
            font-size: 5mm;
            font-weight: bold;
            text-transform: uppercase;
          ">
            PET FOOD ONLY
          </div>
        </div>
        
        <!-- Storage Instructions -->
        <div style="
          position: absolute;
          top: 92.5mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 12.5mm;
        ">
          <div style="
            font-size: 2.5mm;
            line-height: 3mm;
          ">
            <div>• 100% NATURAL</div>
            <div>• NO ARTIFICIAL COLOURS</div>
            <div>• MIXED AND PRODUCED IN AUSTRALIA</div>
          </div>
        </div>
        
        <!-- Data Section -->
        <div style="
          position: absolute;
          top: 105mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 19.5mm;
          display: flex;
          justify-content: space-between;
        ">
          <!-- Date and Weight -->
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 25mm;
          ">
            <div style="
              font-size: 2.5mm;
              line-height: 3mm;
            ">
              <div style="
                background-color: black;
                color: white;
                padding: 0.5mm 1.5mm;
                font-size: 2.2mm;
                display: inline-block;
                margin-bottom: 0.5mm;
                text-transform: uppercase;
              ">
                BEST BEFORE
              </div>
              <div style="
                margin-bottom: 1mm;
                padding-left: 0.5mm;
                font-size: 2.5mm;
              ">
                ${formattedExpiryDate}
              </div>
              
              <div style="
                background-color: black;
                color: white;
                padding: 0.5mm 1.5mm;
                font-size: 2.2mm;
                display: inline-block;
                margin-bottom: 0.5mm;
                text-transform: uppercase;
              ">
                WEIGHT
              </div>
              <div style="
                margin-bottom: 0;
                padding-left: 0.5mm;
                font-size: 2.5mm;
              ">
                ${product.weight || '500g'}
              </div>
            </div>
          </div>
          
          <!-- Barcode -->
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 28mm;
            position: relative;
            padding: 3mm 0;
            margin: 0 auto;
          ">
            ${showBarcode ? `
              <img 
                src="data:image/svg+xml;base64,${Buffer.from(generateBarcodeAsSVG(product.barcode || '0000000000000')).toString('base64')}"
                style="width: 100%; height: 15.5mm;"
              />
            ` : ''}
          </div>
        </div>
        
        <!-- Price -->
        <div style="
          position: absolute;
          top: 124.5mm;
          left: ${labelConfig.horizontalMargin}mm;
          width: calc(100% - ${labelConfig.horizontalMargin * 2}mm);
          height: 3mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        ">
          <div style="
            font-size: 5.5mm;
            font-weight: bold;
            line-height: 1;
          ">
            ${formattedPrice}
          </div>
          <div style="
            font-size: 2.2mm;
            background-color: black;
            color: white;
            padding: 0.5mm 1.5mm;
            margin-top: 0.2mm;
            text-transform: uppercase;
          ">
            PRICE
          </div>
        </div>
      </div>
      
      <!-- Include JsBarcode for browser-based rendering if needed -->
      <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        function renderBarcode() {
          if (typeof JsBarcode !== 'undefined') {
            JsBarcode("#barcode", "${product.barcode || '0000000000000'}", {
              format: "EAN13",
              width: 2,
              height: 30,
              displayValue: true,
              fontSize: 7,
              margin: 0,
              background: "#ffffff",
              lineColor: "#000000",
              flat: true
            });
          }
        }
        
        document.addEventListener('DOMContentLoaded', renderBarcode);
      </script>
    </body>
    </html>
  `;
  
  return {
    html,
    product,
    dimensions: {
      width: labelConfig.width,
      height: labelConfig.height
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate a barcode as SVG (placeholder - normally would use JsBarcode)
 * @param {string} barcode - Barcode to generate
 * @returns {string} - SVG string representation of barcode
 */
const generateBarcodeAsSVG = (barcode) => {
  // This is a placeholder - in a real implementation, 
  // you would use JsBarcode server-side or another barcode generation library
  // For simplicity, we're returning a text representation as SVG
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="35">
      <rect width="100%" height="100%" fill="white" />
      <text x="10" y="20" font-family="monospace">${barcode}</text>
    </svg>
  `;
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
    const labelData = generatePrintableLabel(product, options);
    
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