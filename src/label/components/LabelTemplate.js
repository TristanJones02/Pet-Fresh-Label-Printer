import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import labelConfig from '../config.json';
import { generateLabelDefinition, generateReactLabel } from '../template';
import { renderBarcodeToSvgRef } from '../utils/barcodeGenerator';

/**
 * Calculate expiry date based on duration and type
 * @param {number} duration - The duration amount
 * @param {string} type - The duration type (days, weeks, months, years)
 * @returns {Date} - The calculated expiry date
 */
const calculateExpiryDate = (duration, type) => {
  const today = new Date();
  const expiryDate = new Date(today);
  
  switch (type) {
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
      // Default to days if type is unknown
      expiryDate.setDate(today.getDate() + duration);
  }
  
  return expiryDate;
};

// Label Generator - using the shared template system
function LabelTemplate({ product, showOverlay, config = null, onBarcodeGenerated, showDebug = false }) {
  // Create a local ref that we control completely
  const barcodeRef = useRef(null);
  
  // State to force re-render when barcode is generated
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  
  // State to store the barcode SVG content
  const [barcodeSvgContent, setBarcodeSvgContent] = useState('');
  
  // Generate barcode as soon as component mounts or product changes
  useEffect(() => {
    if (product) {
      console.log('Generating barcode for product:', product.name);
      
      // Reset barcode generated state
      setBarcodeGenerated(false);
      setBarcodeSvgContent('');
      
      // Add a timeout to ensure the element is fully rendered
      setTimeout(() => {
        console.log('Attempting barcode generation after timeout...');
        
        // Generate barcode SVG content directly
        const barcode = product.barcode || product.sku || '0000000000000';
        console.log('Using barcode:', barcode);
        
        try {
          // Import the barcode generator function
          import('../utils/barcodeGenerator').then(({ generateBarcodeSvg }) => {
            const svgContent = generateBarcodeSvg(barcode);
            console.log('Generated SVG content length:', svgContent.length);
            
            // Store the SVG content in state instead of manipulating DOM
            setBarcodeSvgContent(svgContent);
            setBarcodeGenerated(true);
            
            console.log('Barcode generation success: true');
            
            // Notify parent about barcode generation status
            if (onBarcodeGenerated) {
              onBarcodeGenerated(true);
            }
          }).catch(error => {
            console.error('Error importing barcode generator:', error);
            if (onBarcodeGenerated) {
              onBarcodeGenerated(false);
            }
          });
        } catch (error) {
          console.error('Error generating barcode:', error);
          if (onBarcodeGenerated) {
            onBarcodeGenerated(false);
          }
        }
      }, 100);
    }
  }, [product, onBarcodeGenerated]);
  
  if (!product) return null;
  
  // Use provided config or fall back to centralized config
  const cfg = config || labelConfig;
  
  // Pre-calculate values for faster rendering
  let expiryDate;
  
  // Handle both new API format and legacy format
  if (product.expirationDuration && product.expirationType) {
    // New format: Calculate based on duration and type
    expiryDate = calculateExpiryDate(product.expirationDuration, product.expirationType);
  } else if (product.expiryDays) {
    // Legacy format: Calculate based on expiryDays
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + product.expiryDays);
  } else {
    // Default: 30 days if no expiry information provided
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
  }
  
  // Format the price (convert from cents to dollars if needed)
  const formattedPrice = product.price || '$0.00';
  
  // Format the expiry date
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
  
  // Options for the template generator
  const options = {
    formattedPrice,
    formattedExpiryDate
  };
  
  // Use our shared template system to generate the React label
  const LabelComponent = generateReactLabel(product, cfg, options);
  
  // Render the label with our barcode SVG content
  return <LabelComponent barcodeRef={barcodeRef} showOverlay={showOverlay} barcodeSvgContent={barcodeSvgContent} showDebug={showDebug} />;
}

export default LabelTemplate; 