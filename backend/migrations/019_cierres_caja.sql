-- Migration 019: cierre de caja diario (arqueo). Un registro por día:
-- lo que el sistema esperaba tener en efectivo según ventas/compras/gastos
-- cargados ese día, contra lo que el dueño contó de verdad en el cajón.
-- diferencia_efectivo > 0 = sobra plata, < 0 = falta plata.
--
-- acumulado_efectivo/acumulado_transferencia son el total real acumulado
-- hasta ese cierre (arrastrando el cierre anterior + lo de hoy), para no
-- tener que sumar todo el historial manualmente cada vez.
--
-- Una vez cerrado, no se edita ni se borra (es un registro contable de
-- control) -- por eso no tiene "activo" ni endpoints de update/delete.

CREATE TABLE cierres_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  efectivo_esperado DECIMAL(10,2) NOT NULL,
  efectivo_contado DECIMAL(10,2) NOT NULL,
  diferencia_efectivo DECIMAL(10,2) GENERATED ALWAYS AS (efectivo_contado - efectivo_esperado) STORED,
  transferencia_esperado DECIMAL(10,2) NOT NULL,
  acumulado_efectivo DECIMAL(10,2) NOT NULL,
  acumulado_transferencia DECIMAL(10,2) NOT NULL,
  notas TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cierres_caja_fecha ON cierres_caja(fecha);
