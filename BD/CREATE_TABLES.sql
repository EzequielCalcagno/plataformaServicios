-- =========================================================
-- CREACIÓN DE TABLAS BASE - SPRINT 1 (Autenticación)
-- Proyecto: Plataforma Digital de Servicios (PDS)
-- Base de datos: pds
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
    fecha_registro TIMESTAMP DEFAULT NOW(),
    id_rol INT REFERENCES roles(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 🔹 Tabla de tokens
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_expiracion TIMESTAMP
);

-- =========================================================
-- DATOS INICIALES
-- =========================================================
INSERT INTO roles (nombre, descripcion) VALUES
('cliente', 'Usuario que solicita servicios'),
('profesional', 'Usuario que ofrece servicios'),
('admin', 'Administrador del sistema');
