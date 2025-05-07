import React from 'react';
import { 
  Box, 
  Paper,  
  Typography, 
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import ScaleIcon from '@mui/icons-material/Scale';

function ProductList({ products, selectedProduct, onProductSelect, searchTerm, selectedCategory }) {
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
  
  // Determine the header text based on context
  const getHeaderText = () => {
    if (searchTerm) {
      return `RESULTS: ${searchTerm}`;
    } else if (selectedCategory) {
      return selectedCategory.name;
    } else {
      return 'Products';
    }
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
          {getHeaderText()}
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
                  <Grid 
                    key={product.id}
                    sx={{ 
                      width: '33.33%',
                      padding: 1
                    }}
                  >
                    <Card 
                      elevation={2}
                      onClick={() => handleProductClick(product)}
                      sx={{ 
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: selectedProduct && selectedProduct.id === product.id ? '#9ba03b' : 'white',
                        color: selectedProduct && selectedProduct.id === product.id ? 'white' : 'inherit',
                        transition: 'all 0.2s ease',
                        border: selectedProduct && selectedProduct.id === product.id 
                          ? '2px solid #7a7e2e' 
                          : '1px solid #e0e0e0',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                          borderColor: selectedProduct && selectedProduct.id === product.id 
                            ? '#7a7e2e' 
                            : '#9ba03b',
                        },
                        minHeight: '130px', // Increased for larger content
                      }}
                    >
                      <CardContent sx={{ 
                        p: 2, 
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1.5,
                            fontSize: '1.3rem', // Increased from 1.1rem
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            textOverflow: 'ellipsis',
                            height: '2.4em'
                          }}
                        >
                          {product.name}
                        </Typography>
                        
                        {/* Price and Weight on same line with icon for weight only */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 2,
                            color: selectedProduct && selectedProduct.id === product.id ? 'rgba(255,255,255,0.9)' : 'text.secondary'
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 'medium',
                            }}
                          >
                            {product.price}
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <ScaleIcon fontSize="small" />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 'medium',
                              }}
                            >
                              {product.weight}
                            </Typography>
                          </Box>
                        </Box>
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

export default ProductList; 