import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Print as PrintIcon, 
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useDialogs, DIALOG_TYPES } from './dialogs/DialogManager';

function Header({ printerStatus, version }) {
  const { openDialog } = useDialogs();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPrinter, setSelectedPrinter] = useState('');
  
  // Load selected printer from settings when component mounts
  useEffect(() => {
    const loadPrinterFromSettings = async () => {
      try {
        const settings = await window.api.loadSettings();
        if (settings && settings.printer && settings.printer.defaultPrinter) {
          setSelectedPrinter(settings.printer.defaultPrinter);
        } else {
          setSelectedPrinter('None Selected');
        }
      } catch (error) {
        console.error('Error loading printer settings:', error);
        setSelectedPrinter('None Selected');
      }
    };
    
    loadPrinterFromSettings();
  }, []);
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get printer status color
  const getPrinterStatusColor = () => {
    switch (printerStatus) {
      case 'ready':
        return '#4CAF50'; // Green - Printer ready
      case 'printing':
        return '#4CAF50'; // Green - Will be flashing (animation handled by CSS)
      case 'generalError':
        return '#FFC107'; // Yellow - General non-critical error
      case 'criticalError':
        return '#FFC107'; // Yellow - Critical error (will be flashing)
      case 'offline':
        return '#F44336'; // Red - Printer offline
      default:
        return '#9ba03b'; // Primary app color when status unknown
    }
  };
  
  // Get printer status text for tooltip
  const getPrinterStatusText = () => {
    switch (printerStatus) {
      case 'ready':
        return 'Printer Ready';
      case 'printing':
        return 'Printing in Progress';
      case 'generalError':
        return 'General Printer Error';
      case 'criticalError':
        return 'Critical Printer Error';
      case 'offline':
        return 'Printer Offline';
      default:
        return 'Printer Status Unknown';
    }
  };
  
  // Format printer name to remove ZDesigner prefix
  const formatPrinterName = (name) => {
    if (!name) return 'No printer selected';
    
    // Remove ZDesigner prefix and clean up the name
    return name.replace(/ZDesigner\s*/i, '')
               .replace(/\s*-\s*\d+dpi\s*/i, '') // Also remove dpi information
               .trim();
  };
  
  // Format time to show only hours and minutes
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  // Handle opening the printer queue dialog
  const handlePrinterDialogOpen = () => {
    openDialog(DIALOG_TYPES.PRINT_QUEUE);
  };
  
  // Handle opening the settings dialog
  const handleSettingsDialogOpen = () => {
    openDialog(DIALOG_TYPES.SETTINGS);
  };
  
  return (
    <AppBar position="static" sx={{ backgroundColor: '#9ba03b' }}>
      <Toolbar>
        {/* Left Column - App Name */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Pet Fresh Label Printing
          </Typography>
        </Box>
        
        {/* Middle Column - Printer Status and Time */}
        <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ color: 'white', mx: 1 }}>
            Printer: {formatPrinterName(selectedPrinter)} | {formatTime(currentTime)}
          </Typography>
          <Tooltip title={getPrinterStatusText()} arrow placement="bottom">
            <IconButton 
              onClick={handlePrinterDialogOpen}
              sx={{
                bgcolor: 'white',
                color: getPrinterStatusColor(),
                width: 32,
                height: 32,
                '&:hover': { bgcolor: '#f5f5f5' },
                ml: 1,
                animation: printerStatus === 'printing' || printerStatus === 'criticalError' 
                  ? 'pulse 1.5s infinite' 
                  : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Right Column - Version & Settings */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1, color: 'white' }}>
            v{version}
          </Typography>
          <IconButton color="inherit" onClick={handleSettingsDialogOpen} sx={{ color: 'white' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 