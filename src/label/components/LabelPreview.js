import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  DesignServices as DesignIcon,
  Close as CloseIcon,
  Backspace as BackspaceIcon
} from '@mui/icons-material';

import LabelTemplate from './LabelTemplate';
import { getLabelConfig } from '../utils/labelUtils';

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
    
    onChange(value + key.toString());
  };
  
  const handleSubmit = () => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      onSubmit(parsedValue);
    } else {
      // Reset to 1 if invalid
      onSubmit(1);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          minWidth: '320px'
        }
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        pt: 5, 
        pb: 3, 
        px: 3,
        textAlign: 'center'
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
        
        {/* Dialog Title */}
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            fontWeight: 'medium',
            color: '#555'
          }}
        >
          Enter Qty
        </Typography>
        
        {/* Display */}
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          textAlign: 'right',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f8f8f8',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h4" fontWeight="bold">
            {value || '0'}
          </Typography>
        </Box>
        
        {/* Numpad Grid */}
        <Box sx={{ mb: 2 }}>
          {buttons.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ display: 'flex', mb: 1 }}>
              {row.map((button, colIndex) => (
                <Box key={colIndex} sx={{ flex: 1, mx: 0.5 }}>
                  {button === 'delete' ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleKeyClick(button)}
                      sx={{ 
                        height: '54px', 
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      <BackspaceIcon />
                    </Button>
                  ) : button === 'clear' ? (
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleKeyClick(button)}
                      sx={{ height: '54px' }}
                    >
                      C
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleKeyClick(button)}
                      sx={{ 
                        height: '54px', 
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      {button}
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        
        {/* Confirm button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
          sx={{ 
            borderRadius: '8px', 
            height: '54px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Set Quantity
        </Button>
      </Box>
    </Dialog>
  );
}

function LabelPreview({ product, quantity, onQuantityChange, onPrintLabel }) {
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [labelConfig, setLabelConfig] = useState(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [isLabelLoading, setIsLabelLoading] = useState(false);
  const [prevProduct, setPrevProduct] = useState(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const loadingTimerRef = useRef(null);
  
  // Add references for increment/decrement timers
  const incrementIntervalRef = useRef(null);
  const stepSizeRef = useRef(1);
  const lastUpdateTimeRef = useRef(0);
  
  const [prevTouchDistance, setPrevTouchDistance] = useState(null);
  const [initialScaleFactor, setInitialScaleFactor] = useState(1);
  
  // Add printing state to manage UI during print process
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Track product changes to properly manage loading state
  useEffect(() => {
    // If product has changed, update loading state
    if (product !== prevProduct) {
      if (product) {
        // Set loading state but don't show spinner immediately
        setIsLabelLoading(true);
        setShowLoadingSpinner(false);
        
        // Clear any existing timer
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
        
        // Only show spinner if generation takes longer than 1.25 seconds
        loadingTimerRef.current = setTimeout(() => {
          setShowLoadingSpinner(true);
        }, 1250);
        
        // Ultra-short safety timeout for loading state
        const safetyTimer = setTimeout(() => {
          setIsLabelLoading(false);
          setShowLoadingSpinner(false);
        }, 100);
        
        return () => {
          clearTimeout(safetyTimer);
          clearTimeout(loadingTimerRef.current);
        };
      } else {
        setIsLabelLoading(false);
        setShowLoadingSpinner(false);
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
      }
      setPrevProduct(product);
    }
  }, [product, prevProduct]);
  
  // Fetch label config when component mounts
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getLabelConfig();
      setLabelConfig(config);
    };
    
    fetchConfig();
  }, []);
  
  // Handle barcode generation result
  const handleBarcodeGenerated = useCallback((success) => {
    // Immediately hide loading state to show content as fast as possible
    setIsLabelLoading(false);
    setShowLoadingSpinner(false);
    
    // Clear the spinner timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);
  
  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2.0));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  }, []);
  
  const handleResetView = useCallback(() => {
    setScale(initialScaleFactor || 1);
    setTranslateX(0);
    setTranslateY(0);
  }, [initialScaleFactor]);
  
  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);
  
  // Pan functionality
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - startPoint.x) / scale;
    const dy = (e.clientY - startPoint.y) / scale;
    
    setTranslateX((prev) => prev + dx);
    setTranslateY((prev) => prev + dy);
    setStartPoint({ x: e.clientX, y: e.clientY });
  }, [isDragging, startPoint, scale]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle touch functionality for mobile - updated with pinch zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      setIsDragging(true);
      setStartPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zooming
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setPrevTouchDistance(distance);
    }
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging) {
      // Single touch - panning
      const dx = (e.touches[0].clientX - startPoint.x) / scale;
      const dy = (e.touches[0].clientY - startPoint.y) / scale;
      
      setTranslateX((prev) => prev + dx);
      setTranslateY((prev) => prev + dy);
      setStartPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && prevTouchDistance !== null) {
      // Two touches - pinch zooming
      e.preventDefault(); // Prevent default gestures
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Calculate the zoom delta
      const delta = currentDistance - prevTouchDistance;
      
      // Update scale based on pinch gesture
      if (Math.abs(delta) > 1) { // Add a small threshold to avoid micro-adjustments
        const zoomFactor = 0.01; // Adjust zoom sensitivity for pinch
        const newScale = delta > 0 
          ? Math.min(scale + (delta * zoomFactor), 3.0)  // Zoom in
          : Math.max(scale + (delta * zoomFactor), 0.3); // Zoom out
        
        setScale(newScale);
        setPrevTouchDistance(currentDistance);
      }
    }
  }, [isDragging, startPoint, scale, prevTouchDistance]);
  
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPrevTouchDistance(null);
  }, []);
  
  // Modified wheel zoom handler to handle potential errors
  const handleWheel = useCallback((e) => {
    try {
      e.preventDefault();
      
      // Determine zoom direction and intensity
      const deltaY = e.deltaY;
      const zoomFactor = 0.05; // Adjust zoom sensitivity
      
      // Calculate new scale
      const newScale = deltaY < 0
        ? Math.min(scale + zoomFactor, 3.0)  // Zoom in
        : Math.max(scale - zoomFactor, 0.3); // Zoom out
      
      // Only proceed with zoom if previewRef exists
      if (!previewRef.current) {
        setScale(newScale);
        return;
      }
      
      // Get the mouse position relative to the preview container
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
  
      // Calculate the offset to keep the point under the mouse fixed during zoom
      const previewRect = previewRef.current.getBoundingClientRect();
      const centerX = (mouseX - (previewRect.left - rect.left + previewRect.width / 2)) / scale;
      const centerY = (mouseY - (previewRect.top - rect.top + previewRect.height / 2)) / scale;
      
      // Apply the new translation to maintain the mouse position relative to content
      const zoomRatio = newScale / scale;
      const newTranslateX = centerX * (1 - zoomRatio) + translateX;
      const newTranslateY = centerY * (1 - zoomRatio) + translateY;
      
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      
      // Apply the new scale
      setScale(newScale);
    } catch (error) {
      console.error('Error handling wheel zoom:', error);
      // Just apply scale without translations if there's an error
      setScale((prevScale) => {
        return e.deltaY < 0
          ? Math.min(prevScale + 0.05, 3.0)
          : Math.max(prevScale - 0.05, 0.3);
      });
    }
  }, [scale, translateX, translateY]);
  
  // Reset transform when product changes to ensure it's visible
  useEffect(() => {
    handleResetView();
  }, [product]);
  
  // Check boundaries and ensure the label stays at least partially visible
  useEffect(() => {
    // Only run boundary check if:
    // 1. We have a product
    // 2. We're not in loading state
    // 3. Preview ref exists
    // 4. Either translate or scale has changed significantly
    if (!product || isLabelLoading || !previewRef.current) return;
    
    // Skip constant boundary checks for small movements
    const debounceCheck = () => {
      try {
        // Verify again that refs are still valid (might have changed during timeout)
        if (!previewRef.current) return;
        
        const previewRect = previewRef.current.getBoundingClientRect();
        const container = previewRef.current.parentElement;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        
        // Only reset if completely out of view with a good margin
        // Make this really large to reduce unnecessary resets
        const isOffscreenX = (previewRect.right < -previewRect.width) || 
                             (previewRect.left > containerRect.width + previewRect.width);
        const isOffscreenY = (previewRect.bottom < -previewRect.height) || 
                             (previewRect.top > containerRect.height + previewRect.height);
        
        // If too far out of bounds, reset the view
        if (isOffscreenX || isOffscreenY) {
          console.log('Label out of view, resetting position');
          handleResetView();
        }
      } catch (error) {
        console.error('Error checking boundaries:', error);
      }
    };
    
    // Only check boundaries after significant changes or at most every 500ms
    const timeoutId = setTimeout(debounceCheck, 500);
    
    return () => clearTimeout(timeoutId);
  }, [translateX, translateY, scale, product, isLabelLoading, handleResetView]);
  
  // Setup event listeners for pan/zoom
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Get the preview container for wheel events
    const previewContainer = previewRef.current?.parentElement;
    if (previewContainer) {
      previewContainer.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (previewContainer) {
        previewContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, handleWheel]);
  
  // Handle quantity increase with button press and hold
  const handleIncrease = () => {
    onQuantityChange(Math.min(quantity + 1, 999));
  };
  
  // Handle quantity decrease with button press and hold
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(Math.max(quantity - 1, 1));
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
  
  // Auto-scale when component mounts or container resizes
  useLayoutEffect(() => {
    if (!product || !previewRef.current || !containerRef.current) return;

    const calculateOptimalScale = () => {
      try {
        const containerRect = containerRef.current.getBoundingClientRect();
        const labelRect = previewRef.current.getBoundingClientRect();
        
        // Calculate the scale needed to fit the label properly with some padding
        const scaleWidth = (containerRect.width - 40) / labelRect.width;
        const scaleHeight = (containerRect.height - 40) / labelRect.height;
        
        // Use the smaller scale to ensure the entire label fits
        const optimalScale = Math.min(scaleWidth, scaleHeight, 1); // Cap at 1 to avoid too large labels
        
        // Update the initial scale factor
        setInitialScaleFactor(optimalScale);
        
        // Reset view with the new scale
        setScale(optimalScale);
        setTranslateX(0);
        setTranslateY(0);
      } catch (error) {
        console.error('Error calculating optimal scale:', error);
      }
    };

    // Calculate optimal scale after layout
    const timer = setTimeout(calculateOptimalScale, 100);
    
    // Set up resize observer to recalculate on container resize
    const resizeObserver = new ResizeObserver(() => {
      calculateOptimalScale();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [product]);
  
  // Add this function to convert the label to HTML and trigger printing
  const handlePrintLabel = async () => {
    if (!product || isLabelLoading || isPrinting) return;
    
    try {
      // Set printing state to show loading UI
      setIsPrinting(true);
      
      // Start timing on the renderer side
      const clientStartTime = performance.now();
      
      // Get the label container element
      const labelContainer = document.querySelector('.label-container');
      if (!labelContainer) {
        console.error('Label container not found');
        setIsPrinting(false);
        return;
      }
      
      // Clone the DOM node to avoid modifying the displayed label
      const clonedLabel = labelContainer.cloneNode(true);
      
      // Remove the overlay image element completely
      const overlayElement = clonedLabel.querySelector('div[style*="position: absolute"] img[src*="overlay"]');
      if (overlayElement && overlayElement.parentElement) {
        overlayElement.parentElement.remove();
      } else {
        // Alternative approach to hide all overlay elements
        const possibleOverlays = clonedLabel.querySelectorAll('div[style*="position: absolute"][style*="top: 0"]');
        possibleOverlays.forEach(el => {
          if (el.querySelector('img')) {
            el.style.display = 'none';
          }
        });
      }
      
      // Convert SVG barcode to an image for better print compatibility
      const svgElement = clonedLabel.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = document.createElement('img');
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        img.style.width = '100%';
        img.style.height = '100%';
        svgElement.parentNode.replaceChild(img, svgElement);
      }
      
      // Get the computed dimensions of the label and config
      const config = labelConfig || {};
      const width = config.width || 60;
      const height = config.height || 162;
      
      // Create a properly formatted HTML document with necessary styles
      const labelHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pet Fresh Label</title>
            <style>
              @page {
                margin: 0;
                size: ${width}mm ${height}mm;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: ${width}mm;
                height: ${height}mm;
                overflow: hidden;
                font-family: Arial, sans-serif;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: white;
              }
              * {
                box-sizing: border-box;
              }
              .pdf-container {
                width: ${width}mm;
                height: ${height}mm;
                position: relative;
                overflow: hidden;
                background-color: white;
              }
              /* Make sure overlay doesn't display in print */
              [style*="pointer-events: none"] img,
              img[alt="Label Design"],
              div[style*="position: absolute"][style*="z-index: 1"] {
                display: none !important;
              }
              /* Preserve all original styles */
              ${Array.from(document.styleSheets)
                .filter(sheet => !sheet.href || sheet.href.startsWith(window.location.origin))
                .map(sheet => {
                  try {
                    return Array.from(sheet.cssRules)
                      .map(rule => rule.cssText)
                      .join('\n');
                  } catch (e) {
                    return '';
                  }
                })
                .join('\n')
              }
            </style>
          </head>
          <body>
            <div class="pdf-container">
              ${clonedLabel.outerHTML}
            </div>
          </body>
        </html>
      `;
      
      console.log('Sending label to print service...');
      
      // Send to main process for printing via IPC
      const result = await window.api.printLabel(labelHTML, quantity);
      
      // Reset printing state
      setIsPrinting(false);
      
      // Calculate total time including renderer prep work
      const totalClientTime = performance.now() - clientStartTime;
      
      if (result.success) {
        // Log detailed timing information
        console.log(`Label PDF generated successfully in ${result.timing?.total || 'unknown'}ms`);
        console.log(`PDF saved to: ${result.pdfPath}`);
        console.log('Timing details:');
        console.log(`- Client-side prep: ${Math.round(totalClientTime - (result.timing?.total || 0))}ms`);
        console.log(`- HTML loading: ${result.timing?.htmlLoad || 'unknown'}ms`);
        console.log(`- PDF generation: ${result.timing?.pdfGeneration || 'unknown'}ms`);
        console.log(`- File saving: ${result.timing?.fileSave || 'unknown'}ms`);
        console.log(`- Total process: ${Math.round(totalClientTime)}ms`);
        
        // For testing - open the PDF in the default viewer
        if (result.pdfPath) {
          // In a production environment, you might want to hide this or make it optional
          const { shell } = window.require ? window.require('electron') : { shell: null };
          if (shell) {
            shell.openPath(result.pdfPath);
          }
        }
      } else {
        console.error('Error printing label:', result.error);
      }
    } catch (error) {
      console.error('Error in handlePrintLabel:', error);
      setIsPrinting(false);
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        mx: 2
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
      >
        <Typography variant="h6">
          Label Preview
        </Typography>
        
        <ButtonGroup size="small" variant="outlined">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleResetView} size="small">
            <ResetIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={toggleOverlay} size="small" color={showOverlay ? "primary" : "default"}>
            <DesignIcon fontSize="small" />
          </IconButton>
        </ButtonGroup>
      </Box>
      
      {/* Preview Area */}
      <Box 
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden', 
          backgroundColor: '#f5f5f5',
          p: 3,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {product ? (
          isLabelLoading && showLoadingSpinner ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Generating label...
              </Typography>
            </Box>
          ) : (
            <div
              ref={previewRef}
              style={{
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <LabelTemplate 
                product={product} 
                showOverlay={showOverlay} 
                labelConfig={labelConfig}
                onBarcodeGenerated={handleBarcodeGenerated}
              />
            </div>
          )
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              border: '1px dashed #ccc', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3,
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
            }}
          >
            <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
              Select a product to preview label
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Controls at the bottom - Updated */}
      <Box 
        sx={{ 
          p: 3, // Increase padding 
          borderTop: '1px solid #e0e0e0', 
          backgroundColor: '#f8f8f8',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* Quantity section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ButtonGroup 
            size="large" 
            variant="outlined"
            sx={{ 
              '& > button': { 
                mx: 1,
                // First and last children (the +/- buttons)
                '&:first-of-type, &:last-of-type': {
                  minWidth: '48px',
                  mx: 0
                }
              },
            }}
          >
            <IconButton 
              onClick={handleDecrease} 
              onMouseDown={() => startLongPress(false)}
              onMouseUp={endLongPress}
              onMouseLeave={endLongPress}
              disabled={!product || quantity <= 1}
              sx={{ 
                marginRight: '8px !important',
                backgroundColor: 'white',
                width: '48px', 
                height: '48px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <RemoveIcon />
            </IconButton>
            <Button 
              variant="text" 
              disableRipple 
              onClick={handleOpenNumpad}
              disabled={!product}
              sx={{ 
                background: 'white',
                borderRadius: '5px',
                px: 3, 
                minWidth: '90px', 
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                  border: 'none'
                }
              }}
            >
              {quantity}
            </Button>
            <IconButton 
              onClick={handleIncrease}
              onMouseDown={() => startLongPress(true)}
              onMouseUp={endLongPress}
              onMouseLeave={endLongPress}
              disabled={!product}
              sx={{ 
                backgroundColor: 'white',
                width: '48px', 
                height: '48px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <AddIcon />
            </IconButton>
          </ButtonGroup>
        </Box>
        
        {/* Print button on its own line */}
        <Button 
          variant="contained" 
          color="primary" 
          disabled={!product || isLabelLoading || isPrinting}
          onClick={handlePrintLabel}
          sx={{ 
            py: 1.5,
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
          }}
        >
          {isPrinting ? "GENERATING LABEL..." : "PRINT LABEL"}
        </Button>
      </Box>
      
      {/* Update Numpad Dialog for a more calculator-like layout */}
      <NumpadDialog
        open={showNumpad}
        onClose={handleNumpadClose}
        value={tempQuantity}
        onChange={handleNumpadChange}
        onSubmit={handleNumpadSubmit}
      />
    </Paper>
  );
}

export default LabelPreview; 