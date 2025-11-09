import React, { useState, useEffect } from 'react';
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
import HideDepartmentDialog from './dialogs/HideDepartmentDialog';

function ProductList({ products, selectedProduct, onProductSelect, searchTerm, selectedCategory, preferencesUpdateTime, onPreferencesUpdate }) {
  const [userPreferences, setUserPreferences] = useState({ categoryOrder: {}, hiddenDepartments: [] });
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [hideDialog, setHideDialog] = useState({ open: false, departmentName: '' });

  // Load user preferences on mount and when preferences are updated
  useEffect(() => {
    loadPreferences();
  }, []);

  // Reload preferences when they're updated elsewhere
  useEffect(() => {
    if (preferencesUpdateTime) {
      loadPreferences();
    }
  }, [preferencesUpdateTime]);

  const loadPreferences = async () => {
    try {
      const result = await window.api.loadUserPreferences();
      if (result.success) {
        setUserPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences) => {
    try {
      await window.api.saveUserPreferences(newPreferences);
      setUserPreferences(newPreferences);
      // Notify parent that preferences were updated
      if (onPreferencesUpdate) {
        onPreferencesUpdate();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Hide department handlers
  const handleDepartmentLongPress = (departmentName) => {
    const timer = setTimeout(() => {
      setHideDialog({ open: true, departmentName });
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleHideDepartment = (departmentName) => {
    const newHiddenDepartments = [...userPreferences.hiddenDepartments, departmentName];
    const newPreferences = { ...userPreferences, hiddenDepartments: newHiddenDepartments };
    savePreferences(newPreferences);
    setHideDialog({ open: false, departmentName: '' });
  };

  const handleCloseHideDialog = () => {
    setHideDialog({ open: false, departmentName: '' });
  };

  // Group products by departmentName, but filter based on search and category selection
  const groupedProducts = products.reduce((acc, product) => {
    const department = product.departmentName || 'Other';
    
    // When searching, show all products regardless of hidden departments
    // When browsing by category, apply hidden department filter
    if (!searchTerm && userPreferences.hiddenDepartments.includes(department)) {
      return acc; // Skip hidden departments when not searching
    }
    
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(product);
    return acc;
  }, {});
  
  // Get unique product types (departments)
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
      return 'All Products';
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
            <Box key={type} sx={{ mb: 2 }}>
              {/* Only show type header if there are multiple types */}
              {productTypes.length > 1 && (
                <Typography 
                  variant="subtitle1" 
                  onMouseDown={() => handleDepartmentLongPress(type)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  sx={{ 
                    mb: 1, 
                    fontWeight: 'bold', 
                    borderBottom: '1px solid #e0e0e0',
                    pb: 0.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1
                    }
                  }}
                >
                  {type}
                </Typography>
              )}
              
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                  width: '100%'
                }}
              >
                {groupedProducts[type].map((product) => (
                  <Box 
                    key={product.id}
                    sx={{ 
                      display: 'flex',
                      width: '100%'
                    }}
                  >
                    <Card 
                      elevation={2}
                      onClick={() => handleProductClick(product)}
                      sx={{ 
                        cursor: 'pointer',
                        height: '100%',
                        width: '100%',
                        flex: 1,
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
                          {product.productname}
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
                            ${(product.productprice / 100).toFixed(2)}
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: 0.5,
                              backgroundColor: 'black',
                              color: 'white',
                              padding: '0.25em',
                              borderRadius: '5px',
                            }}
                          >
                            <ScaleIcon fontSize="small" />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 'medium',
                              }}
                            >
                              {product.productSize}{product.productUnit}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
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
      <HideDepartmentDialog 
        open={hideDialog.open}
        departmentName={hideDialog.departmentName}
        onClose={handleCloseHideDialog}
        onConfirm={handleHideDepartment}
      />
    </Paper>
  );
}

export default ProductList; 