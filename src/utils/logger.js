// Renderer-side logging utility
class Logger {
  constructor() {
    this.isEnabled = false;
    this.loadSettings();
    this.setupErrorHandlers();
  }

  async loadSettings() {
    try {
      const settings = await window.api.loadSettings();
      this.isEnabled = settings?.application?.enableLogging || false;
    } catch (error) {
      console.error('Failed to load logging settings:', error);
    }
  }

  setupErrorHandlers() {
    // Catch unhandled errors in the renderer process
    window.addEventListener('error', (event) => {
      this.error('Unhandled error in renderer', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : 'No stack trace'
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection in renderer', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Override console.error to also log to file
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (this.isEnabled) {
        this.error('Console error', { 
          message: args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ')
        });
      }
    };
  }

  async log(level, message, context = {}) {
    if (!this.isEnabled) return;
    
    try {
      await window.api.logFromRenderer(level, message, context);
    } catch (error) {
      console.error('Failed to send log to main process:', error);
    }
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, context) {
    this.log('error', message, context);
  }

  debug(message, context) {
    this.log('debug', message, context);
  }

  // Log component lifecycle events
  logComponentEvent(componentName, event, details = {}) {
    this.debug(`Component ${componentName}: ${event}`, details);
  }

  // Log API calls
  logApiCall(endpoint, method, data = {}) {
    this.debug(`API Call: ${method} ${endpoint}`, data);
  }

  // Log print operations
  logPrintOperation(operation, details = {}) {
    this.info(`Print operation: ${operation}`, details);
  }

  // Log label generation
  logLabelGeneration(productName, status, details = {}) {
    if (status === 'success') {
      this.info(`Label generated successfully for: ${productName}`, details);
    } else {
      this.error(`Label generation failed for: ${productName}`, details);
    }
  }

  // Enable or disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.info('Logging enabled from UI');
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;