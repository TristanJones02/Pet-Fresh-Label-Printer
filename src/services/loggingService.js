const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LoggingService {
  constructor() {
    this.isLoggingEnabled = false;
    this.logFilePath = null;
    this.logStream = null;
    this.maxLogSizeMB = 10; // Maximum log file size in MB
    this.initializeLogPath();
  }

  initializeLogPath() {
    // Use app.getPath when available (main process), otherwise use a fallback
    try {
      const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'pet-fresh-label-printer');
      const logsDir = path.join(userDataPath, 'logs');
      
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Create log file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
      this.logFilePath = path.join(logsDir, `app-log-${timestamp}.txt`);
      
    } catch (error) {
      console.error('Failed to initialize log path:', error);
      // Fallback to temp directory
      const tempDir = require('os').tmpdir();
      this.logFilePath = path.join(tempDir, 'pet-fresh-label-printer.log');
    }
  }

  enable() {
    this.isLoggingEnabled = true;
    this.rotateLogIfNeeded();
    this.log('info', 'Logging enabled');
  }

  disable() {
    this.log('info', 'Logging disabled');
    this.isLoggingEnabled = false;
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  rotateLogIfNeeded() {
    if (!this.logFilePath || !fs.existsSync(this.logFilePath)) return;
    
    const stats = fs.statSync(this.logFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > this.maxLogSizeMB) {
      // Archive old log
      const archivePath = this.logFilePath.replace('.txt', `-archived-${Date.now()}.txt`);
      fs.renameSync(this.logFilePath, archivePath);
      
      // Keep only last 5 archived logs
      const logsDir = path.dirname(this.logFilePath);
      const files = fs.readdirSync(logsDir)
        .filter(f => f.includes('-archived-'))
        .map(f => ({ name: f, path: path.join(logsDir, f), time: fs.statSync(path.join(logsDir, f)).mtime }))
        .sort((a, b) => b.time - a.time);
      
      if (files.length > 5) {
        files.slice(5).forEach(f => fs.unlinkSync(f.path));
      }
    }
  }

  formatLogEntry(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const processType = process.type || 'main';
    
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] [${processType}] ${message}`;
    
    // Add context if provided
    if (Object.keys(context).length > 0) {
      logEntry += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return logEntry + '\n';
  }

  log(level, message, context = {}) {
    if (!this.isLoggingEnabled) return;
    
    try {
      const logEntry = this.formatLogEntry(level, message, context);
      
      // Write to file
      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
      
      // Also output to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(logEntry.trim());
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Convenience methods
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

  // Log errors with stack traces
  logError(error, additionalContext = {}) {
    if (!this.isLoggingEnabled) return;
    
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      ...additionalContext
    };
    
    this.error(`Error occurred: ${error.message}`, errorInfo);
  }

  // Get log file path for display in UI
  getLogFilePath() {
    return this.logFilePath;
  }

  // Get recent log entries for quick viewing
  getRecentLogs(lines = 100) {
    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines);
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }

  // Clear log file
  clearLogs() {
    try {
      fs.writeFileSync(this.logFilePath, '', 'utf8');
      this.log('info', 'Log file cleared');
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }

  // Check if logging is enabled
  isEnabled() {
    return this.isLoggingEnabled;
  }

  // Load logging preference from settings
  async loadLoggingPreference() {
    try {
      const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'pet-fresh-label-printer');
      const settingsPath = path.join(userDataPath, 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.application?.enableLogging) {
          this.enable();
        }
      }
    } catch (error) {
      console.error('Failed to load logging preference:', error);
    }
  }

  // Save logging preference to settings
  async saveLoggingPreference(enabled) {
    try {
      const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'pet-fresh-label-printer');
      const settingsPath = path.join(userDataPath, 'settings.json');
      
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      
      if (!settings.application) {
        settings.application = {};
      }
      
      settings.application.enableLogging = enabled;
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      
      if (enabled) {
        this.enable();
      } else {
        this.disable();
      }
    } catch (error) {
      console.error('Failed to save logging preference:', error);
    }
  }
}

// Create singleton instance
const loggingService = new LoggingService();

module.exports = loggingService;