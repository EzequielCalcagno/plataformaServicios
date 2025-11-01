-- =========================================================
-- Sprint 1: Base extendida con soporte de ubicaciones múltiples
-- =========================================================

-- 🔹 Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

-- 🔹 Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash TEXT NOT NULL,
    telefono VARCHAR(20),
    tipo_autenticacion VARCHAR(30) DEFAULT 'local', -- local / google / facebook
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    id_rol INT REFERENCES roles(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 🔹 Tabla de tokens (para sesiones o JWT)
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_expiracion TIMESTAMP
);

-- 🔹 Tabla de perfiles profesionales
CREATE TABLE perfiles_profesionales (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    descripcion TEXT,
    especialidad VARCHAR(100),
    experiencia TEXT,
    foto_url TEXT,
    rating_promedio NUMERIC(2,1),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- 🔹 Tabla de ubicaciones (múltiples por usuario)
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_ubicacion VARCHAR(100),  -- ej: "Casa", "Oficina", "Ubicación actual"
    ciudad VARCHAR(100),
    direccion TEXT,
    coordenadas GEOGRAPHY(Point, 4326),
    tipo VARCHAR(20) DEFAULT 'fija',  -- fija | actual
    principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- Índice espacial para búsquedas por cercanía
CREATE INDEX idx_ubicaciones_coord ON ubicaciones USING GIST (coordenadas);

-- =========================================================
-- Datos iniciales de roles
-- =========================================================
INSERT INTO roles (nombre, descripcion)
VALUES
('cliente', 'Usuario que solicita servicios'),
('profesional', 'Usuario que ofrece servicios'),
('admin', 'Administrador del sistema');
