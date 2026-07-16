-- Migration 025: extras por línea de venta (producto real u opcional texto libre).
-- Tercera y última de las 3 features acordadas en la charla de diseño (ver
-- decisión arquitectónica guardada en Engram bajo el topic
-- architecture/ventas-clientes-extras).
--
-- Un extra se agrega SIEMPRE a mano por el vendedor con un botón por línea
-- (no hay extra automático/por defecto -- se descartó explícitamente por
-- requerir casos especiales por producto). Cuelga de un venta_item, sin
-- importar si esa línea es de catálogo o manual (ver migración 024) -- el
-- extra no le pregunta a su padre qué tipo de línea es.
--
-- Igual que un venta_item (migración 024), un extra es o bien un producto
-- real del catálogo (producto_id, precio autocompletado desde el producto
-- pero editable antes de agregarlo, descripcion queda NULL porque el nombre
-- sale del join a productos) o bien texto libre + precio a mano (descripcion
-- NOT NULL, producto_id NULL) -- ej. "grabado personalizado". Mismo patrón
-- exacto que chk_venta_items_producto_o_manual: nunca ninguno de los dos,
-- nunca los dos a la vez. getVentaById resuelve el nombre a mostrar con
-- COALESCE(pr.titulo, vie.descripcion), igual que ya hace con venta_items.
--
-- Decisión de stock (ver reporte de esta sesión): un extra que referencia un
-- producto real NO descuenta stock de ese producto. En el diseño original el
-- caso de uso era "grabado personalizado" o "cambio de bombilla" -- un ajuste
-- de precio/descripción sobre la línea, no una segunda venta con movimiento
-- de inventario propio. Si en el futuro se necesita que un extra de catálogo
-- sí descuente stock, es un cambio explícito y consciente, no el default.
CREATE TABLE venta_item_extras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_item_id INT NOT NULL,
  producto_id INT NULL,
  descripcion VARCHAR(255) NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio) STORED,
  CONSTRAINT fk_venta_item_extras_venta_item FOREIGN KEY (venta_item_id) REFERENCES venta_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_venta_item_extras_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT chk_venta_item_extras_producto_o_manual CHECK (
    (producto_id IS NOT NULL AND descripcion IS NULL)
    OR
    (producto_id IS NULL AND descripcion IS NOT NULL AND TRIM(descripcion) != '')
  ),
  CONSTRAINT chk_venta_item_extras_precio_positivo CHECK (precio > 0),
  CONSTRAINT chk_venta_item_extras_cantidad_positiva CHECK (cantidad > 0)
);

CREATE INDEX idx_venta_item_extras_venta_item_id ON venta_item_extras(venta_item_id);
