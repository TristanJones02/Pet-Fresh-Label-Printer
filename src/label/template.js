/**
 * @fileoverview Shared label template definition 
 * This file provides a single source of truth for label structure
 * It can be consumed by React (frontend) renderers
 */

// Import React for JSX support
import React from 'react';

// Import barcode generator for server-side rendering
import { generateBarcodeSvg } from './utils/barcodeGenerator.js';

/**
 * Generate a unified label definition that can be used by React templates
 * @param {Object} product - Product data
 * @param {Object} config - Label configuration
 * @param {Object} options - Additional options (formattedPrice, formattedExpiryDate, isPrintMode)
 * @returns {Object} - Label definition with all styling and content
 */
function generateLabelDefinition(product, config, options = {}) {
  const { formattedPrice, formattedExpiryDate, isPrintMode = false } = options;
  
  // Base dimensions and positioning from config
  const width = config.width || 60;
  const height = config.height || 162;
  
  // New comprehensive margin and padding system
  const marginTop = config.marginTop || 3;
  const marginBottom = config.marginBottom || 3;
  const marginLeft = config.marginLeft || 3;
  const marginRight = config.marginRight || 3;
  const paddingTop = config.paddingTop || 2;
  const paddingBottom = config.paddingBottom || 2;
  const paddingLeft = config.paddingLeft || 2;
  const paddingRight = config.paddingRight || 2;
  
  // Printer adjustment parameters (only applied in print mode)
  const printerAdjustmentLeft = isPrintMode ? (config.printerAdjustmentLeft || 0) : 0;
  const printerAdjustmentTop = isPrintMode ? (config.printerAdjustmentTop || 0) : 0;
  
  // Calculate content area dimensions
  const contentWidth = width - marginLeft - marginRight;
  const contentHeight = height - marginTop - marginBottom;
  const innerContentWidth = contentWidth - paddingLeft - paddingRight;
  const innerContentHeight = contentHeight - paddingTop - paddingBottom;
  
  // Calculate final positioning with printer adjustments
  const finalLeftPosition = marginLeft + paddingLeft;
  const finalTopOffset = 0; // Don't adjust individual elements, use container transform instead
  
  // Debug logging for print mode
  if (isPrintMode) {
    console.log('🔧 Main Template Debug - Container Transform Approach:', {
      marginLeft,
      paddingLeft,
      finalLeftPosition,
      containerTransform: `translate(${printerAdjustmentLeft}mm, ${printerAdjustmentTop}mm)`,
      printerAdjustmentLeft,
      printerAdjustmentTop
    });
  }
  
  return {
    // Container styles
    containerStyle: {
      width: `${width}mm`,
      height: `${height}mm`,
      position: 'relative',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'white',
      overflow: 'hidden',
      // Apply printer adjustments to the entire container in print mode
      ...(isPrintMode && {
        transform: `translate(${printerAdjustmentLeft}mm, ${printerAdjustmentTop}mm)`,
        transformOrigin: 'top left'
      })
    },
    
    // Margins and padding values for reference
    margins: { marginTop, marginBottom, marginLeft, marginRight },
    padding: { paddingTop, paddingBottom, paddingLeft, paddingRight },
    contentDimensions: { contentWidth, contentHeight, innerContentWidth, innerContentHeight },
    
    // Overlay/underlay styles (behind everything)
    overlayStyle: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundImage: 'url(assets/overlay.png)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      zIndex: 0,
      pointerEvents: 'none'
    },
    
    // Product name - positioned according to config
    productName: product.name || 'Product Name',
    productNameStyle: {
      position: 'absolute',
      top: `${config.contentStartY || 45}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.productTitleHeight || 20.5}mm`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      fontSize: `${config.fonts?.productTitle?.size || 7.5}mm`,
      lineHeight: `${config.fonts?.productTitle?.lineHeight || 1.15}`,
      zIndex: 1
    },
    
    // Ingredients section
    ingredientsHeader: 'INGREDIENTS',
    ingredientsLine1: product.ingredientsLine1 || '',
    ingredientsLine2: product.ingredientsLine2 || '',
    ingredientsLine3: product.ingredientsLine3 || '',
    ingredientsSectionStyle: {
      position: 'absolute',
      top: `${config.ingredientsY || 70.5}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.ingredientsHeight || 22}mm`,
      zIndex: 1
    },
    ingredientsHeaderStyle: {
      backgroundColor: 'black',
      color: 'white',
      padding: '0.5mm 1.5mm',
      fontSize: `${config.fonts?.ingredients?.headerSize || 3.8}mm`,
      fontWeight: 'bold',
      letterSpacing: '0.3mm',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      marginBottom: '1.5mm',
      textTransform: 'uppercase',
      textAlign: 'center',
      border: 'none',
      outline: 'none',
      boxShadow: 'none'
    },
    ingredientsContentStyle: {
      fontSize: `${config.fonts?.ingredients?.contentSize || 2.7}mm`,
      lineHeight: `${config.fonts?.ingredients?.lineHeight || 3.2}mm`,
      textAlign: 'center',
      padding: '0 2mm'
    },
    ingredientsLineStyle: {
      fontSize: `${config.fonts?.ingredients?.contentSize || 2.7}mm`,
      lineHeight: `${config.fonts?.ingredients?.lineHeight || 3.2}mm`,
      textAlign: 'center',
      marginBottom: '0.5mm',
      minHeight: '3.2mm'
    },
    
    // Pet food only
    petFoodOnly: 'PET FOOD ONLY',
    petFoodOnlyStyle: {
      position: 'absolute',
      top: `${config.petFoodOnlyY || 86}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.petFoodOnlyHeight || 6.5}mm`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: `${config.fonts?.petFoodOnly?.size || 5}mm`,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      zIndex: 1
    },
    
    // Storage instructions
    storageInstructions: [
      '• 100% NATURAL',
      '• NO ARTIFICIAL COLOURS',
      '• MIXED AND PRODUCED IN AUSTRALIA'
    ],
    storageSectionStyle: {
      position: 'absolute',
      top: `${config.storageInstructionsY || 92.5}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.storageInstructionsHeight || 12.5}mm`,
      fontSize: `${config.fonts?.storage?.size || 2.5}mm`,
      lineHeight: `${config.fonts?.storage?.lineHeight || 3}mm`,
      zIndex: 1
    },
    storageItemStyle: {
      textAlign: 'center',
      marginBottom: '0.5mm'
    },
    
    // Data section (best before, weight, barcode) - positioned according to config
    dataSectionStyle: {
      position: 'absolute',
      top: `${config.dataY || 105}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.dataHeight || 19.5}mm`,
      display: 'flex',
      justifyContent: 'space-between',
      zIndex: 1
    },
    
    // Best before
    bestBeforeDate: formattedExpiryDate || '01 Jan 25',
    bestBeforeStyle: {
      fontSize: `${config.fonts?.data?.valueSize || 2.5}mm`,
      lineHeight: `${config.fonts?.data?.lineHeight || 3}mm`,
      marginBottom: '5mm'
    },
    bestBeforeLabelStyle: {
      backgroundColor: 'black',
      color: 'white',
      padding: '0.5mm 1.5mm',
      fontSize: `${config.fonts?.data?.labelSize || 2.2}mm`,
      fontWeight: 'bold',
      letterSpacing: '0.3mm',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      marginBottom: '0.5mm',
      textTransform: 'uppercase',
      border: 'none',
      outline: 'none',
      boxShadow: 'none'
    },
    bestBeforeDateStyle: {
      marginBottom: '1mm',
      paddingLeft: '0.5mm',
      fontSize: `${config.fonts?.data?.valueSize || 2.5}mm`
    },
    
    // Weight
    weight: product.weight || '1kg',
    weightStyle: {
      fontSize: `${config.fonts?.data?.valueSize || 2.5}mm`,
      lineHeight: `${config.fonts?.data?.lineHeight || 3}mm`
    },
    weightLabelStyle: {
      backgroundColor: 'black',
      color: 'white',
      padding: '0.5mm 1.5mm',
      fontSize: `${config.fonts?.data?.labelSize || 2.2}mm`,
      fontWeight: 'bold',
      letterSpacing: '0.3mm',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      marginBottom: '0.5mm',
      textTransform: 'uppercase',
      border: 'none',
      outline: 'none',
      boxShadow: 'none'
    },
    weightValueStyle: {
      marginBottom: '0',
      paddingLeft: '0.5mm',
      fontSize: `${config.fonts?.data?.valueSize || 2.5}mm`
    },
    
    // Barcode section
    barcodeSectionStyle: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: `${config.barcode?.width || 35}mm`,
      position: 'relative',
      padding: '1mm',
      margin: '0',
      marginLeft: 'auto',
      backgroundColor: 'white',
      minHeight: `${config.barcode?.height || 25}mm`,
      overflow: 'visible'
    },
    barcodeStyle: {
      width: '100%',
      height: 'auto',
      display: 'block',
      backgroundColor: 'white',
      minHeight: '15mm',
      maxHeight: '25mm'
    },
    
    // Price section - positioned according to config
    price: formattedPrice || '$0.00',
    priceSectionStyle: {
      position: 'absolute',
      top: `${config.priceY || 124.5}mm`,
      left: `${finalLeftPosition}mm`,
      width: `${innerContentWidth}mm`,
      height: `${config.priceHeight || 3}mm`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      zIndex: 1
    },
    priceValueStyle: {
      fontSize: `${config.fonts?.price?.valueSize || 5.5}mm`,
      fontWeight: 'bold',
      lineHeight: '1'
    },
    priceLabelStyle: {
      fontSize: `${config.fonts?.price?.labelSize || 2.2}mm`,
      backgroundColor: 'black',
      color: 'white',
      padding: '0.5mm 1.5mm',
      fontWeight: 'bold',
      letterSpacing: '0.3mm',
      whiteSpace: 'nowrap',
      marginTop: '0.2mm',
      textTransform: 'uppercase',
      border: 'none',
      outline: 'none',
      boxShadow: 'none'
    },
    
    // Debug visualization styles (optional)
    debugLabelBorderStyle: {
      position: 'absolute',
      top: '0mm',
      left: '0mm',
      width: `${width}mm`,
      height: `${height}mm`,
      border: '2px solid red',
      backgroundColor: 'transparent',
      zIndex: 8,
      pointerEvents: 'none'
    },
    debugMarginStyle: {
      position: 'absolute',
      top: `${marginTop}mm`,
      left: `${marginLeft}mm`,
      width: `${contentWidth}mm`,
      height: `${contentHeight}mm`,
      border: '1px dashed blue',
      backgroundColor: 'rgba(0, 0, 255, 0.05)',
      zIndex: 10,
      pointerEvents: 'none'
    },
    debugPaddingStyle: {
      position: 'absolute',
      top: `${marginTop + paddingTop}mm`,
      left: `${marginLeft + paddingLeft}mm`,
      width: `${innerContentWidth}mm`,
      height: `${innerContentHeight}mm`,
      border: '1px dashed green',
      backgroundColor: 'rgba(0, 255, 0, 0.05)',
      zIndex: 11,
      pointerEvents: 'none'
    }
  };
}

/**
 * Generate React JSX label component from label definition
 * @param {Object} product - Product data
 * @param {Object} config - Label configuration
 * @param {Object} options - Additional options (formattedPrice, formattedExpiryDate)
 * @returns {Function} - React component function
 */
function generateReactLabel(product, config, options = {}) {
  const labelDef = generateLabelDefinition(product, config, options);
  
  return function ReactLabel({ barcodeRef, showOverlay, barcodeSvgContent, showDebug = false }) {
    // Update options to include showDebug for logging
    const debugOptions = { ...options, showDebug };
    const debugLabelDef = showDebug ? generateLabelDefinition(product, config, debugOptions) : labelDef;
    
    return React.createElement('div', {
      className: 'label-container',
      style: debugLabelDef.containerStyle
    }, [
      // Overlay/underlay first (behind everything)
      showOverlay && React.createElement('div', {
        key: 'overlay',
        className: 'overlay',
        style: debugLabelDef.overlayStyle
      }),
      
      // Debug label border visualization (optional) - shows actual label dimensions
      showDebug && React.createElement('div', {
        key: 'debug-label-border',
        className: 'debug-label-border',
        style: debugLabelDef.debugLabelBorderStyle
      }),
      
      // Debug margin visualization (optional)
      showDebug && React.createElement('div', {
        key: 'debug-margin',
        className: 'debug-margin',
        style: debugLabelDef.debugMarginStyle
      }),
      
      // Debug padding visualization (optional)
      showDebug && React.createElement('div', {
        key: 'debug-padding',
        className: 'debug-padding',
        style: debugLabelDef.debugPaddingStyle
      }),
      
      // Debug info text overlay (optional)
      showDebug && React.createElement('div', {
        key: 'debug-info',
        className: 'debug-info',
        style: {
          position: 'absolute',
          top: '1mm',
          left: '1mm',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '2mm',
          fontSize: '1.5mm',
          fontFamily: 'monospace',
          zIndex: 20,
          pointerEvents: 'none',
          borderRadius: '1mm'
        }
      }, [
        `Label: ${debugLabelDef.containerStyle.width} × ${debugLabelDef.containerStyle.height}`,
        React.createElement('br'),
        `Margins: T${debugLabelDef.margins.marginTop} R${debugLabelDef.margins.marginRight} B${debugLabelDef.margins.marginBottom} L${debugLabelDef.margins.marginLeft}`,
        React.createElement('br'),
        `Padding: T${debugLabelDef.padding.paddingTop} R${debugLabelDef.padding.paddingRight} B${debugLabelDef.padding.paddingBottom} L${debugLabelDef.padding.paddingLeft}`,
        React.createElement('br'),
        `Content: ${debugLabelDef.contentDimensions.contentWidth}mm × ${debugLabelDef.contentDimensions.contentHeight}mm`,
        React.createElement('br'),
        `Inner: ${debugLabelDef.contentDimensions.innerContentWidth}mm × ${debugLabelDef.contentDimensions.innerContentHeight}mm`,
        React.createElement('br'),
        `Content Left: ${debugLabelDef.margins.marginLeft + debugLabelDef.padding.paddingLeft}mm`,
        React.createElement('br'),
        `Content Top: ${debugLabelDef.margins.marginTop + debugLabelDef.padding.paddingTop}mm`
      ]),
      
      // Product name
      React.createElement('div', {
        key: 'product-name',
        className: 'product-name',
        style: debugLabelDef.productNameStyle
      }, debugLabelDef.productName),
      
      // Ingredients section
      React.createElement('div', {
        key: 'ingredients',
        className: 'ingredients-section',
        style: debugLabelDef.ingredientsSectionStyle
      }, [
        React.createElement('div', {
          key: 'ingredients-header-container',
          className: 'ingredients-header-container',
          style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.5mm'
          }
        }, [
          React.createElement('span', {
            key: 'ingredients-header',
            className: 'ingredients-header',
            style: debugLabelDef.ingredientsHeaderStyle
          }, debugLabelDef.ingredientsHeader)
        ]),
        React.createElement('div', {
          key: 'ingredients-content',
          className: 'ingredients-content',
          style: debugLabelDef.ingredientsContentStyle
        }, [
          React.createElement('div', {
            key: 'ingredients-line-1',
            className: 'ingredients-line',
            style: debugLabelDef.ingredientsLineStyle
          }, debugLabelDef.ingredientsLine1),
          React.createElement('div', {
            key: 'ingredients-line-2',
            className: 'ingredients-line',
            style: debugLabelDef.ingredientsLineStyle
          }, debugLabelDef.ingredientsLine2),
          React.createElement('div', {
            key: 'ingredients-line-3',
            className: 'ingredients-line',
            style: debugLabelDef.ingredientsLineStyle
          }, debugLabelDef.ingredientsLine3)
        ])
      ]),
      
      // Pet food only section
      React.createElement('div', {
        key: 'pet-food-only',
        className: 'pet-food-only',
        style: debugLabelDef.petFoodOnlyStyle
      }, debugLabelDef.petFoodOnly),
      
      // Storage instructions
      React.createElement('div', {
        key: 'storage',
        className: 'storage-section',
        style: debugLabelDef.storageSectionStyle
      }, debugLabelDef.storageInstructions.map((instruction, index) => 
        React.createElement('div', {
          key: `storage-${index}`,
          className: 'storage-item',
          style: debugLabelDef.storageItemStyle
        }, instruction)
      )),
      
      // Data section (best before, weight, barcode)
      React.createElement('div', {
        key: 'data-section',
        className: 'data-section',
        style: debugLabelDef.dataSectionStyle
      }, [
        // Best before and Weight in left column
        React.createElement('div', {
          key: 'data-left',
          className: 'data-left',
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            width: '32mm'
          }
        }, [
          // Best before
          React.createElement('div', {
            key: 'best-before',
            className: 'best-before',
            style: debugLabelDef.bestBeforeStyle
          }, [
            React.createElement('span', {
              key: 'best-before-label',
              className: 'best-before-label',
              style: debugLabelDef.bestBeforeLabelStyle
            }, 'BEST BEFORE'),
            React.createElement('div', {
              key: 'best-before-date',
              className: 'best-before-date',
              style: debugLabelDef.bestBeforeDateStyle
            }, debugLabelDef.bestBeforeDate)
          ]),
          
          // Weight
          React.createElement('div', {
            key: 'weight',
            className: 'weight',
            style: debugLabelDef.weightStyle
          }, [
            React.createElement('span', {
              key: 'weight-label',
              className: 'weight-label',
              style: debugLabelDef.weightLabelStyle
            }, 'WEIGHT'),
            React.createElement('div', {
              key: 'weight-value',
              className: 'weight-value',
              style: debugLabelDef.weightValueStyle
            }, product.weight || '1kg')
          ])
        ]),
        
        // Barcode in right column
        React.createElement('div', {
          key: 'barcode',
          className: 'barcode-section',
          style: debugLabelDef.barcodeSectionStyle
        }, [
          // Render SVG content directly if available, otherwise show placeholder
          barcodeSvgContent ? 
            React.createElement('div', {
              key: 'barcode-svg',
              className: 'barcode',
              style: debugLabelDef.barcodeStyle,
              dangerouslySetInnerHTML: { __html: barcodeSvgContent }
            }) :
            React.createElement('div', {
              key: 'barcode-placeholder',
              className: 'barcode-placeholder',
              style: {
                ...debugLabelDef.barcodeStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '12px'
              }
            }, 'Generating barcode...')
        ])
      ]),
      
      // Price section (at bottom)
      React.createElement('div', {
        key: 'price-section',
        className: 'price-section',
        style: debugLabelDef.priceSectionStyle
      }, [
        React.createElement('div', {
          key: 'price-value',
          className: 'price-value',
          style: debugLabelDef.priceValueStyle
        }, debugLabelDef.price),
        React.createElement('div', {
          key: 'price-label',
          className: 'price-label',
          style: debugLabelDef.priceLabelStyle
        }, 'PRICE')
      ])
    ]);
  };
}

// Export functions for use in different environments
// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateLabelDefinition,
    generateReactLabel
  };
}

// For ES modules
export {
  generateLabelDefinition,
  generateReactLabel
}; 