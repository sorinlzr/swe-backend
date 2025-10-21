type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const formatPrefix = (name: string, level: LogLevel) => {
  const time = new Date().toISOString();
  return `[${time}] [${level.toUpperCase()}] [${name}]`;
};

const getConfiguredLevel = (): LogLevel => {
  const env = (process.env.LOG_LEVEL || '').toLowerCase();
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') return env;
  // default: show info and above in production, debug in development
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
};

const createLogger = (name = 'app'): Logger => {
  const configured = getConfiguredLevel();
  const configuredLevelNum = LEVELS[configured];

  const shouldLog = (level: LogLevel) => LEVELS[level] >= configuredLevelNum;

  return {
    debug: (...args: any[]) => {
      if (!shouldLog('debug')) return;
      console.debug(formatPrefix(name, 'debug'), ...args);
    },
    info: (...args: any[]) => {
      if (!shouldLog('info')) return;
      console.log(formatPrefix(name, 'info'), ...args);
    },
    warn: (...args: any[]) => {
      if (!shouldLog('warn')) return;
      console.warn(formatPrefix(name, 'warn'), ...args);
    },
    error: (...args: any[]) => {
      if (!shouldLog('error')) return;
      console.error(formatPrefix(name, 'error'), ...args);
    }
  };
};

export default createLogger;
