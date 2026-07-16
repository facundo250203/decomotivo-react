-- Migration 003: detalle de productos vendidos en una venta directa.
-- No aplica a filas tipo 'sena'/'pago_final' (esos items ya están en pedido_items).

CREATE TABLE venta_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  CONSTRAINT fk_venta_items_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_venta_items_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE INDEX idx_venta_items_venta_id ON venta_items(venta_id);
