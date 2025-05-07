import React, { createContext, useContext, useState } from 'react';
import SettingsDialog from './SettingsDialog';

// Create a context for dialog management
const DialogContext = createContext(null);

/**
 * Dialog types that the manager can handle
 */
export const DIALOG_TYPES = {
  SETTINGS: 'settings',
  PRINTER_SELECT: 'printer-select',
  LABEL_PREVIEW: 'label-preview',
  CONFIRMATION: 'confirmation',
};

/**
 * DialogProvider component that wraps the application and provides dialog management
 */
export function DialogProvider({ children }) {
  const [openDialogs, setOpenDialogs] = useState(new Set());
  const [dialogProps, setDialogProps] = useState({});

  // Function to open a dialog
  const openDialog = (dialogType, props = {}) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.add(dialogType);
      return newSet;
    });
    
    setDialogProps(prev => ({
      ...prev,
      [dialogType]: props
    }));
  };

  // Function to close a dialog
  const closeDialog = (dialogType) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(dialogType);
      return newSet;
    });
  };

  // Check if a dialog is open
  const isDialogOpen = (dialogType) => {
    return openDialogs.has(dialogType);
  };

  // Prepare context value
  const contextValue = {
    openDialog,
    closeDialog,
    isDialogOpen,
    dialogProps
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      
      {/* Render the appropriate dialogs based on what's in the openDialogs set */}
      <SettingsDialog 
        open={isDialogOpen(DIALOG_TYPES.SETTINGS)} 
        onClose={() => closeDialog(DIALOG_TYPES.SETTINGS)}
        {...(dialogProps[DIALOG_TYPES.SETTINGS] || {})}
      />
      
      {/* You can add more dialogs here as needed */}
    </DialogContext.Provider>
  );
}

/**
 * Custom hook to use the dialog context
 */
export function useDialogs() {
  const context = useContext(DialogContext);
  
  if (!context) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  
  return context;
} 