const React = require('react');
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, List, ListItem, 
  ListItemText, Alert, Chip
} = require('@mui/material');
const CloseIcon = require('@mui/icons-material/Close').default;
const WarningIcon = require('@mui/icons-material/Warning').default;
const SyncIcon = require('@mui/icons-material/Sync').default;

function ProductValidationDialog({ open, onClose, product, onSyncRequested }) {
  if (!product) return null;

  const handleSyncClick = async () => {
    try {
      if (onSyncRequested) {
        await onSyncRequested();
      }
      onClose();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const dialogTitle = React.createElement(
    DialogTitle,
    { 
      sx: { 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'warning.main',
        color: 'white',
        px: 3,
        py: 2
      } 
    },
    React.createElement(
      Box,
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
      React.createElement(
        Box,
        { display: 'flex', alignItems: 'center', gap: 1 },
        React.createElement(WarningIcon),
        React.createElement(Typography, { variant: 'h6', fontWeight: 'bold' }, 'Product Data Warning')
      ),
      React.createElement(
        IconButton,
        { onClick: onClose, size: 'medium', sx: { color: 'white' } },
        React.createElement(CloseIcon)
      )
    )
  );

  return React.createElement(
    Dialog,
    {
      open,
      onClose,
      maxWidth: 'sm',
      fullWidth: true,
      'aria-labelledby': 'product-validation-dialog-title'
    },
    dialogTitle,
    React.createElement(
      DialogContent,
      { sx: { p: 3 } },
      
      // Main warning message
      React.createElement(
        Alert,
        { severity: 'warning', sx: { mb: 3 } },
        React.createElement(Typography, { variant: 'body1', sx: { mb: 1 } },
          'This product doesn\'t have all required fields populated.'
        )
      ),
      
      // Product Information
      React.createElement(
        Box,
        { sx: { mb: 3 } },
        React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 1, fontWeight: 'bold' } },
          `Product: ${product.sku || product.id || 'Unknown'}`
        ),
        product.departmentName && React.createElement(Typography, { variant: 'body2', color: 'text.secondary' },
          `Department: ${product.departmentName}`
        )
      ),
      
      // Missing Fields
      React.createElement(Typography, { variant: 'subtitle2', sx: { mb: 2, fontWeight: 'bold' } },
        'Missing Field(s):'
      ),
      React.createElement(
        Box,
        { sx: { mb: 3 } },
        product.missingFields && product.missingFields.map((field, index) =>
          React.createElement(
            Chip,
            {
              key: index,
              label: field,
              variant: 'outlined',
              color: 'error',
              size: 'small',
              sx: { mr: 1, mb: 1 }
            }
          )
        )
      ),
      
      // Instructions
      React.createElement(
        Alert,
        { severity: 'info' },
        React.createElement(Typography, { variant: 'body2' },
          'You can update this data by going into the WMS Product Management System and updating the product details.'
        )
      )
    ),
    React.createElement(
      DialogActions,
      { sx: { px: 3, py: 2, gap: 1 } },
      React.createElement(
        Button,
        { onClick: onClose, variant: 'outlined' },
        'Continue Anyway'
      ),
      React.createElement(
        Button,
        { 
          onClick: handleSyncClick, 
          variant: 'contained',
          startIcon: React.createElement(SyncIcon),
          color: 'primary'
        },
        'Synchronize with Latest Data'
      )
    )
  );
}

module.exports = ProductValidationDialog;