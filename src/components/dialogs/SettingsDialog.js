const React = require('react');
const { useState, useEffect } = React;
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, Tab, Tabs,
  List, ListItem, ListItemIcon, ListItemText, Switch,
  Divider, TextField, FormControl, InputLabel, Select,
  MenuItem, FormGroup, FormControlLabel, Checkbox,
  InputAdornment, Paper
} = require('@mui/material');
const CloseIcon = require('@mui/icons-material/Close').default;
const PrintIcon = require('@mui/icons-material/Print').default;
const SettingsIcon = require('@mui/icons-material/Settings').default;
const ImageIcon = require('@mui/icons-material/Image').default;
const FolderIcon = require('@mui/icons-material/Folder').default;
const InfoIcon = require('@mui/icons-material/Info').default;
const RouterIcon = require('@mui/icons-material/Router').default;
const AccessTimeIcon = require('@mui/icons-material/AccessTime').default;

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
  const [printers, setPrinters] = useState([
    { name: 'KITCHEN', isDefault: true },
    { name: 'OFFICE', isDefault: false },
    { name: 'PACKAGING', isDefault: false }
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState('KITCHEN');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [publicIpAddress, setPublicIpAddress] = useState('Fetching...');
  const [privateIpAddress, setPrivateIpAddress] = useState('Fetching...');
  const [allIpAddresses, setAllIpAddresses] = useState([]);
  const [settings, setSettings] = useState({
    printer: {
      defaultPrinter: 'KITCHEN',
      showConfirmation: false
    },
    application: {
      devImageGeneration: false,
      devImagePath: '',
      includeContentOnly: true,
      includeGraphics: false
    }
  });

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
      getSystemInfo();
    }
  }, [open]);

  // Update clock every second
  useEffect(() => {
    if (open) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.api.loadSettings();
      if (loadedSettings && !loadedSettings.error) {
        setSettings(loadedSettings);
        setSelectedPrinter(loadedSettings.printer.defaultPrinter);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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
      React.createElement(Typography, { variant: 'h6', fontWeight: 'bold' }, 'Settings'),
      React.createElement(
        IconButton,
        { onClick: handleClose, size: 'medium', sx: { color: 'white' } },
        React.createElement(CloseIcon)
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
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Available Printers'),
    React.createElement(
      Box,
      { sx: { mb: 3 } },
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
            onChange: (e) => setSelectedPrinter(e.target.value),
            label: 'Default Printer'
          },
          printers.map(printer => 
            React.createElement(
              MenuItem,
              { key: printer.name, value: printer.name },
              `${printer.name} ${printer.isDefault ? ' (Default)' : ''}`
            )
          )
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
    React.createElement(Typography, { variant: 'h6', gutterBottom: true }, 'Development Image Generation'),
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

  // Create dialog actions
  const dialogActions = React.createElement(
    DialogActions,
    { sx: { p: 2, justifyContent: 'space-between' } },
    React.createElement(
      Button,
      { onClick: handleClose, variant: 'text', color: 'inherit' },
      'Cancel'
    ),
    React.createElement(
      Button,
      { 
        onClick: handleSave, 
        variant: 'contained', 
        color: 'primary',
        sx: { px: 3 }
      },
      'Save Changes'
    )
  );

  // Return the complete dialog
  return React.createElement(
    Dialog,
    {
      open,
      onClose: handleClose,
      fullWidth: true,
      maxWidth: 'md',
      TransitionProps: {
        timeout: 250
      },
      PaperProps: {
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }
    },
    dialogTitle,
    tabsComponent,
    React.createElement(
      DialogContent,
      { dividers: true, sx: { p: 3 } },
      printerSettingsTab,
      systemInfoTab,
      applicationSettingsTab
    ),
    dialogActions
  );
}

module.exports = SettingsDialog; 