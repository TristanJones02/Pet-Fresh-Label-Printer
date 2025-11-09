/**
 * System Configuration Management
 * Handles hostname detection and persistent storage
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const CONFIG_FILE = 'system-config.json';

/**
 * Get the system hostname
 * @returns {string} - System hostname
 */
function getSystemHostname() {
  return os.hostname();
}

/**
 * Get the config file path (in the app directory)
 * @returns {string} - Full path to config file
 */
function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILE);
}

/**
 * Load system configuration from persistent storage
 * @returns {Promise<Object>} - System configuration object
 */
async function loadSystemConfig() {
  try {
    const configPath = getConfigPath();
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // If file doesn't exist or is invalid, return default config
    console.log('No existing config found, creating default config');
    return await createDefaultConfig();
  }
}

/**
 * Save system configuration to persistent storage
 * @param {Object} config - Configuration object to save
 * @returns {Promise<void>}
 */
async function saveSystemConfig(config) {
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('System configuration saved successfully');
  } catch (error) {
    console.error('Failed to save system configuration:', error);
    throw error;
  }
}

/**
 * Create default system configuration
 * @returns {Promise<Object>} - Default configuration object
 */
async function createDefaultConfig() {
  const hostname = getSystemHostname();
  const defaultConfig = {
    hostname: hostname,
    printerNetworkPath: `\\\\${hostname}\\zebra_print`,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };

  // Save the default config
  await saveSystemConfig(defaultConfig);
  return defaultConfig;
}

/**
 * Get the current printer network path
 * @returns {Promise<string>} - Network path for printer
 */
async function getPrinterNetworkPath() {
  const config = await loadSystemConfig();
  return config.printerNetworkPath;
}

/**
 * Update hostname in configuration (if system hostname changes)
 * @returns {Promise<Object>} - Updated configuration
 */
async function updateHostnameConfig() {
  const currentHostname = getSystemHostname();
  const config = await loadSystemConfig();
  
  if (config.hostname !== currentHostname) {
    console.log(`Hostname changed from ${config.hostname} to ${currentHostname}, updating config`);
    config.hostname = currentHostname;
    config.printerNetworkPath = `\\\\${currentHostname}\\zebra_print`;
    config.lastUpdated = new Date().toISOString();
    await saveSystemConfig(config);
  }
  
  return config;
}

module.exports = {
  getSystemHostname,
  loadSystemConfig,
  saveSystemConfig,
  createDefaultConfig,
  getPrinterNetworkPath,
  updateHostnameConfig
};