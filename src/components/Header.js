import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton,
  Button
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useDialogs, DIALOG_TYPES } from './dialogs/DialogManager';
import PrintNotification from './PrintNotification';

function Header({ version, onShowNotification }) {
  const { openDialog } = useDialogs();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    success: false,
    productName: '',
    errorMessage: ''
  });
  
  // Function to show notifications - can be called by parent
  const showNotificationHandler = (success, productName, errorMessage = '') => {
    setNotificationData({
      success: success,
      productName: productName,
      errorMessage: errorMessage
    });
    setShowNotification(true);
  };

  // Pass the notification handler to parent via callback ref
  React.useEffect(() => {
    if (onShowNotification) {
      onShowNotification(showNotificationHandler);
    }
  }, [onShowNotification]);
  
  // Handle opening the settings dialog
  const handleSettingsDialogOpen = () => {
    openDialog(DIALOG_TYPES.SETTINGS);
  };

  // Handle cancel print job
  const handleCancelPrint = async () => {
    try {
      if (window.api?.cancelPrintJob) {
        const result = await window.api.cancelPrintJob();
        if (result.success) {
          console.log('Print job cancelled successfully');
          showNotificationHandler(true, 'Print Job Cancelled');
        } else {
          console.error('Failed to cancel print job:', result.error);
          showNotificationHandler(false, 'Cancel Failed', result.error || 'Unknown error occurred');
        }
      } else {
        console.error('Cancel print job API not available');
        showNotificationHandler(false, 'Cancel Failed', 'Cancel print job API not available');
      }
    } catch (error) {
      console.error('Error cancelling print job:', error);
      showNotificationHandler(false, 'Cancel Failed', error.message || 'Unknown error occurred');
    }
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
        
        {/* Right Column - Cancel, Version & Settings */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button 
            onClick={handleCancelPrint} 
            startIcon={<CancelIcon sx={{ color: 'black' }} />}
            sx={{ 
              backgroundColor: 'red', 
              color: 'black', 
              mr: 2,
              borderRadius: '4px',
              minWidth: '120px',
              height: '36px',
              fontSize: '0.875rem',
              textTransform: 'none',
              border: '3px solid black',
              '&:hover': {
                backgroundColor: '#d32f2f',
                border: '3px solid black',
                color: 'black'
              }
            }}
          >
            Cancel Print
          </Button>
          <Typography variant="body2" sx={{ mr: 1, color: 'white' }}>
            v{version}
          </Typography>
          <IconButton color="inherit" onClick={handleSettingsDialogOpen} sx={{ color: 'white' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
      
      {/* Cancel Print Notification */}
      <PrintNotification
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        success={notificationData.success}
        productName={notificationData.productName}
        errorMessage={notificationData.errorMessage}
      />
    </AppBar>
  );
}

export default Header; 