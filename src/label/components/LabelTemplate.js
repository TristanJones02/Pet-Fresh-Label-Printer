import React, { useEffect, useRef, useLayoutEffect } from 'react';
import labelConfig from '../config.json';
import { generateBarcode } from '../utils/labelUtils';

// The overlay image path in the public folder
const OVERLAY_IMAGE_PATH = './assets/overlay.png';

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

// Label Generator - ultra-optimized for instant rendering
function LabelTemplate({ product, showOverlay, config = null, onBarcodeGenerated }) {
  // Create a local ref that we control completely
  const localBarcodeRef = useRef(null);
  
  // Pre-initialize SVG for faster rendering - runs before painting to screen
  useLayoutEffect(() => {
    if (localBarcodeRef.current) {
      // Initialize SVG attributes once
      localBarcodeRef.current.setAttribute('xmlns', "http://www.w3.org/2000/svg");
      localBarcodeRef.current.setAttribute('xmlnsXlink', "http://www.w3.org/1999/xlink");
      localBarcodeRef.current.setAttribute('preserveAspectRatio', "xMidYMid meet");
      localBarcodeRef.current.setAttribute('viewBox', "0 0 100 35");
    }
  }, []);
  
  // Generate barcode as soon as component mounts or product changes
  useEffect(() => {
    if (product && localBarcodeRef.current) {
      // Generate barcode immediately with no delay
      const success = generateBarcode(product, localBarcodeRef);
      
      // Notify parent about barcode generation status
      if (onBarcodeGenerated) {
        onBarcodeGenerated(success);
      }
    }
  }, [product, onBarcodeGenerated]);
  
  if (!product) return null;
  
  // Use provided config or fall back to centralized config
  const cfg = config || labelConfig;
  
  // Get margin and calculate content width
  const horizontalMargin = cfg.horizontalMargin || 5;
  const contentWidth = cfg.width ? cfg.width - (horizontalMargin * 2) : 50;
  
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
  
  // Format ingredients - using direct access for speed
  const ingredientsLine1 = product.ingredientsLine1 || (product.ingredients ? product.ingredients.split('\n')[0] : 'Ingredient Line 1');
  const ingredientsLine2 = product.ingredientsLine2 || (product.ingredients ? product.ingredients.split('\n')[1] : 'Ingredient Line 2');
  const ingredientsLine3 = product.ingredientsLine3 || (product.ingredients ? product.ingredients.split('\n')[2] : 'Ingredient Line 3');
  
  // Format storage instructions - split by new lines
  const storageInstructionsLines = product.storageInstructions 
    ? product.storageInstructions.split('\n') 
    : ['Store in a cool, dry place.', 'Keep sealed after opening.'];
  
  return (
    <div className="label-container" style={{
      position: 'relative',
      width: `${cfg.width}mm`,
      height: `${cfg.height}mm`,
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      overflow: 'hidden',
      margin: '0 auto',
      border: '1px solid #e0e0e0',
      boxSizing: 'border-box' // Ensure padding doesn't affect overall dimensions
    }}>
      {/* Product Name */}
      <div style={{
        position: 'absolute',
        top: `${cfg.contentStartY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.productTitleHeight}mm`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontSize: `${cfg.fonts.productTitle.size}mm`,
        lineHeight: cfg.fonts.productTitle.lineHeight,
        zIndex: 2,
        userSelect: 'none'
      }}>
        {product.name}
      </div>
      
      {/* Ingredients Section */}
      <div style={{
        position: 'absolute',
        top: `${cfg.ingredientsY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.ingredientsHeight}mm`,
        zIndex: 2,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'black',
          color: 'white',
          padding: '0.5mm 1.5mm',
          fontSize: `${cfg.fonts.data.labelSize}mm`,
          display: 'inline-block',
          marginBottom: '0.5mm',
          textTransform: 'uppercase'
        }}>
          INGREDIENTS
        </div>
        <div style={{
          fontSize: `${cfg.fonts.ingredients.contentSize * 0.9}mm`,
          lineHeight: `${cfg.fonts.ingredients.lineHeight * 0.9}mm`,
          textAlign: 'center',
          padding: '0.5mm 0',
          textTransform: 'uppercase',
          width: '100%'
        }}>
          <div>{ingredientsLine1}</div>
          <div>{ingredientsLine2}</div>
          <div>{ingredientsLine3}</div>
        </div>
      </div>
      
      {/* Pet Food Only */}
      <div style={{
        position: 'absolute',
        top: `${cfg.petFoodOnlyY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.petFoodOnlyHeight}mm`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        userSelect: 'none'
      }}>
        <div style={{
          fontSize: `${cfg.fonts.petFoodOnly.size}mm`,
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          PET FOOD ONLY
        </div>
      </div>
      
      {/* Storage Instructions */}
      <div style={{
        position: 'absolute',
        top: `${cfg.storageInstructionsY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.storageInstructionsHeight}mm`,
        zIndex: 2,
        userSelect: 'none'
      }}>
        <div style={{
          fontSize: `${cfg.fonts.storage.size}mm`,
          lineHeight: `${cfg.fonts.storage.lineHeight}mm`
        }}>
          {storageInstructionsLines.map((line, index) => (
            <div key={index}>• {line}</div>
          ))}
        </div>
      </div>
      
      {/* Data Section */}
      <div style={{
        position: 'absolute',
        top: `${cfg.dataY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.dataHeight}mm`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
        userSelect: 'none'
      }}>
        {/* Date and Weight */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '25mm'
        }}>
          <div style={{
            fontSize: `${cfg.fonts.data.valueSize}mm`,
            lineHeight: `${cfg.fonts.storage.lineHeight}mm`
          }}>
            <div style={{
              backgroundColor: 'black',
              color: 'white',
              padding: '0.5mm 1.5mm',
              fontSize: `${cfg.fonts.data.labelSize}mm`,
              display: 'inline-block',
              marginBottom: '0.5mm',
              textTransform: 'uppercase'
            }}>
              BEST BEFORE
            </div>
            <div style={{
              marginBottom: '1mm',
              paddingLeft: '0.5mm',
              fontSize: `${cfg.fonts.data.valueSize}mm`
            }}>
              {formattedExpiryDate}
            </div>
            
            <div style={{
              backgroundColor: 'black',
              color: 'white',
              padding: '0.5mm 1.5mm',
              fontSize: `${cfg.fonts.data.labelSize}mm`,
              display: 'inline-block',
              marginBottom: '0.5mm',
              textTransform: 'uppercase'
            }}>
              WEIGHT
            </div>
            <div style={{
              marginBottom: '0',
              paddingLeft: '0.5mm',
              fontSize: `${cfg.fonts.data.valueSize}mm`
            }}>
              {product.weight || '500g'}
            </div>
          </div>
        </div>
        
        {/* Barcode - Constrained to not overflow margins */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: `${cfg.barcode.width}mm`,
          height: '100%',
          position: 'relative',
          margin: '0 0 0 auto',
          padding: '0',
          maxWidth: `${contentWidth - 27}mm`
        }}>
          <div style={{
            width: '100%',
            height: `${cfg.barcode.height}mm`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: '#ffffff'
          }}>
            <svg 
              id="barcode-preview" 
              ref={localBarcodeRef}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: `${cfg.barcode.height}mm`,
                overflow: 'hidden',
                display: 'block',
                margin: '0 auto'
              }}
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 100 35"
            ></svg>
          </div>
        </div>
      </div>
      
      {/* Price */}
      <div style={{
        position: 'absolute',
        top: `${cfg.priceY}mm`,
        left: `${horizontalMargin}mm`,
        width: `${contentWidth}mm`,
        height: `${cfg.priceHeight}mm`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 2,
        userSelect: 'none'
      }}>
        <div style={{
          fontSize: `${cfg.fonts.price.valueSize}mm`,
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          {formattedPrice}
        </div>
        <div style={{
          fontSize: `${cfg.fonts.price.labelSize}mm`,
          backgroundColor: 'black',
          color: 'white',
          padding: '0.5mm 1.5mm',
          marginTop: '0.2mm',
          textTransform: 'uppercase'
        }}>
          PRICE
        </div>
      </div>
      
      {/* Overlay Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        display: showOverlay ? 'block' : 'none',
        pointerEvents: 'none'
      }}>
        <img 
          src={OVERLAY_IMAGE_PATH}
          alt="Label Design" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          draggable="false"
          onLoad={() => console.log('Overlay image loaded successfully')}
          onError={(e) => {
            console.error('Error loading overlay image:', e);
            // Try fallback paths
            e.target.src = './assets/overlay.png';
          }}
        />
      </div>
    </div>
  );
}

export default LabelTemplate; 