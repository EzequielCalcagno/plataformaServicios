import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger/swagger.json';

// Controladores
import { getHealth } from '../controllers/health.controller';
import { getAllUsersController } from '../controllers/users.controller';

const router = Router();

router.get('/health', getHealth);
router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.get('/users', getAllUsersController);

export default router;
