const { ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Track if we're currently printing
let isPrinting = false;
let availablePrinters = [];

// Memory management for long-running app
let memoryMonitorInterval = null;

function startMemoryMonitoring() {
    // Check memory every 5 minutes
    memoryMonitorInterval = setInterval(() => {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const rssUsedMB = Math.round(usage.rss / 1024 / 1024);
        
        console.log(`📊 Memory: ${heapUsedMB}MB heap, ${rssUsedMB}MB total`);
        
        // Critical memory usage - show restart dialog
        if (heapUsedMB > 275) {
            console.error(`🚨 Critical memory usage: ${heapUsedMB}MB - showing restart dialog`);
            showRestartDialog(heapUsedMB);
        }
        // Warning if memory usage is high
        else if (heapUsedMB > 200) {
            console.warn(`⚠️  High memory usage: ${heapUsedMB}MB - consider restarting app`);
        }
        
        // Force garbage collection if available and memory is high
        if (heapUsedMB > 150 && global.gc) {
            console.log('🧹 Triggering garbage collection...');
            global.gc();
        }
    }, 300000); // 5 minutes
}

function stopMemoryMonitoring() {
    if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
        memoryMonitorInterval = null;
    }
}

// Show restart dialog when memory usage is critical
async function showRestartDialog(memoryUsageMB) {
    // Prevent multiple dialogs
    if (showRestartDialog._isShowing) return;
    showRestartDialog._isShowing = true;
    
    try {
        const { dialog, app, shell } = require('electron');
        
        const result = await dialog.showMessageBox({
            type: 'warning',
            title: 'High Memory Usage Detected',
            message: `The app has been running for a while and is using ${memoryUsageMB}MB of memory.`,
            detail: 'For optimal performance, it\'s recommended to restart the application or device.',
            buttons: [
                'Continue Running', 
                'Restart App', 
                'Restart Computer'
            ],
            defaultId: 1, // Default to "Restart App"
            cancelId: 0,
            icon: null
        });
        
        switch (result.response) {
            case 0: // Continue Running
                console.log('User chose to continue running despite high memory usage');
                break;
                
            case 1: // Restart App
                console.log('User chose to restart the application');
                restartApplication();
                break;
                
            case 2: // Restart Computer
                console.log('User chose to restart the computer');
                await restartComputer();
                break;
        }
    } catch (error) {
        console.error('Error showing restart dialog:', error);
    } finally {
        showRestartDialog._isShowing = false;
    }
}

// Restart the application
function restartApplication() {
    const { app } = require('electron');
    console.log('🔄 Restarting application...');
    app.relaunch();
    app.exit(0);
}

// Restart the computer/device
async function restartComputer() {
    const { exec } = require('child_process');
    const os = require('os');
    
    console.log('🔄 Restarting computer...');
    
    try {
        const platform = os.platform();
        let command;
        
        switch (platform) {
            case 'win32':
                command = 'shutdown /r /t 5 /c "Label printer app restart"';
                break;
            case 'darwin': // macOS
                command = 'sudo shutdown -r +1 "Label printer app restart"';
                break;
            case 'linux':
                command = 'sudo shutdown -r +1 "Label printer app restart"';
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
        
        exec(command, (error) => {
            if (error) {
                console.error('Error restarting computer:', error);
                // Fallback: just restart the app
                restartApplication();
            } else {
                console.log('Computer restart initiated');
            }
        });
        
    } catch (error) {
        console.error('Error initiating computer restart:', error);
        // Fallback: just restart the app
        restartApplication();
    }
}
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
    // Getting Windows printers via PowerShell
    
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
        // Parse the JSON output
        const printers = JSON.parse(stdout.trim());
        
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
    // Detecting printers on current platform
    
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
 * Generate a realistic label preview based on ZPL template structure
 * @param {string} zplData - The ZPL string with actual data
 * @param {number} width - Label width (479px for 60mm)
 * @param {number} height - Label height (1344px for 168mm)  
 * @returns {Promise<string>} Data URL of the generated preview image
 */
async function generateFallbackPreview(zplData, width, height) {
  const { createCanvas } = require('canvas');
  
  // Scale down for preview while maintaining aspect ratio
  const scale = 0.3; // Slightly larger scale for better readability
  const previewWidth = Math.floor(width * scale);
  const previewHeight = Math.floor(height * scale);
  
  // Generating realistic preview at optimal resolution
  
  const canvas = createCanvas(previewWidth, previewHeight);
  const ctx = canvas.getContext('2d');
  
  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, previewWidth, previewHeight);
  
  // Draw border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, previewWidth, previewHeight);
  
  // Extract field data from ZPL by matching the actual template fields
  const extractField = (fieldName) => {
    const regex = new RegExp(`\\^FD${fieldName}\\^FS`, 'g');
    const match = zplData.match(regex);
    if (match) {
      const fieldMatch = zplData.match(new RegExp(`\\^FD([^\\^]*)\\^FS`));
      if (fieldMatch) {
        // Find all ^FD...^FS patterns and extract our specific field
        const allFields = [...zplData.matchAll(/\^FD([^\^]*)\^FS/g)];
        for (const field of allFields) {
          if (field[1] && !field[1].includes('_VAR') && field[1].trim()) {
            // Check if this field contains our target data by position or content
            if (fieldName.includes('NAME_L1') && field[1].length > 5 && !field[1].includes('$') && allFields.indexOf(field) <= 1) {
              return field[1];
            } else if (fieldName.includes('NAME_L2') && field[1].length > 3 && !field[1].includes('$') && allFields.indexOf(field) === 1) {
              return field[1];
            } else if (fieldName.includes('PRICE') && field[1].includes('$')) {
              return field[1];
            } else if (fieldName.includes('BARCODE') && /^\d{10,}$/.test(field[1])) {
              return field[1];
            } else if (fieldName.includes('INGREDIENTS') && field[1].includes(',')) {
              return field[1];
            } else if (fieldName.includes('SPECIAL_MSG1') && field[1].includes('NATURAL')) {
              return field[1];
            } else if (fieldName.includes('SPECIAL_MSG2') && field[1].includes('COLOURS')) {
              return field[1];
            } else if (fieldName.includes('SPECIAL_MSG3') && (field[1].includes('WA') || field[1].includes('OWNED'))) {
              return field[1];
            } else if (fieldName.includes('EXP') && field[1].includes('/')) {
              return field[1];
            } else if (fieldName.includes('WGT') && (field[1].includes('kg') || field[1].includes('g'))) {
              return field[1];
            }
          }
        }
      }
    }
    return '';
  };

  // Parse the ZPL data to extract actual field values (not template placeholders)
  // Parse ZPL for actual field values
  const fieldMatches = [...zplData.matchAll(/\^FD([^\^]*)\^FS/g)];
  
  // Filter out template placeholders and static labels
  const actualData = fieldMatches
    .map(match => match[1])
    .filter(field => {
      // Exclude template variables and static text
      return field && 
             !field.includes('*_VAR') && 
             field !== 'INGREDIENTS' && 
             field !== 'BEST BEFORE' && 
             field !== 'WEIGHT' && 
             field !== 'PET FOOD ONLY' && 
             !field.includes('PRICE\\5C&') &&
             field.trim().length > 0;
    });
  
  // Filtered actual data extracted from ZPL
  
  // Extract the actual values - these should be the product data
  let nameL1 = '';
  let nameL2 = '';
  let price = '';
  let barcode = '';
  let ingredients = '';
  let specialMsg1 = '';
  let specialMsg2 = '';
  let specialMsg3 = '';
  let expiry = '';
  let weight = '';
  
  // Find product name parts and other data based on content patterns
  for (let i = 0; i < actualData.length; i++) {
    const field = actualData[i];
    
    // Check if it's a price (starts with $ or contains currency symbols)
    if (field.startsWith('$') || field.includes('$') || /^\d+\.\d{2}$/.test(field)) {
      price = field;
      continue;
    }
    
    // Check if it's a barcode (all digits, typically 12-13 digits)
    if (/^\d{10,15}$/.test(field)) {
      barcode = field;
      continue;
    }
    
    // Check if it's a date (contains slashes or date format)
    if (field.includes('/') && /\d{2}\/\d{2}\/\d{4}/.test(field)) {
      expiry = field;
      continue;
    }
    
    // Check if it's a weight (contains 'kg' or 'g')
    if (field.includes('kg') || field.includes('g') || /^\d+(\.\d+)?\s*(kg|g)$/i.test(field)) {
      weight = field;
      continue;
    }
    
    // Check if it's ingredients (contains commas and common food ingredients)
    if (field.includes(',') && (field.includes('Rice') || field.includes('Salmon') || field.includes('Chicken') || field.includes('Nutrients'))) {
      ingredients = field;
      continue;
    }
    
    // Check if it's special messages (contains typical marketing phrases)
    if (field.includes('NATURAL') || field.includes('100%')) {
      specialMsg1 = field;
      continue;
    }
    
    if (field.includes('ARTIFICIAL') || field.includes('COLOURS') || field.includes('NO ')) {
      specialMsg2 = field;
      continue;
    }
    
    if (field.includes('OWNED') || field.includes('WA') || field.includes('LOCAL')) {
      specialMsg3 = field;
      continue;
    }
    
    // Otherwise, it's likely part of the product name
    if (!nameL1 && field.length > 1) {
      nameL1 = field;
    } else if (!nameL2 && field.length > 1 && field !== nameL1) {
      nameL2 = field;
    }
  }

  // Fields extracted from ZPL data

  // Scale coordinates from ZPL template (527x1367) to our preview dimensions
  const padding = 8; // Add padding to reduce cramped appearance
  const scaleX = (x) => Math.floor((x / 527) * (previewWidth - padding * 2)) + padding;
  const scaleY = (y) => Math.floor((y / 1367) * (previewHeight - padding * 2)) + padding;
  const scaleFont = (size) => Math.max(7, Math.floor(size * scale * 1.1)); // Slightly larger fonts

  // Draw elements based on ZPL template positions
  ctx.fillStyle = '#000';

  // Product name line 1 (^FT16,472^A0N,59,58 - large, centered)
  if (nameL1) {
    ctx.font = `bold ${scaleFont(58)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(nameL1, previewWidth / 2, scaleY(472));
  }

  // Product name line 2 (^FT17,539^A0N,59,58 - large, centered)
  if (nameL2) {
    ctx.font = `bold ${scaleFont(58)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(nameL2, previewWidth / 2, scaleY(539));
  }

  // Ingredients (^FPH,1^FO69,617 - smaller, centered, multi-line)
  if (ingredients) {
    ctx.font = `${scaleFont(20)}px Arial`;
    ctx.textAlign = 'center';
    // Wrap text if too long
    const maxWidth = previewWidth - 20;
    const words = ingredients.split(' ');
    let line = '';
    let yOffset = 0;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line.trim(), previewWidth / 2, scaleY(617) + yOffset);
        line = words[i] + ' ';
        yOffset += scaleFont(25);
        if (yOffset > scaleFont(50)) break; // Max 3 lines
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), previewWidth / 2, scaleY(617) + yOffset);
    }
  }

  // "PET FOOD ONLY" (^FT120,758^A0N,45,46)
  ctx.font = `${scaleFont(45)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('PET FOOD ONLY', previewWidth / 2, scaleY(758));

  // Special messages (^FPH,1^FO69,782/802/822)
  ctx.font = `${scaleFont(20)}px Arial`;
  ctx.textAlign = 'center';
  if (specialMsg1) ctx.fillText(specialMsg1, previewWidth / 2, scaleY(782));
  if (specialMsg2) ctx.fillText(specialMsg2, previewWidth / 2, scaleY(802));
  if (specialMsg3) ctx.fillText(specialMsg3, previewWidth / 2, scaleY(822));

  // Labels and values
  ctx.font = `${scaleFont(23)}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText('BEST BEFORE', scaleX(88), scaleY(900));
  ctx.fillText('WEIGHT', scaleX(81), scaleY(975));

  if (expiry) {
    ctx.font = `${scaleFont(25)}px Arial`;
    ctx.fillText(expiry, scaleX(81), scaleY(935));
  }

  if (weight) {
    ctx.font = `${scaleFont(25)}px Arial`;
    ctx.fillText(weight, scaleX(81), scaleY(1009));
  }

  // Price (^FT16,1045^A0N,54,53 - large, centered)
  if (price) {
    ctx.font = `bold ${scaleFont(53)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(price, previewWidth / 2, scaleY(1045));
  }

  // Barcode representation (^BY2,2,75^FT282,953^BEN)
  if (barcode) {
    const barcodeX = scaleX(220); // Adjusted position for better centering
    const barcodeY = scaleY(953);
    const barcodeWidth = scaleX(180); // Wider barcode
    const barcodeHeight = scaleY(75);
    
    // Draw more realistic barcode with proper EAN13 pattern
    ctx.fillStyle = '#000';
    const thinBar = Math.max(1, Math.floor(1 * scale));
    const mediumBar = Math.max(2, Math.floor(2 * scale));
    const thickBar = Math.max(3, Math.floor(3 * scale));
    
    let x = barcodeX;
    // Start with guard bars
    ctx.fillRect(x, barcodeY - barcodeHeight, thinBar, barcodeHeight);
    x += thinBar + thinBar;
    ctx.fillRect(x, barcodeY - barcodeHeight, thinBar, barcodeHeight);
    x += thinBar + mediumBar;
    
    // Create pattern based on barcode digits
    for (let i = 0; i < barcode.length && x < barcodeX + barcodeWidth - 10; i++) {
      const digit = parseInt(barcode[i]) || 0;
      
      // Vary bar widths based on digit
      const barWidth = digit % 3 === 0 ? thinBar : digit % 3 === 1 ? mediumBar : thickBar;
      const spacing = digit % 2 === 0 ? thinBar : mediumBar;
      
      // Draw the bar
      ctx.fillRect(x, barcodeY - barcodeHeight, barWidth, barcodeHeight);
      x += barWidth + spacing;
      
      // Add extra spacing every few digits for readability
      if (i % 3 === 2) {
        x += thinBar;
      }
    }
    
    // End with guard bars
    ctx.fillRect(x, barcodeY - barcodeHeight, thinBar, barcodeHeight);
    x += thinBar + thinBar;
    ctx.fillRect(x, barcodeY - barcodeHeight, thinBar, barcodeHeight);
    
    // Barcode number below
    ctx.font = `${scaleFont(12)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(barcode, barcodeX + barcodeWidth/2, barcodeY + scaleFont(18));
  }

  // Draw underlines (^LRY^FO lines from template)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, scale * 30);
  
  // Line under barcode area
  ctx.beginPath();
  ctx.moveTo(scaleX(80), scaleY(952));
  ctx.lineTo(scaleX(183), scaleY(952));
  ctx.stroke();

  // Line under price
  ctx.beginPath();
  ctx.moveTo(scaleX(229), scaleY(1054));
  ctx.lineTo(scaleX(318), scaleY(1054));
  ctx.stroke();

  return canvas.toDataURL('image/png');
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
  
  // Import ZPL system
  const zplSystem = require('../src/zpl');
  
  // ZPL Label System Handlers
  safeHandle('generate-zpl-label', async (event, { product, options }) => {
    try {
      const labelData = await zplSystem.generateLabelData(product, options);
      return {
        success: true,
        labelData
      };
    } catch (error) {
      console.error('Error generating ZPL label:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  safeHandle('generate-zpl-preview', async (event, { product, options }) => {
    try {
      const zplContent = await zplSystem.generateZplForProduct(product, options);
      const previewDataUrl = await zplSystem.generateZplPreviewDataUrl(zplContent, options.preview);
      return {
        success: true,
        preview: previewDataUrl,
        zpl: zplContent
      };
    } catch (error) {
      console.error('Error generating ZPL preview:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  safeHandle('print-zpl-label', async (event, { product, options }) => {
    try {
      // Load margins from settings
      const fs = require('fs');
      const path = require('path');
      const { app } = require('electron');
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      
      let margins = {};
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          margins = settings.printer?.margins || {};
        } catch (err) {
          console.warn('Could not load margin settings:', err);
        }
      }
      
      // Merge margins into options
      const enhancedOptions = {
        ...options,
        margins
      };
      
      const result = await zplSystem.printProductLabel(product, enhancedOptions);
      return result;
    } catch (error) {
      console.error('Error printing ZPL label:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  safeHandle('test-zpl-printer', async (event, options) => {
    try {
      console.log('Testing ZPL printer communication...');
      const result = await zplSystem.testPrinterCommunication(options);
      console.log('ZPL printer test result:', result);
      return result;
    } catch (error) {
      console.error('Error testing ZPL printer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  safeHandle('cancel-print-job', async (event, options = {}) => {
    try {
      const networkPrinter = require('../src/zpl/networkPrinter');
      const result = await networkPrinter.sendStopCommand(options);
      return result;
    } catch (error) {
      console.error('Error cancelling print job:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  safeHandle('send-printer-command', async (event, commandType) => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const networkPrinter = require('../src/zpl/networkPrinter');
      
      // Load the appropriate ZPL command file
      const commandPath = path.join(__dirname, '../src/zpl/printer_commands', `${commandType}.zpl`);
      const commandContent = await fs.readFile(commandPath, 'utf8');
      
      // Send the command to the network printer
      const result = await networkPrinter.printToNetworkPrinter(commandContent);
      return result;
    } catch (error) {
      console.error(`Error sending ${commandType} command:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  safeHandle('check-network-share', async (event, networkPath) => {
    try {
      const fs = require('fs').promises;
      const { exec } = require('child_process');
      
      console.log(`Checking network share: ${networkPath}`);
      
      // Try to access the network share using fs.access first
      try {
        await fs.access(networkPath);
        console.log('Network share accessible via fs.access');
        return { exists: true };
      } catch (accessError) {
        console.log('fs.access failed, trying Windows net use command');
        
        // Fallback: try using Windows net use command
        return new Promise((resolve) => {
          exec(`net use | findstr "${networkPath.replace(/\\/g, '\\\\')}"`, (error, stdout, stderr) => {
            if (error) {
              console.log('Network share not found in net use list');
              resolve({ exists: false, error: `Network share ${networkPath} not accessible` });
            } else {
              console.log('Network share found in net use list');
              resolve({ exists: true });
            }
          });
        });
      }
    } catch (error) {
      console.error('Error checking network share:', error);
      return {
        exists: false,
        error: error.message
      };
    }
  });

  safeHandle('generate-html-label-preview', async (event, { product }) => {
    try {
      // Load margins from settings
      const fs = require('fs');
      const path = require('path');
      const { app } = require('electron');
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      
      let margins = {};
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          margins = settings.printer?.margins || {};
        } catch (err) {
          console.warn('Could not load margin settings for preview:', err);
        }
      }
      
      let previewDataUrl;
      
      // Try Puppeteer-based preview first (better quality but requires dependencies)
      try {
        const labelPreview = require('./labelPreview');
        previewDataUrl = await labelPreview.generateLabelPreview(product, margins);
        console.log('✅ Generated preview using Puppeteer');
      } catch (puppeteerError) {
        console.warn('Puppeteer preview failed, falling back to Electron:', puppeteerError.message);
        
        // Fall back to Electron-based preview (always works, uses built-in Chromium)
        try {
          const labelPreviewElectron = require('./labelPreviewElectron');
          previewDataUrl = await labelPreviewElectron.generateLabelPreview(product, margins);
          console.log('✅ Generated preview using Electron built-in Chromium');
        } catch (electronError) {
          console.error('Both preview methods failed:', electronError);
          throw new Error('Unable to generate label preview. Both Puppeteer and Electron methods failed.');
        }
      }
      
      return {
        success: true,
        imageDataUrl: previewDataUrl,
        width: 709,  // Label width in pixels
        height: 1986 // Label height in pixels
      };
    } catch (error) {
      console.error('Error generating HTML label preview:', error);
      
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  });

  safeHandle('convert-zpl-to-image', async (event, { zplString }) => {
    try {
      const zplImageConvert = require('@replytechnologies/zpl-image-convert');
      
      // Ensure zplString is actually a string and contains ZPL data
      let zplData = zplString;
      if (typeof zplData !== 'string') {
        console.log('ZPL data is not a string, converting:', typeof zplData);
        zplData = String(zplData);
      }
      
      // Log the ZPL data for debugging
      // Processing ZPL data
      
      // Clean the ZPL string to remove commands that might cause issues
      let cleanedZpl = zplData
        // Remove character set commands that might not be supported
        .replace(/\^CI\d+/g, '')
        // Remove field hexadecimal indicators that might cause issues
        .replace(/\^FH\\?/g, '')
        // Remove any null characters or control characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Clean up any double line breaks created by removals
        .replace(/\n\n+/g, '\n');

      // ZPL data cleaned and ready for processing
      
      // Try to decode the ZPL, but fall back to a generated preview if it fails
      let dataUrl;
      // Convert 60x168mm to pixels at 203 DPI (standard label printer DPI)
      // 60mm = 60/25.4 * 203 ≈ 479 pixels
      // 168mm = 168/25.4 * 203 ≈ 1344 pixels
      let width = 479;  // 60mm at 203 DPI
      let height = 1344; // 168mm at 203 DPI
      
      try {
        // First attempt: Try ZPL decoding
        const decodeResult = await zplImageConvert.decode(cleanedZpl);
        
        // Convert the binary data to a PNG image buffer
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(decodeResult.width, decodeResult.height);
        const ctx = canvas.getContext('2d');
        
        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, decodeResult.width, decodeResult.height);
        
        // Convert binary data to image pixels
        const imageData = ctx.createImageData(decodeResult.width, decodeResult.height);
        
        for (let i = 0; i < decodeResult.buffer.length; i++) {
          const currentByte = decodeResult.buffer[i];
          for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
            const pixelBit = (currentByte >> (7 - bitIndex)) & 0x01;
            const currentBitIndex = i * 8 + bitIndex;
            
            const y = Math.floor(currentBitIndex / decodeResult.width);
            const x = currentBitIndex % decodeResult.width;
            
            if (x < decodeResult.width && y < decodeResult.height) {
              const pixelIndex = (y * decodeResult.width + x) * 4;
              
              // Set pixel color (black = 1, white = 0)
              const color = pixelBit ? 0 : 255; // Invert: ZPL 1 = black, 0 = white
              imageData.data[pixelIndex] = color;     // R
              imageData.data[pixelIndex + 1] = color; // G  
              imageData.data[pixelIndex + 2] = color; // B
              imageData.data[pixelIndex + 3] = 255;   // A
            }
          }
        }
        
        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to data URL (PNG)
        dataUrl = canvas.toDataURL('image/png');
        width = decodeResult.width;
        height = decodeResult.height;
        
      } catch (decodeError) {
        // ZPL decode failed, generating fallback preview
        
        // Fallback: Generate a simplified preview based on the ZPL data
        dataUrl = await generateFallbackPreview(zplData, width, height);
      }
      
      return {
        success: true,
        imageDataUrl: dataUrl,
        width: width,
        height: height
      };
    } catch (error) {
      console.error('Error converting ZPL to image:', error);
      console.error('Full error details:', error);
      
      // Try to provide more helpful error information
      let errorMessage = error.message;
      if (error.message?.includes('Unsupported encoding')) {
        errorMessage = 'ZPL contains unsupported encoding commands. The preview may not be available, but printing should still work.';
      } else if (error.message?.includes('Invalid ZPL')) {
        errorMessage = 'ZPL format is invalid for preview conversion. Check ZPL template syntax.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  });
  
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
      availablePrinters = await getPrinters();
      
      // Get the saved printer setting
      const configManager = require('./config-manager');
      const settings = configManager.loadConfig();
      const savedPrinterName = settings?.printer?.defaultPrinter;
      
      // If we couldn't get any printers, provide mock data
      if (!availablePrinters || availablePrinters.length === 0) {
        // No printers found, using mock data
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
          // No Zebra printer found, adding a mock one for development
          availablePrinters.push({ name: 'ZEBRA ZD420 (Mock)', isDefault: false });
        }
      }
      
      return availablePrinters;
    } catch (error) {
      console.error('Error refreshing printer list:', error);
      
      // Return mock data in case of error
      // Error occurred, using mock data
      availablePrinters = [
        { name: 'Microsoft Print to PDF (Mock)', isDefault: true },
        { name: 'ZEBRA ZD420 (Mock)', isDefault: false }
      ];
      
      return availablePrinters;
    }
  }
}

// Start memory monitoring for long-running app
startMemoryMonitoring();

// Cleanup on process exit
process.on('exit', stopMemoryMonitoring);
process.on('SIGINT', () => {
    stopMemoryMonitoring();
    process.exit(0);
});
process.on('SIGTERM', () => {
    stopMemoryMonitoring();
    process.exit(0);
});

module.exports = {
  initPrinting,
  startMemoryMonitoring,
  stopMemoryMonitoring
}; 