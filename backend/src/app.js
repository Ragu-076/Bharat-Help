import express from 'express';
import { findHelp, RequestError } from './helpRepository.js';
import { localizeErrorMessage, localizeHelpResponse, validateLanguage } from './localization.js';
import { dataSource, catalogVersion, recordCount } from './recordStore.js';
import { resourceOptions, searchResources, resourceCounts } from './resourceRepository.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => {
    res.locals.language = 'en';
    res.set({ 'Cache-Control': 'no-store', 'Content-Language': 'en' });
    next();
  });
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', dataSource, catalogVersion, recordCount, resourceCounts }));
  for (const [path, handler] of [['/api/resources/options', resourceOptions], ['/api/resources', searchResources]]) {
    app.get(path, (req, res) => {
      const language = validateLanguage(req.query.language);
      res.locals.language = language;
      res.set('Content-Language', language);
      res.json(handler(req.query));
    });
  }
  app.post('/api/help', (req, _res, next) => {
    if (!req.is('application/json')) return next(new RequestError(415, 'Use application/json.'));
    next();
  }, express.json({ limit: '10kb' }), (req, res) => {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
      throw new RequestError(400, 'Provide a JSON object with categoryId and clues.');
    }
    const language = validateLanguage(req.body.language);
    res.locals.language = language;
    res.set('Content-Language', language);
    res.json(localizeHelpResponse(findHelp(req.body.categoryId, req.body.clues), language));
  });
  app.all('/api/help', (_req, res) => {
    res.set('Allow', 'POST').status(405).json({ error: 'Use POST for help requests.' });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  // Vite forwards /api requests here; frontend assets are served separately.
  app.use((_req, res) => res.status(404).send('Route not found.'));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    if (error instanceof RequestError) {
      return res.status(error.status).json({ error: localizeErrorMessage(error.message, res.locals.language) });
    }
    console.error('Help API error:', error.message);
    res.status(500).json({ error: localizeErrorMessage('Unable to retrieve help. Please try again.', res.locals.language) });
  });
  return app;
}
