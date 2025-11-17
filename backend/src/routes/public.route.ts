import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger/swagger.json';

// Controladores
import { getAllUsuariosController } from '../controllers/usuarios.controller';

const router = Router();

router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/users', getAllUsuariosController);

export default router;
