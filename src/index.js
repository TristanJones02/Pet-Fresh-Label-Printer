const React = require('react');
const { createRoot } = require('react-dom/client');
const App = require('./components/App');

// Initialize the React application
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing application...');
    const container = document.getElementById('app');
    
    if (!container) {
      console.error('Could not find app container element');
      return;
    }
    
    // Create root and render app
    const root = createRoot(container);
    root.render(React.createElement(App));
    console.log('Application rendered successfully');
  } catch (err) {
    console.error('Error initializing application:', err);
  }
});

// Add IPC listeners for dialog management if needed
if (window.api) {
  // We don't want to modify window.api, just use it if the methods don't already exist
  
  // Store event listeners locally instead of trying to attach them to window.api
  const eventListeners = {
    'show-dialog': new Set(),
    'hide-dialog': new Set(),
  };
  
  // Create a local function to handle show-dialog events
  const handleShowDialog = (callback) => {
    eventListeners['show-dialog'].add(callback);
    window.addEventListener('show-dialog', (event) => callback(event, event.detail));
  };
  
  // Create a local function to handle hide-dialog events
  const handleHideDialog = (callback) => {
    eventListeners['hide-dialog'].add(callback);
    window.addEventListener('hide-dialog', (event) => callback(event, event.detail));
  };
  
  // Use the existing electron object or create it
  if (!window.electron) {
    window.electron = {};
  }
  
  // Create a receive function if it doesn't exist
  if (typeof window.electron.receive !== 'function') {
    window.electron.receive = (channel, data) => {
      if (channel === 'show-dialog' || channel === 'hide-dialog') {
        const event = new CustomEvent(channel, { detail: data });
        window.dispatchEvent(event);
        
        // Call registered listeners
        if (eventListeners[channel]) {
          eventListeners[channel].forEach(listener => listener(event, data));
        }
      }
    };
  }
  
  // Expose our dialog handlers by attaching them to a global custom object
  // instead of modifying window.api
  window.customDialogHandlers = {
    onShowDialog: handleShowDialog,
    offShowDialog: (callback) => {
      eventListeners['show-dialog'].delete(callback);
    },
    onHideDialog: handleHideDialog,
    offHideDialog: (callback) => {
      eventListeners['hide-dialog'].delete(callback);
    }
  };
} 