const React = require('react');
const { useState, useEffect } = React;
const { 
  Box, 
  Container, 
  Grid 
} = require('@mui/material');

// Import our components
const Header = require('./Header');
const SearchCategories = require('./SearchCategories');
const ProductList = require('./ProductList');
const LabelPreview = require('./LabelPreview');

function App({ appData, ipcRenderer }) {
  const [categories, setCategories] = useState(appData.categories);
  const [products, setProducts] = useState(appData.products);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printerStatus, setPrinterStatus] = useState(appData.printerStatus);
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
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
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
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        printerStatus={printerStatus} 
        version={appData.version} 
      />
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        <Container maxWidth={false} sx={{ mt: 2, mb: 2, display: 'flex', flexGrow: 1 }}>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {/* Left Column - Search & Categories (25% width) */}
            <Grid item xs={3}>
              <SearchCategories 
                categories={categories}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                onSearch={handleSearch}
                onCategorySelect={handleCategorySelect}
              />
            </Grid>
            
            {/* Middle Column - Products (50% width) */}
            <Grid item xs={6}>
              <ProductList 
                products={filteredProducts}
                selectedProduct={selectedProduct}
                onProductSelect={handleProductSelect}
              />
            </Grid>
            
            {/* Right Column - Label Preview (25% width) */}
            <Grid item xs={3}>
              <LabelPreview 
                product={selectedProduct}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onPrintLabel={handlePrintLabel}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

module.exports = App; 