/**
 * Network Printing System
 * Handles printing ZPL files to network printer share \\{hostname}\zebra_print
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { getPrinterNetworkPath, updateHostnameConfig } = require('../utils/systemConfig');

/**
 * Print ZPL content to network printer
 * @param {string} zplContent - ZPL content to print
 * @param {Object} options - Print options
 * @returns {Promise<Object>} - Print result
 */
async function printToNetworkPrinter(zplContent, options = {}) {
  const { timeout = 10000 } = options;

  try {
    // Ensure hostname config is up to date
    await updateHostnameConfig();
    
    // Get the network printer path
    const networkPath = await getPrinterNetworkPath();
    console.log(`Printing to network path: ${networkPath}`);

    // Create temporary ZPL file
    const tempDir = os.tmpdir();
    const tempFileName = `label_${Date.now()}.zpl`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write ZPL content to temporary file
    await fs.writeFile(tempFilePath, zplContent, 'ascii');

    console.log('ZPL Content being sent:');
    console.log('='.repeat(50));
    console.log(zplContent);
    console.log('='.repeat(50));
    console.log(`ZPL Content Length: ${zplContent.length} characters`);

    // Execute network print command
    const printCommand = `COPY /B "${tempFilePath}" "${networkPath}"`;
    console.log(`Executing command: ${printCommand}`);

    return new Promise((resolve, reject) => {
      exec(printCommand, { timeout }, async (error, stdout, stderr) => {
        // Clean up temporary file
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn('Could not delete temporary file:', cleanupError);
        }

        if (error) {
          console.error('Network print failed:', error);
          reject({
            success: false,
            error: error.message,
            networkPath: networkPath,
            timestamp: new Date().toISOString()
          });
          return;
        }

        if (stderr) {
          console.warn('Print command stderr:', stderr);
        }

        console.log('Network print successful:', stdout);
        resolve({
          success: true,
          message: 'Label sent to network printer successfully',
          networkPath: networkPath,
          output: stdout,
          timestamp: new Date().toISOString()
        });
      });
    });

  } catch (error) {
    console.error('Error in network printing:', error);
    throw {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Send stop command to network printer
 * @param {Object} options - Options for stop command
 * @returns {Promise<Object>} - Stop command result
 */
async function sendStopCommand(options = {}) {
  const { timeout = 5000 } = options;

  try {
    // Load stop.zpl content
    const stopZplPath = path.join(__dirname, 'printer_commands', 'stop.zpl');
    const stopZplContent = await fs.readFile(stopZplPath, 'utf8');

    console.log('Sending stop command to printer...');
    
    // Use the network printer function to send stop command
    return await printToNetworkPrinter(stopZplContent, { timeout });

  } catch (error) {
    console.error('Error sending stop command:', error);
    throw {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test network printer connectivity
 * @param {Object} options - Test options
 * @returns {Promise<Object>} - Test result
 */
async function testNetworkPrinter(options = {}) {
  // Simple test ZPL
  const testZpl = `^XA
^FO50,50^A0N,30,30^FDNETWORK TEST^FS
^FO50,100^A0N,20,20^FDPrinter Communication Test^FS
^XZ`;

  console.log('Testing network printer connectivity...');
  return await printToNetworkPrinter(testZpl, options);
}

module.exports = {
  printToNetworkPrinter,
  sendStopCommand,
  testNetworkPrinter
};