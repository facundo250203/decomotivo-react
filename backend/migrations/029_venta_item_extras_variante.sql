-- Migration 029: soporte de variante en extras por línea de venta.
-- Corrige una limitación de diseño de la migración 025 ("los extras no
-- tienen concepto de variante, solo aplican las reglas a nivel producto"):
-- para un producto con precio_tipo='variantes' (ver migración 018), el stock
-- real vive SIEMPRE en producto_variantes.cantidad -- productos.cantidad
-- queda en 0 como placeholder. Un extra que referenciaba ese producto sin
-- poder indicar variante intentaba descontar stock del padre (0) y fallaba
-- "Stock insuficiente" sin importar cuánto stock real hubiera en sus
-- variantes. Mismo patrón exacto que venta_items.producto_variante_id
-- (migración 018): nullable, la mayoría de los extras de catálogo no
-- referencian un producto con variantes.
ALTER TABLE venta_item_extras
  ADD COLUMN producto_variante_id INT NULL AFTER producto_id,
  ADD CONSTRAINT fk_venta_item_extras_variante FOREIGN KEY (producto_variante_id) REFERENCES producto_variantes(id);

-- El CHECK original (producto_id NOT NULL XOR descripcion NOT NULL) no sabía
-- de esta columna nueva. Se reemplaza por el mismo patrón que
-- chk_venta_items_producto_o_manual (migración 024): un extra manual
-- (descripcion, sin producto_id) tampoco puede traer variante -- no hay
-- producto real detrás para que esa variante cuelgue. Un extra de catálogo
-- puede o no traer variante, según si el producto referenciado las usa.
ALTER TABLE venta_item_extras
  DROP CHECK chk_venta_item_extras_producto_o_manual;

ALTER TABLE venta_item_extras
  ADD CONSTRAINT chk_venta_item_extras_producto_o_manual CHECK (
    (producto_id IS NOT NULL AND descripcion IS NULL)
    OR
    (producto_id IS NULL AND producto_variante_id IS NULL AND descripcion IS NOT NULL AND TRIM(descripcion) != '')
  );
