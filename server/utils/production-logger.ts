import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const productionLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction 
      ? winston.format.json()
      : winston.format.colorize({ all: true })
  ),
  transports: [
    new winston.transports.Console({
      silent: false
    })
  ]
});

// Replace console.log with structured logging in production
if (isProduction) {
  const originalConsole = console.log;
  console.log = (...args: any[]) => {
    productionLogger.info(args.join(' '));
  };
  
  console.error = (...args: any[]) => {
    productionLogger.error(args.join(' '));
  };
}