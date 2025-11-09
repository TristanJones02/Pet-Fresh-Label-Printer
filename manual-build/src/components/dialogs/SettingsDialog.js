const React = require('react');
const { useState, useEffect } = React;
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, Tab, Tabs,
  List, ListItem, ListItemIcon, ListItemText, Switch,
  Divider, TextField, FormControl, InputLabel, Select,
  MenuItem, FormGroup, FormControlLabel, Checkbox,
  InputAdornment, Paper, Alert, Link, CircularProgress,
  Card, CardContent, CardActions, Grid, Tooltip, Snackbar
} = require('@mui/material');
const CloseIcon = require('@mui/icons-material/Close').default;
const PrintIcon = require('@mui/icons-material/Print').default;
const SettingsIcon = require('@mui/icons-material/Settings').default;
const ImageIcon = require('@mui/icons-material/Image').default;
const FolderIcon = require('@mui/icons-material/Folder').default;
const InfoIcon = require('@mui/icons-material/Info').default;
const RouterIcon = require('@mui/icons-material/Router').default;
const AccessTimeIcon = require('@mui/icons-material/AccessTime').default;
const PrinterIcon = require('@mui/icons-material/LocalPrintshop').default;
const BuildIcon = require('@mui/icons-material/Build').default;
const QueueIcon = require('@mui/icons-material/Queue').default;
const AddIcon = require('@mui/icons-material/Add').default;
const TuneIcon = require('@mui/icons-material/Tune').default;
const TestIcon = require('@mui/icons-material/BugReport').default;
const ConnectIcon = require('@mui/icons-material/Cable').default;
const RestartAltIcon = require('@mui/icons-material/RestartAlt').default;
const TuningIcon = require('@mui/icons-material/Tune').default;
const CheckCircleIcon = require('@mui/icons-material/CheckCircle').default;
const ErrorIcon = require('@mui/icons-material/Error').default;
const StorageIcon = require('@mui/icons-material/Storage').default;
const SyncIcon = require('@mui/icons-material/Sync').default;
const ClearIcon = require('@mui/icons-material/Clear').default;
const RefreshIcon = require('@mui/icons-material/Refresh').default;

// TabPanel component to handle tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return React.createElement(
    'div',
    {
      role: "tabpanel",
      hidden: value !== index,
      id: `settings-tabpanel-${index}`,
      'aria-labelledby': `settings-tab-${index}`,
      style: { padding: '16px 0' },
      ...other
    },
    value === index && React.createElement(Box, {}, children)
  );
}

function SettingsDialog({ open, onClose }) {
  const [tabValue, setTabValue] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [publicIpAddress, setPublicIpAddress] = useState('Fetching...');
  const [privateIpAddress, setPrivateIpAddress] = useState('Fetching...');
  const [allIpAddresses, setAllIpAddresses] = useState([]);
  const [printMessage, setPrintMessage] = useState(null);
  const [showPrintMessage, setShowPrintMessage] = useState(false);
  const [settings, setSettings] = useState({
    application: {
      devImageGeneration: false,
      devImagePath: '',
      includeContentOnly: true,
      includeGraphics: false
    }
  });
  const [networkPrinterStatus, setNetworkPrinterStatus] = useState('checking');
  const [printerServiceStatus, setPrinterServiceStatus] = useState('checking');
  const [productSyncStatus, setProductSyncStatus] = useState(null);
  const [isProductActionLoading, setIsProductActionLoading] = useState(false);

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
      getSystemInfo();
      checkNetworkPrinter();
      loadProductSyncStatus();
      
      // Reset toast message when dialog opens
      setShowPrintMessage(false);
      setPrintMessage(null);
    }
  }, [open]);

  // Add auto-dismiss for toast messages
  useEffect(() => {
    if (showPrintMessage) {
      // Auto-hide the toast after 5 seconds
      const timer = setTimeout(() => {
        setShowPrintMessage(false);
      }, 5000);
      
      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, [showPrintMessage]);

  // Load settings 
  const loadSettings = async () => {
    try {
      const loadedSettings = await window.api.loadSettings();
      
      if (loadedSettings && !loadedSettings.error) {
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Check network printer status
  const checkNetworkPrinter = async () => {
    try {
      setNetworkPrinterStatus('checking');
      setPrinterServiceStatus('checking');
      
      // Get hostname for network path
      const { getSystemHostname } = require('../../utils/systemConfig');
      const hostname = getSystemHostname();
      const networkPath = `\\\\${hostname}\\zebra_print`;
      
      // Check if network printer share exists
      const shareCheck = await window.api.checkNetworkShare(networkPath);
      setNetworkPrinterStatus(shareCheck.exists ? 'available' : 'unavailable');
      
      // Check printer service status by testing connection
      const serviceCheck = await window.api.testZplPrinter({ timeout: 5000 });
      setPrinterServiceStatus(serviceCheck.success ? 'active' : 'inactive');
      
    } catch (error) {
      console.error('Error checking network printer:', error);
      setNetworkPrinterStatus('error');
      setPrinterServiceStatus('error');
    }
  };

  // Load product sync status
  const loadProductSyncStatus = async () => {
    try {
      const result = await window.api.productDataGetSyncStatus();
      if (result.success) {
        setProductSyncStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading product sync status:', error);
    }
  };

  // Product data actions
  const handleRefetchAllProducts = async () => {
    try {
      setIsProductActionLoading(true);
      setPrintMessage({ text: 'Fetching all products from server...', type: 'info' });
      setShowPrintMessage(true);

      const result = await window.api.productDataRefetchAll();
      
      if (result.success) {
        await loadProductSyncStatus();
        setPrintMessage({ 
          text: result.message || 'Successfully fetched all products!', 
          type: 'success' 
        });
      } else if (result.isApiError) {
        setPrintMessage({ 
          text: `API Error: ${result.error}. Reference: ${result.reference}`, 
          type: 'error' 
        });
      } else {
        setPrintMessage({ 
          text: `Error fetching products: ${result.error}`, 
          type: 'error' 
        });
      }
      setShowPrintMessage(true);
    } catch (error) {
      console.error('Error fetching products:', error);
      setPrintMessage({ 
        text: `Error: ${error.message}`, 
        type: 'error' 
      });
      setShowPrintMessage(true);
    } finally {
      setIsProductActionLoading(false);
    }
  };

  const handleSyncLatestProducts = async () => {
    try {
      setIsProductActionLoading(true);
      setPrintMessage({ text: 'Synchronizing with latest data...', type: 'info' });
      setShowPrintMessage(true);

      const result = await window.api.productDataSyncLatest();
      
      if (result.success) {
        await loadProductSyncStatus();
        setPrintMessage({ 
          text: result.message || 'Successfully synchronized with latest data!', 
          type: 'success' 
        });
      } else if (result.isApiError) {
        setPrintMessage({ 
          text: `API Error: ${result.error}. Reference: ${result.reference}`, 
          type: 'error' 
        });
      } else {
        setPrintMessage({ 
          text: `Error synchronizing: ${result.error}`, 
          type: 'error' 
        });
      }
      setShowPrintMessage(true);
    } catch (error) {
      console.error('Error synchronizing:', error);
      setPrintMessage({ 
        text: `Error: ${error.message}`, 
        type: 'error' 
      });
      setShowPrintMessage(true);
    } finally {
      setIsProductActionLoading(false);
    }
  };

  const handleClearLocalProducts = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all local product data?\n\nThis will remove all cached products and categories. You can refetch them from the server afterward.'
    );
    
    if (!confirmed) return;

    try {
      setIsProductActionLoading(true);
      setPrintMessage({ text: 'Clearing local product data...', type: 'info' });
      setShowPrintMessage(true);

      const result = await window.api.productDataClearLocal();
      
      if (result.success) {
        await loadProductSyncStatus();
        setPrintMessage({ 
          text: result.message || 'Successfully cleared local product data!', 
          type: 'success' 
        });
      } else {
        setPrintMessage({ 
          text: `Error clearing data: ${result.error}`, 
          type: 'error' 
        });
      }
      setShowPrintMessage(true);
    } catch (error) {
      console.error('Error clearing data:', error);
      setPrintMessage({ 
        text: `Error: ${error.message}`, 
        type: 'error' 
      });
      setShowPrintMessage(true);
    } finally {
      setIsProductActionLoading(false);
    }
  };

  
  // Send printer command (recalibrate or restart)
  const sendPrinterCommand = async (commandType) => {
    try {
      setPrintMessage({
        text: `Sending ${commandType} command to printer...`,
        type: 'info'
      });
      setShowPrintMessage(true);
      
      // Use the network printer system to send commands
      const result = await window.api.sendPrinterCommand(commandType);
      
      if (result.success) {
        setPrintMessage({
          text: `${commandType} command sent successfully!`,
          type: 'success'
        });
        setShowPrintMessage(true);
        
        // Refresh printer status after command
        setTimeout(() => {
          checkNetworkPrinter();
        }, 2000);
      } else {
        setPrintMessage({
          text: `Error sending ${commandType} command: ${result.error || 'Unknown error'}`,
          type: 'error'
        });
        setShowPrintMessage(true);
      }
    } catch (error) {
      console.error(`Error sending ${commandType} command:`, error);
      setPrintMessage({
        text: `Error: ${error.message || `Unknown error sending ${commandType} command`}`,
        type: 'error'
      });
      setShowPrintMessage(true);
    }
  };

  // Update clock every second
  useEffect(() => {
    if (open) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [open]);


  const getSystemInfo = async () => {
    try {
      const systemInfo = await window.api.getSystemInfo();
      if (systemInfo && !systemInfo.error) {
        setPublicIpAddress(systemInfo.publicIpAddress || 'Not available');
        setPrivateIpAddress(systemInfo.privateIpAddress || 'Not available');
        setAllIpAddresses(systemInfo.allIpAddresses || []);
      }
    } catch (error) {
      console.error('Error loading system info:', error);
      setPublicIpAddress('Error fetching');
      setPrivateIpAddress('Error fetching');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    try {
      await window.api.saveSettings(settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleDevImageGenerationChange = (event) => {
    setSettings({
      ...settings,
      application: {
        ...settings.application,
        devImageGeneration: event.target.checked
      }
    });
  };

  const handleDevImagePathChange = (event) => {
    setSettings({
      ...settings,
      application: {
        ...settings.application,
        devImagePath: event.target.value
      }
    });
  };

  const handleContentOnlyChange = (event) => {
    setSettings({
      ...settings,
      application: {
        ...settings.application,
        includeContentOnly: event.target.checked
      }
    });
  };

  const handleIncludeGraphicsChange = (event) => {
    setSettings({
      ...settings,
      application: {
        ...settings.application,
        includeGraphics: event.target.checked
      }
    });
  };


  // Function to print a test label
  const printTestLabel = async () => {
    try {
      setIsPrinting(true);
      
      // Create a simple test label HTML
      const testLabel = `
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              width: 60mm;  /* Label width */
              height: 162mm; /* Label height */
            }
            .label-content {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100%;
              padding: 10mm;
              box-sizing: border-box;
            }
            .title {
              font-size: 5mm;
              font-weight: bold;
              margin-bottom: 5mm;
              text-align: center;
            }
            .info {
              font-size: 3mm;
              margin-bottom: 3mm;
              text-align: center;
            }
            .barcode {
              width: 40mm;
              height: 15mm;
              background: repeating-linear-gradient(90deg, #000, #000 0.5mm, #fff 0.5mm, #fff 1mm);
              margin: 5mm 0;
            }
            .printer-name {
              font-size: 3.5mm;
              font-weight: bold;
            }
            .timestamp {
              font-size: 2.5mm;
              color: #666;
              margin-top: 3mm;
            }
          </style>
        </head>
        <body>
          <div class="label-content">
            <div class="title">Printer Test Label</div>
            <div class="info">This is a test print to verify printer functionality</div>
            <div class="barcode"></div>
            <div class="printer-name">${selectedPrinter}</div>
            <div class="timestamp">Printed: ${new Date().toLocaleString()}</div>
          </div>
        </body>
        </html>
      `;
      
      // Print the test label
      const result = await window.api.printLabel(testLabel, 1, null, { productName: 'Test Print', productId: 'TEST001' });
      
      // Show success/error message
      if (result.success) {
        setPrintMessage({ 
          text: 'Test label printed successfully!', 
          type: 'success' 
        });
      } else {
        setPrintMessage({ 
          text: `Error printing test label: ${result.error}`, 
          type: 'error' 
        });
      }
      
      setShowPrintMessage(true);
    } catch (error) {
      console.error('Error printing test label:', error);
      setPrintMessage({
        text: `Error: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
      setShowPrintMessage(true);
    } finally {
      setIsPrinting(false);
    }
  };
  
  // Handle closing the print message
  const handleClosePrintMessage = () => {
    setShowPrintMessage(false);
    // Also reset the message content
    setPrintMessage(null);
  };

  // Create dialog title component
  const dialogTitle = React.createElement(
    DialogTitle,
    { 
      sx: { 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: '#9ba03b',
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
      React.createElement(Typography, { variant: 'h6', fontWeight: 'bold' }, 'Settings'),
        React.createElement(Typography, { variant: 'body2', sx: { ml: 2, opacity: 0.9 } }, 
          `Time: ${currentTime.toLocaleString()}`
        )
      ),
      React.createElement(
        Box,
        { display: 'flex', alignItems: 'center', gap: 1 },
        React.createElement(
          IconButton,
          { 
            size: 'small',
            sx: { 
              bgcolor: 'white', 
              color: '#9ba03b',
              '&:hover': { bgcolor: '#f5f5f5' },
              width: 32,
              height: 32
            }
          },
          React.createElement(PrintIcon, { fontSize: 'small' })
        ),
      React.createElement(
        IconButton,
        { onClick: handleClose, size: 'medium', sx: { color: 'white' } },
        React.createElement(CloseIcon)
        )
      )
    )
  );

  // Create tabs
  const tabsComponent = React.createElement(
    Box,
    { sx: { borderBottom: 1, borderColor: 'divider' } },
    React.createElement(
      Tabs,
      {
        value: tabValue,
        onChange: handleTabChange,
        'aria-label': 'settings tabs',
        variant: 'fullWidth',
        sx: { 
          '& .MuiTab-root': { 
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.95rem',
            py: 2,
          }
        }
      },
      React.createElement(Tab, { icon: React.createElement(PrintIcon), label: 'Printers', id: 'settings-tab-0' }),
      React.createElement(Tab, { icon: React.createElement(InfoIcon), label: 'System Info', id: 'settings-tab-1' }),
      React.createElement(Tab, { icon: React.createElement(StorageIcon), label: 'Product Data', id: 'settings-tab-2' }),
      React.createElement(Tab, { icon: React.createElement(SettingsIcon), label: 'Application', id: 'settings-tab-3' })
    )
  );

  // Helper function to get status icon and color
  const getStatusIcon = (status) => {
    switch(status) {
      case 'available':
      case 'active':
        return React.createElement(CheckCircleIcon, { sx: { color: 'success.main' } });
      case 'unavailable':
      case 'inactive':
        return React.createElement(ErrorIcon, { sx: { color: 'error.main' } });
      case 'checking':
        return React.createElement(CircularProgress, { size: 20 });
      default:
        return React.createElement(ErrorIcon, { sx: { color: 'warning.main' } });
    }
  };

  // Create Printer Settings Tab
  const printerSettingsTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 0 },
    
    // Network Printer Status Section
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Network Printer Status'),
    React.createElement(
      Paper,
      { variant: 'outlined', sx: { p: 2, mb: 3 } },
      
      // Network Share Status
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(ListItemIcon, {}, getStatusIcon(networkPrinterStatus)),
        React.createElement(
          ListItemText,
          {
            primary: 'Network Printer Share',
            secondary: networkPrinterStatus === 'available' ? 'zebra_print share is accessible' :
                      networkPrinterStatus === 'unavailable' ? 'zebra_print share not found' :
                      networkPrinterStatus === 'checking' ? 'Checking network share...' :
                      'Error checking network share',
            primaryTypographyProps: { fontWeight: 'bold' }
          }
        )
      ),
      
      // Printer Service Status
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(ListItemIcon, {}, getStatusIcon(printerServiceStatus)),
        React.createElement(
          ListItemText,
          {
            primary: 'Printer Service Status',
            secondary: printerServiceStatus === 'active' ? 'Printer is responding to commands' :
                      printerServiceStatus === 'inactive' ? 'Printer not responding' :
                      printerServiceStatus === 'checking' ? 'Testing printer connection...' :
                      'Error testing printer connection'
          }
        )
      )
    ),
    
    // Printer Commands Section
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Printer Commands'),
    React.createElement(
      Paper,
      { variant: 'outlined', sx: { p: 2 } },
      React.createElement(
        Grid,
        { container: true, spacing: 2 },
        
        // Recalibrate Button
        React.createElement(
          Grid,
          { xs: 6 },
          React.createElement(
            Button,
            {
              variant: 'outlined',
              fullWidth: true,
              startIcon: React.createElement(TuningIcon),
              onClick: () => sendPrinterCommand('recalibrate'),
              sx: { py: 1.5 }
            },
            'Recalibrate Printer'
          )
        ),
        
        // Restart Button
        React.createElement(
          Grid,
          { xs: 6 },
          React.createElement(
            Button,
            {
              variant: 'outlined',
              fullWidth: true,
              startIcon: React.createElement(RestartAltIcon),
              onClick: () => sendPrinterCommand('restart'),
              sx: { py: 1.5 }
            },
            'Restart Printer'
          )
        )
      )
    )
  );

  // Create System Info Tab
  const systemInfoTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 1 },
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Network Information'),
    
    // IP Address Section
    React.createElement(
      Paper,
      {
        variant: 'outlined',
        sx: { p: 2, mb: 3 }
      },
      // Public IP Address
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(
          ListItemIcon,
          {},
          React.createElement(RouterIcon, { color: 'primary' })
        ),
        React.createElement(
          ListItemText,
          { 
            primary: 'Public IP Address (Internet facing)', 
            secondary: publicIpAddress,
            primaryTypographyProps: { fontWeight: 'bold' }
          }
        )
      ),
      
      // Private IP Address
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(
          ListItemIcon,
          {},
          React.createElement(RouterIcon)
        ),
        React.createElement(
          ListItemText,
          { 
            primary: 'Private IP Address (Local network)', 
            secondary: privateIpAddress
          }
        )
      ),
      
      // All IP Addresses
      allIpAddresses.length > 0 && React.createElement(
        React.Fragment,
        {},
        React.createElement(
          Typography,
          { 
            variant: 'subtitle2', 
            sx: { mt: 2, mb: 1 },
            color: 'text.secondary'
          },
          'All Network Interfaces'
        ),
        React.createElement(
          Box,
          { 
            sx: { 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #eee', 
              borderRadius: 1,
              p: 1 
            }
          },
          allIpAddresses.map((ip, index) => 
            React.createElement(
              ListItem,
              { 
                key: `ip-${index}`,
                dense: true,
                sx: { 
                  borderBottom: index < allIpAddresses.length - 1 ? '1px solid #f0f0f0' : 'none',
                  py: 0.5
                }
              },
              React.createElement(
                ListItemText,
                {
                  primary: React.createElement(
                    'span',
                    { style: { fontFamily: 'monospace' } },
                    ip.address
                  ),
                  secondary: React.createElement(
                    Typography,
                    { 
                      variant: 'caption',
                      component: 'div',
                      color: 'text.secondary'
                    },
                    `${ip.name} ${ip.internal ? '(internal)' : ''} ${ip.isPrivate ? '(local network)' : '(external network)'}`
                  ),
                  primaryTypographyProps: { 
                    variant: 'body2'
                  }
                }
              )
            )
          )
        )
      )
    ),
    
    // System Information
    React.createElement(Typography, { variant: 'h6', gutterBottom: true, mt: 3 }, 'System Information'),
    React.createElement(
      Paper,
      {
        variant: 'outlined',
        sx: { p: 2 }
      },
      // Current Time
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(
          ListItemIcon,
          {},
          React.createElement(AccessTimeIcon)
        ),
        React.createElement(
          ListItemText,
          { 
            primary: 'Current Time', 
            secondary: currentTime.toLocaleTimeString()
          }
        )
      ),
      
      // Application Version
      React.createElement(
        ListItem,
        { sx: { px: 0 } },
        React.createElement(
          ListItemIcon,
          {},
          React.createElement(InfoIcon)
        ),
        React.createElement(
          ListItemText,
          { 
            primary: 'Application Version', 
            secondary: 'v0.2.5',
            primaryTypographyProps: { fontWeight: 'medium' }
          }
        )
      )
    )
  );

  // Restart functions
  const handleRestartApp = async () => {
    try {
      if (window.api?.restartApplication) {
        await window.api.restartApplication();
      } else {
        console.error('Restart API not available');
      }
    } catch (error) {
      console.error('Error restarting application:', error);
    }
  };

  const handleRestartComputer = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to restart the computer?\n\nThis will close all applications and restart the device.'
    );
    
    if (confirmed) {
      try {
        if (window.api?.restartComputer) {
          await window.api.restartComputer();
        } else {
          console.error('Computer restart API not available');
        }
      } catch (error) {
        console.error('Error restarting computer:', error);
      }
    }
  };

  const handleCloseApp = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to close the application?\n\nThis will exit the label printer app completely.'
    );
    
    if (confirmed) {
      try {
        if (window.api?.closeApp) {
          await window.api.closeApp();
        } else {
          // Fallback: use electron's built-in method
          window.close();
        }
      } catch (error) {
        console.error('Error closing application:', error);
        // Additional fallback
        window.close();
      }
    }
  };

  // Create Product Data Management Tab
  const productDataTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 2 },
    
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Product Data Management'),
    
    // Sync Status Section
    React.createElement(
      Paper,
      { variant: 'outlined', sx: { p: 2, mb: 3 } },
      React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 2, fontWeight: 'medium' } }, 'Sync Status'),
      
      productSyncStatus && React.createElement(
        React.Fragment,
        {},
        
        // Last Sync Time
        React.createElement(
          ListItem,
          { sx: { px: 0 } },
          React.createElement(ListItemIcon, {}, React.createElement(AccessTimeIcon)),
          React.createElement(
            ListItemText,
            {
              primary: 'Last Sync',
              secondary: productSyncStatus.lastSyncTime 
                ? new Date(productSyncStatus.lastSyncTime).toLocaleString()
                : 'Never synchronized',
              primaryTypographyProps: { fontWeight: 'bold' }
            }
          )
        ),
        
        // Auto-sync Status
        React.createElement(
          ListItem,
          { sx: { px: 0 } },
          React.createElement(ListItemIcon, {}, 
            productSyncStatus.isAutoSyncActive 
              ? React.createElement(CheckCircleIcon, { sx: { color: 'success.main' } })
              : React.createElement(ErrorIcon, { sx: { color: 'error.main' } })
          ),
          React.createElement(
            ListItemText,
            {
              primary: 'Auto-sync (10 minutes)',
              secondary: productSyncStatus.isAutoSyncActive ? 'Active' : 'Inactive',
              primaryTypographyProps: { fontWeight: 'bold' }
            }
          )
        ),
        
        // Data Counts
        React.createElement(
          ListItem,
          { sx: { px: 0 } },
          React.createElement(ListItemIcon, {}, React.createElement(StorageIcon)),
          React.createElement(
            ListItemText,
            {
              primary: 'Local Data',
              secondary: `${productSyncStatus.productCount} products, ${productSyncStatus.categoryCount} categories`,
              primaryTypographyProps: { fontWeight: 'bold' }
            }
          )
        )
      )
    ),
    
    // Data Management Actions
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Data Actions'),
    React.createElement(
      Paper,
      { variant: 'outlined', sx: { p: 2 } },
      React.createElement(
        Grid,
        { container: true, spacing: 2 },
        
        // Refetch All Button
        React.createElement(
          Grid,
          { xs: 12, sm: 4 },
          React.createElement(
            Button,
            {
              variant: 'outlined',
              fullWidth: true,
              startIcon: isProductActionLoading ? React.createElement(CircularProgress, { size: 20 }) : React.createElement(RefreshIcon),
              onClick: handleRefetchAllProducts,
              disabled: isProductActionLoading,
              sx: { py: 1.5 }
            },
            'Refetch All Data'
          )
        ),
        
        // Sync Latest Button
        React.createElement(
          Grid,
          { xs: 12, sm: 4 },
          React.createElement(
            Button,
            {
              variant: 'contained',
              fullWidth: true,
              startIcon: isProductActionLoading ? React.createElement(CircularProgress, { size: 20 }) : React.createElement(SyncIcon),
              onClick: handleSyncLatestProducts,
              disabled: isProductActionLoading,
              sx: { py: 1.5 }
            },
            'Synchronize Latest'
          )
        ),
        
        // Clear Local Data Button
        React.createElement(
          Grid,
          { xs: 12, sm: 4 },
          React.createElement(
            Button,
            {
              variant: 'outlined',
              fullWidth: true,
              color: 'error',
              startIcon: isProductActionLoading ? React.createElement(CircularProgress, { size: 20 }) : React.createElement(ClearIcon),
              onClick: handleClearLocalProducts,
              disabled: isProductActionLoading,
              sx: { py: 1.5 }
            },
            'Clear Local Data'
          )
        )
      ),
      
      React.createElement(
        Box,
        { sx: { mt: 2 } },
        React.createElement(
          Alert,
          { severity: 'info' },
          React.createElement(Typography, { variant: 'body2' }, 
            'Product data is automatically synchronized every 10 minutes. Use "Synchronize Latest" to get only new updates since the last sync, or "Refetch All Data" to get a complete fresh copy of all products.'
          )
        )
      )
    )
  );

  // Create Application Settings Tab
  const applicationSettingsTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 3 },
    
    React.createElement(
      Box,
      { sx: { p: 3 } },
      
      // Title
      React.createElement(Typography, { variant: 'h6', sx: { mb: 3, fontWeight: 'bold' } }, 'Application Management'),
      
      // Memory Information
      React.createElement(
        Card,
        { sx: { mb: 3 } },
        React.createElement(
          CardContent,
          {},
          React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 1, fontWeight: 'medium' } }, 'Memory Usage'),
          React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } }, 
            'For optimal performance in long-running applications, consider restarting periodically.'
          )
        )
      ),
      
      // Restart Options
      React.createElement(
        Card,
        {},
        React.createElement(
          CardContent,
          {},
          React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 2, fontWeight: 'medium' } }, 'Restart Options'),
          
          React.createElement(
            Grid,
            { container: true, spacing: 2 },
            
            // Restart App Button
            React.createElement(
              Grid,
              { xs: 12, sm: 4 },
              React.createElement(
                Button,
                {
                  variant: 'outlined',
                  startIcon: React.createElement(RestartAltIcon),
                  onClick: handleRestartApp,
                  fullWidth: true,
                  sx: { 
                    height: '60px',
                    borderColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.50'
                    }
                  }
                },
                React.createElement(
                  Box,
                  { textAlign: 'center' },
                  React.createElement(Typography, { variant: 'button', display: 'block' }, 'Restart App'),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary' }, 'Quick restart (~10 seconds)')
                )
              )
            ),
            
            // Close App Button
            React.createElement(
              Grid,
              { xs: 12, sm: 4 },
              React.createElement(
                Button,
                {
                  variant: 'outlined',
                  startIcon: React.createElement(CloseIcon),
                  onClick: handleCloseApp,
                  fullWidth: true,
                  color: 'error',
                  sx: { 
                    height: '60px',
                    borderColor: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.50'
                    }
                  }
                },
                React.createElement(
                  Box,
                  { textAlign: 'center' },
                  React.createElement(Typography, { variant: 'button', display: 'block' }, 'Close App'),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary' }, 'Exit application completely')
                )
              )
            ),
            
            // Restart Computer Button
            React.createElement(
              Grid,
              { xs: 12, sm: 4 },
              React.createElement(
                Button,
                {
                  variant: 'outlined',
                  startIcon: React.createElement(RestartAltIcon),
                  onClick: handleRestartComputer,
                  fullWidth: true,
                  color: 'warning',
                  sx: { 
                    height: '60px',
                    borderColor: 'warning.main',
                    '&:hover': {
                      backgroundColor: 'warning.50'
                    }
                  }
                },
                React.createElement(
                  Box,
                  { textAlign: 'center' },
                  React.createElement(Typography, { variant: 'button', display: 'block' }, 'Restart Computer'),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary' }, 'Full system restart (~2 minutes)')
                )
              )
            )
          ),
          
          React.createElement(
            Alert,
            { severity: 'info', sx: { mt: 2 } },
            'The app will automatically suggest restarting when memory usage exceeds 275MB for optimal performance.'
          )
        )
      )
    )
  );

  // Main dialog content
  return React.createElement(
    Dialog,
    {
      open,
      onClose: handleClose,
      maxWidth: 'md',
      fullWidth: true,
      'aria-labelledby': 'settings-dialog-title',
      'aria-describedby': 'settings-dialog-description'
    },
    dialogTitle,
    React.createElement(
      DialogContent,
      { dividers: true, sx: { p: 0 } },
      React.createElement(
        Box,
        { sx: { height: '100%', display: 'flex', flexDirection: 'column' } },
        tabsComponent,
        React.createElement(
          Box,
          { sx: { px: 3, py: 2, flexGrow: 1, overflowY: 'auto' } },
      printerSettingsTab,
      systemInfoTab,
      productDataTab,
      applicationSettingsTab
        )
      )
    ),
    React.createElement(
      DialogActions,
      { sx: { px: 3, py: 2 } },
      React.createElement(Button, { onClick: handleClose }, 'Cancel'),
      React.createElement(Button, { onClick: handleSave, variant: 'contained', color: 'primary' }, 'Save')
    ),
    // Print message notification
    React.createElement(
      Snackbar,
      {
        open: showPrintMessage,
        autoHideDuration: 6000,
        onClose: handleClosePrintMessage,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
      },
      React.createElement(
        Alert,
        { 
          onClose: handleClosePrintMessage, 
          severity: printMessage?.type || 'info',
          sx: { width: '100%' }
        },
        printMessage?.text
      )
    )
  );
}

module.exports = SettingsDialog; 