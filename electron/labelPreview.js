/**
 * HTML-based Label Preview System
 * Generates realistic label previews using HTML templates and Puppeteer
 */

const fs = require('fs');
const path = require('path');

// Optional dependencies - will gracefully fail if not installed
let puppeteer = null;
let JsBarcode = null;
let createCanvas = null;

try {
    puppeteer = require('puppeteer');
    JsBarcode = require('jsbarcode');
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    console.log('✅ Label preview dependencies loaded successfully');
} catch (error) {
    console.warn('⚠️  Label preview dependencies not found. Install with: npm install puppeteer jsbarcode canvas');
    console.warn('    Label previews will not be generated but app will continue to work');
}

// Global browser instance
let globalBrowser = null;
let isInitializing = false;

// Initialize browser with minimal resource usage
async function initBrowser() {
    if (isInitializing) {
        // Wait for existing initialization
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return globalBrowser;
    }
    
    if (globalBrowser) return globalBrowser;
    
    isInitializing = true;
    try {
        // Determine if we're running in a packaged app
        const { app } = require('electron');
        const isPackaged = app ? app.isPackaged : false;
        
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--memory-pressure-off',
                '--max_old_space_size=512',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--font-render-hinting=none',
                '--enable-font-antialiasing',
                '--force-device-scale-factor=1',
                '--disable-gpu',  // Disable GPU for compatibility
                '--disable-software-rasterizer',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list'
            ],
            timeout: 10000  // Increased timeout
        };
        
        // Try multiple executable paths for better compatibility
        const possiblePaths = [];
        
        if (isPackaged) {
            // Try bundled Chrome first
            try {
                const bundledPath = puppeteer.executablePath();
                if (bundledPath && fs.existsSync(bundledPath)) {
                    possiblePaths.push(bundledPath);
                }
            } catch (e) {
                console.log('Bundled Chrome not found:', e.message);
            }
            
            // Try common browser installation paths on Windows (Chrome, Edge, Chromium)
            const commonPaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Chromium\\Application\\chromium.exe',
                'C:\\Program Files (x86)\\Chromium\\Application\\chromium.exe'
            ];
            
            for (const chromePath of commonPaths) {
                if (fs.existsSync(chromePath)) {
                    possiblePaths.push(chromePath);
                }
            }
        }
        
        // Try launching with different executable paths
        for (let i = 0; i < Math.max(1, possiblePaths.length); i++) {
            try {
                if (possiblePaths.length > 0 && i < possiblePaths.length) {
                    launchOptions.executablePath = possiblePaths[i];
                    console.log(`Trying Chrome executable: ${possiblePaths[i]}`);
                } else {
                    delete launchOptions.executablePath;
                    console.log('Trying default Puppeteer Chrome detection');
                }
                
                globalBrowser = await puppeteer.launch(launchOptions);
                console.log('✅ Browser launched successfully');
                break;
                
            } catch (error) {
                console.log(`❌ Failed to launch with ${possiblePaths[i] || 'default'}: ${error.message}`);
                if (i === Math.max(0, possiblePaths.length - 1)) {
                    throw new Error(`Unable to initialize browser for label generation. Tried ${possiblePaths.length || 1} different configurations. This may be due to missing system dependencies or Chrome/Chromium not being properly installed.`);
                }
            }
        }
        
        // Set up browser close handler
        globalBrowser.on('disconnected', () => {
            globalBrowser = null;
            console.log('Browser disconnected, will reinitialize on next use');
        });

        // Pre-create a page to make first generation faster
        try {
            const prewarmPage = await globalBrowser.newPage();
            await prewarmPage.setViewport({
                width: 709,
                height: 1986,
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false
            });
            
            // Set user agent for consistent rendering
            await prewarmPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            // Pre-load basic fonts
            await prewarmPage.evaluate(() => {
                // Trigger font loading
                const fonts = ['Arial Unicode MS', 'Liberation Sans Narrow', 'Arial'];
                fonts.forEach(font => {
                    const div = document.createElement('div');
                    div.style.fontFamily = font;
                    div.style.opacity = '0';
                    div.textContent = 'Font preload';
                    document.body.appendChild(div);
                    setTimeout(() => document.body.removeChild(div), 100);
                });
            });
            
            // Keep the page open for reuse
            globalBrowser._prewarmPage = prewarmPage;
        } catch (pageError) {
            console.warn('Could not pre-create page:', pageError.message);
        }
        
        console.log('Label preview browser initialized');
        return globalBrowser;
    } catch (error) {
        console.error('Browser init error:', error);
        globalBrowser = null;
        throw error;
    } finally {
        isInitializing = false;
    }
}

// Close browser after idle time to free resources
let browserIdleTimeout = null;
function scheduleBrowserClose() {
    if (browserIdleTimeout) {
        clearTimeout(browserIdleTimeout);
    }
    
    browserIdleTimeout = setTimeout(async () => {
        if (globalBrowser) {
            try {
                await globalBrowser.close();
                globalBrowser = null;
                console.log('Browser closed due to inactivity');
            } catch (error) {
                console.error('Error closing browser:', error);
            }
        }
    }, 7200000); // Close after 2 hours of inactivity for memory efficiency
}

// Cache underlay image with cleanup
let cachedUnderlayBase64 = null;
let lastMemoryCheck = 0;

// Memory monitoring and cleanup
function checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    console.log(`Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB heap`);
    
    // If memory usage is high, force cleanup
    if (heapUsedMB > 150) { // 150MB threshold
        console.log('High memory usage detected, forcing cleanup...');
        forceCleanup();
    }
    
    lastMemoryCheck = Date.now();
}

// Force cleanup of browser and cached data
async function forceCleanup() {
    if (globalBrowser) {
        try {
            await globalBrowser.close();
            globalBrowser = null;
            console.log('Browser force-closed for memory cleanup');
        } catch (error) {
            console.error('Error force-closing browser:', error);
        }
    }
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
        console.log('Garbage collection triggered');
    }
}

// Get underlay image as base64 (cached)
function getUnderlayBase64() {
    if (cachedUnderlayBase64) {
        return cachedUnderlayBase64;
    }
    
    try {
        // Try multiple possible paths for the underlay image
        const possiblePaths = [
            path.join(__dirname, '../src/assets/pf_label_underlay.jpg'),
            path.join(__dirname, '../assets/pf_label_underlay.jpg'),
            path.join(process.cwd(), 'src/assets/pf_label_underlay.jpg'),
            path.join(process.cwd(), 'assets/pf_label_underlay.jpg')
        ];
        
        let imageBuffer = null;
        let usedPath = '';
        
        for (const imagePath of possiblePaths) {
            try {
                if (fs.existsSync(imagePath)) {
                    imageBuffer = fs.readFileSync(imagePath);
                    usedPath = imagePath;
                    break;
                }
            } catch (err) {
                // Continue to next path
                continue;
            }
        }
        
        if (!imageBuffer) {
            console.error('Underlay image not found in any of the following paths:', possiblePaths);
            return '';
        }
        
        const base64 = imageBuffer.toString('base64');
        console.log('Underlay loaded successfully from:', usedPath, 'base64 length:', base64.length);
        cachedUnderlayBase64 = base64;
        return base64;
    } catch (error) {
        console.error('Error loading underlay image:', error);
        return '';
    }
}

// Calculate EAN13 check digit
function calculateEAN13CheckDigit(barcode12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode12[i]);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
}

// Generate barcode SVG
function generateBarcodeSVG(barcodeValue) {
    if (!barcodeValue || barcodeValue.length < 12) {
        return '';
    }
    
    try {
        // If 12 digits, add check digit
        if (barcodeValue.length === 12) {
            barcodeValue = barcodeValue + calculateEAN13CheckDigit(barcodeValue);
        }
        
        const canvas = createCanvas(275, 138);
        JsBarcode(canvas, barcodeValue, {
            format: "EAN13",
            width: 2.75,
            height: 103,
            displayValue: true,
            fontSize: 16,
            textMargin: 2.75,
            background: "transparent",
            lineColor: "#000000"
        });
        
        return `<img src="${canvas.toDataURL()}" style="display: block;">`;
    } catch (error) {
        console.error('Barcode generation error:', error);
        return '';
    }
}

// Pre-compiled template parts for faster generation
const HTML_HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Label</title>
    <style>
        
        body { 
            margin: 0; 
            padding: 0; 
            font-family: "Arial Unicode MS", Arial, sans-serif;
        }
        
        /* Ensure consistent font rendering */
        * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }
        
        /* Force font loading */
        @font-face {
            font-family: 'Arial Unicode MS';
            src: local('Arial Unicode MS'), local('Arial');
            font-display: block;
        }
        
        @font-face {
            font-family: 'Liberation Sans Narrow';
            src: local('Liberation Sans Narrow'), local('Arial Narrow'), local('Arial');
            font-display: block;
        }
        
        .label {
            width: 709px;
            height: 1986px;
            position: relative;
            font-family: "Arial Unicode MS", Arial, sans-serif;
            background: white;
            border: 1px solid #000;
        }

        .label-text {
            position: absolute;
            color: black;
            white-space: pre-wrap;
            font-weight: 900;
            z-index: 1;
            font-family: "Arial Unicode MS", Arial, sans-serif;
        }

        .underlay-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            object-fit: cover;
        }

        .ingredients-label {
            position: absolute;
            left: 50%;
            top: 798px;
            font-size: 27px;
            color: white;
            z-index: 2;
            text-align: center;
            line-height: 33px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 33px;
            padding: 4px 27px;
            background: black;
            width: auto;
            transform: translateX(-50%);
            letter-spacing: 0.5px;
        }

        .name-l1 {
            left: 22px;
            top: 609px;
            font-size: 77px;
            width: 665px;
            text-align: center;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .name-l2 {
            left: 23px;
            top: 681px;
            font-size: 77px;
            width: 663px;
            text-align: center;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .ingredients-text {
            left: 66px;
            top: 855px;
            font-size: 34px;
            width: 577px;
            text-align: center;
            line-height: 1.3;
            color: black;
        }

        .pet-food-only {
            left: 22px;
            top: 1015px;
            font-size: 59px;
            width: 665px;
            text-align: center;
            font-weight: 900;
            letter-spacing: 0.2px;
        }

        .special-msg1 {
            left: 78px;
            top: 1102px;
            font-size: 28px;
            width: 553px;
            text-align: center;
            color: black;
            overflow: hidden;
            white-space: nowrap;
        }

        .special-msg2 {
            left: 78px;
            top: 1138px;
            font-size: 28px;
            width: 553px;
            text-align: center;
            color: black;
            overflow: hidden;
            white-space: nowrap;
        }

        .special-msg3 {
            left: 78px;
            top: 1174px;
            font-size: 28px;
            width: 553px;
            text-align: center;
            color: black;
            overflow: hidden;
            white-space: nowrap;
        }

        .best-before-label {
            position: absolute;
            left: 70px;
            top: 1261px;
            font-size: 30px;
            color: white;
            z-index: 2;
            text-align: left;
            line-height: 28px;
            font-weight: 900;
            display: flex;
            align-items: center;
            height: 28px;
            padding: 4px 15px;
            background: black;
            width: auto;
            letter-spacing: 0.5px;
        }

        .exp-date {
            left: 70px;
            top: 1295px;
            font-size: 31px;
            font-weight: 900;
        }

        .weight-label-inverted {
            position: absolute;
            left: 70px;
            top: 1363px;
            font-size: 30px;
            color: white;
            z-index: 2;
            text-align: left;
            line-height: 28px;
            font-weight: 900;
            display: flex;
            align-items: center;
            height: 28px;
            padding: 4px 15px;
            background: black;
            width: auto;
            letter-spacing: 0.5px;
        }

        .weight-value {
            left: 70px;
            top: 1395px;
            font-size: 31px;
            font-weight: 900;
        }

        .price-value {
            left: 22px;
            top: 1458px;
            font-size: 90px;
            width: 665px;
            text-align: center;
            font-weight: 900;
            font-family: "Liberation Sans Narrow", "Arial Narrow", Arial, sans-serif;
            letter-spacing: -1px;
        }

        .price-label {
            left: 50%;
            top: 1559px;
            font-size: 27px;
            color: white;
            z-index: 2;
            text-align: center;
            line-height: 28px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 28px;
            padding: 4px 27px;
            background: black;
            width: auto;
            transform: translateX(-50%);
            letter-spacing: 0.5px;
        }

        .barcode-container {
            position: absolute;
            left: 355px;
            top: 1246px;
        }
    </style>
</head>
<body>
    <div class="label">`;

const HTML_FOOTER = `    </div>
</body>
</html>`;

// Generate HTML template function with complete label styling - optimized for speed
function generateLabelHTML(data, margins = {}) {
    // Apply margin adjustments to the styles if provided
    const topMargin = margins.top || 0;
    const leftMargin = margins.left || 0;
    const bottomMargin = margins.bottom || 0;
    const rightMargin = margins.right || 0;
    
    // Convert mm to pixels (assuming 96 DPI for screen display)
    const mmToPixels = 3.78; // 96 DPI / 25.4 mm per inch
    const topPx = Math.round(topMargin * mmToPixels);
    const leftPx = Math.round(leftMargin * mmToPixels);
    const bottomPx = Math.round(bottomMargin * mmToPixels);
    const rightPx = Math.round(rightMargin * mmToPixels);
    
    // Create margin style override
    const marginStyle = (topPx || leftPx || bottomPx || rightPx) ? `
        <style>
            .label-container {
                padding-top: ${topPx}px !important;
                padding-left: ${leftPx}px !important;
                padding-bottom: ${bottomPx}px !important;
                padding-right: ${rightPx}px !important;
            }
            .label-text {
                margin-left: ${leftPx}px !important;
            }
        </style>
    ` : '';
    
    // Fast string concatenation instead of template literals
    return HTML_HEADER + marginStyle + 
        `<img src="data:image/jpeg;base64,${data.underlayBase64}" alt="Underlay" class="underlay-image">
        
        <div class="label-text ingredients-label">INGREDIENTS</div>
        <div class="label-text price-label">PRICE</div>
        
        <div class="label-text name-l1">${data.nameL1}</div>
        <div class="label-text name-l2">${data.nameL2}</div>
        <div class="label-text ingredients-text">${data.ingredients}</div>
        <div class="label-text pet-food-only">PET FOOD ONLY</div>
        <div class="label-text special-msg1">${data.specialMsg1}</div>
        <div class="label-text special-msg2">${data.specialMsg2}</div>
        <div class="label-text special-msg3">${data.specialMsg3}</div>
        <div class="label-text best-before-label">BEST BEFORE</div>
        <div class="label-text exp-date">${data.expiry}</div>
        <div class="label-text weight-label-inverted">WEIGHT</div>
        <div class="label-text weight-value">${data.weight}</div>
        <div class="label-text price-value">${data.price}</div>
        
        <div class="barcode-container">
            ${data.barcodeHTML}
        </div>` + 
        HTML_FOOTER;
}

/**
 * Generate label preview from product data
 * @param {Object} product - Product data
 * @param {Object} margins - Margin adjustments in mm
 * @returns {Promise<string>} - Base64 encoded PNG image
 */
async function generateLabelPreview(product, margins = {}) {
    // Check if label generation dependencies are available
    if (!puppeteer || !JsBarcode || !createCanvas) {
        throw new Error('Label generation dependencies are not installed. Install with: npm install puppeteer jsbarcode canvas');
    }

    // Periodic memory check for long-running apps
    const now = Date.now();
    if (now - lastMemoryCheck > 60000) { // Check every minute
        checkMemoryUsage();
    }

    try {
        // Extract product data exactly matching Express API logic
        const nameL1 = product.productNameL1 || '';
        const nameL2 = product.productNameL2 || '';
        const ingredients = product.productIngredients || '';
        
        // Weight formatting exactly like Express API
        const weight = product.productSize && product.productUnit ? 
            `${product.productSize}${product.productUnit}` : '';
            
        // Price formatting exactly like Express API (note: no $ prefix in original)
        const price = product.productprice ? 
            `$${(product.productprice / 100).toFixed(2)}` : '$0.00';
            
        // Barcode extraction
        const barcode = product.barcodes && product.barcodes.length > 0 ? 
            product.barcodes[0] : '';
        
        // Parse special messages from storage instructions (using \\n as in Express)
        const storageInstructions = product.productStorageInstructions || '';
        const messages = storageInstructions.split('\\n').filter(msg => msg.trim());
        const specialMsg1 = messages[0] || '';
        const specialMsg2 = messages[1] || '';
        const specialMsg3 = messages[2] || '';
        
        // Calculate expiry date exactly like Express logic would
        let expiry = '';
        if (product.expirationDuration && product.expirationType) {
            const now = new Date();
            const duration = product.expirationDuration;
            
            switch (product.expirationType) {
                case 'days':
                    now.setDate(now.getDate() + duration);
                    break;
                case 'weeks':
                    now.setDate(now.getDate() + (duration * 7));
                    break;
                case 'months':
                    now.setMonth(now.getMonth() + duration);
                    break;
                case 'years':
                    now.setFullYear(now.getFullYear() + duration);
                    break;
            }
            
            // Format as DD/MM/YYYY to match Express API
            expiry = now.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        
        const barcodeHTML = generateBarcodeSVG(barcode);
        
        const html = generateLabelHTML({
            nameL1,
            nameL2,
            ingredients,
            expiry,
            weight,
            price,
            barcode,
            specialMsg1,
            specialMsg2,
            specialMsg3,
            barcodeHTML,
            underlayBase64: getUnderlayBase64()
        }, margins);
        
        // Ensure browser is ready
        let browser;
        try {
            browser = await initBrowser();
        } catch (browserError) {
            console.error('Browser initialization failed:', browserError.message);
            throw new Error('Unable to initialize browser for label generation. This may be due to missing system dependencies.');
        }
        
        // Reuse pre-warmed page if available, otherwise create new one
        let page;
        if (browser._prewarmPage) {
            page = browser._prewarmPage;
            browser._prewarmPage = null; // Remove reference so it's not reused
            console.log('Using pre-warmed page for fast generation');
        } else {
            page = await browser.newPage();
            // Set viewport to match label dimensions with exact font settings
            await page.setViewport({ 
                width: 709, 
                height: 1986, 
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false
            });
            
            // Set user agent to match standard rendering
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        }
        
        try {
            
            // Ultra-fast content loading
            await page.setContent(html, { 
                waitUntil: 'domcontentloaded',
                timeout: 800  // Further reduced for speed
            });
            
            // Parallel font loading and render wait
            await Promise.allSettled([
                // Quick font check - don't wait too long
                page.waitForFunction(() => document.fonts.ready, { timeout: 50 }).catch(() => {}),
                // Minimal render wait for speed
                page.waitForTimeout(30)  // Further reduced from 50ms
            ]);
            
            // Fast low-res screenshot for preview speed
            const image = await page.screenshot({
                type: 'png',
                omitBackground: false,
                captureBeyondViewport: false,
                clip: {
                    x: 0,
                    y: 0, 
                    width: 709,
                    height: 1986
                }
            });

            // Schedule browser close to free resources
            scheduleBrowserClose();

            // Convert buffer to base64 data URL
            const base64 = image.toString('base64');
            return `data:image/png;base64,${base64}`;
            
        } finally {
            // Keep page alive for reuse instead of closing for speed
            try {
                // Clear the page content but keep it alive
                await page.evaluate(() => {
                    document.body.innerHTML = '';
                });
                // Store for reuse as pre-warmed page
                if (!globalBrowser._prewarmPage) {
                    globalBrowser._prewarmPage = page;
                } else {
                    // If we already have a pre-warmed page, close this one
                    await page.close();
                }
            } catch (closeError) {
                console.warn('Error handling page cleanup:', closeError.message);
            }
        }
        
    } catch (error) {
        console.error('Error generating label preview:', error);
        throw error;
    }
}

/**
 * Check if label preview system is ready
 * @returns {Object} - Health status
 */
function getHealthStatus() {
    return {
        status: 'OK',
        browserReady: globalBrowser !== null,
        underlayLoaded: cachedUnderlayBase64 !== null,
        dependenciesAvailable: !!(puppeteer && JsBarcode && createCanvas)
    };
}

// Smart pre-warming: delay browser initialization to prevent startup lag
if (puppeteer && JsBarcode && createCanvas) {
    try {
        // Pre-load underlay image immediately
        getUnderlayBase64();
        console.log('Label underlay image pre-loaded');
        
        // Pre-warm browser after a short delay to avoid blocking app startup
        setTimeout(async () => {
            try {
                console.log('Pre-warming label preview browser...');
                await initBrowser();
                console.log('Label preview browser ready for fast generation');
            } catch (error) {
                console.warn('⚠️  Failed to pre-warm browser (this is normal in some environments):', error.message);
                console.log('   Label preview will initialize on first use');
            }
        }, 1000); // 1 second delay for faster first-use
        
    } catch (error) {
        console.warn('Failed to pre-load label preview components:', error.message);
    }
}

module.exports = {
    generateLabelPreview,
    getHealthStatus,
    initBrowser,
    checkMemoryUsage,
    forceCleanup
};