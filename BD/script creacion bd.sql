-- =========================================================
-- 🔻 ELIMINAR OBJETOS EXISTENTES (orden correcto)
-- =========================================================
drop view IF exists vista_usuarios_roles CASCADE;

drop table if exists ubicaciones CASCADE;

drop table if exists perfiles_profesionales CASCADE;

drop table if exists tokens CASCADE;

drop table if exists usuarios CASCADE;

drop table if exists roles CASCADE;

-- =========================================================
-- SECUENCIAS PARA ID DE CLIENTES Y PROFESIONALES
-- =========================================================
create sequence seq_cliente START
with
  1 INCREMENT BY 1 MINVALUE 1 OWNED BY NONE;

create sequence seq_profesional START
with
  1 INCREMENT BY 1 MINVALUE 1 OWNED BY NONE;

-- =========================================================
-- 🧱 CREACIÓN DE TABLAS - SPRINT 1 FINAL
-- =========================================================
-- 🔹 Tabla de roles
create table roles (
  id SERIAL primary key,
  nombre VARCHAR(50) unique not null,
  descripcion TEXT,
  creado_en TIMESTAMP default NOW()
);

-- 🔹 Tabla de usuarios (avatar general)
create table usuarios (
  id VARCHAR(20) primary key,
  nombre VARCHAR(100) not null,
  apellido VARCHAR(100),
  email VARCHAR(150) unique not null,
  contrasena_hash TEXT not null,
  telefono VARCHAR(20),
  foto_url TEXT, -- avatar
  tipo_autenticacion VARCHAR(30) default 'local', -- local | google | facebook
  verificado BOOLEAN default false,
  fecha_registro TIMESTAMP default NOW(),
  id_rol INT references roles (id) on delete set null,
  activo BOOLEAN default true,
  ultimo_login TIMESTAMP,
  ip_ultimo_login VARCHAR(45),
  constraint chk_email_valido check (POSITION('@' in email) > 1)
);

-- 🔹 Tabla de tokens (sesiones o JWT)
create table tokens (
  id SERIAL primary key,
  usuario_id VARCHAR(20) not null references usuarios (id) on delete CASCADE,
  token VARCHAR(500) not null,
  ip_origen VARCHAR(45),
  dispositivo VARCHAR(100),
  fecha_creacion TIMESTAMP default NOW(),
  fecha_expiracion TIMESTAMP,
  valido BOOLEAN default true
);

-- 🔹 Perfil adicional para usuarios con rol profesional
create table perfiles_profesionales (
  id SERIAL primary key,
  usuario_id VARCHAR(20) unique references usuarios (id) on delete CASCADE,
  descripcion TEXT,
  especialidad VARCHAR(100),
  experiencia TEXT,
  portada_url TEXT, -- portada/portfolio (distinta del avatar)
  rating_promedio NUMERIC(2, 1),
  fecha_actualizacion TIMESTAMP default NOW()
);

-- Antes de crear la tabla ubicaciones
create extension IF not exists postgis;

-- 🔹 Ubicaciones (múltiples por usuario) - requiere PostGIS
create table ubicaciones (
  id SERIAL primary key,
  usuario_id VARCHAR(20) references usuarios (id) on delete CASCADE,
  nombre_ubicacion VARCHAR(100), -- "Casa", "Oficina", "Ubicación actual"
  ciudad VARCHAR(100),
  direccion TEXT,
  coordenadas GEOGRAPHY (Point, 4326),
  tipo VARCHAR(20) default 'fija', -- fija | actual
  principal BOOLEAN default false,
  activa BOOLEAN default true,
  fecha_registro TIMESTAMP default NOW()
);

-- Índice espacial para búsquedas por cercanía
create index idx_ubicaciones_coord on ubicaciones using GIST (coordenadas);

-- =========================================================
-- 🔸 Datos iniciales
-- =========================================================
insert into
  roles (nombre, descripcion)
values
  ('cliente', 'Usuario que solicita servicios'),
  ('profesional', 'Usuario que ofrece servicios'),
  ('admin', 'Administrador del sistema');

-- =========================================================
-- 🔸 Vista auxiliar (usuarios con su rol)
-- =========================================================
create or replace view vista_usuarios_roles as
select
  u.id,
  u.nombre,
  u.apellido,
  u.email,
  u.foto_url as avatar_url,
  r.nombre as rol,
  u.activo
from
  usuarios u
  left join roles r on u.id_rol = r.id;

-- =========================================================
-- FUNCIONES PARA NOMENCLATURAS DE IDs
-- =========================================================
create or replace function next_cliente_id () RETURNS text as $$
DECLARE
  seq_value BIGINT;
BEGIN
  seq_value := nextval('seq_cliente');
  RETURN 'c_' || LPAD(seq_value::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

create or replace function next_profesional_id () RETURNS text as $$
DECLARE
  seq_value BIGINT;
BEGIN
  seq_value := nextval('seq_profesional');
  RETURN 'p_' || LPAD(seq_value::text, 5, '0');
END;
$$ LANGUAGE plpgsql;