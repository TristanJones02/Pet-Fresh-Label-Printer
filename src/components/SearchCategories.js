import React, { useState, useEffect, useRef } from 'react';
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
  const [userPreferences, setUserPreferences] = useState({ categoryOrder: {}, hiddenDepartments: [] });
  const [orderedCategories, setOrderedCategories] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [previewOrder, setPreviewOrder] = useState([]);
  const [dropZoneIndex, setDropZoneIndex] = useState(null);
  const dragCounter = useRef(0);
  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update ordered categories when categories or preferences change
  useEffect(() => {
    updateOrderedCategories();
  }, [categories, userPreferences]);

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
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const updateOrderedCategories = () => {
    if (!categories?.length) {
      setOrderedCategories([]);
      return;
    }

    // Filter out hidden departments
    const visibleCategories = categories.filter(cat => 
      !userPreferences.hiddenDepartments.includes(cat.name || cat.categoryName)
    );

    // Sort categories based on saved order
    const orderedCats = [...visibleCategories].sort((a, b) => {
      const aOrder = userPreferences.categoryOrder[a.id] ?? 999;
      const bOrder = userPreferences.categoryOrder[b.id] ?? 999;
      return aOrder - bOrder;
    });

    setOrderedCategories(orderedCats);
  };

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

  // Long press handlers for drag
  const handleMouseDown = (index) => {
    const timer = setTimeout(() => {
      // Enable dragging after long press
      console.log('Long press detected, enabling drag for index:', index);
    }, 800); // 800ms long press to enable drag
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // Reset drag states when mouse is released
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropZoneIndex(null);
    setPreviewOrder([]);
  };

  // Handle drag end (when drag is cancelled without drop)
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropZoneIndex(null);
    setPreviewOrder([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    console.log('Drag start for index:', index);
    setDraggedIndex(index);
    setPreviewOrder([...orderedCategories]); // Initialize preview with current order
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
      setDropZoneIndex(index);
      
      // Create real-time preview by calculating insertion point
      const currentPreview = previewOrder.length > 0 ? previewOrder : orderedCategories;
      const newPreviewOrder = [...currentPreview];
      
      // Find the dragged item in the current preview
      const draggedCategory = orderedCategories[draggedIndex];
      const draggedPreviewIndex = newPreviewOrder.findIndex(cat => cat.id === draggedCategory.id);
      
      // Remove it from its current position in preview
      if (draggedPreviewIndex !== -1) {
        newPreviewOrder.splice(draggedPreviewIndex, 1);
      }
      
      // Insert at the new position
      newPreviewOrder.splice(index, 0, draggedCategory);
      setPreviewOrder(newPreviewOrder);
    }
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
      setDropZoneIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    console.log('Drop: source =', sourceIndex, 'target =', targetIndex);

    if (sourceIndex === targetIndex || isNaN(sourceIndex)) {
      setDraggedIndex(null);
      return;
    }

    // Reorder categories
    const newOrder = [...orderedCategories];
    const draggedCategory = newOrder[sourceIndex];
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCategory);

    // Update category order in preferences
    const newCategoryOrder = { ...userPreferences.categoryOrder };
    newOrder.forEach((category, index) => {
      newCategoryOrder[category.id] = index;
    });

    console.log('New category order:', newCategoryOrder);
    const newPreferences = { ...userPreferences, categoryOrder: newCategoryOrder };
    savePreferences(newPreferences);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropZoneIndex(null);
    setPreviewOrder([]);
  };

  // Remove hide department handlers - these will be moved to ProductList
  
  
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
        {(previewOrder.length > 0 ? previewOrder : orderedCategories).map((category, index) => {
          // Find the original index for drag handlers
          const originalIndex = orderedCategories.findIndex(cat => cat.id === category.id);
          const isBeingDragged = draggedIndex === originalIndex;
          const showInsertionPoint = draggedIndex !== null && dropZoneIndex === index && !isBeingDragged;
          
          return (
          <React.Fragment key={category.id}>
            {/* Insertion point indicator - shows where item will be inserted */}
            {showInsertionPoint && (
              <Box
                sx={{
                  height: '6px',
                  backgroundColor: '#4caf50',
                  margin: '8px 16px',
                  borderRadius: '3px',
                  opacity: 0.9,
                  animation: 'glow 1s ease-in-out infinite alternate',
                  boxShadow: '0 0 12px rgba(76, 175, 80, 0.6)',
                  position: 'relative',
                  '@keyframes glow': {
                    '0%': { 
                      opacity: 0.6,
                      transform: 'scaleX(0.95)'
                    },
                    '100%': { 
                      opacity: 1,
                      transform: 'scaleX(1.05)'
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '8px solid #4caf50'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: '-4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '8px solid #4caf50'
                  }
                }}
              />
            )}
            <ListItemButton 
              draggable={true}
              onClick={() => handleCategoryClick(category)}
              onMouseDown={() => handleMouseDown(originalIndex)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDragStart={(e) => handleDragStart(e, originalIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              selected={selectedCategory && selectedCategory.id === category.id}
              sx={{ 
                position: 'relative',
                backgroundColor: category.color,
                color: 'white',
                padding: '15px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '2px',
                cursor: isBeingDragged ? 'grabbing' : 'grab',
                opacity: isBeingDragged ? 0.4 : 1,
                transform: isBeingDragged 
                  ? 'scale(1.05) rotate(3deg)' 
                  : showInsertionPoint 
                    ? 'translateY(4px)' 
                    : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                filter: isBeingDragged ? 'brightness(1.2)' : 'none',
                zIndex: isBeingDragged ? 1000 : 1,
                boxShadow: isBeingDragged 
                  ? '0 8px 25px rgba(0,0,0,0.3)' 
                  : showInsertionPoint
                    ? '0 2px 8px rgba(0,0,0,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.1)',
                clipPath: selectedCategory && selectedCategory.id === category.id 
                  ? 'polygon(0 0, calc(100% - 30px) 0, 100% 50%, calc(100% - 30px) 100%, 0 100%)'
                  : 'none',
                '&:hover': {
                  backgroundColor: category.color,
                  filter: isBeingDragged ? 'brightness(1.2)' : 'brightness(1.1)',
                  transform: isBeingDragged 
                    ? 'scale(1.05) rotate(3deg)' 
                    : showInsertionPoint 
                      ? 'translateY(4px) scale(1.02)' 
                      : 'scale(1.02)',
                },
                '&.Mui-selected': {
                  backgroundColor: category.color,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: category.color,
                  filter: 'brightness(1.1)',
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
                primary={category.name || category.categoryName} 
                sx={{ 
                  textAlign: 'center',
                  '& .MuiTypography-root': {
                    fontWeight: 'bold',
                    fontSize: '18px',
                    textShadow: isBeingDragged ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }
                }}
              />
            </ListItemButton>
          </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
}

export default SearchCategories; 