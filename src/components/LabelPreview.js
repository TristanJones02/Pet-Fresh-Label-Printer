const React = require('react');
const { useEffect, useRef } = React;
const { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  IconButton,
  Divider,
  ButtonGroup
} = require('@mui/material');
const {
  Add: AddIcon,
  Remove: RemoveIcon
} = require('@mui/icons-material');
const JsBarcode = require('jsbarcode');

// Label Generator
function generateLabelHtml(product) {
  if (!product) return null;
  
  // Calculate expiry date
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + product.expiryDays);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Label</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .label-container {
          width: 100mm;
          height: 50mm;
          border: 1px solid #ccc;
          padding: 5mm;
          box-sizing: border-box;
          position: relative;
        }
        .product-name {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        .product-details {
          font-size: 10pt;
          margin-bottom: 2mm;
        }
        .barcode-container {
          text-align: center;
          margin-top: 3mm;
        }
        .expiry-date {
          position: absolute;
          bottom: 5mm;
          right: 5mm;
          font-size: 10pt;
          font-weight: bold;
        }
        .price {
          position: absolute;
          top: 5mm;
          right: 5mm;
          font-size: 14pt;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="label-container">
        <div class="product-name">${product.name}</div>
        <div class="price">${product.price}</div>
        <div class="product-details">
          <strong>Weight:</strong> ${product.weight}<br>
          <strong>Ingredients:</strong> ${product.ingredients}<br>
          <strong>Storage:</strong> ${product.storageInstructions}
        </div>
        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>
        <div class="expiry-date">
          Expiry: ${expiryDate.toLocaleDateString()}
        </div>
      </div>
      <script>
        if (typeof window !== 'undefined') {
          JsBarcode("#barcode", "${product.barcode}", {
            format: "EAN13",
            width: 2,
            height: 50,
            displayValue: true
          });
        }
      </script>
    </body>
    </html>
  `;
}

function LabelPreview({ product, quantity, onQuantityChange, onPrintLabel }) {
  const previewRef = useRef(null);
  const barcodeRef = useRef(null);
  
  useEffect(() => {
    // Generate barcode when product changes
    if (product && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: "EAN13",
          width: 2,
          height: 50,
          displayValue: true
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [product]);
  
  // Handle quantity decrease
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };
  
  // Handle quantity increase
  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };
  
  // Handle print
  const handlePrint = () => {
    if (!product) return;
    
    // Generate the HTML for the label
    const labelHtml = generateLabelHtml(product);
    
    // You would normally send this to the printer
    // For now, we'll just trigger the print function passed from the parent
    onPrintLabel({
      product,
      quantity,
      labelHtml
    });
  };
  
  // Simulate long-press for quantity changes
  const startIntervalRef = useRef(null);
  
  const handleLongPressStart = (increment) => {
    if (startIntervalRef.current) return;
    
    let counter = 0;
    let step = 1;
    
    startIntervalRef.current = setInterval(() => {
      counter++;
      if (counter >= 5) {
        // After 5 steps, increment by 5 instead of 1
        step = 5;
      }
      
      if (increment && quantity + step <= 999) {
        onQuantityChange(quantity + step);
      } else if (!increment && quantity - step >= 1) {
        onQuantityChange(quantity - step);
      }
    }, 250);
  };
  
  const handleLongPressEnd = () => {
    if (startIntervalRef.current) {
      clearInterval(startIntervalRef.current);
      startIntervalRef.current = null;
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">
          Label Preview
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        {product ? (
          <>
            {/* Label Preview Card */}
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 2, 
                p: 2,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
              ref={previewRef}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {product.name}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  <strong>Weight:</strong> {product.weight}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {product.price}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Ingredients:</strong> {product.ingredients}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Storage:</strong> {product.storageInstructions}
              </Typography>
              
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <svg ref={barcodeRef}></svg>
              </Box>
              
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  Expiry: {new Date(new Date().setDate(new Date().getDate() + product.expiryDays)).toLocaleDateString()}
                </Typography>
              </Box>
            </Card>
            
            {/* Quantity and Print Controls */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quantity:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton 
                  onClick={handleDecrease}
                  onMouseDown={() => handleLongPressStart(false)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  disabled={quantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mx: 2, 
                    minWidth: '40px', 
                    textAlign: 'center' 
                  }}
                >
                  {quantity}
                </Typography>
                <IconButton 
                  onClick={handleIncrease}
                  onMouseDown={() => handleLongPressStart(true)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  disabled={quantity >= 999}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large"
                onClick={handlePrint}
              >
                Print Label
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Select a product to preview and print label
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

module.exports = LabelPreview; 