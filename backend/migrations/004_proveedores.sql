-- Migration 004: catálogo de proveedores.

CREATE TABLE proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  direccion VARCHAR(255) NULL,
  notas TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);
