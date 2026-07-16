-- Migration 012: muchos proveedores se manejan por Instagram/Facebook en
-- vez de (o adicionalmente a) email.

ALTER TABLE proveedores
  ADD COLUMN instagram VARCHAR(150) NULL AFTER email,
  ADD COLUMN facebook VARCHAR(150) NULL AFTER instagram;
