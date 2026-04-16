import { Router, Request, Response, NextFunction } from 'express';
import { checkSchema, batchSchema } from '../utils/validation';
import { checkSafety } from '../services/safety.service';
import type { CheckRequest, BatchRequest } from '../types/index';
export const safetyRouter = Router();

safetyRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = checkSchema.validate(req.body, { abortEarly: false });
    if (error) { res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details.map(d => d.message) } }); return; }
    res.status(200).json(await checkSafety(value as CheckRequest));
  } catch (err) { next(err); }
});

safetyRouter.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = batchSchema.validate(req.body, { abortEarly: false });
    if (error) { res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details.map(d => d.message) } }); return; }
    const t0 = Date.now();
    const results = await Promise.allSettled((value as BatchRequest).checks.map((c: CheckRequest) => checkSafety(c)));
    const out = results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason instanceof Error ? r.reason.message : 'Unknown' });
    const safeCount = out.filter(r => !('error' in r) && (r as { safe: boolean }).safe).length;
    res.status(200).json({ batch_id: `batch_${Date.now()}`, total: (value as BatchRequest).checks.length, safe_count: safeCount, unsafe_count: (value as BatchRequest).checks.length - safeCount, results: out, latency_ms: Date.now() - t0 });
  } catch (err) { next(err); }
});
