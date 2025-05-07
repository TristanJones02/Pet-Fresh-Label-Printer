import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, Tab, Tabs,
  List, ListItem, ListItemIcon, ListItemText, Switch,
  Divider, TextField, FormControl, InputLabel, Select,
  MenuItem, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/Settings';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';

// TabPanel component to handle tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ padding: '16px 0' }}
      {...other}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

export default function SettingsDialog({ open, onClose }) {
  const [tabValue, setTabValue] = useState(0);
  const [printers, setPrinters] = useState([
    { name: 'KITCHEN', isDefault: true },
    { name: 'OFFICE', isDefault: false },
    { name: 'PACKAGING', isDefault: false }
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState('KITCHEN');
  const [darkMode, setDarkMode] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    // Save settings here if needed
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      TransitionProps={{
        timeout: 250 // Animation duration in ms
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: '#9ba03b',
        color: 'white',
        px: 3,
        py: 2
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">Settings</Typography>
          <IconButton onClick={handleClose} size="medium" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="fullWidth"
          sx={{ 
            '& .MuiTab-root': { 
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 2,
            }
          }}
        >
          <Tab icon={<PrintIcon />} label="Printers" id="settings-tab-0" />
          <Tab icon={<LabelIcon />} label="Label Options" id="settings-tab-1" />
          <Tab icon={<SettingsIcon />} label="Application" id="settings-tab-2" />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Printer Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Available Printers</Typography>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="printer-select-label">Default Printer</InputLabel>
              <Select
                labelId="printer-select-label"
                id="printer-select"
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                label="Default Printer"
              >
                {printers.map((printer) => (
                  <MenuItem key={printer.name} value={printer.name}>
                    {printer.name} {printer.isDefault && ' (Default)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Typography variant="h6" gutterBottom>Printer Settings</Typography>
          <FormGroup>
            <FormControlLabel 
              control={<Checkbox defaultChecked />} 
              label="Enable printer status monitoring" 
            />
            <FormControlLabel 
              control={<Checkbox defaultChecked />} 
              label="Show print confirmation dialog" 
            />
          </FormGroup>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<PrintIcon />}
            >
              Test Print
            </Button>
          </Box>
        </TabPanel>

        {/* Label Options Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Label Size</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Width (mm)"
              type="number"
              defaultValue={60}
              variant="outlined"
              size="small"
              InputProps={{ inputProps: { min: 10, max: 200 } }}
            />
            <TextField
              label="Height (mm)"
              type="number"
              defaultValue={162}
              variant="outlined"
              size="small"
              InputProps={{ inputProps: { min: 10, max: 400 } }}
            />
          </Box>
          
          <Typography variant="h6" gutterBottom>Label Content</Typography>
          <FormGroup>
            <FormControlLabel 
              control={<Checkbox defaultChecked />} 
              label="Show company logo" 
            />
            <FormControlLabel 
              control={<Checkbox defaultChecked />} 
              label="Include barcode" 
            />
            <FormControlLabel 
              control={<Checkbox defaultChecked />} 
              label="Show expiry date" 
            />
          </FormGroup>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.api.openLabelEditor?.()}
            >
              Open Label Editor
            </Button>
          </Box>
        </TabPanel>

        {/* Application Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>General Settings</Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <BrightnessAutoIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dark Mode" 
                secondary="Switch between light and dark theme"
              />
              <Switch
                edge="end"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemText 
                primary="Application Version" 
                secondary="v0.2.5"
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
            </ListItem>
          </List>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleClose} variant="text" color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleClose} 
          variant="contained" 
          color="primary"
          sx={{ px: 3 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
} 