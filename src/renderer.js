// Pet Fresh Label Printer - Main renderer
document.addEventListener('DOMContentLoaded', async () => {
  const appDiv = document.getElementById('app');
  
  // Get current app version using IPC
  let appVersion = 'v0.1';
  try {
    // Use the exposed ipcRenderer to call for version
    window.api.getAppVersion().then(version => {
      appVersion = version;
      // Update version display if UI already rendered
      const versionElement = document.getElementById('appVersion');
      if (versionElement) {
        versionElement.textContent = appVersion;
      }
    }).catch(err => {
      console.error('Error getting app version:', err);
    });
  } catch (error) {
    console.error('Error setting up IPC communication:', error);
  }
  
  // Load product data
  let productData = {};
  
  // Settings dialog state
  let isSettingsOpen = false;
  
  try {
    const response = await fetch('../src/data/products.json');
    productData = await response.json();
    console.log('Loaded product data:', Object.keys(productData));
  } catch (error) {
    console.error('Error loading product data:', error);
    // Show error message
    appDiv.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h2>Error Loading Product Data</h2>
        <p>${error.message}</p>
      </div>
    `;
    return;
  }
  
  // Default selected category (first one in the data)
  let selectedCategory = Object.keys(productData)[0];
  
  // Search functionality
  let searchQuery = '';
  let isSearchActive = false;
  
  // Global variables to remember label position and scale between selections
  let currentLabelScale = null;
  let currentLabelTranslateX = 0;
  let currentLabelTranslateY = 0;
  let baseScale = null; // Store the base fitting scale
  
  // Function to render the UI
  function renderUI() {
    appDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f5f5f5;">
        <!-- Header -->
        <div style="background-color: #9ba03b; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 20px; font-weight: bold;">Pet Fresh Label Printing</div>
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 10px;">Printer: KITCHEN</span>
            <span style="color: #4CAF50; font-size: 24px;">●</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span id="appVersion" style="margin-right: 10px;">${appVersion}</span>
            <button id="settingsButton" style="background: none; border: none; color: white; cursor: pointer; padding: 5px; border-radius: 4px; transition: background-color 0.2s ease;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.325 2.317C8.751 0.561 11.249 0.561 11.675 2.317C11.7389 2.5808 11.8642 2.82578 12.0405 3.032C12.2168 3.23822 12.4399 3.39985 12.6907 3.50375C12.9414 3.60764 13.2132 3.65085 13.4838 3.62987C13.7544 3.60889 14.0162 3.5243 14.248 3.383C15.791 2.443 17.558 4.209 16.618 5.753C16.4769 5.98466 16.3924 6.24634 16.3715 6.51677C16.3506 6.78721 16.3938 7.05877 16.4975 7.30938C16.6013 7.55999 16.7627 7.78258 16.9687 7.95905C17.1747 8.13553 17.4194 8.26091 17.683 8.325C19.439 8.751 19.439 11.249 17.683 11.675C17.4192 11.7389 17.1742 11.8642 16.968 12.0405C16.7618 12.2168 16.6001 12.4399 16.4963 12.6907C16.3924 12.9414 16.3491 13.2132 16.3701 13.4838C16.3911 13.7544 16.4757 14.0162 16.617 14.248C17.557 15.791 15.791 17.558 14.247 16.618C14.0153 16.4769 13.7537 16.3924 13.4832 16.3715C13.2128 16.3506 12.9412 16.3938 12.6906 16.4975C12.44 16.6013 12.2174 16.7627 12.0409 16.9687C11.8645 17.1747 11.7391 17.4194 11.675 17.683C11.249 19.439 8.751 19.439 8.325 17.683C8.26108 17.4192 8.13578 17.1742 7.95949 16.968C7.7832 16.7618 7.56011 16.6001 7.30935 16.4963C7.05859 16.3924 6.78683 16.3491 6.51621 16.3701C6.24559 16.3911 5.98375 16.4757 5.752 16.617C4.209 17.557 2.442 15.791 3.382 14.247C3.5231 14.0153 3.60755 13.7537 3.62848 13.4832C3.6494 13.2128 3.60624 12.9412 3.50247 12.6906C3.3987 12.44 3.23726 12.2174 3.03127 12.0409C2.82529 11.8645 2.58056 11.7391 2.317 11.675C0.561 11.249 0.561 8.751 2.317 8.325C2.5808 8.26108 2.82578 8.13578 3.032 7.95949C3.23822 7.7832 3.39985 7.56011 3.50375 7.30935C3.60764 7.05859 3.65085 6.78683 3.62987 6.51621C3.60889 6.24559 3.5243 5.98375 3.383 5.752C2.443 4.209 4.209 2.442 5.753 3.382C6.753 4.011 8.049 3.696 8.325 2.317Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="display: flex; flex: 1; padding: 0; overflow: hidden;">
          <!-- Left Column - Categories -->
          <div style="width: 25%; background-color: #f5f5f5; display: flex; flex-direction: column; border-right: 1px solid #ddd;">
            <!-- Search Box -->
            <div style="padding: 10px; border-bottom: 1px solid #ddd;">
              <div style="display: flex; position: relative;">
                <input id="searchInput" type="text" placeholder="Search products..." 
                  style="flex: 1; padding: 8px 32px 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);" 
                  value="${searchQuery}">
                ${searchQuery ? `
                  <button id="clearSearch" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; width: 18px; height: 18px; display: flex; justify-content: center; align-items: center; border-radius: 50%; background-color: #9e9e9e; color: white; font-size: 14px; line-height: 1; padding: 0;">
                    <span style="position: relative; top: -1px;">✕</span>
                  </button>
                ` : ''}
              </div>
            </div>
            
            <!-- Category List -->
            <div style="flex: 1; overflow-y: auto; overflow-x: hidden;">
              ${Object.entries(productData).map(([category, data]) => {
                const isSelected = category === selectedCategory && !isSearchActive;
                return `
                  <div class="category-item" 
                       data-category="${category}"
                       style="position: relative; background-color: ${data.color}; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 2px; cursor: pointer; ${isSelected ? 'clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%);' : 'margin-right: 15px;'}">
                    ${category}
                    ${isSelected ? `
                      <div style="position: absolute; right: 0; top: 0; width: 0; height: 0; border-top: 25px solid white; border-left: 15px solid transparent; transform: translateY(0);"></div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- Middle Column - Products -->
          <div style="width: 50%; background-color: white; overflow-y: auto; display: flex; flex-direction: column; padding: 15px;">
            <!-- Product Categories -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-weight: bold; font-size: 28px;">${isSearchActive ? 'SEARCH RESULTS' : 'PRODUCTS'}</h2>
              ${isSearchActive ? `
                <div style="display: flex; align-items: center; background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px;">
                  <span style="margin-right: 10px; font-size: 14px;">Search: "${searchQuery}"</span>
                  <button id="clearSearchResults" style="background: none; border: none; cursor: pointer; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; border-radius: 50%; background-color: #9e9e9e; color: white; font-size: 12px; line-height: 1; padding: 0;">
                    <span style="position: relative; top: -1px;">✕</span>
                  </button>
                </div>
              ` : ''}
            </div>
            
            <!-- Products Display -->
            <div id="productsContainer">
              ${(() => {
                const filteredProducts = getFilteredProducts();
                
                if (filteredProducts.length === 0) {
                  return `
                    <div style="text-align: center; color: #888; padding: 40px 0;">
                      ${isSearchActive ? 'No products match your search' : 'No products in this category'}
                    </div>
                  `;
                }
                
                if (isSearchActive || !hasMultipleProductTypes(filteredProducts)) {
                  // Display a simple grid for search results or when there's only one product type
                  return `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
                      ${filteredProducts.map(product => {
                        // Format price from cents to dollars
                        const formattedPrice = product.productprice ? 
                          `$${(product.productprice / 100).toFixed(2)}` : '';
                        
                        // Format size and unit
                        const sizeUnit = product.productSize ? 
                          `${product.productSize}${product.productUnit || ''}` : '';
                        
                        return `
                          <div class="product-item" 
                               data-product-id="${product.id}"
                               style="background-color: ${product.selected ? '#9ba03b' : '#ddd'}; color: ${product.selected ? 'white' : 'black'}; padding: 20px; text-align: center; font-weight: bold; cursor: pointer; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
                            <div>
                              ${product.productname.replace(/ /g, '<br/>')}
                              <div style="font-size: 14px; margin-top: 5px; color: ${product.selected ? '#eee' : '#666'};">${formattedPrice}</div>
                              <div style="font-size: 12px; color: ${product.selected ? '#eee' : '#888'};">${sizeUnit}</div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                } else {
                  // Group products by type when there are multiple types and it's not a search
                  const groupedProducts = groupProductsByType(filteredProducts);
                  
                  return Object.entries(groupedProducts).map(([type, products]) => {
                    return `
                      <div style="margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; font-weight: bold; font-size: 22px; border-bottom: 2px solid #9ba03b; padding-bottom: 8px; color: #333;">${type}</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                          ${products.map(product => {
                            // Format price from cents to dollars
                            const formattedPrice = product.productprice ? 
                              `$${(product.productprice / 100).toFixed(2)}` : '';
                            
                            // Format size and unit
                            const sizeUnit = product.productSize ? 
                              `${product.productSize}${product.productUnit || ''}` : '';
                            
                            return `
                              <div class="product-item" 
                                   data-product-id="${product.id}"
                                   style="background-color: ${product.selected ? '#9ba03b' : '#ddd'}; color: ${product.selected ? 'white' : 'black'}; padding: 20px; text-align: center; font-weight: bold; cursor: pointer; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
                                <div>
                                  ${product.productname.replace(/ /g, '<br/>')}
                                  <div style="font-size: 14px; margin-top: 5px; color: ${product.selected ? '#eee' : '#666'};">${formattedPrice}</div>
                                  <div style="font-size: 12px; color: ${product.selected ? '#eee' : '#888'};">${sizeUnit}</div>
                                </div>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    `;
                  }).join('');
                }
              })()}
            </div>
          </div>
          
          <!-- Right Column - Label Preview -->
          <div style="width: 25%; background-color: #f5f5f5; display: flex; flex-direction: column; border-left: 1px solid #ddd; height: 100%;">
            <!-- Label Preview - Now takes all available space -->
            <div id="labelPreviewContainer" style="flex: 1; background-color: white; margin: 10px 10px 10px 10px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: flex; justify-content: center; align-items: center; overflow: hidden;">
              <div style="text-align: center; width: 90%; height: 90%; border: 1px dashed #ccc; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;">
                <div style="font-size: 16px; color: #888;">Select a product to preview label</div>
              </div>
            </div>
            
            <!-- Bottom Controls Container -->
            <div style="padding: 10px; border-top: 1px solid #ddd; background-color: #f5f5f5; border-radius: 0 0 4px 4px;">
              <!-- Quantity Controls -->
              <div style="display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 10px;">
                <button id="decreaseQuantity" style="width: 40px; height: 40px; font-size: 20px; border: none; background-color: #ddd; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;">
                  <span style="font-size: 24px;">-</span>
                </button>
                <div id="quantityDisplay" style="width: 100px; text-align: center; background-color: #ddd; margin: 0 10px; padding: 8px; font-weight: bold; font-size: 20px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">1</div>
                <button id="increaseQuantity" style="width: 40px; height: 40px; font-size: 20px; border: none; background-color: #ddd; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;">
                  <span style="font-size: 24px;">+</span>
                </button>
              </div>
              
              <!-- Print Button -->
              <button id="printButton" style="width: 100%; padding: 15px; background-color: #9ba03b; color: white; border: none; font-size: 18px; font-weight: bold; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(155, 160, 59, 0.3); transition: all 0.2s ease;">PRINT LABEL</button>
            </div>
          </div>
        </div>
        
        <!-- Settings Dialog (initially hidden) -->
        ${isSettingsOpen ? `
        <div id="settingsDialog" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
          <div style="width: 80%; max-width: 800px; background-color: white; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); padding: 20px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <h2 style="margin: 0; font-size: 24px;">Settings</h2>
              <button id="closeSettings" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            <div style="padding: 20px 0;">
              <p style="color: #666; text-align: center;">Settings panel content will go here.</p>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
    
    // Add event listeners after rendering
    setupEventListeners();
  }
  
  // Function to generate label HTML from template and product data
  async function generateLabelHtml(product, category) {
    if (!product) return null;
    
    try {
      // Format the price (convert from cents to dollars)
      const formattedPrice = (product.productprice / 100).toFixed(2);
      
      // Get the first barcode if available
      const barcode = product.barcodes && product.barcodes.length > 0 ? product.barcodes[0] : '0000000000000';
      
    // Label dimensions (in mm)
    const labelWidth = 60; // Width of the label in mm
    const labelHeight = 162; // Height of the label in mm (including the bottom area)
    const gutterHeight = 34.5; // Height of the bottom gutter area
    const contentHeight = labelHeight - gutterHeight; // Height of the content area

    // Margins (in mm)
    const horizontalMargin = 5; // Left and right margins
    const contentWidth = labelWidth - (horizontalMargin * 2); // Width of content area with margins

    // Section heights (in mm)
    const productTitleHeight = 20.5; // Product title section height
    const ingredientsHeight = 15.5; // Ingredients section height
    const petFoodOnlyHeight = 6.5; // "Pet Food Only" section height
    const storageInstructionsHeight = 12.5; // Storage instructions section height
    const dataHeight = 19.5; // Date and weight section height
    const priceHeight = 3; // Price section height

    // Calculate section positions
    const contentStartY = 50; // Content starts at 50mm from top
    const titleY = contentStartY;
    const ingredientsY = titleY + productTitleHeight;
    const petFoodOnlyY = ingredientsY + ingredientsHeight;
    const storageInstructionsY = petFoodOnlyY + petFoodOnlyHeight;
    const dataY = storageInstructionsY + storageInstructionsHeight;
    const priceY = dataY + dataHeight;
      
      // Prepare product name for auto-sizing
      const productName = product.productname;
      const nameLength = productName.length;
      const words = productName.split(' ');
      
      // Calculate ideal font size
      let calculatedFontSize;
      
      // Approach: Use larger fonts for shorter texts, especially important words
      if (words.length === 1 && nameLength <= 8) {
        // Single short word - very large font
        calculatedFontSize = 8;
      } else if (nameLength <= 12) {
        // Short text - large font
        calculatedFontSize = 7;
      } else if (nameLength <= 16) {
        // Medium length - medium font
        calculatedFontSize = 6;
      } else if (nameLength <= 25) {
        // Longer text - medium-small font
        calculatedFontSize = 5;
      } else {
        // Very long text - small font
        calculatedFontSize = 4;
      }
      
      // For 2-word product names that are important (like "CHICKEN NECKS"),
      // try to keep them on one line unless they're too long
      const forceSingleLine = words.length === 2 && nameLength <= 14;
      
      // Generate product title HTML
      const productTitleHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          display: flex; 
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0.5mm;
        ">
          <div style="
            font-size: ${calculatedFontSize}mm; 
            line-height: 1.15; 
            font-weight: bold; 
            text-align: center; 
            width: 100%; 
            overflow: hidden;
            ${forceSingleLine ? 'white-space: nowrap; text-overflow: ellipsis;' : 
              'display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word;'}
          ">${productName}</div>
        </div>
      `;
      
      // Calculate best before date based on product expiration settings
      let bestBeforeDate;
      const today = new Date();
      
      if (product.expirationDuration && product.expirationType) {
        const expirationDate = new Date(today);
        
        switch (product.expirationType) {
          case 'days':
            expirationDate.setDate(expirationDate.getDate() + product.expirationDuration);
            break;
          case 'weeks':
            expirationDate.setDate(expirationDate.getDate() + (product.expirationDuration * 7));
            break;
          case 'months':
            expirationDate.setMonth(expirationDate.getMonth() + product.expirationDuration);
            break;
          case 'years':
            expirationDate.setFullYear(expirationDate.getFullYear() + product.expirationDuration);
            break;
          default:
            // Default to 30 days if type is not recognized
            expirationDate.setDate(expirationDate.getDate() + 30);
        }
        
        bestBeforeDate = expirationDate.toLocaleDateString('en-AU', {day: '2-digit', month: 'short', year: '2-digit'});
      } else {
        // Fallback to 30 days if expiration settings are not provided
        const defaultExpirationDate = new Date(today);
        defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);
        bestBeforeDate = defaultExpirationDate.toLocaleDateString('en-AU', {day: '2-digit', month: 'short', year: '2-digit'});
      }
      
      // Ingredient lines (empty if not provided)
      const ingredientsLine1 = product.ingredientsLine1 || '';
      const ingredientsLine2 = product.ingredientsLine2 || '';
      const ingredientsLine3 = product.ingredientsLine3 || '';
      
      // Generate the weight/quantity HTML based on product properties
      let weightQuantityHTML = '';
      if (product.productUnit === 'pcs' && product.productSize === 1) {
        // Don't display anything for single piece products
        weightQuantityHTML = '';
      } else if (product.productUnit === 'pcs' && product.productSize > 1) {
        weightQuantityHTML = `
          <div class="data-label">QUANTITY</div>
          <div class="data-value" style="margin-bottom: 0;">
            ${product.productSize} pieces
          </div>
        `;
      } else {
        weightQuantityHTML = `
          <div class="data-label">WEIGHT</div>
          <div class="data-value" style="margin-bottom: 0;">
            ${product.productSize}${product.productUnit}
          </div>
        `;
      }
      
      // Template variables
      const templateVars = {
        labelWidth,
        labelHeight,
        horizontalMargin,
        contentWidth,
        titleY,
        productTitleHeight,
        ingredientsY,
        ingredientsHeight,
        petFoodOnlyY,
        petFoodOnlyHeight,
        storageInstructionsY,
        storageInstructionsHeight,
        dataY,
        dataHeight,
        priceY,
        priceHeight,
        calculatedFontSize,
        productTitleHTML,
        ingredientsLine1,
        ingredientsLine2,
        ingredientsLine3,
        bestBeforeDate,
        weightQuantityHTML,
        productSize: product.productSize,
        productUnit: product.productUnit,
        barcode,
        formattedPrice,
        overlayImagePath: '../src/assets/overlay.png'
      };
      
      // Load the template file
      const templatePath = '../src/templates/label-template.html';
      const templateResponse = await fetch(templatePath);
      let templateContent = await templateResponse.text();
      
      // Replace template variables with actual values
      Object.entries(templateVars).forEach(([key, value]) => {
        const regex = new RegExp('\\$\\{' + key + '\\}', 'g');
        templateContent = templateContent.replace(regex, value);
      });
      
      return templateContent;
    } catch (error) {
      console.error('Error generating label HTML:', error);
      return `<div style="color: red;">Error generating label: ${error.message}</div>`;
    }
  }
  
  // Function to update the label preview
  async function updateLabelPreview() {
    // Find selected product
    let selectedProduct = null;
    let productCategory = '';
    
    // Check all categories for a selected product
    for (const [category, data] of Object.entries(productData)) {
      if (!data.products) continue;
      
      const product = data.products.find(p => p.selected);
      if (product) {
        selectedProduct = product;
        productCategory = category;
        break;
      }
    }
    
    const labelPreviewContainer = document.getElementById('labelPreviewContainer');
    
    if (!selectedProduct) {
      // No product selected, show empty preview
      labelPreviewContainer.innerHTML = `
        <div style="text-align: center; width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;">
          <div style="font-size: 16px; color: #888;">Select a product to preview label</div>
        </div>
      `;
      // Reset position and scale when nothing is selected
      currentLabelScale = null;
      currentLabelTranslateX = 0;
      currentLabelTranslateY = 0;
      baseScale = null;
      return;
    }
    
    try {
      // Generate label HTML
      const labelHtml = await generateLabelHtml(selectedProduct, productCategory);
      
      // Create a container with zoom controls and preview
      const previewHtml = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; background: #f5f5f5; overflow: hidden; border-radius: 4px;">
          <!-- Zoom controls -->
          <div style="padding: 8px; display: flex; justify-content: flex-end; gap: 5px; background: #e8e8e8; border-top-left-radius: 4px; border-top-right-radius: 4px; border-bottom: 1px solid #ddd;">
            <button id="zoomOut" style="width: 30px; height: 30px; font-size: 16px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">-</button>
            <button id="zoomReset" style="padding: 0 8px; height: 30px; font-size: 12px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">Reset</button>
            <button id="zoomIn" style="width: 30px; height: 30px; font-size: 16px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">+</button>
            <button id="toggleDesign" style="padding: 0 8px; height: 30px; font-size: 12px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">Show Design</button>
          </div>
          
          <!-- Preview area with drag capability -->
          <div id="labelPreviewArea" style="flex: 1; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;">
            <div id="labelElement" style="transform-origin: center; cursor: move; opacity: 0; transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              ${labelHtml}
            </div>
          </div>
        </div>
      `;
      
      // Update the preview container
      labelPreviewContainer.innerHTML = previewHtml;
      
      // Add container transitions
      const previewAreaElement = document.getElementById('labelPreviewArea');
      if (previewAreaElement) {
        previewAreaElement.style.transition = 'background-color 0.3s ease-in-out';
      }
      
      // Generate barcode locally
      const barcodeElement = document.getElementById('barcode');
      if (barcodeElement) {
        const barcode = selectedProduct.barcodes && selectedProduct.barcodes.length > 0 
          ? selectedProduct.barcodes[0] 
          : '0000000000000';
        
        // Create barcode SVG
        generateBarcode(barcodeElement, barcode);
      }
      
      // Add toggle design functionality
      const toggleDesignButton = document.getElementById('toggleDesign');
      const designOverlay = document.querySelector('.design-overlay');
      
      if (toggleDesignButton && designOverlay) {
        let designVisible = true;
        toggleDesignButton.textContent = 'Hide Design';
        
        toggleDesignButton.addEventListener('click', function() {
          designVisible = !designVisible;
          designOverlay.style.display = designVisible ? 'block' : 'none';
          toggleDesignButton.textContent = designVisible ? 'Hide Design' : 'Show Design';
        });
      }
      
      // Auto-scale to fit the preview area
      const labelElement = document.getElementById('labelElement');
      
      if (labelElement && previewAreaElement) {
        // Let the DOM update before measuring
        setTimeout(() => {
          // Get dimensions of preview area and label
          const previewRect = previewAreaElement.getBoundingClientRect();
          const labelRect = labelElement.getBoundingClientRect();
          
          // Calculate the scale needed to fit the longest side
          const scaleWidth = (previewRect.width - 40) / labelRect.width;  // -40 for padding
          const scaleHeight = (previewRect.height - 40) / labelRect.height;
          
          // Use the smaller scale to ensure the entire label fits
          const fitScale = Math.min(scaleWidth, scaleHeight);
          
          // Store the base scale if not already set
          if (baseScale === null) {
            baseScale = fitScale;
          }
          
          // Use saved scale and position if available, otherwise use the calculated fit scale
          const scale = currentLabelScale || fitScale;
          const translateX = currentLabelTranslateX;
          const translateY = currentLabelTranslateY;
          
          // Apply the transform
          labelElement.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
          
          // Fade in the label with a slight delay
          setTimeout(() => {
            labelElement.style.opacity = '1';
          }, 50);
          
          // Setup zoom and drag with current scale
          setupPreviewControls(scale, fitScale);
        }, 50);
      }
      
    } catch (error) {
      console.error('Error updating label preview:', error);
      // Show fallback preview with error message
      labelPreviewContainer.innerHTML = `
        <div style="text-align: center; width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;">
          <div style="color: red; margin-bottom: 10px;">Error generating preview</div>
          <div style="font-size: 12px;">${error.message}</div>
        </div>
      `;
      
      // Reset position and scale on error
      currentLabelScale = null;
      currentLabelTranslateX = 0;
      currentLabelTranslateY = 0;
      baseScale = null;
    }
  }
  
  // Function to generate barcode locally
  function generateBarcode(element, value) {
    if (!element) return;
    
    const barcode = value || '0000000000000';
    
    // Clear any existing content
    element.innerHTML = '';
    
    // Generate simple CODE128 barcode
    // This is a simplified version - in production you'd use a more robust implementation
    // Format: each character in the barcode is represented by 11 modules (thin/thick bars)
    const barcodeWidth = 100; // percentage width
    const height = 30;
    const moduleCount = barcode.length * 11;
    const moduleWidth = barcodeWidth / moduleCount;
    
    // Generate pseudo-random bars based on the barcode value
    // Not a real CODE128 implementation, just for visual representation
    let svg = '';
    let currentX = 0;
    
    for (let i = 0; i < barcode.length; i++) {
      const charCode = barcode.charCodeAt(i);
      
      // Generate 5 bars for each character (3 black, 2 white)
      for (let j = 0; j < 5; j++) {
        const isBlack = j % 2 === 0;
        const width = (charCode % 3 + 1) * moduleWidth; // Vary width based on char code
        
        if (isBlack) {
          svg += `<rect x="${currentX}%" y="0" width="${width}%" height="${height}" fill="black" />`;
        }
        
        currentX += width;
      }
    }
    
    element.innerHTML = svg;
    element.setAttribute('viewBox', `0 0 100 ${height}`);
    element.setAttribute('preserveAspectRatio', 'none');
  }
  
  // Function to setup zoom and drag controls for label preview
  function setupPreviewControls(initialScale, baseFitScale) {
    const labelElement = document.getElementById('labelElement');
    const previewArea = document.getElementById('labelPreviewArea');
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    const zoomResetButton = document.getElementById('zoomReset');
    
    if (!labelElement || !previewArea) return;
    
    let scale = initialScale || 1; // Use the provided initial scale or default to 1
    let isDragging = false;
    let startX, startY, translateX = currentLabelTranslateX, translateY = currentLabelTranslateY;
    let lastDistance = 0; // For pinch zoom
    
    // Store the base fit scale for reset
    const originalScale = baseFitScale || scale;
    
    // Update transform and save current position
    function updateTransform(withTransition = false) {
      if (withTransition) {
        labelElement.style.transition = 'transform 0.3s ease-out';
        setTimeout(() => {
          labelElement.style.transition = 'opacity 0.3s ease-in-out';
        }, 300);
      } else {
        labelElement.style.transition = 'opacity 0.3s ease-in-out';
      }
      
      labelElement.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
      
      // Save current values to global variables
      currentLabelScale = scale;
      currentLabelTranslateX = translateX;
      currentLabelTranslateY = translateY;
    }
    
    // Zoom in button
    zoomInButton.addEventListener('click', function() {
      scale += scale * 0.2; // 20% increase
      updateTransform(true);
    });
    
    // Zoom out button
    zoomOutButton.addEventListener('click', function() {
      scale = Math.max(scale * 0.8, originalScale * 0.5); // 20% decrease with min limit
      updateTransform(true);
    });
    
    // Reset zoom
    zoomResetButton.addEventListener('click', function() {
      scale = originalScale;
      translateX = 0;
      translateY = 0;
      updateTransform(true);
    });
    
    // Drag functionality
    labelElement.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      labelElement.style.cursor = 'grabbing';
      labelElement.style.transition = 'none'; // Disable transitions during drag
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
      
      translateX += dx;
      translateY += dy;
      
      startX = e.clientX;
      startY = e.clientY;
      
      updateTransform(false);
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        labelElement.style.cursor = 'move';
        // Don't re-enable transitions immediately to avoid jumpy behavior
        setTimeout(() => {
          labelElement.style.transition = 'opacity 0.3s ease-in-out';
        }, 50);
      }
    });
    
    // Mouse wheel zoom
    previewArea.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      const delta = -Math.sign(e.deltaY);
      const scaleFactor = delta > 0 ? 1.1 : 0.9;
      
      labelElement.style.transition = 'none'; // Disable transitions during wheel zoom
      
      // Calculate new scale with bounds
      const newScale = Math.max(originalScale * 0.5, Math.min(scale * scaleFactor, originalScale * 5));
      
      // Get mouse position relative to the label
      const rect = labelElement.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;
      
      // Calculate how much the mouse point will move at the new scale
      const scaleDiff = newScale - scale;
      
      // Adjust translation to keep the point under the mouse 
      translateX -= mouseX * scaleDiff / newScale;
      translateY -= mouseY * scaleDiff / newScale;
      
      // Apply new scale
      scale = newScale;
      
      updateTransform(false);
      
      // Re-enable transitions after a brief delay
      setTimeout(() => {
        labelElement.style.transition = 'opacity 0.3s ease-in-out';
      }, 50);
    });
    
    // Touch support for mobile - enhanced with pinch zoom
    previewArea.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        labelElement.style.transition = 'none'; // Disable transitions during touch
      } 
      else if (e.touches.length === 2) {
        // Pinch-to-zoom - calculate initial distance between touch points
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistance = Math.sqrt(dx * dx + dy * dy);
        labelElement.style.transition = 'none'; // Disable transitions during pinch
      }
      e.preventDefault();
    });
    
    previewArea.addEventListener('touchmove', function(e) {
      e.preventDefault();
      
      if (e.touches.length === 1 && isDragging) {
        // Single touch = drag
        const dx = (e.touches[0].clientX - startX) / scale;
        const dy = (e.touches[0].clientY - startY) / scale;
        
        translateX += dx;
        translateY += dy;
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        
        updateTransform(false);
      } 
      else if (e.touches.length === 2) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate the center point between the two fingers
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        // Get the element position
        const rect = labelElement.getBoundingClientRect();
        
        // Convert center to element coordinates
        const elementCenterX = (centerX - rect.left) / scale;
        const elementCenterY = (centerY - rect.top) / scale;
        
        // Calculate zoom ratio
        const ratio = distance / lastDistance;
        
        // Update scale with bounds
        const newScale = Math.max(originalScale * 0.5, Math.min(scale * ratio, originalScale * 5));
        
        // Calculate how much the center point will move at the new scale
        const scaleDiff = newScale - scale;
        
        // Adjust translation to keep the center point stable
        translateX -= elementCenterX * scaleDiff / newScale;
        translateY -= elementCenterY * scaleDiff / newScale;
        
        // Apply new scale
        scale = newScale;
        lastDistance = distance;
        
        updateTransform(false);
      }
    });
    
    previewArea.addEventListener('touchend', function(e) {
      if (e.touches.length === 0) {
        isDragging = false;
        // Re-enable transitions after a brief delay
        setTimeout(() => {
          labelElement.style.transition = 'opacity 0.3s ease-in-out';
        }, 50);
      } else if (e.touches.length === 1) {
        // If one finger is lifted but another remains, setup for dragging
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    });
  }
  
  // Get filtered products based on search or category
  function getFilteredProducts() {
    if (isSearchActive && searchQuery) {
      // Search across all categories
      const results = [];
      const lowerCaseQuery = searchQuery.toLowerCase();
      
      Object.values(productData).forEach(categoryData => {
        if (categoryData.products) {
          categoryData.products.forEach(product => {
            // Search in product name
            if (product.productname.toLowerCase().includes(lowerCaseQuery)) {
              results.push(product);
            }
          });
        }
      });
      
      return results;
    } else {
      // Return products from the selected category
      return (productData[selectedCategory]?.products || []);
    }
  }
  
  // Group products by type
  function groupProductsByType(products) {
    const groups = {};
    
    products.forEach(product => {
      const type = product.type || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(product);
    });
    
    return groups;
  }
  
  // Check if multiple product types exist
  function hasMultipleProductTypes(products) {
    const types = new Set();
    
    products.forEach(product => {
      types.add(product.type || 'Other');
    });
    
    return types.size > 1;
  }
  
  // Function to set up all event listeners
  function setupEventListeners() {
    // Settings button click handler
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
      settingsButton.addEventListener('click', function() {
        isSettingsOpen = true;
        renderUI();
      });
      
      // Add hover effect
      settingsButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      });
      
      settingsButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
    }
    
    // Close settings dialog
    const closeSettingsButton = document.getElementById('closeSettings');
    if (closeSettingsButton) {
      closeSettingsButton.addEventListener('click', function() {
        isSettingsOpen = false;
        renderUI();
      });
    }
    
    // Close settings on click outside
    const settingsDialog = document.getElementById('settingsDialog');
    if (settingsDialog) {
      settingsDialog.addEventListener('click', function(e) {
        // Close only if clicking the overlay (not the content)
        if (e.target === this) {
          isSettingsOpen = false;
          renderUI();
        }
      });
    }
    
    // Add hover effects to buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      // Skip buttons that might have custom hover states
      if (button.id === 'printButton') {
        // For the print button, use a darker green hover
        button.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#878c30';
          this.style.boxShadow = '0 3px 7px rgba(155, 160, 59, 0.4)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#9ba03b';
          this.style.boxShadow = '0 2px 5px rgba(155, 160, 59, 0.3)';
        });
      } else {
        // For all other buttons, lighten the background
        button.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#e5e5e5';
          this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#ddd';
          this.style.boxShadow = button.id.includes('Quantity') 
            ? '0 2px 4px rgba(0,0,0,0.1)' 
            : '0 1px 2px rgba(0,0,0,0.1)';
        });
      }
      
      // Add active state
      button.addEventListener('mousedown', function() {
        this.style.transform = 'translateY(1px)';
      });
      
      button.addEventListener('mouseup', function() {
        this.style.transform = 'translateY(0)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          searchQuery = this.value.trim();
          isSearchActive = searchQuery !== '';
          renderUI();
        }
      });
      
      // Give the input focus when clicking on its container
      const searchContainer = searchInput.parentElement;
      searchContainer.addEventListener('click', function(e) {
        if (e.target === this) {
          searchInput.focus();
        }
      });
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
      // Add hover effect
      clearSearchBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#757575';
      });
      
      clearSearchBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#9e9e9e';
      });
      
      clearSearchBtn.addEventListener('click', function() {
        searchQuery = '';
        searchInput.value = '';
        isSearchActive = false;
        renderUI();
      });
    }
    
    // Clear search results button
    const clearSearchResultsBtn = document.getElementById('clearSearchResults');
    if (clearSearchResultsBtn) {
      // Add hover effect
      clearSearchResultsBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#757575';
      });
      
      clearSearchResultsBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#9e9e9e';
      });
      
      clearSearchResultsBtn.addEventListener('click', function() {
        searchQuery = '';
        isSearchActive = false;
        renderUI();
      });
    }
    
    // Category selection
    const categoryElements = document.querySelectorAll('.category-item');
    categoryElements.forEach(item => {
      item.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        selectedCategory = category;
        
        // Re-render UI with new selected category
        renderUI();
      });
    });
    
    // Product selection
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
      item.addEventListener('click', async function() {
        const productId = this.getAttribute('data-product-id');
        
        // Clear all selections across all categories
        Object.entries(productData).forEach(([category, data]) => {
          if (data.products) {
            data.products.forEach(p => { p.selected = false; });
          }
        });
        
        // Select the clicked product
        const product = productData[selectedCategory].products.find(p => p.id.toString() === productId);
        if (product) {
          product.selected = true;
        }
        
        // Re-render UI
        renderUI();
        
        // Update label preview
        await updateLabelPreview();
      });
    });
    
    // Quantity controls with accelerating increment
    let quantity = 1;
    const quantityDisplay = document.getElementById('quantityDisplay');
    const decreaseButton = document.getElementById('decreaseQuantity');
    const increaseButton = document.getElementById('increaseQuantity');
    
    // Variables for acceleration
    let incrementInterval = null;
    let decrementInterval = null;
    let accelerationStage = 0;
    let accelerationTimes = [0, 500, 1500, 3000]; // Time thresholds in ms for acceleration stages
    let accelerationValues = [1, 2, 4, 8]; // Increment values for each stage
    let holdStartTime = 0;
    
    // Function to update quantity value and display
    function updateQuantity(newValue) {
      quantity = Math.max(1, newValue); // Ensure quantity doesn't go below 1
      quantityDisplay.textContent = quantity;
    }
    
    // Function to increment with acceleration based on hold time
    function incrementWithAcceleration() {
      const currentHoldTime = Date.now() - holdStartTime;
      let incrementValue = 1;
      
      // Determine which acceleration stage we're in
      for (let i = accelerationTimes.length - 1; i >= 0; i--) {
        if (currentHoldTime >= accelerationTimes[i]) {
          incrementValue = accelerationValues[i];
          accelerationStage = i;
          break;
        }
      }
      
      updateQuantity(quantity + incrementValue);
      
      // Adjust interval timing based on acceleration stage
      if (accelerationStage !== accelerationTimes.length - 1 && 
          currentHoldTime >= accelerationTimes[accelerationStage + 1]) {
        // Move to next acceleration stage
        accelerationStage++;
        
        // Clear existing interval and start a new one with faster timing
        clearInterval(incrementInterval);
        const intervalTime = Math.max(50, 200 - (accelerationStage * 50));
        incrementInterval = setInterval(incrementWithAcceleration, intervalTime);
      }
    }
    
    // Function to decrement with acceleration based on hold time
    function decrementWithAcceleration() {
      const currentHoldTime = Date.now() - holdStartTime;
      let decrementValue = 1;
      
      // Determine which acceleration stage we're in
      for (let i = accelerationTimes.length - 1; i >= 0; i--) {
        if (currentHoldTime >= accelerationTimes[i]) {
          decrementValue = accelerationValues[i];
          accelerationStage = i;
          break;
        }
      }
      
      updateQuantity(quantity - decrementValue);
      
      // Adjust interval timing based on acceleration stage
      if (accelerationStage !== accelerationTimes.length - 1 && 
          currentHoldTime >= accelerationTimes[accelerationStage + 1]) {
        // Move to next acceleration stage
        accelerationStage++;
        
        // Clear existing interval and start a new one with faster timing
        clearInterval(decrementInterval);
        const intervalTime = Math.max(50, 200 - (accelerationStage * 50));
        decrementInterval = setInterval(decrementWithAcceleration, intervalTime);
      }
    }
    
    // Increase button - click and hold
    increaseButton.addEventListener('mousedown', function(e) {
      // Immediate increment by 1
      updateQuantity(quantity + 1);
      
      // Setup acceleration for held button
      holdStartTime = Date.now();
      accelerationStage = 0;
      
      // Start interval for continuous increment
      incrementInterval = setInterval(incrementWithAcceleration, 200);
      
      e.preventDefault(); // Prevent text selection
    });
    
    increaseButton.addEventListener('mouseup', function() {
      clearInterval(incrementInterval);
    });
    
    increaseButton.addEventListener('mouseleave', function() {
      clearInterval(incrementInterval);
    });
    
    // Decrease button - click and hold
    decreaseButton.addEventListener('mousedown', function(e) {
      // Immediate decrement by 1 if possible
      if (quantity > 1) {
        updateQuantity(quantity - 1);
      }
      
      // Setup acceleration for held button
      holdStartTime = Date.now();
      accelerationStage = 0;
      
      // Start interval for continuous decrement
      decrementInterval = setInterval(decrementWithAcceleration, 200);
      
      e.preventDefault(); // Prevent text selection
    });
    
    decreaseButton.addEventListener('mouseup', function() {
      clearInterval(decrementInterval);
    });
    
    decreaseButton.addEventListener('mouseleave', function() {
      clearInterval(decrementInterval);
    });
    
    // Touch support for mobile
    increaseButton.addEventListener('touchstart', function(e) {
      // Immediate increment by 1
      updateQuantity(quantity + 1);
      
      // Setup acceleration for held button
      holdStartTime = Date.now();
      accelerationStage = 0;
      
      // Start interval for continuous increment
      incrementInterval = setInterval(incrementWithAcceleration, 200);
      
      e.preventDefault(); // Prevent scrolling
    });
    
    increaseButton.addEventListener('touchend', function() {
      clearInterval(incrementInterval);
    });
    
    decreaseButton.addEventListener('touchstart', function(e) {
      // Immediate decrement by 1 if possible
      if (quantity > 1) {
        updateQuantity(quantity - 1);
      }
      
      // Setup acceleration for held button
      holdStartTime = Date.now();
      accelerationStage = 0;
      
      // Start interval for continuous decrement
      decrementInterval = setInterval(decrementWithAcceleration, 200);
      
      e.preventDefault(); // Prevent scrolling
    });
    
    decreaseButton.addEventListener('touchend', function() {
      clearInterval(decrementInterval);
    });
    
    // Print button
    const printButton = document.getElementById('printButton');
    printButton.addEventListener('click', async function() {
      // Find selected product
      let selectedProduct = null;
      let selectedCat = null;
      
      // Check all categories for a selected product
      for (const [category, data] of Object.entries(productData)) {
        if (data.products) {
          const product = data.products.find(p => p.selected);
          if (product) {
            selectedProduct = product;
            selectedCat = category;
            break;
          }
        }
      }
      
      if (!selectedProduct) {
        alert('Please select a product first');
        return;
      }
      
      const quantity = parseInt(document.getElementById('quantityDisplay').textContent, 10);
      
      // Show confirmation
      const confirm = window.confirm(`Print ${quantity} labels for ${selectedProduct.productname}?`);
      
      if (confirm) {
        // In a real app, we would call the API to print the label
        alert(`Printing ${quantity} labels for ${selectedProduct.productname}`);
      }
    });
  }
  
  // Initial render
  renderUI();
  
  console.log('Pet Fresh Label Printer initialized');
}); 