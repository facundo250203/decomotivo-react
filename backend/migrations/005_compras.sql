-- Migration 005: compras a proveedores o entradas de producción propia.
-- proveedor_id NULL = producción propia: no hay pago real, por eso el CHECK
-- fuerza monto_efectivo=0 y monto_transferencia=0 en ese caso.
--
-- Nota: la FK NO usa "ON DELETE SET NULL" porque MySQL no permite que una
-- columna con esa acción participe también en un CHECK (error 3823).
-- No hace falta de todos modos: proveedoresController.deleteProveedor hace
-- soft delete (activo=false), nunca borra la fila, así que este ON DELETE
-- nunca se dispararía en la práctica.

CREATE TABLE compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(10,2) GENERATED ALWAYS AS (monto_efectivo + monto_transferencia) STORED,
  notas TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT chk_compras_monto_positivo CHECK (monto_efectivo >= 0 AND monto_transferencia >= 0),
  CONSTRAINT chk_compras_dinero_solo_si_proveedor CHECK (proveedor_id IS NOT NULL OR (monto_efectivo = 0 AND monto_transferencia = 0))
);

CREATE INDEX idx_compras_proveedor_id ON compras(proveedor_id);
CREATE INDEX idx_compras_fecha ON compras(fecha);
