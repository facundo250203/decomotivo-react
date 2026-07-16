-- Migration 002: tabla ventas (libro de caja diario)
-- pedido_id NULL = venta directa de mostrador. ON DELETE SET NULL: si se borra
-- un pedido, no se pierde el registro histórico de caja.

CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(10,2) GENERATED ALWAYS AS (monto_efectivo + monto_transferencia) STORED,
  tipo ENUM('sena', 'pago_final', 'venta_directa') NOT NULL,
  cliente_nombre VARCHAR(150) NULL,
  cliente_telefono VARCHAR(30) NULL,
  notas TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
  CONSTRAINT chk_ventas_monto_positivo CHECK (monto_efectivo >= 0 AND monto_transferencia >= 0),
  CONSTRAINT chk_ventas_algun_monto CHECK (monto_efectivo > 0 OR monto_transferencia > 0)
);

CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_pedido_id ON ventas(pedido_id);
