import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Controladores
import { getAllUsuariosController } from '../controllers/usuarios.controller.js';

// Para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta absoluta al swagger.json
const swaggerPath = path.resolve(__dirname, '../swagger/swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

const router = Router();

router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/users', getAllUsuariosController);

export default router;
