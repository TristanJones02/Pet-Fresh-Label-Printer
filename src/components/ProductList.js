const React = require('react');
const { 
  Box, 
  Paper,  
  Typography, 
  Grid,
  Card,
  CardContent,
  Divider
} = require('@mui/material');

function ProductList({ products, selectedProduct, onProductSelect }) {
  // Group products by type
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {});
  
  // Get unique product types
  const productTypes = Object.keys(groupedProducts);
  
  const handleProductClick = (product) => {
    onProductSelect(product);
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">
          Products
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        {products.length > 0 ? (
          productTypes.map((type, typeIndex) => (
            <Box key={type} sx={{ mb: 3 }}>
              {/* Only show type header if there are multiple types */}
              {productTypes.length > 1 && (
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 'bold', 
                    borderBottom: '1px solid #e0e0e0',
                    pb: 0.5
                  }}
                >
                  {type}
                </Typography>
              )}
              
              <Grid container spacing={2}>
                {groupedProducts[type].map((product) => (
                  <Grid item xs={6} sm={4} key={product.id}>
                    <Card 
                      elevation={1}
                      onClick={() => handleProductClick(product)}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedProduct && selectedProduct.id === product.id ? '#9ba03b' : 'white',
                        color: selectedProduct && selectedProduct.id === product.id ? 'white' : 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 0.5,
                            color: selectedProduct && selectedProduct.id === product.id ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                          }}
                        >
                          {product.weight} - {product.price}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              No products found. Try a different search or category.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

module.exports = ProductList; 