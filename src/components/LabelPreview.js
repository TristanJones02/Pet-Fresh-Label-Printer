const React = require('react');
const { useState, useRef, useEffect, useCallback } = React;
const mui = require('@mui/material');
const logger = require('../utils/logger');
const { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress
} = mui;

// Create Add and Remove icons using simple SVG
const AddIcon = () => React.createElement('svg', {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, React.createElement('path', {
  d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
}));

const RemoveIcon = () => React.createElement('svg', {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, React.createElement('path', {
  d: 'M19 13H5v-2h14v2z'
}));

const CloseIcon = () => React.createElement('svg', {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, React.createElement('path', {
  d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
}));

const BackspaceIcon = () => React.createElement('svg', {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, React.createElement('path', {
  d: 'M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z'
}));

// Numpad Dialog Component  
function NumpadDialog({ open, onClose, value, onChange, onSubmit }) {
  // Use calculator-style layout (7-8-9 on top row)
  const buttons = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    ['clear', 0, 'delete']
  ];
  
  const handleKeyClick = (key) => {
    if (key === 'clear') {
      onChange('');
      return;
    }
    
    if (key === 'delete') {
      onChange(value.slice(0, -1));
      return;
    }
    
    // Limit to 3 digits (max 999)
    if (value.length >= 3) return;
    
    // Prevent entering 0 as the first digit
    if (value === '' && key === 0) return;
    
    onChange(value + key.toString());
  };
  
  const handleSubmit = () => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onSubmit(parsedValue);
    } else {
      // Reset to 1 if invalid or 0
      onSubmit(1);
    }
  };
  
  return React.createElement(
    Dialog,
    {
      open: open,
      onClose: onClose,
      PaperProps: {
        sx: {
          borderRadius: '12px',
          minWidth: '320px'
        }
      }
    },
    React.createElement(
      Box,
      {
        sx: {
          position: 'relative',
          pt: 5,
          pb: 3,
          px: 3,
          textAlign: 'center'
        }
      },
      React.createElement(
        IconButton,
        {
          onClick: onClose,
          sx: {
            position: 'absolute',
            right: 8,
            top: 8
          }
        },
        React.createElement(CloseIcon)
      ),
      
      // Dialog Title
      React.createElement(
        Typography,
        {
          variant: 'h6',
          sx: {
            mb: 2,
            fontWeight: 'medium',
            color: '#555'
          }
        },
        'Enter Qty'
      ),
      
      // Display
      React.createElement(
        Box,
        {
          sx: {
            mb: 2,
            p: 2,
            textAlign: 'right',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f8f8',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }
        },
        React.createElement(
          Typography,
          { variant: 'h4', fontWeight: 'bold' },
          value || '0'
        )
      ),
      
      // Numpad Grid
      React.createElement(
        Box,
        { sx: { mb: 2 } },
        buttons.map((row, rowIndex) =>
          React.createElement(
            Box,
            { key: rowIndex, sx: { display: 'flex', mb: 1 } },
            row.map((button, colIndex) =>
              React.createElement(
                Box,
                { key: colIndex, sx: { flex: 1, mx: 0.5 } },
                button === 'delete' ? (
                  React.createElement(
                    Button,
                    {
                      variant: 'outlined',
                      fullWidth: true,
                      onClick: () => handleKeyClick(button),
                      sx: {
                        height: '54px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }
                    },
                    React.createElement(BackspaceIcon)
                  )
                ) : button === 'clear' ? (
                  React.createElement(
                    Button,
                    {
                      variant: 'outlined',
                      color: 'error',
                      fullWidth: true,
                      onClick: () => handleKeyClick(button),
                      sx: { height: '54px' }
                    },
                    'C'
                  )
                ) : (
                  React.createElement(
                    Button,
                    {
                      variant: 'outlined',
                      fullWidth: true,
                      onClick: () => handleKeyClick(button),
                      sx: {
                        height: '54px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }
                    },
                    button
                  )
                )
              )
            )
          )
        )
      ),
      
      // Confirm button
      React.createElement(
        Button,
        {
          variant: 'contained',
          color: 'primary',
          fullWidth: true,
          onClick: handleSubmit,
          sx: {
            borderRadius: '8px',
            height: '54px',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        'Set Quantity'
      )
    )
  );
}

function LabelPreview({ product, quantity, onQuantityChange, onPrintLabel }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(0.95);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Add references for increment/decrement timers and preview container
  const incrementIntervalRef = useRef(null);
  const stepSizeRef = useRef(1);
  const lastUpdateTimeRef = useRef(0);
  const previewContainerRef = useRef(null);
  const previewImageRef = useRef(null);

  const handlePrint = async () => {
    if (!product || isPrinting) return;
    
    setIsPrinting(true);
    logger.logPrintOperation('initiated', { 
      product: product.name, 
      quantity: quantity,
      productId: product.id 
    });
    
    try {
      // Call the parent's print handler which includes notification support
      if (onPrintLabel) {
        await onPrintLabel(product, quantity);
        logger.logPrintOperation('completed', { 
          product: product.name, 
          quantity: quantity 
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      logger.error('Print operation failed', { 
        error: error.message,
        stack: error.stack,
        product: product.name,
        quantity: quantity 
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleIncrease = () => {
    if (quantity < 999) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  // Start long press for quantity buttons
  const startLongPress = (isIncrement) => {
    if (!product) return;
    
    // Clear any existing intervals
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
    }
    
    // Reset step size
    stepSizeRef.current = 1;
    lastUpdateTimeRef.current = Date.now();
    
    // Set interval for continuous updates
    incrementIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedTime = now - lastUpdateTimeRef.current;
      
      // Gradually increase step size based on how long button is held
      if (elapsedTime > 3000) {
        stepSizeRef.current = 50;
      } else if (elapsedTime > 2000) {
        stepSizeRef.current = 20;
      } else if (elapsedTime > 1000) {
        stepSizeRef.current = 5;
      }
      
      if (isIncrement) {
        onQuantityChange(prev => Math.min(prev + stepSizeRef.current, 999));
      } else {
        onQuantityChange(prev => Math.max(prev - stepSizeRef.current, 1));
      }
    }, 150);
  };
  
  // End long press
  const endLongPress = () => {
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  };

  const handleOpenNumpad = () => {
    setTempQuantity(quantity.toString());
    setShowNumpad(true);
  };
  
  const handleNumpadChange = (value) => {
    setTempQuantity(value);
  };
  
  const handleNumpadSubmit = (value) => {
    onQuantityChange(value);
    setShowNumpad(false);
  };
  
  const handleNumpadClose = () => {
    setShowNumpad(false);
  };

  // Generate HTML-based preview when product changes
  const generatePreview = useCallback(async (selectedProduct) => {
    if (!selectedProduct) {
      setPreviewImage(null);
      return;
    }

    setIsGeneratingPreview(true);
    try {
      console.log('Generating realistic HTML label preview for:', selectedProduct.productname);
      
      // Generate HTML preview only
      const imageResult = await window.api.generateHtmlLabelPreview(selectedProduct);

      if (imageResult.success) {
        setPreviewImage({
          dataUrl: imageResult.imageDataUrl,
          width: imageResult.width,
          height: imageResult.height
        });
        console.log('HTML preview generated successfully');
        logger.logLabelGeneration(selectedProduct.name, 'success', { 
          type: 'preview',
          productId: selectedProduct.id 
        });
      } else {
        console.error('Failed to generate HTML preview:', imageResult.error);
        logger.logLabelGeneration(selectedProduct.name, 'failed', { 
          type: 'preview',
          error: imageResult.error,
          productId: selectedProduct.id 
        });
        setPreviewImage(null);
      }

    } catch (error) {
      console.error('Error generating preview:', error);
      logger.error('Error generating label preview', { 
        error: error.message,
        stack: error.stack,
        product: selectedProduct?.name 
      });
      setPreviewImage(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, []); // Empty dependency array since it only depends on stable references


  // Reset zoom and pan
  const resetZoomAndPan = () => {
    setZoom(0.95);
    setPanX(0);
    setPanY(0);
  };

  // Auto-reset zoom after 3 seconds of inactivity
  const autoResetTimeoutRef = useRef(null);
  
  const scheduleAutoReset = () => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
    }
    
    autoResetTimeoutRef.current = setTimeout(() => {
      if (zoom !== 0.95 || panX !== 0 || panY !== 0) {
        resetZoomAndPan();
      }
    }, 3000);
  };

  // Handle wheel zoom with non-passive event listener
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom * delta));
    setZoom(newZoom);
    scheduleAutoReset();
  }, [zoom, scheduleAutoReset]);

  // Handle touch/mouse events for panning
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setLastPanPoint({ x: clientX, y: clientY });
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - lastPanPoint.x;
    const deltaY = clientY - lastPanPoint.y;
    
    setPanX(prev => prev + deltaX);
    setPanY(prev => prev + deltaY);
    setLastPanPoint({ x: clientX, y: clientY });
    
    scheduleAutoReset();
    e.preventDefault();
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Handle pinch-to-zoom on touch devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastPanPoint({ x: distance, y: 0 });
    } else if (e.touches.length === 1) {
      handlePointerDown(e);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastPanPoint.x > 0) {
        const scale = distance / lastPanPoint.x;
        const newZoom = Math.max(0.5, Math.min(5, zoom * scale));
        setZoom(newZoom);
        setLastPanPoint({ x: distance, y: 0 });
        scheduleAutoReset();
      }
    } else if (e.touches.length === 1) {
      handlePointerMove(e);
    }
  };

  // Generate preview when product changes and reset zoom
  useEffect(() => {
    generatePreview(product);
    // Reset zoom and pan inline to avoid dependency issues
    setZoom(0.95);
    setPanX(0);
    setPanY(0);
  }, [product, generatePreview]);

  // Cleanup auto-reset timeout
  useEffect(() => {
    return () => {
      if (autoResetTimeoutRef.current) {
        clearTimeout(autoResetTimeoutRef.current);
      }
    };
  }, []);

  // Memory management: cleanup old preview images
  useEffect(() => {
    return () => {
      // Clear preview image data on unmount to free memory
      if (previewImage?.dataUrl) {
        setPreviewImage(null);
      }
    };
  }, []);

  // Cleanup preview image when product changes to prevent memory accumulation
  useEffect(() => {
    return () => {
      // Only clear if we're switching to a different product
      const currentImageUrl = previewImage?.dataUrl;
      if (currentImageUrl && currentImageUrl.length > 100000) { // Large images (>100KB base64)
        console.log('Clearing large preview image to free memory');
        URL.revokeObjectURL?.(currentImageUrl); // Revoke blob URLs if any
      }
    };
  }, [product?.id]); // Trigger when product ID changes

  // Add non-passive wheel event listener
  useEffect(() => {
    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  return React.createElement(
    Paper,
    {
      elevation: 3,
      sx: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        mx: 2
      }
    },
    // Header
    React.createElement(
      Box,
      {
        sx: {
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      },
      React.createElement(Typography, { variant: 'h6' }, 'Label Preview')
    ),
    
    // Preview Area with zoom and pan
    React.createElement(
      Box,
      {
        ref: previewContainerRef,
        sx: {
          flexGrow: 1,
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          p: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          userSelect: 'none'
        },
        onMouseDown: handlePointerDown,
        onMouseMove: handlePointerMove,
        onMouseUp: handlePointerUp,
        onMouseLeave: handlePointerUp,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handlePointerUp
      },
      product ? (
        React.createElement(
          Box,
          {
            sx: {
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }
          },
          isGeneratingPreview ? (
            React.createElement(
              Box,
              {
                sx: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }
              },
              React.createElement(CircularProgress, { size: 40 })
            )
          ) : previewImage ? (
            React.createElement(
              Box,
              {
                sx: {
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  cursor: zoom > 0.95 || panX !== 0 || panY !== 0 ? 'grab' : 'zoom-in'
                }
              },
              React.createElement('img', {
                ref: previewImageRef,
                src: previewImage.dataUrl,
                alt: 'Label Preview',
                style: {
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))',
                  borderRadius: '2px',
                  outline: 'none',
                  border: 'none',
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  transition: zoom === 0.95 && panX === 0 && panY === 0 ? 'transform 0.3s ease' : 'none',
                  transformOrigin: 'center center'
                },
                draggable: false
              })
            )
          ) : (
            React.createElement(
              Box,
              {
                sx: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }
              },
              React.createElement(Typography, { variant: 'body2', color: 'text.secondary' }, 
                'Unable to generate preview'
              ),
              React.createElement(Typography, { variant: 'caption', color: 'text.secondary' }, 
                `Selected: ${product.productname || product.name}`
              )
            )
          ),
          // Zoom indicator
          zoom !== 0.95 && React.createElement(
            Box,
            {
              sx: {
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10
              }
            },
            `${Math.round(zoom * 100)}%`
          )
        )
      ) : (
        React.createElement(
          Box,
          {
            sx: {
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3
            }
          },
          React.createElement(Typography, { variant: 'body1', color: 'textSecondary', mb: 1 }, 
            'Select a Product'
          )
        )
      )
    ),
    
    // Controls at the bottom
    React.createElement(
      Box,
      {
        sx: {
          p: 3,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f8f8',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }
      },
      // Quantity section
      React.createElement(
        Box,
        {
          sx: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        React.createElement(
          ButtonGroup,
          {
            size: 'large',
            variant: 'outlined',
            sx: {
              '& > button': {
                mx: 1,
                '&:first-of-type, &:last-of-type': {
                  minWidth: '48px',
                  mx: 0
                }
              }
            }
          },
          React.createElement(
            IconButton,
            {
              onClick: handleDecrease,
              onMouseDown: () => startLongPress(false),
              onMouseUp: endLongPress,
              onMouseLeave: endLongPress,
              disabled: !product || quantity <= 1,
              sx: {
                marginRight: '8px !important',
                backgroundColor: 'white',
                width: '48px',
                height: '48px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }
            },
            React.createElement(RemoveIcon)
          ),
          React.createElement(
            Button,
            {
              variant: 'text',
              disableRipple: true,
              onClick: handleOpenNumpad,
              disabled: !product,
              sx: {
                background: 'white',
                borderRadius: '2px',
                px: 3,
                minWidth: '90px',
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                  border: 'none'
                }
              }
            },
            quantity
          ),
          React.createElement(
            IconButton,
            {
              onClick: handleIncrease,
              onMouseDown: () => startLongPress(true),
              onMouseUp: endLongPress,
              onMouseLeave: endLongPress,
              disabled: !product,
              sx: {
                backgroundColor: 'white',
                width: '48px',
                height: '48px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }
            },
            React.createElement(AddIcon)
          )
        )
      ),
      
      // Print button
      React.createElement(
        Button,
        {
          variant: 'contained',
          color: 'primary',
          fullWidth: true,
          size: 'large',
          onClick: handlePrint,
          disabled: !product || isPrinting,
          sx: {
            height: '56px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px'
          }
        },
        isPrinting ? 'Printing...' : `Print ${quantity} Label${quantity > 1 ? 's' : ''}`
      )
    ),
    
    // Numpad Dialog
    React.createElement(NumpadDialog, {
      open: showNumpad,
      onClose: handleNumpadClose,
      value: tempQuantity,
      onChange: handleNumpadChange,
      onSubmit: handleNumpadSubmit
    })
  );
}

// Use both CommonJS and ESM exports for maximum compatibility
module.exports = LabelPreview;
module.exports.default = LabelPreview;