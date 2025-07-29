const fs = require('fs');
const path = require('path');
const os = require('os');
let electron;
try {
  electron = require('electron');
} catch (e) {
  // Handle case where electron is not available
  console.error('Electron not available:', e);
}

// Get the app data directory for storing configuration
// This will resolve to a location like %APPDATA%\pet-fresh-label-printer on Windows
const getConfigPath = () => {
  try {
    // Try to get the userData path from electron
    if (electron && electron.app) {
      return path.join(electron.app.getPath('userData'), 'labelMachineConfig.json');
    } else if (process.env.APPDATA) {
      // Fallback to environment variable on Windows
      return path.join(process.env.APPDATA, 'pet-fresh-label-printer', 'labelMachineConfig.json');
    } else {
      // Last resort fallback
      return path.join(os.homedir(), '.pet-fresh-label-printer', 'labelMachineConfig.json');
    }
  } catch (err) {
    console.error('Error determining config path:', err);
    // Last resort fallback
    return path.join(os.homedir(), '.pet-fresh-label-printer', 'labelMachineConfig.json');
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  usageType: null, // null means not configured yet
  debuggingMode: false
};

/**
 * Checks if the configuration file exists
 * @returns {boolean} True if the file exists, false otherwise
 */
function configExists() {
  return fs.existsSync(getConfigPath());
}

/**
 * Creates the configuration file with default settings if it doesn't exist
 * @returns {boolean} True if successful, false otherwise
 */
function createDefaultConfigIfNeeded() {
  try {
    if (!configExists()) {
      // Ensure the directory exists
      const configDir = path.dirname(getConfigPath());
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(getConfigPath(), JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('Created default configuration file at', getConfigPath());
    }
    return true;
  } catch (error) {
    console.error('Error creating default configuration:', error);
    return false;
  }
}

/**
 * Loads the configuration from the file
 * @returns {Object} The configuration object
 */
function loadConfig() {
  try {
    if (!configExists()) {
      createDefaultConfigIfNeeded();
      return DEFAULT_CONFIG;
    }
    
    const configData = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading configuration:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Saves the configuration to the file
 * @param {Object} config The configuration object to save
 * @returns {boolean} True if successful, false otherwise
 */
function saveConfig(config) {
  try {
    // Preserve debuggingMode if not explicitly set
    const currentConfig = loadConfig();
    const newConfig = {
      ...config,
      debuggingMode: config.debuggingMode !== undefined ? 
        config.debuggingMode : 
        currentConfig.debuggingMode
    };

    fs.writeFileSync(getConfigPath(), JSON.stringify(newConfig, null, 2));
    console.log('Configuration saved successfully to', getConfigPath());
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
}

/**
 * Checks if the app is configured
 * @returns {boolean} True if configured, false otherwise
 */
function isAppConfigured() {
  const config = loadConfig();
  return config.usageType !== null;
}

/**
 * Gets the debugging mode status
 * @returns {boolean} True if debugging is enabled, false otherwise
 */
function isDebuggingEnabled() {
  const config = loadConfig();
  return config.debuggingMode === true;
}

/**
 * Always returns true for debugging the config window
 * @returns {boolean} Always true
 */
function isConfigWindowDebuggingEnabled() {
  return true; // Always enable debugging for config window
}

module.exports = {
  configExists,
  createDefaultConfigIfNeeded,
  loadConfig,
  saveConfig,
  isAppConfigured,
  isDebuggingEnabled,
  isConfigWindowDebuggingEnabled
}; 