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
  const [printers, setPrinters] = useState([]);
  const [systemPrinters, setSystemPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [publicIpAddress, setPublicIpAddress] = useState('Fetching...');
  const [privateIpAddress, setPrivateIpAddress] = useState('Fetching...');
  const [allIpAddresses, setAllIpAddresses] = useState([]);
  const [hasZebraPrinter, setHasZebraPrinter] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMessage, setPrintMessage] = useState(null);
  const [showPrintMessage, setShowPrintMessage] = useState(false);
  const [settings, setSettings] = useState({
    printer: {
      defaultPrinter: '',
      showConfirmation: false,
      disableAutomaticPrinting: false
    },
    application: {
      devImageGeneration: false,
      devImagePath: '',
      includeContentOnly: true,
      includeGraphics: false
    }
  });
  const [isZebraPrinterSelected, setIsZebraPrinterSelected] = useState(false);
  const [printerAdjustmentLeft, setPrinterAdjustmentLeft] = useState(0);
  const [printerAdjustmentTop, setPrinterAdjustmentTop] = useState(0);

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettingsAndInitialPrinter();
      getSystemInfo();
      
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

  // Load settings and create initial printer option for previously selected printer
  const loadSettingsAndInitialPrinter = async () => {
    try {
      setLoadingPrinters(true);
      const loadedSettings = await window.api.loadSettings();
      
      // Load label config to get printer adjustment values
      const labelConfig = await window.api.loadLabelConfig();
      
      if (loadedSettings && !loadedSettings.error) {
        setSettings(loadedSettings);
        
        // If there's a previously selected printer, create an initial option for it
        if (loadedSettings.printer.defaultPrinter) {
          const initialPrinter = loadedSettings.printer.defaultPrinter;
          setSelectedPrinter(initialPrinter);
          
          // Create an initial printer list with just the selected printer
          // This allows the UI to show the previously selected printer immediately
          setSystemPrinters([
            { name: initialPrinter, isDefault: true, isLoading: true }
          ]);
        }
      }
      
      // Load printer adjustment values from label config
      if (labelConfig && !labelConfig.error) {
        setPrinterAdjustmentLeft(labelConfig.printerAdjustmentLeft || 0);
        setPrinterAdjustmentTop(labelConfig.printerAdjustmentTop || 0);
      }
      
      // Load the full printer list in the background
      loadSystemPrinters();
    } catch (error) {
      console.error('Error loading settings:', error);
      // Still try to load printers even if settings fail
      loadSystemPrinters();
    }
  };

  // Load installed system printers
  const loadSystemPrinters = async () => {
    try {
      const printerList = await window.api.getPrinters();
      console.log('System printers:', printerList);
      
      // Check if any Zebra printers are installed
      const hasZebra = printerList.some(printer => 
        printer.name.toLowerCase().includes('zebra') || 
        printer.name.toLowerCase().includes('zdesigner')
      );
      setHasZebraPrinter(hasZebra);
      
      // If we have a selected printer that's not in the list, add it
      let updatedPrinterList = [...printerList];
      if (selectedPrinter && !printerList.find(p => p.name === selectedPrinter)) {
        updatedPrinterList.push({
          name: selectedPrinter,
          isDefault: false,
          temporary: true // Mark as temporary so we know it wasn't found on the system
        });
      }
      
      // Update the printer list
      setSystemPrinters(updatedPrinterList);
      
      // If no printer is selected yet, select the default one
      if (!selectedPrinter) {
        const defaultPrinter = printerList.find(p => p.isDefault);
        setSelectedPrinter(defaultPrinter ? defaultPrinter.name : (printerList.length > 0 ? printerList[0].name : ''));
      }
      
      // Check if selected printer is a Zebra printer
      checkIfZebraPrinter(selectedPrinter);
      
      setLoadingPrinters(false);
    } catch (error) {
      console.error('Error loading system printers:', error);
      setLoadingPrinters(false);
      
      // If we have a selected printer but no printers loaded, create a temporary one
      if (selectedPrinter && systemPrinters.length === 0) {
        setSystemPrinters([
          { name: selectedPrinter, isDefault: true, temporary: true }
        ]);
      }
    }
  };

  // Check if the selected printer is a Zebra printer
  const checkIfZebraPrinter = (printerName) => {
    if (!printerName) {
      setIsZebraPrinterSelected(false);
      return;
    }
    
    const isZebra = printerName.toLowerCase().includes('zebra') || 
                   printerName.toLowerCase().includes('zdesigner');
    setIsZebraPrinterSelected(isZebra);
  };

  // Handle printer selection change
  const handlePrinterChange = (event) => {
    const newPrinter = event.target.value;
    setSelectedPrinter(newPrinter);
    checkIfZebraPrinter(newPrinter);
  };
  
  // Run Zebra printer tool command
  const runPrinterCommand = async (command) => {
    try {
      // Show a message that the printer tool is launching
      setPrintMessage({
        text: 'Launching printer tool, please wait...',
        type: 'info'
      });
      setShowPrintMessage(true);
      
      // Replace the printer name in the command
      const finalCommand = command.replace(/ZDesigner ZT230-200dpi/g, selectedPrinter);
      
      // Use the appropriate API method to run the command
      const result = await window.api.runCommand(finalCommand);
      
      if (result.success) {
        // Show success message but keep dialog open
        setPrintMessage({
          text: 'Tool launched successfully!',
          type: 'success'
        });
        setShowPrintMessage(true);
      } else {
        // Show error
        setPrintMessage({
          text: `Error: ${result.error || 'Failed to launch printer tool'}`,
          type: 'error'
        });
        setShowPrintMessage(true);
      }
    } catch (error) {
      console.error('Error running printer command:', error);
      setPrintMessage({
        text: `Error: ${error.message || 'Unknown error running printer command'}`,
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

  // Force re-render when selected printer changes
  useEffect(() => {
    console.log("Selected printer updated:", selectedPrinter);
    // This useEffect is just to ensure the UI updates when selectedPrinter changes
  }, [selectedPrinter]);

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
    // Update settings object
    const updatedSettings = {
      ...settings,
      printer: {
        ...settings.printer,
        defaultPrinter: selectedPrinter
      }
    };
    
    try {
      await window.api.saveSettings(updatedSettings);
      
      // Save printer adjustment values to label config
      const currentConfig = await window.api.loadLabelConfig();
      if (currentConfig && !currentConfig.error) {
        const updatedConfig = {
          ...currentConfig,
          printerAdjustmentLeft: printerAdjustmentLeft,
          printerAdjustmentTop: printerAdjustmentTop
        };
        await window.api.saveLabelConfig(updatedConfig);
      }
      
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

  const handlePrintConfirmationChange = (event) => {
    setSettings({
      ...settings,
      printer: {
        ...settings.printer,
        showConfirmation: event.target.checked
      }
    });
  };

  const handleDisableAutoPrintingChange = (event) => {
    setSettings({
      ...settings,
      printer: {
        ...settings.printer,
        disableAutomaticPrinting: event.target.checked
      }
    });
  };

  const handlePrinterAdjustmentLeftChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setPrinterAdjustmentLeft(value);
  };

  const handlePrinterAdjustmentTopChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setPrinterAdjustmentTop(value);
  };

  const handleRefreshPrinters = async () => {
    setLoadingPrinters(true);
    await loadSystemPrinters();
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
          `Printer: ${selectedPrinter || 'None Selected'} | Time: ${currentTime.toLocaleString()}`
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
      React.createElement(Tab, { icon: React.createElement(SettingsIcon), label: 'Application', id: 'settings-tab-2' })
    )
  );

  // Create Printer Settings Tab
  const printerSettingsTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 0 },
    
    // Zebra Printer Alert
    !hasZebraPrinter && React.createElement(
      Alert,
      { 
        severity: "warning",
        sx: { mb: 3 }
      },
      React.createElement(
        React.Fragment,
        {},
        "A Zebra Label Printer was not found on your system. Please ",
        React.createElement(
          Link,
          { 
            href: "https://www.zebra.com/us/en/support-downloads/printers/desktop/zd420-series.html",
            target: "_blank",
            underline: "hover"
          },
          "click here"
        ),
        " to download the driver - You will need to select your printer model click Downloads and Driver"
      )
    ),
    
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Available Printers'),
    
    // Button row with Refresh and Test Print
    React.createElement(
      Box,
      { sx: { mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 } },
      // Test Print Button
      selectedPrinter && React.createElement(
        Tooltip,
        { title: "Print a test label to verify printer functionality" },
        React.createElement(
          Button,
          { 
            variant: 'outlined',
            onClick: printTestLabel,
            size: 'small',
            startIcon: React.createElement(TestIcon),
            disabled: loadingPrinters || isPrinting || !selectedPrinter,
            color: "secondary"
          },
          isPrinting ? 'Printing...' : 'Test Print'
        )
      ),
      // Refresh Button
      React.createElement(
        Button,
        { 
          variant: 'outlined',
          onClick: handleRefreshPrinters,
          size: 'small',
          startIcon: React.createElement(PrintIcon),
          disabled: loadingPrinters
        },
        loadingPrinters ? 'Refreshing...' : 'Refresh Printers'
      )
    ),
    
    // Printer selection with loading state
    React.createElement(
      Box,
      { sx: { mb: 3 } },
      systemPrinters.length === 0 && !loadingPrinters
        ? React.createElement(Typography, { variant: 'body2', sx: { mb: 2 } }, 'No printers found on your system')
        : React.createElement(
          Box,
          { position: 'relative' },
      React.createElement(
        FormControl,
        { fullWidth: true, variant: 'outlined', size: 'small' },
        React.createElement(InputLabel, { id: 'printer-select-label' }, 'Default Printer'),
        React.createElement(
          Select,
          {
            labelId: 'printer-select-label',
            id: 'printer-select',
            value: selectedPrinter,
                onChange: handlePrinterChange,
                label: 'Default Printer',
                disabled: loadingPrinters
          },
              systemPrinters.map(printer => 
            React.createElement(
              MenuItem,
                  { 
                    key: printer.name, 
                    value: printer.name,
                    disabled: printer.isLoading
                  },
                  `${printer.name} ${printer.isDefault ? ' (System Default)' : ''} ${printer.temporary ? ' (Not Found)' : ''} ${printer.isLoading ? ' (Loading...)' : ''}`
                )
              )
            )
          ),
          loadingPrinters && React.createElement(
            CircularProgress,
            {
              size: 20,
              sx: {
                position: 'absolute',
                top: '50%',
                right: 30,
                marginTop: '-10px'
              }
            }
          )
        )
    ),
    
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Printer Options'),
    React.createElement(
      FormGroup,
      {},
      React.createElement(
        FormControlLabel,
        { 
          control: React.createElement(
            Checkbox, 
            { 
              checked: settings.printer.showConfirmation,
              onChange: handlePrintConfirmationChange 
            }
          ), 
          label: 'Show print confirmation dialog' 
        }
      )
    ),
    
    React.createElement(Typography, { variant: 'h6', gutterBottom: true, sx: { mt: 3 } }, 'Printer Adjustments'),
    React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } }, 'Fine-tune print positioning to account for printer-specific variations. These adjustments only apply to printed output, not the preview.'),
    
    React.createElement(
      Box,
      { sx: { display: 'flex', gap: 2, mb: 2 } },
      React.createElement(
        TextField,
        {
          label: 'Left Adjustment (mm)',
          type: 'number',
          size: 'small',
          value: printerAdjustmentLeft,
          onChange: handlePrinterAdjustmentLeftChange,
          inputProps: { 
            step: 0.5,
            min: -10,
            max: 10
          },
          helperText: 'Positive values move content right',
          sx: { flex: 1 }
        }
      ),
      React.createElement(
        TextField,
        {
          label: 'Top Adjustment (mm)',
          type: 'number',
          size: 'small',
          value: printerAdjustmentTop,
          onChange: handlePrinterAdjustmentTopChange,
          inputProps: { 
            step: 0.5,
            min: -10,
            max: 10
          },
          helperText: 'Positive values move content down',
          sx: { flex: 1 }
        }
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

  // Create Application Settings Tab
  const applicationSettingsTab = React.createElement(
    TabPanel,
    { value: tabValue, index: 2 },
    
    // Printing Options section
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Printing Options'),
    React.createElement(
      Paper,
      { 
        variant: 'outlined',
        sx: { p: 2, mb: 3 }
      },
      // Disable Automatic Printing option
      React.createElement(
        FormControlLabel,
        { 
          control: React.createElement(
            Switch,
            {
              checked: settings.printer.disableAutomaticPrinting,
              onChange: handleDisableAutoPrintingChange
            }
          ), 
          label: React.createElement(
            Typography,
            { variant: 'subtitle1', fontWeight: 'medium' },
            'Disable Automatic Printing'
          )
        }
      ),
      React.createElement(
        Typography,
        { variant: 'body2', color: 'text.secondary', sx: { mt: 1, mb: 2 } },
        'When enabled, a system print dialog will appear instead of sending labels directly to the selected printer. Canceling this dialog will be logged.'
      )
    ),
    
    // Development Image Generation
    React.createElement(Typography, { variant: 'h6', gutterBottom: true, mt: 3 }, 'Development Image Generation'),
    React.createElement(
      Paper,
      { 
        variant: 'outlined',
        sx: { p: 2, mb: 3 }
      },
      React.createElement(
        FormControlLabel,
        { 
          control: React.createElement(
            Switch,
            {
              checked: settings.application.devImageGeneration,
              onChange: handleDevImageGenerationChange
            }
          ), 
          label: React.createElement(
            Typography,
            { variant: 'subtitle1', fontWeight: 'medium' },
            'Enable Development Image Generation'
          )
        }
      ),
      React.createElement(
        Typography,
        { variant: 'body2', color: 'text.secondary', sx: { mt: 1, mb: 2 } },
        'When enabled, high-quality PNG images will be generated instead of PDFs for development purposes.'
      ),
      settings.application.devImageGeneration && React.createElement(
        React.Fragment,
        {},
        React.createElement(
          TextField,
          {
            fullWidth: true,
            label: 'Image Output Directory',
            variant: 'outlined',
            size: 'small',
            value: settings.application.devImagePath,
            onChange: handleDevImagePathChange,
            InputProps: {
              startAdornment: React.createElement(
                InputAdornment,
                { position: 'start' },
                React.createElement(FolderIcon, { fontSize: 'small' })
              ),
            },
            helperText: 'Location where PNG images will be saved',
            sx: { mb: 2 }
          }
        ),
        
        // Content-only option
        React.createElement(
          FormControlLabel,
          { 
            control: React.createElement(
              Checkbox, 
              { 
                checked: settings.application.includeContentOnly,
                onChange: handleContentOnlyChange 
              }
            ), 
            label: 'Include label content only (no borders/margins)'
          }
        ),
        
        // Include graphics option
        React.createElement(
          FormControlLabel,
          { 
            control: React.createElement(
              Checkbox, 
              { 
                checked: settings.application.includeGraphics,
                onChange: handleIncludeGraphicsChange 
              }
            ), 
            label: 'Include graphics overlay in generated images'
          }
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