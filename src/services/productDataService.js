const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { transformApiData, transformProductsWithValidation } = require('../utils/productDataTransformer');

class ProductDataService {
  constructor() {
    this.apiUrl = 'https://wms-api.neicha.com.au/labels/scale-machine-products';
    this.dataFile = null; // Will be set during initialization
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.lastSyncCheckTime = null; // Track when we last checked for updates
  }

  /**
   * Initialize the service and start auto-sync
   */
  async initialize() {
    this.dataFile = path.join(app.getPath('userData'), 'scale-products.json');
    await this.loadLocalData();
    this.startAutoSync();
    console.log('ProductDataService initialized');
  }

  /**
   * Start automatic sync every 10 minutes
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncWithLatest();
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log('Auto-sync started (10 minute interval)');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Load local data from file
   */
  async loadLocalData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        // Check if data needs migration (old format to new format)
        const needsMigration = data.products?.length > 0 && !data.products[0].productname;
        
        if (needsMigration) {
          console.log('Migrating existing data to new format...');
          // Transform existing data to new format
          const migratedData = transformApiData({
            products: data.products,
            scaleCategories: data.scaleCategories || data.categories
          });
          migratedData.lastUpdated = data.lastUpdated;
          
          // Save the migrated data
          fs.writeFileSync(this.dataFile, JSON.stringify(migratedData, null, 2));
          this.localData = migratedData;
        } else {
          this.localData = data;
        }
        
        // Only set lastSyncTime if we have actual data (successful sync)
        this.lastSyncTime = (this.localData.products?.length > 0 || this.localData.scaleCategories?.length > 0) ? this.localData.lastUpdated : null;
        console.log(`Loaded local product data: ${this.localData.products?.length || 0} products, ${this.localData.scaleCategories?.length || 0} categories`);
        return this.localData;
      } else {
        this.localData = { scaleCategories: [], categories: [], products: [], lastUpdated: null };
        this.lastSyncTime = null;
        return this.localData;
      }
    } catch (error) {
      console.error('Error loading local data:', error);
      this.localData = { scaleCategories: [], categories: [], products: [], lastUpdated: null };
      this.lastSyncTime = null;
      return this.localData;
    }
  }

  /**
   * Save data to local file
   */
  async saveLocalData(data) {
    try {
      // Check if data is already transformed (has the UI format fields)
      const isTransformed = data.products?.length > 0 && 
        (data.products[0].productname !== undefined || 
         data.products[0].productNameL1 !== undefined);
      
      // Only transform if data is in raw API format
      const dataToSave = isTransformed ? {
        ...data,
        lastUpdated: new Date().toISOString()
      } : {
        ...transformApiData(data),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(dataToSave, null, 2));
      this.localData = dataToSave;
      this.lastSyncTime = dataToSave.lastUpdated;
      console.log(`Saved local product data: ${dataToSave.products?.length || 0} products, ${dataToSave.categories?.length || 0} categories`);
      return { success: true };
    } catch (error) {
      console.error('Error saving local data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch data from API
   */
  async fetchFromAPI(lastUpdated = null) {
    try {
      let url = this.apiUrl;
      if (lastUpdated) {
        url += `?lastUpdated=${encodeURIComponent(lastUpdated)}`;
      }

      console.log(`Fetching from API: ${url}`);
      
      const response = await fetch(url);
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle API error responses
        if (data.error && data.reference) {
          return { 
            success: false, 
            error: data.error,
            reference: data.reference,
            message: data.message,
            isApiError: true
          };
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      console.log(`API response: ${data.products?.length || 0} products, ${data.scaleCategories?.length || 0} categories`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching from API:', error);
      return { success: false, error: error.message, isApiError: false };
    }
  }

  /**
   * Perform full refresh - fetch all data
   */
  async refetchAll() {
    try {
      console.log('Starting full data refetch...');
      // Update last sync check time regardless of result
      this.lastSyncCheckTime = new Date().toISOString();
      
      const result = await this.fetchFromAPI();
      
      if (result.success) {
        await this.saveLocalData(result.data);
        // Return the transformed data that was saved, not the raw API data
        const transformedData = this.getLocalData();
        return { 
          success: true, 
          message: `Successfully fetched ${transformedData.products?.length || 0} products and ${transformedData.scaleCategories?.length || 0} categories`,
          data: transformedData 
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error in refetchAll:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync with latest data using lastUpdated timestamp
   */
  async syncWithLatest() {
    try {
      console.log('Starting sync with latest data...');
      // Update last sync check time regardless of result
      this.lastSyncCheckTime = new Date().toISOString();
      
      const result = await this.fetchFromAPI(this.lastSyncTime);
      
      if (result.success) {
        if (result.data.products?.length > 0 || result.data.scaleCategories?.length > 0) {
          // Merge with existing data
          const mergedData = this.mergeData(this.localData, result.data);
          await this.saveLocalData(mergedData);
          
          // Return the saved data (which is properly transformed)
          return { 
            success: true, 
            message: `Sync completed: ${result.data.products?.length || 0} new/updated products, ${result.data.scaleCategories?.length || 0} new/updated categories`,
            data: this.localData 
          };
        } else {
          console.log('No new data to sync');
          return { 
            success: true, 
            message: 'No new data available',
            data: this.localData 
          };
        }
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error in syncWithLatest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Merge new data with existing local data
   */
  mergeData(localData, newData) {
    // Transform the new data first
    const transformedNewData = transformApiData(newData);
    
    const merged = {
      scaleCategories: [...(localData.scaleCategories || [])],
      categories: [...(localData.categories || [])],
      products: [...(localData.products || [])],
      lastUpdated: new Date().toISOString()
    };

    // Merge categories
    if (transformedNewData.categories) {
      transformedNewData.categories.forEach(newCategory => {
        const existingIndex = merged.categories.findIndex(cat => cat.id === newCategory.id);
        if (existingIndex >= 0) {
          // Preserve the full transformed category data
          merged.categories[existingIndex] = newCategory;
        } else {
          merged.categories.push(newCategory);
        }
      });
      // Keep scaleCategories in sync
      merged.scaleCategories = [...merged.categories];
    }

    // Merge products - ensure transformed data is preserved
    if (transformedNewData.products) {
      transformedNewData.products.forEach(newProduct => {
        const existingIndex = merged.products.findIndex(prod => prod.id === newProduct.id);
        if (existingIndex >= 0) {
          // Replace entirely with the new transformed product to ensure all fields are correct
          merged.products[existingIndex] = newProduct;
        } else {
          merged.products.push(newProduct);
        }
      });
    }

    return merged;
  }

  /**
   * Clear all local data
   */
  async clearLocalData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        fs.unlinkSync(this.dataFile);
      }
      this.localData = { scaleCategories: [], products: [], lastUpdated: null };
      this.lastSyncTime = null;
      console.log('Local product data cleared');
      return { success: true, message: 'Local product data cleared successfully' };
    } catch (error) {
      console.error('Error clearing local data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all local data
   */
  getLocalData() {
    return this.localData || { scaleCategories: [], products: [], lastUpdated: null };
  }

  /**
   * Get products with validation for missing fields
   */
  getProductsWithValidation() {
    const data = this.getLocalData();
    const requiredFields = [
      'sku', 'productNameLine1', 'productNameLine2', 'productIngredients',
      'primaryBarcode', 'size', 'unit', 'departmentName', 'price'
    ];

    // Check validation against original API data if available
    const validatedProducts = data.products.map(product => {
      const originalData = product._originalApiData || product;
      const missingFields = requiredFields.filter(field => 
        !originalData[field] || (typeof originalData[field] === 'string' && originalData[field].trim() === '')
      );

      return {
        ...product,
        hasValidationIssues: missingFields.length > 0,
        missingFields
      };
    });

    return transformProductsWithValidation(validatedProducts);
  }

  /**
   * Get categories
   */
  getCategories() {
    const data = this.getLocalData();
    return data.scaleCategories || [];
  }

  /**
   * Get sync status information
   */
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      lastSyncCheckTime: this.lastSyncCheckTime,
      isAutoSyncActive: this.syncInterval !== null,
      hasLocalData: this.localData && (this.localData.products?.length > 0 || this.localData.scaleCategories?.length > 0),
      productCount: this.localData?.products?.length || 0,
      categoryCount: this.localData?.scaleCategories?.length || 0
    };
  }

  /**
   * Destroy the service
   */
  destroy() {
    this.stopAutoSync();
  }
}

module.exports = ProductDataService;