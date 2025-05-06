const React = require('react');
const { 
  Box, 
  Paper, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Divider,
  IconButton
} = require('@mui/material');
const {
  Search: SearchIcon,
  ExpandMore: ExpandMoreIcon,
  ExpandLess: ExpandLessIcon
} = require('@mui/icons-material');

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
        overflow: 'hidden'
      }}
    >
      {/* Search Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
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
      
      {/* Categories Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          Categories
        </Typography>
      </Box>
      
      {/* Category List */}
      <List 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
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
        {categories.map((category) => (
          <ListItem 
            key={category.id}
            button
            onClick={() => handleCategoryClick(category)}
            selected={selectedCategory && selectedCategory.id === category.id}
            sx={{ 
              borderLeft: `4px solid ${category.color}`,
              backgroundColor: selectedCategory && selectedCategory.id === category.id ? `${category.color}20` : 'transparent',
              '&:hover': {
                backgroundColor: `${category.color}10`,
              },
            }}
          >
            <ListItemText primary={category.name} />
            {selectedCategory && selectedCategory.id === category.id ? (
              <ExpandMoreIcon />
            ) : (
              <ExpandLessIcon sx={{ opacity: 0.5 }} />
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

module.exports = SearchCategories; 