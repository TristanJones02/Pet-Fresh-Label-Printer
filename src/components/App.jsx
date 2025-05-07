import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DialogProvider, useDialogs, DIALOG_TYPES } from './dialogs/DialogManager';
import { mockAppData } from '../mockData';

// Import legacy components
import AppContent from './App';

// Create a theme instance
const lightTheme = createTheme({
  palette: {
    primary: {
      main: '#9ba03b', // Pet Fresh green
      contrastText: '#ffffff', // Ensure text on primary color is white
    },
    secondary: {
      main: '#19857b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#9ba03b', // Ensure AppBar background is consistent
          color: '#ffffff', // Ensure text is white
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#878c30', // Darker green on hover
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          flexGrow: 1,
        },
      },
    },
  },
});

// App content that uses dialogs
function AppWrapper() {
  const { openDialog } = useDialogs();
  
  // You can add listeners for Electron IPC messages here
  useEffect(() => {
    // Listen for dialog open/close requests from the main process
    const handleShowDialog = (event, { dialogType, props }) => {
      openDialog(dialogType, props);
    };
    
    // Add event listeners
    window.api?.onShowDialog?.(handleShowDialog);
    
    // Clean up
    return () => {
      window.api?.offShowDialog?.(handleShowDialog);
    };
  }, [openDialog]);
  
  return <AppContent appData={mockAppData} />;
}

// Root App component
const App = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <DialogProvider>
        <AppWrapper />
      </DialogProvider>
    </ThemeProvider>
  );
};

export default App; 