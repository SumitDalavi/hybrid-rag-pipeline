import { logger } from '../src/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('logs info', () => {
    logger.info('test info', { foo: 'bar' });
    expect(consoleLogSpy).toHaveBeenCalled();
    const logArg = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logArg.level).toBe('info');
    expect(logArg.msg).toBe('test info');
    expect(logArg.foo).toBe('bar');
  });

  it('logs error', () => {
    logger.error('test error', { foo: 'bar' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logArg = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logArg.level).toBe('error');
    expect(logArg.msg).toBe('test error');
  });

  it('logs warn', () => {
    logger.warn('test warn', { foo: 'bar' });
    expect(consoleWarnSpy).toHaveBeenCalled();
    const logArg = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
    expect(logArg.level).toBe('warn');
  });

  it('does not log debug when LOG_LEVEL is not debug', () => {
    logger.debug('test debug');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });

  it('logs debug when LOG_LEVEL is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    logger.debug('test debug', { foo: 'bar' });
    expect(consoleDebugSpy).toHaveBeenCalled();
    const logArg = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
    expect(logArg.level).toBe('debug');
  });
});
