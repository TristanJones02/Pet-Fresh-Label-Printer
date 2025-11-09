/**
 * Electron-native Label Preview System
 * Uses Electron's built-in Chromium instead of Puppeteer for better performance and compatibility
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Cache for barcode generation
let JsBarcode = null;
let createCanvas = null;

try {
    JsBarcode = require('jsbarcode');
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    console.log('✅ Barcode generation dependencies loaded');
} catch (error) {
    console.warn('⚠️  Barcode generation dependencies not found');
}

// Generate barcode as base64 image
function generateBarcodeBase64(barcodeValue) {
    if (!JsBarcode || !createCanvas) {
        return ''; // Return empty if dependencies not available
    }
    
    try {
        const canvas = createCanvas(300, 100);
        JsBarcode(canvas, barcodeValue, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: false,
            margin: 0
        });
        
        // Convert to base64
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error generating barcode:', error);
        return '';
    }
}

// HTML template for label
function generateLabelHTML(data, margins = {}) {
    // Apply margin adjustments
    const topMargin = margins.top || 0;
    const leftMargin = margins.left || 0;
    const bottomMargin = margins.bottom || 0;
    const rightMargin = margins.right || 0;
    
    // Convert mm to pixels (96 DPI)
    const mmToPixels = 3.78;
    const topPx = Math.round(topMargin * mmToPixels);
    const leftPx = Math.round(leftMargin * mmToPixels);
    const bottomPx = Math.round(bottomMargin * mmToPixels);
    const rightPx = Math.round(rightMargin * mmToPixels);
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: 60mm 162mm;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
            width: 709px;
            height: 1986px;
            font-family: Arial, sans-serif;
            position: relative;
            background: white;
        }
        
        .label-container {
            width: 100%;
            height: 100%;
            position: relative;
            padding-top: ${topPx}px;
            padding-left: ${leftPx}px;
            padding-bottom: ${bottomPx}px;
            padding-right: ${rightPx}px;
            box-sizing: border-box;
        }
        
        .underlay-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        
        .label-text {
            position: absolute;
            z-index: 10;
            color: #000;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.2;
        }
        
        .product-name-l1 {
            font-size: 36px;
            top: ${260 + topPx}px;
            left: ${50 + leftPx}px;
            width: 320px;
        }
        
        .product-name-l2 {
            font-size: 36px;
            top: ${310 + topPx}px;
            left: ${50 + leftPx}px;
            width: 320px;
        }
        
        .price-value {
            font-size: 72px;
            top: ${235 + topPx}px;
            right: ${60 - rightPx}px;
            text-align: right;
        }
        
        .ingredients-text {
            font-size: 15px;
            top: ${520 + topPx}px;
            left: ${50 + leftPx}px;
            width: 609px;
            height: 280px;
            line-height: 1.3;
            text-transform: none;
            overflow: hidden;
        }
        
        .weight-text {
            font-size: 24px;
            top: ${400 + topPx}px;
            left: ${50 + leftPx}px;
        }
        
        .expiry-text {
            font-size: 20px;
            top: ${850 + topPx}px;
            left: ${50 + leftPx}px;
        }
        
        .barcode-container {
            position: absolute;
            top: ${900 + topPx}px;
            left: ${200 + leftPx}px;
            width: 309px;
            height: 100px;
            z-index: 10;
        }
        
        .barcode-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .special-msg {
            font-size: 18px;
            position: absolute;
            left: ${50 + leftPx}px;
            width: 609px;
            text-align: center;
        }
        
        .special-msg-1 { top: ${1100 + topPx}px; }
        .special-msg-2 { top: ${1140 + topPx}px; }
        .special-msg-3 { top: ${1180 + topPx}px; }
        
        .hostname-text {
            font-size: 14px;
            position: absolute;
            bottom: ${20 + bottomPx}px;
            right: ${20 - rightPx}px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="label-container">
        <img src="${data.underlayBase64 || ''}" alt="" class="underlay-image">
        
        <div class="label-text product-name-l1">${data.nameL1 || ''}</div>
        <div class="label-text product-name-l2">${data.nameL2 || ''}</div>
        <div class="label-text price-value">${data.price || '$0.00'}</div>
        <div class="label-text ingredients-text">${data.ingredients || ''}</div>
        <div class="label-text weight-text">${data.weight || ''}</div>
        <div class="label-text expiry-text">USE BY: ${data.expiry || ''}</div>
        
        <div class="barcode-container">
            ${data.barcodeBase64 ? `<img src="${data.barcodeBase64}" class="barcode-image" />` : ''}
        </div>
        
        <div class="label-text special-msg special-msg-1">${data.specialMsg1 || ''}</div>
        <div class="label-text special-msg special-msg-2">${data.specialMsg2 || ''}</div>
        <div class="label-text special-msg special-msg-3">${data.specialMsg3 || ''}</div>
        
        <div class="hostname-text">${data.hostname || require('os').hostname()}</div>
    </div>
</body>
</html>`;
}

// Get underlay image as base64
function getUnderlayBase64() {
    try {
        const underlayPath = path.join(__dirname, '..', 'public', 'assets', 'underlay.jpg');
        if (fs.existsSync(underlayPath)) {
            const imageBuffer = fs.readFileSync(underlayPath);
            return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        }
    } catch (error) {
        console.warn('Could not load underlay image:', error);
    }
    return '';
}

/**
 * Generate label preview using Electron's built-in Chromium
 * @param {Object} product - Product data
 * @param {Object} margins - Margin adjustments in mm
 * @returns {Promise<string>} - Base64 encoded PNG image
 */
async function generateLabelPreview(product, margins = {}) {
    try {
        // Extract product data
        const nameL1 = product.productNameL1 || '';
        const nameL2 = product.productNameL2 || '';
        const ingredients = product.productIngredients || '';
        
        const weight = product.productSize && product.productUnit ? 
            `${product.productSize}${product.productUnit}` : '';
            
        const price = product.productprice ? 
            `$${(product.productprice / 100).toFixed(2)}` : '$0.00';
            
        const barcode = product.barcodes && product.barcodes.length > 0 ? 
            product.barcodes[0] : '';
        
        const storageInstructions = product.productStorageInstructions || '';
        const messages = storageInstructions.split('\\n').filter(msg => msg.trim());
        const specialMsg1 = messages[0] || '';
        const specialMsg2 = messages[1] || '';
        const specialMsg3 = messages[2] || '';
        
        // Calculate expiry date
        let expiry = '';
        if (product.expirationDuration && product.expirationType) {
            const expiryDate = new Date();
            const duration = parseInt(product.expirationDuration) || 0;
            
            switch (product.expirationType?.toLowerCase()) {
                case 'days':
                    expiryDate.setDate(expiryDate.getDate() + duration);
                    break;
                case 'weeks':
                    expiryDate.setDate(expiryDate.getDate() + (duration * 7));
                    break;
                case 'months':
                    expiryDate.setMonth(expiryDate.getMonth() + duration);
                    break;
            }
            
            expiry = expiryDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        }
        
        // Generate barcode
        const barcodeBase64 = barcode ? generateBarcodeBase64(barcode) : '';
        
        // Generate HTML
        const html = generateLabelHTML({
            nameL1,
            nameL2,
            ingredients,
            expiry,
            weight,
            price,
            specialMsg1,
            specialMsg2,
            specialMsg3,
            barcodeBase64,
            underlayBase64: getUnderlayBase64(),
            hostname: require('os').hostname()
        }, margins);
        
        // Create hidden browser window
        const win = new BrowserWindow({
            width: 709,
            height: 1986,
            show: false,
            webPreferences: {
                offscreen: true,
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        
        // Load HTML
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        
        // Wait a bit for rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the page
        const image = await win.webContents.capturePage();
        const buffer = image.toPNG();
        
        // Clean up
        win.destroy();
        
        // Return as base64
        return `data:image/png;base64,${buffer.toString('base64')}`;
        
    } catch (error) {
        console.error('Error generating label preview with Electron:', error);
        throw error;
    }
}

module.exports = {
    generateLabelPreview
};