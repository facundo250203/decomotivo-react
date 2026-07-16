-- Migration 007: registro único de por qué cambió productos.cantidad.
-- Una fila por producto por operación (una compra/venta con varios ítems
-- genera varias filas acá, una por producto). cantidad siempre positivo;
-- el signo (entrada/salida) lo da el tipo, no el número.

CREATE TABLE movimientos_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo ENUM('entrada_compra', 'salida_venta', 'salida_pedido_senado', 'ajuste_manual') NOT NULL,
  cantidad INT NOT NULL,
  compra_id INT NULL,
  venta_id INT NULL,
  pedido_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT NULL,
  CONSTRAINT fk_movimientos_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_movimientos_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL,
  CONSTRAINT fk_movimientos_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
  CONSTRAINT fk_movimientos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
);

CREATE INDEX idx_movimientos_producto_id ON movimientos_stock(producto_id);
