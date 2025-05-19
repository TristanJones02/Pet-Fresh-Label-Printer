const { ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// Track if we're currently printing
let isPrinting = false;
let availablePrinters = [];

/**
 * Get printers on Windows using PowerShell
 * @returns {Promise<Array>} Array of printer objects
 */
async function getWindowsPrinters() {
  return new Promise((resolve, reject) => {
    console.log('Trying to get Windows printers...');
    
    // Using a simpler PowerShell command that should work reliably
    exec('powershell.exe -command "Get-Printer | Select-Object Name, Default | ConvertTo-Json"', (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting Windows printers:', error);
        console.error('Stderr:', stderr);
        
        // Return mock data in case of error for development
        console.log('Returning mock printer data');
        resolve([
          { name: 'KITCHEN (Mock)', isDefault: true },
          { name: 'OFFICE (Mock)', isDefault: false },
          { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
        ]);
        return;
      }
      
      try {
        console.log('PowerShell output:', stdout.trim());
        
        // Parse the JSON output
        const printers = JSON.parse(stdout.trim());
        console.log('Parsed printer data:', printers);
        
        // Convert to our standard format - set all to non-default initially
        let formattedPrinters = Array.isArray(printers) 
          ? printers.map(printer => ({
              name: printer.Name,
              isDefault: false // Default to false for all
            }))
          : [{ name: printers.Name, isDefault: false }];
        
        // Mark the first printer as default if needed
        if (formattedPrinters.length > 0) {
          formattedPrinters[0].isDefault = true;
        }
        
        console.log('Formatted printers:', formattedPrinters);
        resolve(formattedPrinters);
      } catch (parseError) {
        console.error('Error parsing Windows printer list:', parseError);
        console.log('Invalid output:', stdout.trim());
        
        // Return mock data in case of error for development
        console.log('Returning mock printer data due to parsing error');
        resolve([
          { name: 'KITCHEN (Mock)', isDefault: true },
          { name: 'OFFICE (Mock)', isDefault: false },
          { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
        ]);
      }
    });
  });
}

/**
 * Get printers on macOS using lpstat
 * @returns {Promise<Array>} Array of printer objects
 */
async function getMacPrinters() {
  return new Promise((resolve, reject) => {
    // Get all printers
    exec('lpstat -p', (error, stdout) => {
      if (error) {
        console.error('Error getting macOS printers:', error);
        resolve([]);
        return;
      }
      
      // Get default printer
      exec('lpstat -d', (defaultError, defaultStdout) => {
        try {
          const printerLines = stdout.trim().split('\n');
          const printers = [];
          
          // Parse default printer name
          let defaultPrinter = '';
          if (!defaultError && defaultStdout) {
            const defaultMatch = defaultStdout.match(/system default destination: (.+)/);
            if (defaultMatch && defaultMatch[1]) {
              defaultPrinter = defaultMatch[1];
            }
          }
          
          // Parse printer list
          for (const line of printerLines) {
            // Format: "printer PrinterName is idle. enabled since..."
            const match = line.match(/printer (.+?) /);
            if (match && match[1]) {
              const printerName = match[1];
              printers.push({
                name: printerName,
                isDefault: printerName === defaultPrinter
              });
            }
          }
          
          resolve(printers);
        } catch (parseError) {
          console.error('Error parsing macOS printer list:', parseError);
          resolve([]);
        }
      });
    });
  });
}

/**
 * Get all available printers based on platform
 * @returns {Promise<Array>} Array of printer objects
 */
async function getPrinters() {
  try {
    const platform = process.platform;
    console.log('Detecting printers on platform:', platform);
    
    // We're only supporting Windows for now
    return await getWindowsPrinters();
  } catch (error) {
    console.error('Error getting printers:', error);
    // Return mock data on error
    return [
      { name: 'KITCHEN (Mock)', isDefault: true },
      { name: 'OFFICE (Mock)', isDefault: false },
      { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
    ];
  }
}

/**
 * Initialize printing functionality and IPC handlers
 */
function initPrinting() {
  // Load printers initially
  refreshPrinterList();
  
  // Set up IPC handlers for print requests
  ipcMain.handle('print-label', async (event, options) => {
    try {
      // Start timing the operation
      const startTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting PDF generation...`);
      
      // Prevent multiple simultaneous print jobs
      if (isPrinting) {
        return { success: false, error: 'Print job already in progress' };
      }
      
      isPrinting = true;
      
      const { html, quantity = 1, savePath } = options;
      
      // Create a temporary hidden window for PDF generation
      const printWindow = new BrowserWindow({
        width: 600,
        height: 800,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      // Load HTML timing
      const htmlLoadStart = Date.now();
      console.log(`[${new Date().toISOString()}] Loading HTML content...`);
      
      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      
      const htmlLoadTime = Date.now() - htmlLoadStart;
      console.log(`[${new Date().toISOString()}] HTML loaded in ${htmlLoadTime}ms`);
      
      // Allow a moment for rendering (minimal delay)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Setup PDF options for high quality, minimal margins
      const pdfOptions = {
        marginsType: 1, // Minimal margins
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
        pageSize: { width: 62000, height: 100000 }, // Micrometers (62mm x 100mm)
        scaleFactor: 100,
      };
      
      // PDF generation timing
      const pdfGenStart = Date.now();
      console.log(`[${new Date().toISOString()}] Generating PDF...`);
      
      // Generate the PDF data
      const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
      
      const pdfGenTime = Date.now() - pdfGenStart;
      console.log(`[${new Date().toISOString()}] PDF generated in ${pdfGenTime}ms`);
      
      // Determine save location
      let outputPath;
      if (savePath) {
        outputPath = savePath;
      } else {
        // Create temp directory if using a temp file
        const tempDir = path.join(os.tmpdir(), 'pet-fresh-labels');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        outputPath = path.join(tempDir, `label-${Date.now()}.pdf`);
      }
      
      // File saving timing
      const saveStart = Date.now();
      console.log(`[${new Date().toISOString()}] Saving PDF to: ${outputPath}`);
      
      // Save the PDF
      fs.writeFileSync(outputPath, pdfData);
      
      const saveTime = Date.now() - saveStart;
      console.log(`[${new Date().toISOString()}] PDF saved in ${saveTime}ms`);
      
      // For production, here we would send to printer directly
      // For now, we're just returning the path to the generated PDF
      
      // Clean up
      printWindow.close();
      isPrinting = false;
      
      // Total time calculation
      const totalTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Total PDF generation time: ${totalTime}ms`);
      console.log(`[${new Date().toISOString()}] PDF saved to: ${outputPath}`);
      
      // Return success with the PDF path and timing information
      return { 
        success: true, 
        pdfPath: outputPath,
        message: `Generated PDF with ${quantity} label(s)`,
        timing: {
          total: totalTime,
          htmlLoad: htmlLoadTime,
          pdfGeneration: pdfGenTime,
          fileSave: saveTime
        }
      };
    } catch (error) {
      console.error('Error in print-label:', error);
      isPrinting = false;
      return { success: false, error: error.message || 'Unknown error' };
    }
  });
  
  // Refresh the printer list
  async function refreshPrinterList() {
    try {
      console.log('Refreshing printer list...');
      availablePrinters = await getPrinters();
      console.log('Available printers:', availablePrinters);
      
      // If we couldn't get any printers, provide mock data
      if (!availablePrinters || availablePrinters.length === 0) {
        console.log('No printers found, using mock data');
        availablePrinters = [
          { name: 'KITCHEN (Mock)', isDefault: true },
          { name: 'OFFICE (Mock)', isDefault: false },
          { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
        ];
      } else {
        // Check if we have any Zebra printers in the list
        const hasZebraPrinter = availablePrinters.some(printer => 
          printer.name.toLowerCase().includes('zebra') || 
          printer.name.toLowerCase().includes('zdesigner')
        );
        
        // Add a mock Zebra printer if none was found and we're in development mode
        if (!hasZebraPrinter && process.env.NODE_ENV === 'development') {
          console.log('No Zebra printer found, adding a mock one for development');
          availablePrinters.push({ name: 'ZEBRA ZD420 (Mock)', isDefault: false });
        }
      }
      
      return availablePrinters;
    } catch (error) {
      console.error('Error refreshing printer list:', error);
      
      // Return mock data in case of error
      console.log('Error occurred, using mock data');
      availablePrinters = [
        { name: 'KITCHEN (Mock)', isDefault: true },
        { name: 'OFFICE (Mock)', isDefault: false },
        { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
      ];
      
      return availablePrinters;
    }
  }
  
  // IPC handler to get list of printers
  ipcMain.handle('get-printers', async () => {
    try {
      // Refresh the printer list before returning it
      await refreshPrinterList();
      return availablePrinters;
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  });
  
  // IPC handler to refresh the printer list
  ipcMain.handle('refresh-printers', async () => {
    try {
      await refreshPrinterList();
      return availablePrinters;
    } catch (error) {
      console.error('Error refreshing printers:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  initPrinting
}; 