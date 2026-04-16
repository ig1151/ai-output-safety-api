import pino from 'pino';
import { config } from './config';
export const logger = pino({
  level: config.logging.level,
  base: { service: 'ai-output-safety-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
});
