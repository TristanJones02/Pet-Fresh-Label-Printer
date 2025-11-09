/**
 * Transform API product data to match UI component expectations
 */

/**
 * Transform a single product from API format to UI format
 */
function transformProduct(apiProduct) {
  if (!apiProduct) return null;

  return {
    // Map API fields to UI expected fields
    id: apiProduct.id,
    sku: apiProduct.sku,
    
    // Product name fields - API provides productName
    productname: apiProduct.productName || apiProduct.departmentName || 'Unnamed Product',
    productNameL1: apiProduct.productNameLine1 || '',
    productNameL2: apiProduct.productNameLine2 || '',
    name: apiProduct.productName || apiProduct.departmentName || 'Unnamed Product',
    
    // Price (convert from dollars to cents for UI compatibility)
    price: typeof apiProduct.price === 'number' ? apiProduct.price : 0,
    productprice: typeof apiProduct.price === 'number' ? Math.round(apiProduct.price * 100) : 0, // Convert to cents
    
    // Size and unit
    size: apiProduct.size || 0,
    unit: apiProduct.unit || '',
    productSize: apiProduct.size || 0,
    productUnit: apiProduct.unit || '',
    
    // Barcode
    barcode: apiProduct.primaryBarcode || '',
    barcodes: apiProduct.primaryBarcode ? [apiProduct.primaryBarcode] : [],
    primaryBarcode: apiProduct.primaryBarcode || '',
    
    // Additional product details
    productIngredients: apiProduct.productIngredients || '',
    departmentName: apiProduct.departmentName || '',
    
    // Messages/instructions
    extraMessage1: apiProduct.extraMessage1 || '',
    extraMessage2: apiProduct.extraMessage2 || '',
    extraMessage3: apiProduct.extraMessage3 || '',
    productStorageInstructions: [
      apiProduct.extraMessage1,
      apiProduct.extraMessage2,
      apiProduct.extraMessage3
    ].filter(Boolean).join('\\n') || '',
    
    // Expiration
    expirationDuration: apiProduct.expirationDuration,
    expirationType: apiProduct.expirationType,
    
    // Category/type - use scaleCategoryIds if available, otherwise departmentName
    scaleCategoryIds: apiProduct.scaleCategoryIds || [],
    type: apiProduct.departmentName || 'Other',  // Keep departmentName for product type grouping
    category: apiProduct.departmentName || 'Other',  // Keep for backwards compatibility
    
    // Keep original API data for reference
    _originalApiData: apiProduct
  };
}

/**
 * Transform a single category from API format to UI format
 */
function transformCategory(apiCategory) {
  if (!apiCategory) return null;

  return {
    id: apiCategory.id,
    name: apiCategory.categoryName,
    color: apiCategory.categoryColour || '#9ba03b',
    categoryName: apiCategory.categoryName,
    categoryColour: apiCategory.categoryColour || '#9ba03b',
    lastUpdated: apiCategory.lastUpdated,
    
    // Keep original API data for reference
    _originalApiData: apiCategory
  };
}

/**
 * Transform complete API response to UI format
 */
function transformApiData(apiData) {
  if (!apiData) return { products: [], categories: [], lastUpdated: null };

  const transformedProducts = (apiData.products || []).map(transformProduct).filter(Boolean);
  const transformedCategories = (apiData.scaleCategories || []).map(transformCategory).filter(Boolean);

  return {
    products: transformedProducts,
    categories: transformedCategories,
    scaleCategories: transformedCategories, // Keep both for compatibility
    lastUpdated: apiData.lastUpdated || new Date().toISOString()
  };
}

/**
 * Get products with validation (transform API validation format to UI format)
 */
function transformProductsWithValidation(apiProducts) {
  if (!Array.isArray(apiProducts)) return [];

  return apiProducts.map(apiProduct => {
    const transformed = transformProduct(apiProduct);
    
    return {
      ...transformed,
      hasValidationIssues: apiProduct.hasValidationIssues || false,
      missingFields: apiProduct.missingFields || []
    };
  });
}

module.exports = {
  transformProduct,
  transformCategory,
  transformApiData,
  transformProductsWithValidation
};