import JsBarcode from 'jsbarcode';
import labelConfig from '../config.json';
import { renderBarcodeToSvgRef, formatBarcode } from './barcodeGenerator';

// Enhanced barcode cache using product ID as keys for faster lookups
const barcodeCache = new Map();

// Pre-generate some default SVG templates for immediate display
const DEFAULT_BARCODE_SVG = `
<rect width="100%" height="100%" fill="white"></rect>
<g transform="translate(10, 17)">
  <rect x="0" y="0" width="80" height="16" fill="black"></rect>
  <rect x="2" y="0" width="2" height="16" fill="white"></rect>
  <rect x="7" y="0" width="1" height="16" fill="white"></rect>
  <rect x="13" y="0" width="3" height="16" fill="white"></rect>
  <rect x="18" y="0" width="2" height="16" fill="white"></rect>
  <rect x="22" y="0" width="1" height="16" fill="white"></rect>
  <rect x="29" y="0" width="4" height="16" fill="white"></rect>
  <rect x="37" y="0" width="2" height="16" fill="white"></rect>
  <rect x="41" y="0" width="3" height="16" fill="white"></rect>
  <rect x="49" y="0" width="1" height="16" fill="white"></rect>
  <rect x="54" y="0" width="2" height="16" fill="white"></rect>
  <rect x="59" y="0" width="1" height="16" fill="white"></rect>
  <rect x="65" y="0" width="3" height="16" fill="white"></rect>
  <rect x="71" y="0" width="1" height="16" fill="white"></rect>
  <rect x="74" y="0" width="2" height="16" fill="white"></rect>
</g>
`;

// Standard barcode configuration for consistent rendering
const BARCODE_OPTIONS = {
  format: "EAN13",
  lineColor: "#000",
  width: 1.2,
  height: 45,
  displayValue: true,
  fontSize: 9,
  margin: 0,
  background: "#ffffff",
  textMargin: 1,
  flat: true
};

// Create a lightweight offline barcode generator instance - outside component to avoid recreation
let offscreenCanvas;
try {
  // Create an offscreen canvas for rapid barcode generation
  if (typeof OffscreenCanvas !== 'undefined') {
    offscreenCanvas = new OffscreenCanvas(200, 70);
  }
} catch (e) {
  console.log('OffscreenCanvas not supported');
}

/**
 * Calculate EAN-13 check digit
 * @param {String} barcode - First 12 digits of EAN13
 * @returns {Number} - Check digit (last digit)
 */
const calculateEAN13CheckDigit = (barcode12) => {
  // Ensure we have exactly 12 digits to work with
  const digits = barcode12.substring(0, 12).padStart(12, '0');
  
  // Calculate weighted sum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  
  // Calculate check digit
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Validate an EAN-13 barcode
 * @param {String} barcode - Full 13-digit barcode to validate
 * @returns {Boolean} - Whether the barcode is valid
 */
const isValidEAN13 = (barcode) => {
  if (!barcode || barcode.length !== 13 || !/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  const firstTwelve = barcode.substring(0, 12);
  const providedCheckDigit = parseInt(barcode[12], 10);
  const calculatedCheckDigit = calculateEAN13CheckDigit(firstTwelve);
  
  return providedCheckDigit === calculatedCheckDigit;
};

/**
 * Ultra-fast barcode generation for a given product on a target SVG element
 * @param {Object} product - The product data
 * @param {Object} svgRef - React ref for the SVG element
 * @returns {Boolean} - Success or failure
 */
export const generateBarcode = (product, svgRef) => {
  // Use our new barcode renderer
  return renderBarcodeToSvgRef(product, svgRef);
};

/**
 * Get the label configuration, either from local config or API
 * @returns {Promise<Object>} - The label configuration object
 */
export const getLabelConfig = async () => {
  try {
    // First try to get from API if available in browser context
    if (window && window.api && window.api.getLabelConfig) {
      const apiConfig = await window.api.getLabelConfig();
      if (apiConfig) {
        return apiConfig;
      }
    }
  } catch (e) {
    console.log('Could not load config from API, using local config');
  }
  
  // Fallback to local config
  return labelConfig;
};

/**
 * Default label configuration (matches config.json)
 */
export const DEFAULT_LABEL_CONFIG = labelConfig; 