/**
 * Simple logger utility for consistent logging across the application
 */

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Get current log level from environment or default to INFO
const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

// Timestamp formatter
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message) => {
  return `[${getTimestamp()}] [${level.toUpperCase()}] ${message}`;
};

// Logger implementation
export const logger = {
  error: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('error', message), ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(formatMessage('info', message), ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },
  
  // Log with custom level
  log: (level, message, ...args) => {
    const logLevel = level.toLowerCase();
    switch (logLevel) {
      case 'error':
        logger.error(message, ...args);
        break;
      case 'warn':
        logger.warn(message, ...args);
        break;
      case 'info':
        logger.info(message, ...args);
        break;
      case 'debug':
        logger.debug(message, ...args);
        break;
      default:
        console.log(formatMessage(logLevel, message), ...args);
    }
  }
};