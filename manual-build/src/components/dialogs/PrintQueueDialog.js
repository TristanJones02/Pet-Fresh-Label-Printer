const React = require('react');
const { useState, useEffect } = React;
const { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Typography, Box, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Chip, Tooltip
} = require('@mui/material');
const CloseIcon = require('@mui/icons-material/Close').default;
const PrintIcon = require('@mui/icons-material/Print').default;
const RefreshIcon = require('@mui/icons-material/Refresh').default;
const ErrorIcon = require('@mui/icons-material/Error').default;
const CheckCircleIcon = require('@mui/icons-material/CheckCircle').default;
const HourglassEmptyIcon = require('@mui/icons-material/HourglassEmpty').default;
const CancelIcon = require('@mui/icons-material/Cancel').default;

function PrintQueueDialog({ open, onClose }) {
  const [printJobs, setPrintJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load print jobs when dialog opens
  useEffect(() => {
    if (open) {
      fetchPrintJobs();
    }
  }, [open]);

  // Fetch print jobs from main process
  const fetchPrintJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobs = await window.api.getPrintJobs();
      setPrintJobs(jobs || []);
    } catch (err) {
      console.error("Error fetching print jobs:", err);
      setError("Failed to load print jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status chip based on job status
  const getStatusChip = (status) => {
    let color = "default";
    let icon = null;
    let label = status || "Unknown";

    switch (status?.toLowerCase()) {
      case "pending":
        color = "warning";
        icon = <HourglassEmptyIcon fontSize="small" />;
        label = "Pending";
        break;
      case "printing":
        color = "primary";
        icon = <PrintIcon fontSize="small" />;
        label = "Printing";
        break;
      case "completed":
        color = "success";
        icon = <CheckCircleIcon fontSize="small" />;
        label = "Completed";
        break;
      case "error":
        color = "error";
        icon = <ErrorIcon fontSize="small" />;
        label = "Error";
        break;
      case "cancelled":
        color = "default";
        icon = <CancelIcon fontSize="small" />;
        label = "Cancelled";
        break;
      default:
        color = "default";
        label = status || "Unknown";
    }

    return (
      <Chip 
        icon={icon} 
        label={label} 
        size="small" 
        color={color} 
        variant="outlined"
      />
    );
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchPrintJobs();
  };

  // Handle reset print spooler
  const handleResetSpooler = async () => {
    try {
      setLoading(true);
      await window.api.resetPrintSpooler();
      // Refresh the print jobs list after reset
      fetchPrintJobs();
    } catch (err) {
      console.error("Error resetting print spooler:", err);
      setError("Failed to reset print spooler. Please try again.");
      setLoading(false);
    }
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
        { display: 'flex', alignItems: 'center' },
        React.createElement(PrintIcon, { sx: { mr: 1.5 } }),
        React.createElement(Typography, { variant: 'h6', fontWeight: 'bold' }, 'Print Queue')
      ),
      React.createElement(
        IconButton,
        { onClick: handleClose, size: 'medium', sx: { color: 'white' } },
        React.createElement(CloseIcon)
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
      'aria-labelledby': 'print-queue-dialog-title',
      'aria-describedby': 'print-queue-dialog-description'
    },
    dialogTitle,
    React.createElement(
      DialogContent,
      { 
        dividers: true, 
        sx: { 
          p: 3,
          height: '500px', // Fixed height for scrollability
          display: 'flex',
          flexDirection: 'column'
        } 
      },
      // Error message if any
      error && React.createElement(
        Box,
        { sx: { mb: 2 } },
        React.createElement(
          Paper,
          { 
            variant: 'outlined',
            sx: { 
              p: 2, 
              bgcolor: '#FFEBEE',
              borderColor: '#FFCDD2',
              color: '#B71C1C' 
            } 
          },
          React.createElement(Typography, { variant: 'body2' }, error)
        )
      ),
      
      // Print Jobs Table
      React.createElement(
        TableContainer,
        { 
          component: Paper,
          variant: 'outlined',
          sx: { flexGrow: 1, overflowY: 'auto', mb: 2 }
        },
        React.createElement(
          Table,
          { stickyHeader: true, size: 'small' },
          // Table Header
          React.createElement(
            TableHead,
            {},
            React.createElement(
              TableRow,
              {},
              React.createElement(TableCell, { sx: { fontWeight: 'bold' } }, 'Date/Time'),
              React.createElement(TableCell, { sx: { fontWeight: 'bold' } }, 'Product Name'),
              React.createElement(TableCell, { sx: { fontWeight: 'bold' } }, 'SKU'),
              React.createElement(TableCell, { sx: { fontWeight: 'bold', width: '80px' } }, 'Qty'),
              React.createElement(TableCell, { sx: { fontWeight: 'bold' } }, 'Status'),
              React.createElement(TableCell, { sx: { fontWeight: 'bold' } }, 'Job ID')
            )
          ),
          // Table Body
          React.createElement(
            TableBody,
            {},
            loading ? (
              // Loading state
              React.createElement(
                TableRow,
                {},
                React.createElement(
                  TableCell,
                  { colSpan: 6, align: 'center', sx: { py: 4 } },
                  React.createElement(
                    Box,
                    { display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
                    React.createElement(CircularProgress, { size: 40, sx: { mb: 2 } }),
                    React.createElement(Typography, { variant: 'body2', color: 'text.secondary' }, 'Loading print jobs...')
                  )
                )
              )
            ) : printJobs.length === 0 ? (
              // Empty state
              React.createElement(
                TableRow,
                {},
                React.createElement(
                  TableCell,
                  { colSpan: 6, align: 'center', sx: { py: 4 } },
                  React.createElement(
                    Box,
                    { display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
                    React.createElement(Typography, { variant: 'body1' }, 'No print jobs found'),
                    React.createElement(Typography, { variant: 'body2', color: 'text.secondary', mt: 1 }, 'Print jobs will appear here when you send labels to print')
                  )
                )
              )
            ) : (
              // Print jobs list
              printJobs.map((job) => React.createElement(
                TableRow,
                { 
                  key: job.id,
                  sx: { 
                    '&:last-child td, &:last-child th': { border: 0 },
                    bgcolor: job.status === 'error' ? '#FFEBEE' : 'inherit'
                  }
                },
                React.createElement(TableCell, {}, formatDate(job.timestamp)),
                React.createElement(TableCell, {}, 
                  React.createElement(Tooltip, { title: job.productDetails || '' }, 
                    React.createElement('span', {}, job.productName || 'Unknown')
                  )
                ),
                React.createElement(TableCell, {}, job.sku || 'N/A'),
                React.createElement(TableCell, { align: 'center' }, job.quantity || 1),
                React.createElement(TableCell, {}, getStatusChip(job.status)),
                React.createElement(TableCell, {}, 
                  React.createElement(
                    Tooltip, 
                    { 
                      title: job.logs ? job.logs.join('\n') : 'No logs available',
                      placement: 'left'
                    }, 
                    React.createElement('span', {}, job.id)
                  )
                )
              ))
            )
          )
        )
      ),
      
      // System Status
      React.createElement(
        Paper,
        { 
          variant: 'outlined',
          sx: { p: 2 }
        },
        React.createElement(
          Box,
          { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
          React.createElement(
            Typography,
            { variant: 'body2', color: 'text.secondary' },
            "Last updated: ", formatDate(new Date().toISOString())
          ),
          React.createElement(
            Box,
            { display: 'flex', gap: 1 },
            React.createElement(
              Tooltip,
              { title: 'View in Event Viewer' },
              React.createElement(
                Button,
                { 
                  variant: 'outlined',
                  size: 'small',
                  onClick: () => window.api.runCommand('eventvwr.exe')
                },
                "View Event Logs"
              )
            )
          )
        )
      )
    ),
    React.createElement(
      DialogActions,
      { sx: { px: 3, py: 2 } },
      React.createElement(
        Button, 
        { 
          startIcon: React.createElement(RefreshIcon),
          onClick: handleRefresh, 
          disabled: loading
        }, 
        "Refresh"
      ),
      React.createElement(
        Button, 
        { 
          color: 'error',
          onClick: handleResetSpooler,
          disabled: loading
        }, 
        "Reset Print Spooler"
      ),
      React.createElement(
        Button, 
        { 
          variant: 'contained',
          color: 'primary',
          onClick: handleClose
        }, 
        "Close"
      )
    )
  );
}

module.exports = PrintQueueDialog; 