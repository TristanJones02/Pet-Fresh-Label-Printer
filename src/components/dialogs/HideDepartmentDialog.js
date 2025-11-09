const React = require('react');
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box
} = require('@mui/material');

function HideDepartmentDialog({ open, onClose, departmentName, onConfirm }) {
  return React.createElement(
    Dialog,
    {
      open: open || false,
      onClose: () => onClose && onClose(),
      maxWidth: 'sm',
      fullWidth: true,
      PaperProps: {
        sx: {
          borderRadius: 2,
          p: 1
        }
      }
    },
    React.createElement(
      DialogTitle,
      {
        sx: {
          textAlign: 'center',
          pb: 2,
          fontWeight: 'bold'
        }
      },
      'Hide Department?'
    ),
    React.createElement(
      DialogContent,
      { sx: { textAlign: 'center', py: 2 } },
      React.createElement(
        Typography,
        { variant: 'h6', sx: { mb: 2, fontWeight: 'medium' } },
        departmentName
      ),
      React.createElement(
        Typography,
        { variant: 'body2', color: 'text.secondary' },
        'You can undo this in settings.'
      )
    ),
    React.createElement(
      DialogActions,
      { sx: { justifyContent: 'center', gap: 2, p: 3 } },
      React.createElement(
        Button,
        {
          onClick: () => onClose && onClose(),
          variant: 'outlined',
          color: 'primary',
          sx: { minWidth: 100 }
        },
        'Cancel'
      ),
      React.createElement(
        Button,
        {
          onClick: () => onConfirm && onConfirm(departmentName),
          variant: 'contained',
          color: 'error',
          sx: { minWidth: 100 }
        },
        'Hide'
      )
    )
  );
}

module.exports = HideDepartmentDialog;