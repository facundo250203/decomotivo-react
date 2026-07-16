-- Migration 001: agrega columna stock_minimo a productos
-- No destructiva: ADD COLUMN con DEFAULT, no toca filas existentes.

ALTER TABLE productos
  ADD COLUMN stock_minimo INT NOT NULL DEFAULT 0 AFTER cantidad;
