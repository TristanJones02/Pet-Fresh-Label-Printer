import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  Badge
} from '@mui/material';
import { 
  Print as PrintIcon, 
  Settings as SettingsIcon, 
  Close as CloseIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDialogs, DIALOG_TYPES } from './dialogs/DialogManager';

function Header({ printerStatus, version }) {
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const { openDialog } = useDialogs();
  
  // Mock print jobs for the printer dialog
  const [printJobs, setPrintJobs] = useState([
    { id: 1, product: 'Premium Dog Food', status: 'pending', time: '2023-04-10T14:30:00Z' },
    { id: 2, product: 'Organic Cat Food', status: 'printing', time: '2023-04-10T14:31:00Z' },
    { id: 3, product: 'Bird Seed Mix', status: 'completed', time: '2023-04-10T14:28:00Z' },
  ]);
  
  // Get printer status color
  const getPrinterStatusColor = () => {
    switch (printerStatus) {
      case 'ready':
        return '#4CAF50'; // Green
      case 'printing':
        return '#4CAF50'; // Green (will be animated with CSS)
      case 'error':
        return '#F44336'; // Red
      case 'systemError':
        return '#FFC107'; // Yellow
      default:
        return '#9E9E9E'; // Grey
    }
  };
  
  // Handle opening the printer dialog
  const handlePrinterDialogOpen = () => {
    setPrinterDialogOpen(true);
  };
  
  // Handle closing the printer dialog
  const handlePrinterDialogClose = () => {
    setPrinterDialogOpen(false);
  };
  
  // Handle opening the settings dialog using DialogManager
  const handleSettingsDialogOpen = () => {
    openDialog(DIALOG_TYPES.SETTINGS);
  };
  
  // Handle cancel print job
  const handleCancelJob = (jobId) => {
    setPrintJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId ? { ...job, status: 'cancelled' } : job
      )
    );
  };
  
  // Handle reset printer spooler
  const handleResetSpooler = () => {
    console.log('Resetting printer spooler...');
    // In a real app, this would communicate with the main process to reset the print spooler
    setPrintJobs([]);
    setTimeout(() => {
      setPrinterDialogOpen(false);
    }, 500);
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
        
        {/* Middle Column - Printer Status */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 1, color: 'white' }}>
            Printer Kitchen
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handlePrinterDialogOpen}
            sx={{
              color: getPrinterStatusColor(),
              animation: printerStatus === 'printing' ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 }
              }
            }}
          >
            <PrintIcon />
          </IconButton>
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
      
      {/* Printer Dialog */}
      <Dialog
        fullScreen
        open={printerDialogOpen}
        onClose={handlePrinterDialogClose}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Printer Queue</Typography>
            <IconButton edge="end" color="inherit" onClick={handlePrinterDialogClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {printJobs.length > 0 ? (
              printJobs.map((job) => (
                <ListItem key={job.id}>
                  <ListItemText 
                    primary={job.product} 
                    secondary={`Status: ${job.status} - Time: ${new Date(job.time).toLocaleTimeString()}`} 
                  />
                  {job.status !== 'completed' && job.status !== 'cancelled' && (
                    <IconButton edge="end" aria-label="cancel" onClick={() => handleCancelJob(job.id)}>
                      <CancelIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No print jobs in queue" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<RefreshIcon />} onClick={handleResetSpooler} color="secondary">
            Reset Print Spooler
          </Button>
          <Button onClick={handlePrinterDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

export default Header; 