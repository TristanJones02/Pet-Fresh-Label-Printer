const React = require('react');
const { useState, useEffect, useCallback } = React;
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const CssBaseline = require('@mui/material/CssBaseline').default;
const { DialogProvider, useDialogs, DIALOG_TYPES } = require('./dialogs/DialogManager');
const ProductValidationDialog = require('./dialogs/ProductValidationDialog');
const ApiErrorDialog = require('./dialogs/ApiErrorDialog');
const mui = require('@mui/material');
const { Box, Grid, Container, Typography } = mui;

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
function MainContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [printerStatus, setPrinterStatus] = useState('ready');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [appVersion, setAppVersion] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showNotification, setShowNotification] = useState(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationProduct, setValidationProduct] = useState(null);
  const [apiErrorDialogOpen, setApiErrorDialogOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      // Get app version
      if (window.api?.getAppVersion) {
        try {
          const version = await window.api.getAppVersion();
          setAppVersion(version);
        } catch (error) {
          console.error('Error fetching app version:', error);
        }
      }
      
      // Load product data
      await loadProductData();
      
      setIsLoading(false);
    };
    
    loadInitialData();
  }, []); // Remove dependency to prevent infinite re-renders

  // Memoize the fetchFromApi function to avoid dependency issues
  const fetchFromApi = useCallback(async () => {
    try {
      const result = await window.api.productDataRefetchAll();
      if (result.success && result.data) {
        setProducts(result.data.products || []);
        setCategories(result.data.scaleCategories || result.data.categories || []);
        console.log(`Loaded ${result.data.products?.length || 0} products and ${(result.data.scaleCategories || result.data.categories || []).length} categories from API`);
        if (result.data.products?.length > 0) {
          console.log('Sample API product data:', result.data.products[0]);
        }
      } else if (result.isApiError) {
        // Handle API error with reference
        setApiError(result);
        setApiErrorDialogOpen(true);
      } else {
        console.error('Failed to fetch from API:', result.error);
        if (showNotification) {
          showNotification(false, 'Failed to fetch product data', result.error);
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
      if (showNotification) {
        showNotification(false, 'Failed to fetch product data', error.message);
      }
    }
  }, [showNotification]);

  // Load product data from the service
  const loadProductData = useCallback(async () => {
    try {
      // Get local data first
      const localResult = await window.api.productDataGetLocal();
      if (localResult.success && localResult.data) {
        const localData = localResult.data;
        
        if (localData.products?.length > 0) {
          setProducts(localData.products);
          console.log(`Loaded ${localData.products.length} products from local cache`);
          console.log('Sample product data:', localData.products[0]);
        }
        
        if (localData.scaleCategories?.length > 0) {
          setCategories(localData.scaleCategories);
          console.log(`Loaded ${localData.scaleCategories.length} categories from local cache`);
        } else if (localData.categories?.length > 0) {
          setCategories(localData.categories);
          console.log(`Loaded ${localData.categories.length} categories from local cache`);
        }
        
        // If no local data, try to fetch from API
        if (localData.products?.length === 0) {
          console.log('No local product data found, attempting to fetch from API...');
          await fetchFromApi();
          // Note: fetchFromApi will update the state, so no need to set it again here
        }
      } else {
        // No local data, try to fetch from API
        await fetchFromApi();
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      if (showNotification) {
        showNotification(false, 'Failed to load product data', error.message);
      }
    }
  }, [fetchFromApi, showNotification]);

  // Filter products based on search term or selected category
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = products.filter(product => 
        (product.productname || product.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (selectedCategory) {
      filtered = products.filter(product => 
        // Check if product has scaleCategoryIds that include the selected category ID
        (product.scaleCategoryIds && product.scaleCategoryIds.includes(selectedCategory.id)) ||
        // Fallback to name-based matching for backwards compatibility
        product.category === selectedCategory.name || product.type === selectedCategory.name
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  // Handle search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setSelectedCategory(null);
    setSelectedProduct(null); // Clear selected product
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((category) => {
    setSelectedProduct(null); // Clear the selected product
    setQuantity(1); // Reset quantity
    
    setSelectedCategory(category);
    setSearchTerm('');
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setQuantity(1); // Reset quantity when selecting a new product
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(newQuantity);
  }, []);

  // Validate product before printing
  const validateProduct = useCallback(async (product) => {
    try {
      const result = await window.api.productDataGetProductsWithValidation();
      if (result.success) {
        const validatedProduct = result.data.find(p => p.id === product.id || p.sku === product.sku);
        if (validatedProduct && validatedProduct.hasValidationIssues) {
          return validatedProduct;
        }
      }
      return null;
    } catch (error) {
      console.error('Error validating product:', error);
      return null;
    }
  }, []);

  // Handle sync request from validation dialog
  const handleSyncRequest = useCallback(async () => {
    try {
      const result = await window.api.productDataSyncLatest();
      if (result.success) {
        // Reload the product data
        await loadProductData();
        if (showNotification) {
          showNotification(true, 'Product data synchronized successfully');
        }
      } else if (result.isApiError) {
        setApiError(result);
        setApiErrorDialogOpen(true);
      } else {
        if (showNotification) {
          showNotification(false, 'Failed to sync product data', result.error);
        }
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      if (showNotification) {
        showNotification(false, 'Failed to sync product data', error.message);
      }
    }
  }, [showNotification, loadProductData]);

  // Handle print label - this will be called by LabelPreview
  const handlePrintLabel = useCallback(async (product, printQuantity) => {
    if (!product) return;
    
    // Validate product before printing
    const validationIssues = await validateProduct(product);
    if (validationIssues) {
      setValidationProduct(validationIssues);
      setValidationDialogOpen(true);
      return;
    }
    
    // Set printer status to 'printing'
    setPrinterStatus('printing');
    
    try {
      // Use the new ZPL printing system
      if (window.api?.printZplLabel) {
        console.log(`Printing ${printQuantity} ZPL label(s) for ${product.productname || product.name}`);
        
        const result = await window.api.printZplLabel(product, {
          quantity: printQuantity,
          templateName: 'label_template'
        });
        
        if (result.success) {
          console.log('Print job completed successfully:', result);
          // Use Header's notification system
          if (showNotification) {
            showNotification(true, product.productname || product.name);
          }
        } else {
          console.error('Print job failed:', result.error);
          // Use Header's notification system
          if (showNotification) {
            showNotification(false, product.productname || product.name, result.error);
          }
        }
      } else {
        // Fallback - simulate print response
        console.log('ZPL Print API not available - simulating print');
        setTimeout(() => {
          if (showNotification) {
            showNotification(true, product.productname || product.name);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Print error:', error);
      if (showNotification) {
        showNotification(false, product.productname || product.name, error.message);
      }
    } finally {
      setPrinterStatus('ready');
    }
  }, [showNotification, validateProduct]);

  // Create stable notification handler to avoid infinite re-renders
  const handleShowNotification = useCallback((notificationFunc) => {
    setShowNotification(() => notificationFunc);
  }, []);

  // Create header component
  const headerComponent = React.createElement(
    Header,
    {
      printerStatus: printerStatus,
      version: appVersion,
      onShowNotification: handleShowNotification,
      selectedProduct: selectedProduct
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
    contentBox,
    React.createElement(
      ProductValidationDialog,
      {
        open: validationDialogOpen,
        onClose: () => {
          setValidationDialogOpen(false);
          setValidationProduct(null);
        },
        product: validationProduct,
        onSyncRequested: handleSyncRequest
      }
    ),
    React.createElement(
      ApiErrorDialog,
      {
        open: apiErrorDialogOpen,
        onClose: () => {
          setApiErrorDialogOpen(false);
          setApiError(null);
        },
        error: apiError
      }
    )
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
  
  return React.createElement(MainContent);
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