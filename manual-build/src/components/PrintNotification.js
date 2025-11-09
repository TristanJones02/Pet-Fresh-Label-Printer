import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Slide 
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

function PrintNotification({ 
  isVisible, 
  onClose, 
  success, 
  productName, 
  errorMessage 
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // Auto close after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Touch/Mouse drag handlers
  const handleDragStart = (clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    setDragOffset(0);
  };

  const handleDragMove = (clientY) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY.current;
    // Only allow dragging down (positive values)
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    // If dragged down more than 50px, dismiss
    if (dragOffset > 50) {
      onClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events
  const handleMouseDown = (e) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const backgroundColor = success 
    ? '#C8E6C9' // Solid pastel green for success
    : '#FFCDD2';  // Solid pastel red for error

  const borderColor = success ? '#4CAF50' : '#f44336';
  const iconColor = success ? '#4CAF50' : '#f44336';

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '10vh',
          backgroundColor: backgroundColor,
          borderTop: `3px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300, // Below modal but above other content
          boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
          padding: '0 24px',
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            maxWidth: '90%',
            textAlign: 'center'
          }}
        >
          {success ? (
            <CheckIcon sx={{ color: iconColor, fontSize: 32 }} />
          ) : (
            <ErrorIcon sx={{ color: iconColor, fontSize: 32 }} />
          )}
          
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#333',
                fontWeight: 600,
                mb: 0.5
              }}
            >
              {success ? (
                productName.includes('Cancel') ? productName : `Print Job "${productName}" Sent to Printer`
              ) : (
                productName.includes('Cancel') ? productName : `Print Job Failed`
              )}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontSize: '0.875rem'
              }}
            >
              {success ? (
                productName.includes('Cancel') ? 
                  'Print job cancellation command sent to printer.' :
                  'To Cancel, press the Cancel Print button at the top of the screen.'
              ) : (
                errorMessage || 'An error occurred while printing.'
              )}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Slide>
  );
}

export default PrintNotification;