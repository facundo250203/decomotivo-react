-- Migration 006: detalle de productos ingresados en una compra
-- (real o de producción propia).

CREATE TABLE compra_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  compra_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  CONSTRAINT fk_compra_items_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  CONSTRAINT fk_compra_items_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_compra_items_compra_id ON compra_items(compra_id);
