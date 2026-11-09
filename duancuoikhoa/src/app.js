import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import router from './routes.js';
import { query } from './db.js';
import { errorHandler, HttpError, respond } from './lib/http.js';

const swagger = JSON.parse(readFileSync(new URL('../docs/swagger.json', import.meta.url), 'utf8'));
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/uploads', express.static(fileURLToPath(new URL('../uploads/', import.meta.url))));
app.use('/assets', express.static(fileURLToPath(new URL('../public/', import.meta.url))));
app.get('/', (req, res) => res.redirect('/swagger'));
app.get('/health', async (req, res) => { await query('SELECT 1'); return respond(res, { database: 'connected' }); });
app.get('/swagger.json', (req, res) => res.json(swagger));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swagger, { swaggerOptions: { persistAuthorization: false } }));
app.use('/api', router);
app.use((req, res, next) => next(new HttpError(404, 'Không tìm thấy API')));
app.use(errorHandler);

export default app;
