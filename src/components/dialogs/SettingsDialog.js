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
const UpdateIcon = require('@mui/icons-material/Update').default;
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
const RestoreIcon = require('@mui/icons-material/Restore').default;
const StorageIcon = require('@mui/icons-material/Storage').default;
const SyncIcon = require('@mui/icons-material/Sync').default;
const ClearIcon = require('@mui/icons-material/Clear').default;
const RefreshIcon = require('@mui/icons-material/Refresh').default;
const DescriptionIcon = require('@mui/icons-material/Description').default;
const DeleteIcon = require('@mui/icons-material/Delete').default;
const logger = require('../../utils/logger');

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

function SettingsDialog({ open, onClose, onPreferencesUpdate, onProductDataUpdate }) {
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
      includeGraphics: false,
      enableLogging: false
    }
  });
  const [networkPrinterStatus, setNetworkPrinterStatus] = useState('checking');
  const [printerServiceStatus, setPrinterServiceStatus] = useState('checking');
  const [productSyncStatus, setProductSyncStatus] = useState(null);
  const [isProductActionLoading, setIsProductActionLoading] = useState(false);
  const [memoryData, setMemoryData] = useState([]);
  const [currentMemory, setCurrentMemory] = useState({ used: 0, total: 0 });
  const [userPreferences, setUserPreferences] = useState({ categoryOrder: {}, hiddenDepartments: [] });
  const [appVersion, setAppVersion] = useState('v1.2.2');
  const [logFilePath, setLogFilePath] = useState('');

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
      getSystemInfo();
      checkNetworkPrinter();
      loadProductSyncStatus();
      loadUserPreferences();
      loadAppVersion();
      loadLogFilePath();
      
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
      
      // Check printer share status
      const serviceCheck = await window.api.testZplPrinter({ timeout: 5000 });
      
      if (serviceCheck.status === 'connected') {
        setNetworkPrinterStatus('available');
        setPrinterServiceStatus('active');
      } else if (serviceCheck.status === 'disconnected') {
        setNetworkPrinterStatus('available');
        setPrinterServiceStatus('inactive');
      } else if (serviceCheck.status === 'not_found') {
        setNetworkPrinterStatus('unavailable');
        setPrinterServiceStatus('inactive');
      } else {
        setNetworkPrinterStatus('error');
        setPrinterServiceStatus('error');
      }
      
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

  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const result = await window.api.loadUserPreferences();
      if (result.success) {
        setUserPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Load app version
  const loadAppVersion = async () => {
    try {
      const version = await window.api.getAppVersion();
      setAppVersion(`v${version}`);
    } catch (error) {
      console.error('Error loading app version:', error);
    }
  };

  // Load log file path
  const loadLogFilePath = async () => {
    try {
      const path = await window.api.getLogFilePath();
      setLogFilePath(path);
    } catch (error) {
      console.error('Error loading log file path:', error);
    }
  };

  // Unhide department
  const handleUnhideDepartment = async (departmentName) => {
    try {
      const newHiddenDepartments = userPreferences.hiddenDepartments.filter(
        dept => dept !== departmentName
      );
      const newPreferences = { 
        ...userPreferences, 
        hiddenDepartments: newHiddenDepartments 
      };
      
      const result = await window.api.saveUserPreferences(newPreferences);
      if (result.success) {
        setUserPreferences(newPreferences);
        // Notify parent components that preferences were updated
        if (onPreferencesUpdate) {
          onPreferencesUpdate();
        }
      }
    } catch (error) {
      console.error('Error unhiding department:', error);
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
        // Notify parent to reload product data
        if (onProductDataUpdate) {
          onProductDataUpdate();
        }
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
        // Notify parent to reload product data
        if (onProductDataUpdate) {
          onProductDataUpdate();
        }
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

  // Update memory data every second
  useEffect(() => {
    if (open && tabValue === 1) { // Only update when on Application tab
      const updateMemory = async () => {
        try {
          const result = await window.api.getMemoryUsage();
          if (result.success) {
            const { used, total } = result.data;
            
            setCurrentMemory({
              used,
              total
            });
            
            // Add to history (keep last 300 points for 5 minutes of data)
            setMemoryData(prev => {
              const newData = [...prev, {
                time: new Date().getTime(),
                value: (used / 1024 / 1024).toFixed(1) // Convert to MB
              }];
              return newData.slice(-300);
            });
          }
        } catch (error) {
          console.log('Memory monitoring not available:', error);
        }
      };
      
      updateMemory(); // Initial update
      const timer = setInterval(updateMemory, 1000);
      
      return () => clearInterval(timer);
    }
  }, [open, tabValue]);


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

  const handleEnableLoggingChange = async (event) => {
    const enabled = event.target.checked;
    setSettings({
      ...settings,
      application: {
        ...settings.application,
        enableLogging: enabled
      }
    });
    
    // Update logger immediately
    logger.setEnabled(enabled);
    
    if (enabled) {
      logger.info('Logging enabled from settings');
    }
  };

  const handleOpenLogFile = async () => {
    try {
      const result = await window.api.openLogFile();
      if (!result.success) {
        setPrintMessage({ 
          text: 'Could not open log file: ' + (result.error || 'File not found'), 
          type: 'error' 
        });
        setShowPrintMessage(true);
      }
    } catch (error) {
      console.error('Error opening log file:', error);
      setPrintMessage({ 
        text: 'Error opening log file', 
        type: 'error' 
      });
      setShowPrintMessage(true);
    }
  };

  const handleClearLogFile = async () => {
    const confirmed = window.confirm('Are you sure you want to clear the log file?');
    if (!confirmed) return;
    
    try {
      const result = await window.api.clearLogs();
      if (result.success) {
        setPrintMessage({ 
          text: 'Log file cleared successfully', 
          type: 'success' 
        });
      } else {
        setPrintMessage({ 
          text: 'Failed to clear log file', 
          type: 'error' 
        });
      }
      setShowPrintMessage(true);
    } catch (error) {
      console.error('Error clearing log file:', error);
      setPrintMessage({ 
        text: 'Error clearing log file', 
        type: 'error' 
      });
      setShowPrintMessage(true);
    }
  };

  const handleMarginChange = (side) => (event) => {
    const value = parseFloat(event.target.value) || 0;
    setSettings({
      ...settings,
      printer: {
        ...settings.printer,
        margins: {
          ...settings.printer?.margins,
          [side]: value
        }
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
            secondary: networkPrinterStatus === 'available' ? 'zebra_print share found' :
                      networkPrinterStatus === 'unavailable' ? 'zebra_print share not configured (network share not set up)' :
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
            primary: 'Printer Connection Status',
            secondary: printerServiceStatus === 'active' ? 'Connected - printer share is accessible' :
                      printerServiceStatus === 'inactive' ? 'Disconnected - share exists but not accessible' :
                      printerServiceStatus === 'checking' ? 'Checking printer connection...' :
                      'Error checking printer connection'
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
    ),
    
    // Label Margin Adjustments Section
    React.createElement(Typography, { variant: 'h6', gutterBottom: true, mt: 3 }, 'Label Margin Adjustments'),
    React.createElement(
      Paper,
      { variant: 'outlined', sx: { p: 2 } },
      React.createElement(
        Typography, 
        { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } },
        'Adjust label margins in millimeters. Positive values add space, negative values reduce space.'
      ),
      React.createElement(
        Grid,
        { container: true, spacing: 2 },
        
        // Top Margin
        React.createElement(
          Grid,
          { xs: 12, sm: 6 },
          React.createElement(
            TextField,
            {
              fullWidth: true,
              label: 'Top Margin (mm)',
              type: 'number',
              value: settings.printer?.margins?.top || 0,
              onChange: handleMarginChange('top'),
              InputProps: {
                inputProps: { 
                  min: -10, 
                  max: 10, 
                  step: 0.5 
                }
              },
              size: 'small'
            }
          )
        ),
        
        // Bottom Margin
        React.createElement(
          Grid,
          { xs: 12, sm: 6 },
          React.createElement(
            TextField,
            {
              fullWidth: true,
              label: 'Bottom Margin (mm)',
              type: 'number',
              value: settings.printer?.margins?.bottom || 0,
              onChange: handleMarginChange('bottom'),
              InputProps: {
                inputProps: { 
                  min: -10, 
                  max: 10, 
                  step: 0.5 
                }
              },
              size: 'small'
            }
          )
        ),
        
        // Left Margin
        React.createElement(
          Grid,
          { xs: 12, sm: 6 },
          React.createElement(
            TextField,
            {
              fullWidth: true,
              label: 'Left Margin (mm)',
              type: 'number',
              value: settings.printer?.margins?.left || 0,
              onChange: handleMarginChange('left'),
              InputProps: {
                inputProps: { 
                  min: -10, 
                  max: 10, 
                  step: 0.5 
                }
              },
              size: 'small'
            }
          )
        ),
        
        // Right Margin
        React.createElement(
          Grid,
          { xs: 12, sm: 6 },
          React.createElement(
            TextField,
            {
              fullWidth: true,
              label: 'Right Margin (mm)',
              type: 'number',
              value: settings.printer?.margins?.right || 0,
              onChange: handleMarginChange('right'),
              InputProps: {
                inputProps: { 
                  min: -10, 
                  max: 10, 
                  step: 0.5 
                }
              },
              size: 'small'
            }
          )
        )
      ),
      
      React.createElement(
        Alert,
        { severity: 'info', sx: { mt: 2 } },
        'These adjustments will be applied to both the label preview and the printed labels.'
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
            secondary: appVersion,
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
        
        // Sync Times in Two Columns
        React.createElement(
          Grid,
          { container: true, spacing: 2, sx: { mb: 2 } },
          // Last Product Update
          React.createElement(
            Grid,
            { item: true, xs: 12, sm: 6 },
            React.createElement(
              ListItem,
              { sx: { px: 0 } },
              React.createElement(ListItemIcon, {}, React.createElement(UpdateIcon, { sx: { color: 'primary.main' } })),
              React.createElement(
                ListItemText,
                {
                  primary: 'Last Product Update',
                  secondary: productSyncStatus.lastSyncTime 
                    ? new Date(productSyncStatus.lastSyncTime).toLocaleString()
                    : 'No product updates yet',
                  primaryTypographyProps: { fontWeight: 'bold' }
                }
              )
            )
          ),
          // Last Sync Check
          React.createElement(
            Grid,
            { item: true, xs: 12, sm: 6 },
            React.createElement(
              ListItem,
              { sx: { px: 0 } },
              React.createElement(ListItemIcon, {}, React.createElement(AccessTimeIcon)),
              React.createElement(
                ListItemText,
                {
                  primary: 'Last Sync',
                  secondary: productSyncStatus.lastSyncCheckTime 
                    ? new Date(productSyncStatus.lastSyncCheckTime).toLocaleString()
                    : 'Never checked',
                  primaryTypographyProps: { fontWeight: 'bold' }
                }
              )
            )
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
            `• Data is automatically fetched every 10 min, and can be manually fetched by clicking "Synchronize Latest". Auto/Manual synchronization fetches any product changes since the last sync.\n• Refetch All Data will overwrite local product data with newly downloaded data.\n• Clear Local Data will clear the local data, and not auto-refetch - This will happen on next restart OR Refetch all/Auto Sync.`
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
          React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 1 } }, 
            `Current: ${(currentMemory.used / 1024 / 1024).toFixed(1)} MB / ${(currentMemory.total / 1024 / 1024 / 1024).toFixed(1)} GB`
          ),
          React.createElement(
            Box,
            { sx: { height: 100, position: 'relative', mt: 2, mb: 1 } },
            React.createElement(
              'svg',
              { width: '100%', height: '100%', style: { backgroundColor: '#f5f5f5', borderRadius: 4 } },
              // Grid lines
              React.createElement('line', { x1: '0', y1: '50%', x2: '100%', y2: '50%', stroke: '#e0e0e0', strokeDasharray: '2,2' }),
              React.createElement('line', { x1: '0', y1: '25%', x2: '100%', y2: '25%', stroke: '#e0e0e0', strokeDasharray: '2,2' }),
              React.createElement('line', { x1: '0', y1: '75%', x2: '100%', y2: '75%', stroke: '#e0e0e0', strokeDasharray: '2,2' }),
              // Memory line
              memoryData.length > 1 && React.createElement('polyline', {
                points: memoryData.map((point, index) => {
                  const x = (index / (memoryData.length - 1)) * 100;
                  const maxMB = Math.max(...memoryData.map(d => parseFloat(d.value)), 100);
                  const y = 100 - (parseFloat(point.value) / maxMB) * 100;
                  return `${x}%,${y}%`;
                }).join(' '),
                fill: 'none',
                stroke: '#9ba03b',
                strokeWidth: 2
              })
            )
          ),
          React.createElement(Typography, { variant: 'caption', color: 'text.secondary' }, 
            'Memory usage over the last 5 minutes. For optimal performance, consider restarting periodically.'
          )
        )
      ),
      
      // Hidden Departments Section
      userPreferences.hiddenDepartments.length > 0 && React.createElement(
        Card,
        { sx: { mb: 3 } },
        React.createElement(
          CardContent,
          {},
          React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 2, fontWeight: 'medium' } }, 'Hidden Departments'),
          React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } }, 
            'Departments hidden from the category list. Click to unhide them.'
          ),
          React.createElement(
            Box,
            { sx: { display: 'flex', flexWrap: 'wrap', gap: 1 } },
            userPreferences.hiddenDepartments.map((dept, index) =>
              React.createElement(
                Button,
                {
                  key: index,
                  variant: 'outlined',
                  size: 'small',
                  startIcon: React.createElement(RestoreIcon),
                  onClick: () => handleUnhideDepartment(dept),
                  sx: { 
                    textTransform: 'none',
                    borderColor: 'warning.main',
                    color: 'warning.main',
                    '&:hover': {
                      backgroundColor: 'warning.50',
                      borderColor: 'warning.dark'
                    }
                  }
                },
                dept
              )
            )
          )
        )
      ),
      
      // Logging Settings
      React.createElement(
        Card,
        { sx: { mb: 3 } },
        React.createElement(
          CardContent,
          {},
          React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 2, fontWeight: 'medium' } }, 'Error Logging'),
          React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } }, 
            'Enable logging to track errors and debug issues with label generation and printing.'
          ),
          
          // Enable Logging Toggle
          React.createElement(
            FormGroup,
            { sx: { mb: 2 } },
            React.createElement(
              FormControlLabel,
              {
                control: React.createElement(Switch, {
                  checked: settings.application?.enableLogging || false,
                  onChange: handleEnableLoggingChange,
                  color: 'primary'
                }),
                label: 'Enable Error Logging'
              }
            )
          ),
          
          // Log File Actions
          settings.application?.enableLogging && React.createElement(
            Box,
            { sx: { display: 'flex', gap: 2, alignItems: 'center' } },
            React.createElement(
              Button,
              {
                variant: 'outlined',
                size: 'small',
                startIcon: React.createElement(DescriptionIcon),
                onClick: handleOpenLogFile,
                sx: { textTransform: 'none' }
              },
              'Open Log File'
            ),
            React.createElement(
              Button,
              {
                variant: 'outlined',
                size: 'small',
                color: 'error',
                startIcon: React.createElement(DeleteIcon),
                onClick: handleClearLogFile,
                sx: { textTransform: 'none' }
              },
              'Clear Logs'
            )
          ),
          
          // Log File Path
          settings.application?.enableLogging && logFilePath && React.createElement(
            Box,
            { sx: { mt: 2 } },
            React.createElement(
              Typography,
              { variant: 'caption', color: 'text.secondary', sx: { wordBreak: 'break-all' } },
              `Log file location: ${logFilePath}`
            )
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