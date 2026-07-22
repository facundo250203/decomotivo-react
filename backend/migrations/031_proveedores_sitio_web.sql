-- Migration 031: sitio web como un tercer dato de "redes" junto a
-- instagram/facebook (ver migración 012) -- algunos proveedores tienen
-- página propia en vez de (o además de) redes sociales.
ALTER TABLE proveedores
  ADD COLUMN sitio_web VARCHAR(255) NULL AFTER facebook;
