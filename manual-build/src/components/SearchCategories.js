import React from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton,
  Typography, 
  Divider,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

function SearchCategories({ categories, selectedCategory, searchTerm, onSearch, onCategorySelect }) {
  const handleSearchChange = (event) => {
    onSearch(event.target.value);
  };
  
  const handleCategoryClick = (category) => {
    if (selectedCategory && selectedCategory.id === category.id) {
      // If already selected, deselect it
      onCategorySelect(null);
    } else {
      onCategorySelect(category);
    }
  };
  
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        overflowX: 'hidden',
      }}
    >
      {/* Search Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', overflowX: 'hidden' }}>
        <Typography variant="h6" gutterBottom>
          Search
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            ),
          }}
          size="small"
        />
      </Box>
      
      {/* Category List */}
      <List 
        className="category-list"
        sx={{ 
          paddingTop:'0px',
          flexGrow: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          // Hide vertical scrollbar for Webkit browsers
          '&::-webkit-scrollbar': {
            width: 0,
            background: 'transparent',
          },
          // Hide vertical scrollbar for Firefox
          scrollbarWidth: 'none',
          // Hide vertical scrollbar for IE/Edge
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((category) => (
          <ListItemButton 
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            selected={selectedCategory && selectedCategory.id === category.id}
            sx={{ 
              position: 'relative',
              backgroundColor: category.color, // Keep original color always
              color: 'white',
              padding: '15px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              marginBottom: '2px',
              cursor: 'pointer',
              clipPath: selectedCategory && selectedCategory.id === category.id 
                ? 'polygon(0 0, calc(100% - 30px) 0, 100% 50%, calc(100% - 30px) 100%, 0 100%)'
                : 'none',
              '&:hover': {
                backgroundColor: category.color, // Override default hover background
                filter: 'brightness(1.1)', // Just add slight brightness on hover
              },
              '&.Mui-selected': {
                backgroundColor: category.color, // Keep the same background when selected
              },
              '&.Mui-selected:hover': {
                backgroundColor: category.color, // Keep the same background when selected and hovered
                filter: 'brightness(1.1)', // Just add slight brightness on hover
              },
              '&::after': selectedCategory && selectedCategory.id === category.id ? {
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                width: 0,
                height: 0,
                borderTop: '25px solid white',
                borderLeft: '15px solid transparent',
                transform: 'translateY(0)'
              } : {}
            }}
          >
            <ListItemText 
              primary={category.name} 
              sx={{ 
                textAlign: 'center',
                '& .MuiTypography-root': {
                  fontWeight: 'bold',
                  fontSize: '18px'
                }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}

export default SearchCategories; 