-- Migration 016: productos.visible_publico -- distinto de `activo` (que
-- controla si el producto existe/se puede vender) y de `controla_stock`
-- (si se descuenta inventario). Un producto puede existir, estar activo y
-- ser vendible por el admin (pedidos/ventas) sin aparecer en la tienda
-- pública -- por ejemplo, algo que se vende solo por trato directo.
--
-- Default true: todo el catálogo existente sigue viéndose igual que hoy.

ALTER TABLE productos
  ADD COLUMN visible_publico BOOLEAN NOT NULL DEFAULT true AFTER activo;
