const React = require('react');
const { useState, useEffect } = React;
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const CssBaseline = require('@mui/material/CssBaseline').default;
const { DialogProvider, useDialogs, DIALOG_TYPES } = require('./dialogs/DialogManager');
const { mockAppData } = require('../mockData');
const mui = require('@mui/material');
const { Box, Grid, Container } = mui;

// Import components - get the default export directly
let Header, SearchCategories, ProductList, LabelPreview;

try {
  Header = require('./Header').default;
  SearchCategories = require('./SearchCategories').default;
  ProductList = require('./ProductList').default;
  LabelPreview = require('./LabelPreview').default;
} catch (err) {
  console.error('Error loading components:', err);
  
  // Fallback to direct imports if default fails
  Header = require('./Header');
  SearchCategories = require('./SearchCategories');
  ProductList = require('./ProductList');
  LabelPreview = require('./LabelPreview');
}

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

// Main App content component - this is the main app display
function MainContent({ appData }) {
  const [categories, setCategories] = useState(appData?.categories || []);
  const [products, setProducts] = useState(appData?.products || []);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printerStatus, setPrinterStatus] = useState(appData?.printerStatus || 'ready');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Filter products based on search term or selected category
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (selectedCategory) {
      filtered = products.filter(product => 
        product.category === selectedCategory.id
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setSelectedCategory(null);
    setSelectedProduct(null); // Clear selected product
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedProduct(null); // Clear the selected product
    setQuantity(1); // Reset quantity
    
    setSelectedCategory(category);
    setSearchTerm('');
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantity(1); // Reset quantity when selecting a new product
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
  };

  // Handle print label
  const handlePrintLabel = () => {
    if (!selectedProduct) return;
    
    // Set printer status to 'printing'
    setPrinterStatus('printing');
    
    // Generate label data
    const labelData = {
      product: selectedProduct,
      quantity: quantity,
      timestamp: new Date().toISOString()
    };
    
    // Simulate print response (we'll use window.api in the future)
    console.log('Print label:', labelData);
    setTimeout(() => {
      setPrinterStatus('ready');
    }, 3000);
  };

  // Create header component
  const headerComponent = React.createElement(
    Header,
    {
      printerStatus: printerStatus,
      version: appData?.version || '0.2.5'
    }
  );
  
  // Create the grid layout
  const gridLayout = React.createElement(
    Grid,
    {
      container: true,
      spacing: 3,
      sx: { 
        height: '100%',
        flexWrap: 'nowrap'
      }
    },
    // Left Column - Search & Categories
    React.createElement(
      Grid,
      {
        item: true,
        sx: { 
          height: '100%', 
          width: '25%',
          flexBasis: '25%',
          flexGrow: 0,
          flexShrink: 0,
          px: 1
        }
      },
      React.createElement(
        SearchCategories,
        {
          categories: categories,
          selectedCategory: selectedCategory,
          searchTerm: searchTerm,
          onSearch: handleSearch,
          onCategorySelect: handleCategorySelect
        }
      )
    ),
    // Middle Column - Products
    React.createElement(
      Grid,
      {
        item: true,
        sx: { 
          height: '100%', 
          width: '50%',
          flexBasis: '50%',
          flexGrow: 0,
          flexShrink: 0,
          px: 1
        }
      },
      React.createElement(
        ProductList,
        {
          products: filteredProducts,
          selectedProduct: selectedProduct,
          onProductSelect: handleProductSelect,
          searchTerm: searchTerm,
          selectedCategory: selectedCategory
        }
      )
    ),
    // Right Column - Label Preview
    React.createElement(
      Grid,
      {
        item: true,
        sx: { 
          height: '100%', 
          width: '25%',
          flexBasis: '25%',
          flexGrow: 0,
          flexShrink: 0,
          px: 1,
          pr: 2
        }
      },
      React.createElement(
        LabelPreview,
        {
          product: selectedProduct,
          quantity: quantity,
          onQuantityChange: handleQuantityChange,
          onPrintLabel: handlePrintLabel
        }
      )
    )
  );

  // Create content box
  const contentBox = React.createElement(
    Box,
    {
      sx: { 
        flexGrow: 1, 
        overflow: 'hidden', 
        display: 'flex',
        p: 3,
        pr: 4
      }
    },
    gridLayout
  );

  // Main container
  return React.createElement(
    Box, 
    { 
      sx: { 
        flexGrow: 1, 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      } 
    },
    headerComponent,
    contentBox
  );
}

// App wrapper that uses dialogs
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
  
  return React.createElement(MainContent, { appData: mockAppData });
}

// Root App component
const App = () => {
  return React.createElement(
    ThemeProvider,
    { theme: lightTheme },
    React.createElement(CssBaseline),
    React.createElement(
      DialogProvider,
      null,
      React.createElement(AppWrapper)
    )
  );
};

// Use both CommonJS and ESM exports for maximum compatibility
module.exports = App;
module.exports.default = App; 