-- Migration 015: tabla de gastos (salidas de dinero que no son compra de
-- mercadería ni producción propia: pago de servicios, retiros, sueldos,
-- etc.). Es plata pura saliendo de la caja, sin producto ni proveedor de
-- por medio -- por eso no reutiliza `compras`.
--
-- IMPORTANTE: si este archivo llegara a tener acentos, aplicarlo SIEMPRE
-- con --default-character-set=utf8mb4 (ver migraciones anteriores).

CREATE TABLE gastos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  concepto VARCHAR(150) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(10,2) GENERATED ALWAYS AS (monto_efectivo + monto_transferencia) STORED,
  notas TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_gastos_monto_positivo CHECK (monto_efectivo >= 0 AND monto_transferencia >= 0),
  CONSTRAINT chk_gastos_algun_monto CHECK (monto_efectivo > 0 OR monto_transferencia > 0)
);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
