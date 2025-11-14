// // src/routes/auth.route.ts
// import { Router, Request, Response } from 'express';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import pool from '../db/pool';

// const router = Router();

// type RolNombre = 'cliente' | 'profesional' | 'admin';

// const JWT_SECRET = process.env.JWT_SECRET;
// if (!JWT_SECRET) {
//   // No tiramos error al importar, pero avisamos en consola.
//   console.warn('⚠️  JWT_SECRET no está definido en .env. Usá uno seguro en producción.');
// }

// const signToken = (u: { id: number; email: string; id_rol: number | null }) =>
//   jwt.sign(
//     { id: u.id, email: u.email, rol: u.id_rol ?? 0 },
//     JWT_SECRET || 'dev_secret_change_me',
//     { expiresIn: '7d' }
//   );

// // POST /v1/auth/register
// router.post('/register', async (req: Request, res: Response) => {
//   try {
//     const { nombre, apellido, email, password, telefono, ciudad, rol } = req.body as {
//       nombre: string;
//       apellido: string;
//       email: string;
//       password: string;
//       telefono?: string;
//       ciudad?: string;
//       rol: RolNombre;
//     };

//     if (!nombre || !apellido || !email || !password || !rol) {
//       return res.status(400).json({ error: 'Faltan campos requeridos' });
//     }

//     // ¿Email ya existe?
//     const dup = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
//     if ((dup.rowCount ?? 0) > 0) {
//       return res.status(409).json({ error: 'Email ya registrado' });
//     }

//     // Rol válido
//     const r = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rol]);
//     if ((r.rowCount ?? 0) === 0) {
//       return res.status(400).json({ error: 'Rol inválido' });
//     }
//     const idRol: number = r.rows[0].id;

//     // Hash de contraseña
//     const hash = await bcrypt.hash(password, 12);

//     // Crear usuario
//     const ures = await pool.query(
//       `INSERT INTO usuarios
//          (nombre, apellido, email, contrasena_hash, telefono, id_rol, verificado, activo)
//        VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE)
//        RETURNING id, nombre, apellido, email, telefono, id_rol, foto_url`,
//       [nombre, apellido, email, hash, telefono || null, idRol]
//     );
//     const user = ures.rows[0];

//     // Ubicación opcional por ciudad
//     if (ciudad) {
//       await pool.query(
//         `INSERT INTO ubicaciones
//            (usuario_id, nombre_ubicacion, ciudad, tipo, principal, activa)
//          VALUES ($1,'Principal',$2,'fija', TRUE, TRUE)`,
//         [user.id, ciudad]
//       );
//     }

//     // Token
//     const token = signToken(user);
//     await pool.query(
//       `INSERT INTO tokens (usuario_id, token, fecha_expiracion)
//        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
//       [user.id, token]
//     );

//     return res.json({ token, usuario: user });
//   } catch (e) {
//     console.error('REGISTER ERROR', e);
//     return res.status(500).json({ error: 'Error en servidor' });
//   }
// });

// // POST /v1/auth/login
// router.post('/login', async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body as { email: string; password: string };
//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email y contraseña requeridos' });
//     }

//     const q = await pool.query(
//       `SELECT id, nombre, apellido, email, contrasena_hash, telefono, id_rol, foto_url
//          FROM usuarios
//         WHERE email = $1 AND activo = TRUE`,
//       [email]
//     );
//     if ((q.rowCount ?? 0) === 0) {
//       return res.status(401).json({ error: 'Credenciales inválidas' });
//     }

//     const user = q.rows[0];
//     const ok = await bcrypt.compare(password, user.contrasena_hash);
//     if (!ok) {
//       return res.status(401).json({ error: 'Credenciales inválidas' });
//     }

//     const token = signToken(user);
//     await pool.query(
//       `INSERT INTO tokens (usuario_id, token, fecha_expiracion)
//        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
//       [user.id, token]
//     );

//     // No devolver hash
//     delete user.contrasena_hash;

//     return res.json({ token, usuario: user });
//   } catch (e) {
//     console.error('LOGIN ERROR', e);
//     return res.status(500).json({ error: 'Error en servidor' });
//   }
// });

// export default router;
