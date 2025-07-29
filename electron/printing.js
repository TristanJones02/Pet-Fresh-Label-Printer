const { ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Track if we're currently printing
let isPrinting = false;
let availablePrinters = [];
let printJobs = [];
const MAX_STORED_JOBS = 50;

/**
 * Create a unique job ID
 * @returns {string} A unique job ID
 */
function createJobId() {
  // Create a shorter job ID for readability
  return uuidv4().split('-')[0].toUpperCase();
}

/**
 * Log to Windows Event Log
 * @param {string} message - The message to log
 * @param {string} level - The log level (Information, Warning, Error)
 */
function logToEventLog(message, level = 'Information') {
  if (process.platform !== 'win32') {
    console.log(`[EVENT LOG] ${level}: ${message}`);
    return;
  }

  try {
    // Escape quotes in the message for PowerShell
    const escapedMessage = message.replace(/"/g, '`"');
    
    // Create the PowerShell command to write to the event log
    const command = `
      powershell.exe -Command "
        $source = 'PetFreshLabelPrinter'
        
        # Create event source if it doesn't exist
        if (-not [System.Diagnostics.EventLog]::SourceExists($source)) {
          try {
            [System.Diagnostics.EventLog]::CreateEventSource($source, 'Application')
            Start-Sleep -Seconds 1  # Wait for registration
          } catch {
            # If we can't create the source, just use Application
            $source = 'Application'
          }
        }
        
        # Write the event
        Write-EventLog -LogName Application -Source $source -EventId ${level === 'Error' ? '1001' : level === 'Warning' ? '1002' : '1000'} -EntryType ${level} -Message \\"${escapedMessage}\\"
      "
    `;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error writing to event log:', error);
        console.error('stderr:', stderr);
      }
    });
  } catch (err) {
    console.error('Error creating Windows event log entry:', err);
  }
}

/**
 * Add a new print job to the history
 * @param {Object} job - The print job details
 */
function addPrintJob(job) {
  // Ensure job has all required fields
  const newJob = {
    id: job.id || createJobId(),
    timestamp: job.timestamp || new Date().toISOString(),
    productName: job.productName || 'Unknown Product',
    sku: job.sku || '',
    quantity: job.quantity || 1,
    status: job.status || 'pending',
    logs: job.logs || [],
    printerId: job.printerId || '',
    printerName: job.printerName || 'Default Printer'
  };
  
  // Add to the beginning of the array
  printJobs.unshift(newJob);
  
  // Limit the number of stored jobs
  if (printJobs.length > MAX_STORED_JOBS) {
    printJobs = printJobs.slice(0, MAX_STORED_JOBS);
  }
  
  return newJob;
}

/**
 * Update an existing print job's status
 * @param {string} jobId - The job ID to update
 * @param {string} status - The new status
 * @param {string} logMessage - Optional log message to add
 */
function updatePrintJob(jobId, status, logMessage = null) {
  const jobIndex = printJobs.findIndex(job => job.id === jobId);
  
  if (jobIndex === -1) {
    console.error(`Job ${jobId} not found`);
    return null;
  }
  
  // Update the job status
  printJobs[jobIndex].status = status;
  
  // Add log message if provided
  if (logMessage) {
    const timestamp = new Date().toISOString();
    printJobs[jobIndex].logs.push(`[${timestamp}] ${logMessage}`);
  }
  
  return printJobs[jobIndex];
}

/**
 * Get printers on Windows using PowerShell
 * @returns {Promise<Array>} Array of printer objects
 */
async function getWindowsPrinters() {
  return new Promise((resolve, reject) => {
    console.log('Trying to get Windows printers...');
    
    // Using a more detailed PowerShell command to explicitly get the default printer
    exec('powershell.exe -command "$defaultPrinterName = (Get-WmiObject -Query \\"SELECT * FROM Win32_Printer WHERE Default=$true\\").Name; Get-Printer | Select-Object Name, @{Name=\\"Default\\"; Expression={$_.Name -eq $defaultPrinterName}} | ConvertTo-Json"', (error, stdout, stderr) => {
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
        
        // Convert to our standard format - properly handling Default property
        let formattedPrinters = Array.isArray(printers) 
          ? printers.map(printer => ({
            name: printer.Name,
            isDefault: printer.Default === true
          }))
          : [{ name: printers.Name, isDefault: printers.Default === true }];
        
        // If no default printer was found, mark the first one as default
        const hasDefault = formattedPrinters.some(p => p.isDefault);
        if (!hasDefault && formattedPrinters.length > 0) {
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
 * Initialize printing functionality
 */
function initPrinting() {
  // Keep track of registered handlers to prevent duplicates
  const registeredHandlers = new Set();
  
  // Helper to safely register IPC handlers only once
  const safeHandle = (channel, handler) => {
    if (!registeredHandlers.has(channel)) {
      try {
        ipcMain.handle(channel, handler);
        registeredHandlers.add(channel);
      } catch (error) {
        console.warn(`Handler for '${channel}' may already be registered:`, error.message);
      }
    }
  };
  
  // Load printers initially
  refreshPrinterList();
  
  // Set up IPC handlers for print requests
  safeHandle('print-label', async (event, options) => {
    try {
      // Create a unique job ID
      const jobId = createJobId();
      
      // Start timing the operation
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      
      // Extract product information if available
      const productName = options.productName || 'Unknown Product';
      const sku = options.sku || '';
      const quantity = options.quantity || 1;
      
      // Create a new print job record
      const printJob = addPrintJob({
        id: jobId,
        timestamp,
        productName,
        sku,
        quantity,
        status: 'pending',
        logs: [`[${timestamp}] Print request received for ${productName} (SKU: ${sku}) - Quantity: ${quantity}`]
      });
      
      // Log the print request to the event log
      logToEventLog(`Print Job ${jobId} | Received for SKU ${sku} - ${productName}, Qty ${quantity}`, 'Information');
      
      // Prevent multiple simultaneous print jobs
      if (isPrinting) {
        updatePrintJob(jobId, 'error', 'Print job already in progress');
        logToEventLog(`Print Job ${jobId} | Error: Another print job is already in progress`, 'Warning');
        return { 
          success: false, 
          error: 'Print job already in progress', 
          jobId 
        };
      }
      
      isPrinting = true;
      
      const { html, quantity: requestedQuantity = 1, savePath, settings = {} } = options;
      
      // Import the label config to get correct dimensions
      const labelConfig = require('../src/label/config.json');
      
      // Use config dimensions instead of hardcoded values
      const labelWidth = labelConfig.width || 60;
      const labelHeight = labelConfig.height || 162;
      
      // Update job with HTML generation start
      updatePrintJob(jobId, 'processing', 'Starting HTML processing');
      
      // Process the HTML to ensure black backgrounds print correctly
      const processedHtml = html.replace(
        /<table class="header-table"/g, 
        '<table bgcolor="black" style="background-color:black !important; color:white !important;"'
      )
      // Enhance any div with black background - make sure they print properly
      .replace(
        /background-color: ?black !important/g,
        'background-color:black !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important'
      )
      // Fix horizontal margins
      .replace(
        /left: (\d+)mm/g,
        'left: $1mm !important'
      )
      .replace(
        /width: calc\(100% - (\d+)mm\)/g,
        'width: calc(100% - $1mm) !important'
      );
      
      // Inject minimal print-specific styles without overriding fonts or layout
      const styleAddition = `
      <style>
        @page {
          margin: 0;
          size: ${labelWidth}mm ${labelHeight}mm;
        }
        
        /* Ensure label container is positioned correctly */
        .label-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: ${labelWidth}mm !important;
          height: ${labelHeight}mm !important;
        }
        
        /* Force black backgrounds to print properly in all printer drivers */
        [style*="background-color:black"], [style*="background-color: black"] {
          background-color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Ensure all elements print with exact colors */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Print-specific media query */
        @media print {
          [style*="background-color:black"], [style*="background-color: black"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: black !important;
          }
        }
      </style>
      `;
      
      // Add style tag to head if it exists, otherwise prepend to body
      const processedHtmlWithStyles = processedHtml.includes('<head>') 
        ? processedHtml.replace('</head>', `${styleAddition}</head>`)
        : processedHtml.replace('<body>', `<head>${styleAddition}</head><body>`);
      
      // Create a temporary hidden window for PDF generation
      const printWindow = new BrowserWindow({
        width: 600,
        height: 800,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false, // Allow loading local assets
          allowRunningInsecureContent: false,
          experimentalFeatures: false
        }
      });
      
      // Load HTML timing
      const htmlLoadStart = Date.now();
      updatePrintJob(jobId, 'processing', 'Loading HTML content into render window');
      
      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(processedHtmlWithStyles)}`);
      
      const htmlLoadTime = Date.now() - htmlLoadStart;
      updatePrintJob(jobId, 'processing', `HTML loaded in ${htmlLoadTime}ms`);
      logToEventLog(`Print Job ${jobId} | Label Generation took ${htmlLoadTime}ms`, 'Information');
      
      // Allow a moment for rendering (minimal delay)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simple tweak to enhance print quality while maintaining consistency with preview
      await printWindow.webContents.executeJavaScript(`
        try {
          // Only enhance black backgrounds for print compatibility - don't change fonts or layout
          const blackBackgrounds = document.querySelectorAll('[style*="background-color:black"], [style*="background-color: black"]');
          blackBackgrounds.forEach(el => {
            // Ensure black background prints properly
            el.style.webkitPrintColorAdjust = 'exact';
            el.style.printColorAdjust = 'exact';
            el.style.colorAdjust = 'exact';
          });
          
          // Force a layout recalculation
          document.body.offsetHeight;
          
        } catch (e) { 
          console.error('Error enhancing print quality:', e);
        }
      `);
      
      // Setup PDF options for high quality, minimal margins
      const pdfOptions = {
        marginsType: 0, // No margins
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
        pageSize: { 
          width: labelWidth * 1000,  // Convert mm to microns
          height: labelHeight * 1000 // Convert mm to microns
        },
        scaleFactor: 100, // Standard scaling
        preferCSSPageSize: true,
        rasterize: false, // Don't rasterize to bitmap
      };
      
      // PDF generation timing
      const pdfGenStart = Date.now();
      updatePrintJob(jobId, 'processing', 'Generating PDF');
      
      // Generate the PDF data
      const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
      
      const pdfGenTime = Date.now() - pdfGenStart;
      updatePrintJob(jobId, 'processing', `PDF generated in ${pdfGenTime}ms`);
      logToEventLog(`Print Job ${jobId} | PDF Generation took ${pdfGenTime}ms`, 'Information');
      
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
        outputPath = path.join(tempDir, `label-${jobId}.pdf`);
      }
      
      // File saving timing
      const saveStart = Date.now();
      updatePrintJob(jobId, 'processing', `Saving PDF to ${outputPath}`);
      
      // Save the PDF
      fs.writeFileSync(outputPath, pdfData);
      
      const saveTime = Date.now() - saveStart;
      updatePrintJob(jobId, 'processing', `PDF saved in ${saveTime}ms`);
      
      // Check if automatic printing is disabled
      const disableAutoPrinting = settings?.disableAutomaticPrinting === true;
      
      // If automatic printing is disabled, show the system print dialog
      let printResult = { success: true };
      
      if (disableAutoPrinting) {
        updatePrintJob(jobId, 'printing', 'Showing system print dialog');
        
        // Show the system print dialog
        const printDialogStart = Date.now();
        
        // Use Electron's built-in print dialog
        printResult = await new Promise((resolve) => {
          // Create proper printer settings
          const printOptions = {
            silent: false,
            printBackground: true,
            deviceName: settings?.printer?.defaultPrinter || availablePrinters.find(p => p.isDefault)?.name,
            copies: requestedQuantity,
            // Important: Specify all required printer dimensions in microns
            pageSize: {
              width: labelWidth * 1000,  // Convert mm to microns
              height: labelHeight * 1000 // Convert mm to microns
            },
            margins: {
              marginType: 0, // No margins
            },
            landscape: false,
            scaleFactor: 100,
            dpi: { horizontal: 203, vertical: 203 } // Standard printer DPI
          };
          
          // Check if this is a Zebra printer and adjust settings appropriately
          const isPrinterZebra = printOptions.deviceName?.toLowerCase().includes('zebra') || 
                                printOptions.deviceName?.toLowerCase().includes('zdesigner');
          
          if (isPrinterZebra) {
            // Log that we're using specialized Zebra printer settings
            updatePrintJob(jobId, 'printing', 'Using Zebra printer settings');
            logToEventLog(`Print Job ${jobId} | Using specialized settings for Zebra printer`, 'Information');
            
            // Use special settings for Zebra printers
            printOptions.dpi = { horizontal: 203, vertical: 203 }; // Standard Zebra printer DPI
            
            // Make sure content size is explicitly set
            printOptions.mediaSize = {
              name: 'CUSTOM',
              width_microns: labelWidth * 1000,
              height_microns: labelHeight * 1000,
              custom_display_name: `Pet Fresh Label (${labelWidth}×${labelHeight}mm)`
            };
            
            // For Zebra printers set scale factor
            printOptions.scaleFactor = 100;
            printOptions.margins = { marginType: 0 }; // No margins
            
            // Ensure proper print orientation for Zebra printers
            printOptions.landscape = false;
          }
          
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            const printDialogTime = Date.now() - printDialogStart;
            
            if (success) {
              updatePrintJob(jobId, 'completed', `Print dialog completed in ${printDialogTime}ms`);
              logToEventLog(`Print Job ${jobId} | Print Job sent to Printer through system dialog`, 'Information');
              resolve({ success: true, method: 'dialog', time: printDialogTime });
            } else {
              updatePrintJob(jobId, 'error', `Print dialog failed: ${failureReason} after ${printDialogTime}ms`);
              logToEventLog(`Print Job ${jobId} | Print dialog was canceled or failed: ${failureReason}`, 'Warning');
              resolve({ success: false, error: failureReason, method: 'dialog', time: printDialogTime });
            }
          });
        });
      } else {
        // For direct printing (we'll implement this now)
        updatePrintJob(jobId, 'printing', 'Starting direct print job');
        
        const printJobStart = Date.now();
        
        try {
          // Create proper printer settings
          const printOptions = {
            silent: true, // Direct printing - no dialog
            printBackground: true,
            deviceName: settings?.printer?.defaultPrinter || availablePrinters.find(p => p.isDefault)?.name,
            copies: requestedQuantity,
            // Important: Specify all required printer dimensions in microns
            pageSize: {
              width: labelWidth * 1000,  // Convert mm to microns
              height: labelHeight * 1000 // Convert mm to microns
            },
            margins: {
              marginType: 0, // No margins
            },
            landscape: false,
            scaleFactor: 100,
            dpi: { horizontal: 203, vertical: 203 } // Standard printer DPI
          };
          
          // Check if this is a Zebra printer and adjust settings appropriately
          const isPrinterZebra = printOptions.deviceName?.toLowerCase().includes('zebra') || 
                                printOptions.deviceName?.toLowerCase().includes('zdesigner');
          
          if (isPrinterZebra) {
            // Log that we're using specialized Zebra printer settings
            updatePrintJob(jobId, 'printing', 'Using Zebra printer settings');
            logToEventLog(`Print Job ${jobId} | Using specialized settings for Zebra printer`, 'Information');
            
            // Use special settings for Zebra printers
            printOptions.dpi = { horizontal: 203, vertical: 203 }; // Standard Zebra printer DPI
            
            // Make sure content size is explicitly set
            printOptions.mediaSize = {
              name: 'CUSTOM',
              width_microns: labelWidth * 1000,
              height_microns: labelHeight * 1000,
              custom_display_name: `Pet Fresh Label (${labelWidth}×${labelHeight}mm)`
            };
            
            // For Zebra printers set scale factor
            printOptions.scaleFactor = 100;
            printOptions.margins = { marginType: 0 }; // No margins
            
            // Ensure proper print orientation for Zebra printers
            printOptions.landscape = false;
          }
          
          // Send the job to the printer directly
          printResult = await new Promise((resolve) => {
            printWindow.webContents.print(printOptions, (success, failureReason) => {
              const printJobTime = Date.now() - printJobStart;
              
              if (success) {
                updatePrintJob(jobId, 'completed', `Direct print completed in ${printJobTime}ms`);
                logToEventLog(`Print Job ${jobId} | Print Job sent to ${printOptions.deviceName || 'default printer'}`, 'Information');
                resolve({ success: true, method: 'direct', time: printJobTime });
              } else {
                updatePrintJob(jobId, 'error', `Direct print failed: ${failureReason} after ${printJobTime}ms`);
                logToEventLog(`Print Job ${jobId} | Print failed: ${failureReason}`, 'Error');
                resolve({ success: false, error: failureReason, method: 'direct', time: printJobTime });
              }
            });
          });
        } catch (directPrintError) {
          updatePrintJob(jobId, 'error', `Direct print error: ${directPrintError.message}`);
          logToEventLog(`Print Job ${jobId} | Error during direct print: ${directPrintError.message}`, 'Error');
          printResult = { 
            success: false, 
            error: directPrintError.message, 
            method: 'direct' 
          };
        }
      }
      
      // Clean up
      printWindow.close();
      isPrinting = false;
      
      // Total time calculation
      const totalTime = Date.now() - startTime;
      updatePrintJob(jobId, printResult.success ? 'completed' : 'error', 
        `Total process time: ${totalTime}ms - Final status: ${printResult.success ? 'Success' : 'Failed'}`);
      
      // Return success with the PDF path and timing information
      return { 
        success: printResult.success, 
        pdfPath: outputPath,
        message: printResult.success ? 
          `Generated PDF with ${requestedQuantity} label(s)` : 
          `Error: ${printResult.error || 'Unknown error'}`,
        method: printResult.method || 'direct',
        jobId,
        timing: {
          total: totalTime,
          htmlLoad: htmlLoadTime,
          pdfGeneration: pdfGenTime,
          fileSave: saveTime,
          dialogTime: printResult.time
        }
      };
    } catch (error) {
      console.error('Error in print-label:', error);
      
      // Log error to event log if we have a job ID
      if (error.jobId) {
        updatePrintJob(error.jobId, 'error', `Print process error: ${error.message || 'Unknown error'}`);
        logToEventLog(`Print Job ${error.jobId} | Error: ${error.message || 'Unknown error'}`, 'Error');
      } else {
        logToEventLog(`Print Error: ${error.message || 'Unknown error'}`, 'Error');
      }
      
      isPrinting = false;
      return { success: false, error: error.message || 'Unknown error', jobId: error.jobId };
    }
  });
  
  // IPC handler to get list of printers
  safeHandle('get-printers', async () => {
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
  safeHandle('refresh-printers', async () => {
    try {
      await refreshPrinterList();
      return availablePrinters;
    } catch (error) {
      console.error('Error refreshing printers:', error);
      return { success: false, error: error.message };
    }
  });
  
  // IPC handler to get print jobs
  safeHandle('get-print-jobs', () => {
    return printJobs;
  });
  
  // IPC handler to reset print spooler
  safeHandle('reset-print-spooler', async () => {
    try {
      // Only available on Windows
      if (process.platform === 'win32') {
        // Log the spooler reset request
        logToEventLog('Print spooler reset requested by user', 'Information');
        
        // Stop and restart the print spooler service
        const command = `
          powershell.exe -Command "
            try {
              Stop-Service -Name Spooler -Force
              Start-Sleep -Seconds 2
              Start-Service -Name Spooler
              Write-Output 'Print spooler reset successfully'
            } catch {
              Write-Error $_.Exception.Message
              exit 1
            }
          "
        `;
        
        return new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error('Error resetting print spooler:', error);
              console.error('stderr:', stderr);
              logToEventLog(`Failed to reset print spooler: ${stderr || error.message}`, 'Error');
              reject({ success: false, error: stderr || error.message });
            } else {
              console.log('Print spooler reset output:', stdout);
              logToEventLog('Print spooler reset successfully', 'Information');
              resolve({ success: true, message: 'Print spooler reset successfully' });
            }
          });
        });
      } else {
        // On non-Windows platforms, just clear our job history
        printJobs = [];
        return { success: true, message: 'Print jobs cleared' };
      }
    } catch (error) {
      console.error('Error in reset-print-spooler:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  });
  
  // IPC handler to run shell commands (primarily for printer management)
  safeHandle('run-command', async (event, command) => {
    try {
      console.log('Running command:', command);
      
      // For PowerShell commands that launch printer tools, we want to bring them to the foreground
      // Use a modified approach to focus Windows when started with Start-Process
      if (command.includes('Start-Process') && process.platform === 'win32') {
        // Log the command
        logToEventLog(`Running printer command: ${command.substring(0, 100)}...`, 'Information');
        
        return new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error('Error running command:', error);
              console.error('stderr:', stderr);
              logToEventLog(`Error running command: ${stderr || error.message}`, 'Error');
              reject({ success: false, error: stderr || error.message });
            } else {
              console.log('Command output:', stdout);
              resolve({ success: true, output: stdout });
            }
          });
        });
      } 
      // For regular commands
      else {
        // Execute the command
        return new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error('Error running command:', error);
              console.error('stderr:', stderr);
              reject({ success: false, error: stderr || error.message });
            } else {
              console.log('Command output:', stdout);
              resolve({ success: true, output: stdout });
            }
          });
        });
      }
    } catch (error) {
      console.error('Error running command:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  });
  
  // Refresh the printer list
  async function refreshPrinterList() {
    try {
      console.log('Refreshing printer list...');
      availablePrinters = await getPrinters();
      console.log('Available printers:', availablePrinters);
      
      // Get the saved printer setting
      const configManager = require('./config-manager');
      const settings = configManager.loadConfig();
      const savedPrinterName = settings?.printer?.defaultPrinter;
      
      // If we couldn't get any printers, provide mock data
      if (!availablePrinters || availablePrinters.length === 0) {
        console.log('No printers found, using mock data');
        availablePrinters = [
          { name: 'Microsoft Print to PDF (Mock)', isDefault: !savedPrinterName },
          { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
        ];
        
        // If we have a saved printer, add it and mark as default
        if (savedPrinterName) {
          availablePrinters.unshift({ 
            name: savedPrinterName, 
            isDefault: true 
          });
        }
      } else {
        // Check if saved printer exists in the list
        if (savedPrinterName) {
          // Set the saved printer as default if found
          const savedPrinterExists = availablePrinters.some(p => p.name === savedPrinterName);
          
          if (savedPrinterExists) {
            // Update isDefault flags
            availablePrinters.forEach(p => {
              p.isDefault = (p.name === savedPrinterName);
            });
          } else {
            // Add the saved printer to the list if not found
            availablePrinters.unshift({ 
              name: savedPrinterName, 
              isDefault: true,
              notFound: true 
            });
          }
        }
        
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
        { name: 'Microsoft Print to PDF (Mock)', isDefault: true },
        { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
      ];
      
      return availablePrinters;
    }
  }
}

module.exports = {
  initPrinting
}; 