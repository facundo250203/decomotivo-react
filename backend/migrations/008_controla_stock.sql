-- Migration 008: distingue productos con inventario real (madera, papelería
-- para reventa) de productos/servicios sin stock (copias e impresiones).
-- No destructiva: ADD COLUMN con DEFAULT true, todo el catálogo existente
-- sigue controlando stock como hasta ahora.

ALTER TABLE productos
  ADD COLUMN controla_stock BOOLEAN NOT NULL DEFAULT true AFTER stock_minimo;
