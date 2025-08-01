const React = require('react');
const { useState, useRef } = React;
const mui = require('@mui/material');
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
  
  // Add references for increment/decrement timers  
  const incrementIntervalRef = useRef(null);
  const stepSizeRef = useRef(1);
  const lastUpdateTimeRef = useRef(0);

  const handlePrint = async () => {
    if (!product || isPrinting) return;
    
    setIsPrinting(true);
    try {
      // Call the parent's print handler which includes notification support
      if (onPrintLabel) {
        await onPrintLabel(product, quantity);
      }
    } catch (error) {
      console.error('Print error:', error);
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
    
    // Preview Area
    React.createElement(
      Box,
      {
        sx: {
          flexGrow: 1,
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }
      },
      product ? (
        React.createElement(
          Box,
          {
            sx: {
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
            }
          },
          React.createElement(Typography, { variant: 'h6', mb: 2 }, 'ZPL Preview Coming Soon'),
          React.createElement(Typography, { variant: 'body2', color: 'text.secondary' }, 
            `Selected: ${product.productname || product.name}`
          )
        )
      ) : (
        React.createElement(
          Box,
          {
            sx: {
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
            }
          },
          React.createElement(Typography, { variant: 'body1', color: 'textSecondary', mb: 1 }, 
            'Select a product to preview label'
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