const { ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Track if we're currently printing
let isPrinting = false;

/**
 * Initialize printing functionality and IPC handlers
 */
function initPrinting() {
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
  
  // Debug IPC handlers
  ipcMain.handle('get-printers', async () => {
    try {
      // In a future version, this would return the list of available printers
      // For now, we'll return a mock printer
      return [{ name: 'PDF Printer', isDefault: true }];
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  });
}

module.exports = {
  initPrinting
}; 