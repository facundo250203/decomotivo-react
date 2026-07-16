-- Migration 018: variantes de producto (medidas con precio y stock
-- propios). Resuelve casos como "Tabla para Asado" -- son 4 medidas
-- distintas, cada una con su propio precio y su propio stock físico, en
-- vez de meterlas todas bajo un precio "desde" y un solo contador de
-- stock compartido que no refleja la realidad.
--
-- Un producto con precio_tipo='variantes' ignora productos.cantidad,
-- stock_minimo y controla_stock -- el stock se controla siempre a nivel
-- de cada variante.

CREATE TABLE producto_variantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  precio_valor DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_variantes_producto_id ON producto_variantes(producto_id);

-- 'variantes': el precio se arma a partir de las variantes, no de
-- productos.precio_valor (esa columna queda sin usar para este tipo).
ALTER TABLE productos
  MODIFY COLUMN precio_tipo ENUM('fijo','desde','consultar','variantes') DEFAULT 'fijo';

-- pedido_items / venta_items / compra_items / movimientos_stock necesitan
-- saber QUÉ variante puntual participó, para poder descontar/sumar el
-- stock de esa medida específica y no del producto padre. Nullable: la
-- gran mayoría de productos no tiene variantes.
ALTER TABLE pedido_items
  ADD COLUMN producto_variante_id INT NULL AFTER producto_id,
  ADD CONSTRAINT fk_pedido_items_variante FOREIGN KEY (producto_variante_id) REFERENCES producto_variantes(id);

ALTER TABLE venta_items
  ADD COLUMN producto_variante_id INT NULL AFTER producto_id,
  ADD CONSTRAINT fk_venta_items_variante FOREIGN KEY (producto_variante_id) REFERENCES producto_variantes(id);

ALTER TABLE compra_items
  ADD COLUMN producto_variante_id INT NULL AFTER producto_id,
  ADD CONSTRAINT fk_compra_items_variante FOREIGN KEY (producto_variante_id) REFERENCES producto_variantes(id);

ALTER TABLE movimientos_stock
  ADD COLUMN producto_variante_id INT NULL AFTER producto_id,
  ADD CONSTRAINT fk_movimientos_variante FOREIGN KEY (producto_variante_id) REFERENCES producto_variantes(id);
