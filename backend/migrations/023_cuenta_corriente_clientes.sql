-- Migration 023: cuenta corriente de clientes (fiado / saldo a favor).
-- Primera de 3 features acordadas en la charla de diseño (ver decisión
-- arquitectónica guardada en Engram bajo el topic
-- architecture/ventas-clientes-extras) -- ítems no catalogados y extras por
-- línea quedan para migraciones futuras, no se tocan acá.
--
-- El saldo del cliente NO se guarda en una columna mutable -- se calcula
-- sumando esta tabla, mismo patrón que ya usa caja para su saldo (ver
-- cajaController.calcularMovimientosRango: todo sale de sumar movimientos,
-- nunca de un total guardado a mano).
--
-- `monto` siempre positivo; la dirección la da `tipo`, igual que
-- movimientos_stock usa `cantidad` positivo + `tipo` para dar la dirección
-- real del movimiento (ver migración 007).
--
-- Saldo = SUM(+monto para 'venta_fiado'/'saldo_a_favor_aplicado', -monto
-- para 'pago_cliente'). Saldo > 0 = el cliente debe esa plata (fiado
-- pendiente). Saldo < 0 = el cliente tiene saldo a favor por ese valor
-- absoluto (pagó de más, o el vendedor le acreditó vuelto en vez de
-- dárselo). Un solo número corrido cubre los dos casos -- no hacen falta
-- columnas separadas de "deuda" y "a favor".
--
-- Nota de alcance: "pago_cliente" cubre tanto pagos que reducen deuda como
-- pagos que exceden la deuda y generan saldo a favor (la resta ya lo maneja
-- solo, sin necesitar un tipo separado para ese caso).

CREATE TABLE movimientos_cuenta_corriente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  tipo ENUM('venta_fiado', 'pago_cliente', 'saldo_a_favor_aplicado') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  venta_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT NULL,
  CONSTRAINT fk_movimientos_cc_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_movimientos_cc_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
  CONSTRAINT chk_movimientos_cc_monto_positivo CHECK (monto > 0)
);

CREATE INDEX idx_movimientos_cc_cliente_id ON movimientos_cuenta_corriente(cliente_id);

-- "A cuenta" pasa a ser una tercera forma de pago junto a efectivo/
-- transferencia (ver backend/utils/montoValidation.js -- montoCoincide ya es
-- genérico, no hace falta tocarlo, solo se le suma este componente en
-- ventasController). Requiere cliente vinculado: no existe "a cuenta" sin
-- saber a quién se le fía.
ALTER TABLE ventas
  ADD COLUMN monto_cuenta_corriente DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER monto_transferencia;

ALTER TABLE ventas
  MODIFY COLUMN monto_total DECIMAL(10,2)
    GENERATED ALWAYS AS (monto_efectivo + monto_transferencia + monto_cuenta_corriente) STORED;

-- 'pago_cuenta_corriente': pago suelto de un cliente contra su deuda (no
-- viene de un pedido ni tiene venta_items), mismo patrón que 'pago_final'
-- ya usa para pagos de pedido sin ítems propios (ver
-- orderController.registerPayment).
ALTER TABLE ventas
  MODIFY COLUMN tipo ENUM('sena', 'pago_final', 'venta_directa', 'pago_cuenta_corriente') NOT NULL;

ALTER TABLE ventas
  DROP CHECK chk_ventas_monto_positivo,
  DROP CHECK chk_ventas_algun_monto;

ALTER TABLE ventas
  ADD CONSTRAINT chk_ventas_monto_positivo
    CHECK (monto_efectivo >= 0 AND monto_transferencia >= 0 AND monto_cuenta_corriente >= 0);

-- chk_ventas_algun_monto (exigía efectivo>0 OR transferencia>0) se elimina
-- sin reemplazo: una venta puede quedar totalmente cubierta por saldo a
-- favor aplicado, dejando los tres montos de pago en 0 -- eso es válido
-- (el cliente ya había puesto esa plata en una venta anterior, contarla de
-- nuevo acá sería duplicar ingreso). Que sumen algo > 0 en total ya lo
-- garantiza el controller (no se puede cargar una venta sin ítems).
--
-- NO se agrega un CHECK de "cuenta_corriente > 0 requiere cliente_id" acá:
-- MySQL no permite un CHECK sobre una columna (cliente_id) que participa en
-- una FK con acción ON DELETE SET NULL (fk_ventas_cliente) -- "Column
-- 'cliente_id' cannot be used in a check constraint... needed in a foreign
-- key constraint... referential action". Queda validado solo a nivel
-- aplicación (ver ventasController.createVentaDirecta).
