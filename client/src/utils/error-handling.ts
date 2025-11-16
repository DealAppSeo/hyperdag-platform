/**
 * Utilities for error handling and serialization in the HyperDAG platform
 */

/**
 * Custom replacer function for JSON.stringify to handle cyclic references
 * Used when logging objects that might contain circular references
 */
export const safeJsonReplacer = (key: string, value: any) => {
  // List of keys that often contain circular references
  const cyclicKeys = ['_events', '_newListener', '_removeListener', '_maxListeners', '_conf', 'options'];
  
  if (cyclicKeys.includes(key)) {
    return '[Circular Reference]';
  }
  
  return value;
};

/**
 * Safely stringify an object, handling circular references
 */
export const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    try {
      // Try with custom replacer
      return JSON.stringify(obj, safeJsonReplacer);
    } catch (e2) {
      // If that still fails, return a simple representation
      return '[Complex Object: Circular Reference]';
    }
  }
};

/**
 * Patch console.log to handle circular references
 * Call this function early in your application to prevent JSON serialization errors
 */
export const patchConsoleForCircularReferences = (): void => {
  const originalConsoleLog = console.log;
  const originalConsoleDebug = console.debug;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  const patchMethod = (original: any) => {
    return function(...args: any[]) {
      try {
        // Process arguments to make them safe for logging
        const safeArgs = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              // Test if object can be stringified
              JSON.stringify(arg);
              return arg;
            } catch (error) {
              // If it fails due to circular reference, create a safe copy
              try {
                return JSON.parse(safeStringify(arg));
              } catch (error2) {
                return '[Circular Object]';
              }
            }
          }
          return arg;
        });
        
        original.apply(console, safeArgs);
      } catch (error) {
        original.call(console, '[Logging error]', error instanceof Error ? error.message : String(error));
      }
    };
  };

  console.log = patchMethod(originalConsoleLog);
  console.debug = patchMethod(originalConsoleDebug);
  console.info = patchMethod(originalConsoleInfo);
  console.warn = patchMethod(originalConsoleWarn);
  console.error = patchMethod(originalConsoleError);
};