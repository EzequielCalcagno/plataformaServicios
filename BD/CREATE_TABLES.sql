-- =========================================================
-- 🔻 ELIMINAR OBJETOS EXISTENTES (orden correcto)
-- =========================================================
DROP VIEW IF EXISTS vista_usuarios_roles CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS perfiles_profesionales CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =========================================================
-- 🧱 CREACIÓN DE TABLAS - SPRINT 1 FINAL
-- =========================================================

-- 🔹 Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 🔹 Tabla de usuarios (avatar general)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash TEXT NOT NULL,
    telefono VARCHAR(20),
    foto_url TEXT,                                   -- avatar
    tipo_autenticacion VARCHAR(30) DEFAULT 'local',  -- local | google | facebook
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    id_rol INT REFERENCES roles(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    ip_ultimo_login VARCHAR(45),
    CONSTRAINT chk_email_valido CHECK (POSITION('@' IN email) > 1)
);

-- 🔹 Tabla de tokens (sesiones o JWT)
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_origen VARCHAR(45),
    dispositivo VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_expiracion TIMESTAMP,
    valido BOOLEAN DEFAULT TRUE
);

-- 🔹 Perfil adicional para usuarios con rol profesional
CREATE TABLE perfiles_profesionales (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    descripcion TEXT,
    especialidad VARCHAR(100),
    experiencia TEXT,
    portada_url TEXT,                                -- portada/portfolio (distinta del avatar)
    rating_promedio NUMERIC(2,1),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- 🔹 Ubicaciones (múltiples por usuario) - requiere PostGIS
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_ubicacion VARCHAR(100),   -- "Casa", "Oficina", "Ubicación actual"
    ciudad VARCHAR(100),
    direccion TEXT,
    coordenadas GEOGRAPHY(Point, 4326),
    tipo VARCHAR(20) DEFAULT 'fija', -- fija | actual
    principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- Índice espacial para búsquedas por cercanía
CREATE INDEX idx_ubicaciones_coord ON ubicaciones USING GIST (coordenadas);

-- =========================================================
-- 🔸 Datos iniciales
-- =========================================================
INSERT INTO roles (nombre, descripcion)
VALUES
('cliente', 'Usuario que solicita servicios'),
('profesional', 'Usuario que ofrece servicios'),
('admin', 'Administrador del sistema');

-- =========================================================
-- 🔸 Vista auxiliar (usuarios con su rol)
-- =========================================================
CREATE OR REPLACE VIEW vista_usuarios_roles AS
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.foto_url AS avatar_url,
    r.nombre AS rol,
    u.activo
FROM usuarios u
LEFT JOIN roles r ON u.id_rol = r.id;
CREATE EXTENSION IF NOT EXISTS postgis;