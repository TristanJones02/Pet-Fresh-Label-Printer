import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid 
} from '@mui/material';

// Import our components
import Header from './Header';
import SearchCategories from './SearchCategories';
import ProductList from './ProductList';
import LabelPreview from './LabelPreview';

function App({ appData, ipcRenderer }) {
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
    // Clear selected product when searching
    setSelectedProduct(null);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    // Clear the selected product when category changes
    setSelectedProduct(null);
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
    
    // Send print request to main process
    if (ipcRenderer) {
      ipcRenderer.send('print-label', labelData);
      
      // Listen for response from main process
      ipcRenderer.once('print-response', (event, response) => {
        if (response.success) {
          // Set printer status back to 'ready' after a delay to simulate printing
          setTimeout(() => {
            setPrinterStatus('ready');
          }, 3000);
        } else {
          setPrinterStatus('error');
        }
      });
    } else {
      console.log('Print label:', labelData);
      // Simulate print response
      setTimeout(() => {
        setPrinterStatus('ready');
      }, 3000);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header 
        printerStatus={printerStatus} 
        version={appData?.version || '0.2.5'} 
      />
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'hidden', 
        display: 'flex',
        p: 3,
        pr: 4 // Add extra padding on the right side
      }}>
        <Grid 
          container 
          spacing={3}
          sx={{ 
            height: '100%',
            flexWrap: 'nowrap'
          }}
        >
          {/* Left Column - Search & Categories (25% width) */}
          <Grid 
            sx={{ 
              height: '100%', 
              width: '25%',
              flexBasis: '25%',
              flexGrow: 0,
              flexShrink: 0,
              px: 1
            }}
          >
            <SearchCategories 
              categories={categories}
              selectedCategory={selectedCategory}
              searchTerm={searchTerm}
              onSearch={handleSearch}
              onCategorySelect={handleCategorySelect}
            />
          </Grid>
          
          {/* Middle Column - Products (50% width) */}
          <Grid 
            sx={{ 
              height: '100%', 
              width: '50%',
              flexBasis: '50%',
              flexGrow: 0,
              flexShrink: 0,
              px: 1
            }}
          >
            <ProductList 
              products={filteredProducts}
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
          </Grid>
          
          {/* Right Column - Label Preview (25% width) */}
          <Grid 
            sx={{ 
              height: '100%', 
              width: '25%',
              flexBasis: '25%',
              flexGrow: 0,
              flexShrink: 0,
              px: 1,
              pr: 2 // Add extra padding on the right
            }}
          >
            <LabelPreview 
              product={selectedProduct}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              onPrintLabel={handlePrintLabel}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default App; 