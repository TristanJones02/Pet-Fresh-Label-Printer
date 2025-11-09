const React = require('react');
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, Alert, Paper
} = require('@mui/material');
const CloseIcon = require('@mui/icons-material/Close').default;
const ErrorIcon = require('@mui/icons-material/Error').default;
const ContentCopyIcon = require('@mui/icons-material/ContentCopy').default;

function ApiErrorDialog({ open, onClose, error }) {
  if (!error || !error.isApiError) return null;

  const handleCopyReference = () => {
    if (navigator.clipboard && error.reference) {
      navigator.clipboard.writeText(error.reference);
    }
  };

  const dialogTitle = React.createElement(
    DialogTitle,
    { 
      sx: { 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'error.main',
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
        React.createElement(ErrorIcon),
        React.createElement(Typography, { variant: 'h6', fontWeight: 'bold' }, 'Server Error')
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
      'aria-labelledby': 'api-error-dialog-title'
    },
    dialogTitle,
    React.createElement(
      DialogContent,
      { sx: { p: 3 } },
      
      // Main error message
      React.createElement(
        Alert,
        { severity: 'error', sx: { mb: 3 } },
        React.createElement(Typography, { variant: 'body1' },
          'There was an error fetching new product data from the server.'
        )
      ),
      
      // Instructions
      React.createElement(Typography, { variant: 'body1', sx: { mb: 2 } },
        'Please quote the following reference number to IT Support:'
      ),
      
      // Reference number display
      React.createElement(
        Paper,
        { 
          variant: 'outlined',
          sx: { 
            p: 3,
            textAlign: 'center',
            bgcolor: 'grey.50',
            border: '2px solid',
            borderColor: 'error.main'
          }
        },
        React.createElement(
          Typography,
          { 
            variant: 'h4',
            sx: { 
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: 'error.main',
              letterSpacing: '0.1em'
            }
          },
          error.reference || 'N/A'
        )
      ),
      
      // Copy button (if clipboard API is available)
      navigator.clipboard && React.createElement(
        Box,
        { sx: { mt: 2, textAlign: 'center' } },
        React.createElement(
          Button,
          {
            variant: 'outlined',
            startIcon: React.createElement(ContentCopyIcon),
            onClick: handleCopyReference,
            size: 'small'
          },
          'Copy Reference'
        )
      ),
      
      // Additional error details if available
      error.message && React.createElement(
        Box,
        { sx: { mt: 3 } },
        React.createElement(Typography, { variant: 'body2', color: 'text.secondary' },
          error.message
        )
      )
    ),
    React.createElement(
      DialogActions,
      { sx: { px: 3, py: 2 } },
      React.createElement(
        Button,
        { onClick: onClose, variant: 'contained', color: 'primary' },
        'Close'
      )
    )
  );
}

module.exports = ApiErrorDialog;