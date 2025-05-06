// Import required libraries
const React = require('react');
const ReactDOM = require('react-dom');
const { ipcRenderer } = require('electron');

// Import Material UI components
const { 
  ThemeProvider, 
  createTheme, 
  CssBaseline 
} = require('@mui/material');

// Import our components
const App = require('./components/App');

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#9ba03b', // Green color for selection
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

// Mock data for testing (will be replaced with API calls later)
const mockCategories = [
  { id: 1, name: 'Dog Food', color: '#FF5722' },
  { id: 2, name: 'Cat Food', color: '#2196F3' },
  { id: 3, name: 'Bird Food', color: '#4CAF50' },
  { id: 4, name: 'Fish Food', color: '#9C27B0' },
  { id: 5, name: 'Small Animal', color: '#FF9800' },
  { id: 6, name: 'Reptile Food', color: '#795548' },
  { id: 7, name: 'Horse Food', color: '#607D8B' },
  { id: 8, name: 'Pet Treats', color: '#E91E63' },
  { id: 9, name: 'Pet Supplements', color: '#00BCD4' },
  { id: 10, name: 'Pet Accessories', color: '#8BC34A' },
];

const mockProducts = [
  {
    id: 1,
    name: 'Premium Dog Food',
    category: 1,
    type: 'Dry Food',
    weight: '10kg',
    price: '$49.99',
    ingredients: 'Chicken, Rice, Vegetables, Vitamins, Minerals',
    expiryDays: 365,
    storageInstructions: 'Store in a cool, dry place. Seal after opening.',
    barcode: '123456789012',
  },
  {
    id: 2,
    name: 'Organic Cat Food',
    category: 2,
    type: 'Dry Food',
    weight: '5kg',
    price: '$39.99',
    ingredients: 'Salmon, Brown Rice, Carrots, Essential Nutrients',
    expiryDays: 300,
    storageInstructions: 'Store in a cool, dry place. Seal after opening.',
    barcode: '223456789012',
  },
  {
    id: 3,
    name: 'Gourmet Cat Food',
    category: 2,
    type: 'Wet Food',
    weight: '400g',
    price: '$3.99',
    ingredients: 'Tuna, Water, Fish Oil, Vitamins, Minerals',
    expiryDays: 180,
    storageInstructions: 'Refrigerate after opening. Use within 2 days.',
    barcode: '323456789012',
  },
  {
    id: 4,
    name: 'Bird Seed Mix',
    category: 3,
    type: 'Seed Mix',
    weight: '2kg',
    price: '$12.99',
    ingredients: 'Sunflower Seeds, Millet, Canary Seed, Oats',
    expiryDays: 240,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '423456789012',
  },
  {
    id: 5,
    name: 'Tropical Fish Flakes',
    category: 4,
    type: 'Fish Food',
    weight: '250g',
    price: '$8.99',
    ingredients: 'Fish Meal, Shrimp Meal, Wheat Flour, Fish Oil, Vitamins',
    expiryDays: 270,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '523456789012',
  },
  {
    id: 6,
    name: 'Guinea Pig Pellets',
    category: 5,
    type: 'Small Animal Food',
    weight: '3kg',
    price: '$15.99',
    ingredients: 'Timothy Hay, Alfalfa, Oats, Barley, Vitamins',
    expiryDays: 210,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '623456789012',
  },
  {
    id: 7,
    name: 'Reptile Food Sticks',
    category: 6,
    type: 'Reptile Food',
    weight: '500g',
    price: '$19.99',
    ingredients: 'Fish Meal, Wheat Flour, Vitamins, Minerals',
    expiryDays: 180,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '723456789012',
  },
  {
    id: 8,
    name: 'Premium Horse Feed',
    category: 7,
    type: 'Horse Food',
    weight: '20kg',
    price: '$59.99',
    ingredients: 'Oats, Barley, Alfalfa, Minerals, Vitamins',
    expiryDays: 240,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '823456789012',
  },
  {
    id: 9,
    name: 'Dog Treats - Chicken Flavor',
    category: 8,
    type: 'Dog Treats',
    weight: '500g',
    price: '$9.99',
    ingredients: 'Chicken, Wheat Flour, Vegetable Oil, Vitamins',
    expiryDays: 365,
    storageInstructions: 'Store in a cool, dry place. Seal after opening.',
    barcode: '923456789012',
  },
  {
    id: 10,
    name: 'Joint Health Supplement',
    category: 9,
    type: 'Pet Supplements',
    weight: '250g',
    price: '$24.99',
    ingredients: 'Glucosamine, Chondroitin, MSM, Vitamin C',
    expiryDays: 540,
    storageInstructions: 'Store in a cool, dry place. Keep sealed.',
    barcode: '023456789012',
  },
];

const appData = {
  categories: mockCategories,
  products: mockProducts,
  version: '1.0.0',
  printerStatus: 'ready', // 'ready', 'printing', 'error', 'systemError'
};

// Render the application
ReactDOM.render(
  React.createElement(
    ThemeProvider,
    { theme: theme },
    React.createElement(
      React.Fragment,
      null,
      React.createElement(CssBaseline),
      React.createElement(App, { appData: appData, ipcRenderer: ipcRenderer })
    )
  ),
  document.getElementById('app')
); 