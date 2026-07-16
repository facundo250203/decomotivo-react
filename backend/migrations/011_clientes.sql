-- Migration 011: catálogo de clientes registrados. Sin instagram/facebook
-- a propósito (el dueño pidió esos campos solo para proveedores).

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  direccion VARCHAR(255) NULL,
  notas TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
