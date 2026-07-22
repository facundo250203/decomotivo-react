-- Migration 030: el cierre de caja pasa a contar el TOTAL en caja, no solo
-- el movimiento del día. Acordado con el dueño: su hábito real al hacer el
-- arqueo es contar toda la plata que está físicamente en el cajón en ese
-- momento (que ya arrastra todos los cierres anteriores, nunca se "resetea"
-- a cero cada día), no separar mentalmente "lo de hoy" del acumulado previo.
-- Eso cambia el significado de efectivo_contado (antes: "lo contado HOY",
-- ahora: "el total contado AHORA") y agrega el mismo concepto para
-- transferencia, que hasta esta migración no tenía ningún paso de conteo/
-- verificación -- era puro cálculo teórico (acumulado_transferencia =
-- previo + esperado, sin contraste contra la realidad).
--
-- transferencia_contado: espejo de efectivo_contado para transferencia (el
-- dueño verifica el total recibido según Mercado Pago/banco, mismo criterio
-- "total hasta ahora" que efectivo). NULL primero porque hay filas
-- existentes sin este dato -- se backfillea con el propio acumulado_
-- transferencia de esas filas (bajo el modelo nuevo, acumuladoTransferencia
-- = transferenciaContadoNum directo, así que el valor que ya tenían guardado
-- en acumulado_transferencia ES lo que hubieran "contado" si el campo
-- hubiera existido) y recién después se aprieta a NOT NULL.
ALTER TABLE cierres_caja
  ADD COLUMN transferencia_contado DECIMAL(10,2) NULL AFTER transferencia_esperado;

UPDATE cierres_caja SET transferencia_contado = 366204.00 WHERE id = 8;
UPDATE cierres_caja SET transferencia_contado = 375204.00 WHERE id = 9;

ALTER TABLE cierres_caja
  MODIFY COLUMN transferencia_contado DECIMAL(10,2) NOT NULL;

-- diferencia_transferencia: nueva columna, mismo rol que diferencia_efectivo
-- pero para transferencia. Nace en 0.00 para las 2 filas históricas porque
-- ya sabemos que coincidían (el "contado" backfilleado arriba es igual al
-- acumulado que ya tenían -- no hay diferencia que reportar retroactivamente
-- sobre un conteo que en su momento no existió).
ALTER TABLE cierres_caja
  ADD COLUMN diferencia_transferencia DECIMAL(10,2) NULL AFTER transferencia_contado;

UPDATE cierres_caja SET diferencia_transferencia = 0.00 WHERE id IN (8, 9);

ALTER TABLE cierres_caja
  MODIFY COLUMN diferencia_transferencia DECIMAL(10,2) NOT NULL;

-- diferencia_efectivo deja de ser GENERATED. La fórmula nueva es
-- (efectivo_contado - acumulado_efectivo_previo) - efectivo_esperado, y una
-- columna GENERATED en MySQL solo puede referenciar OTRAS COLUMNAS DE LA
-- MISMA FILA -- no puede leer acumulado_efectivo de la fila anterior (no hay
-- forma de expresar "el cierre de ayer" dentro de una expresión GENERATED).
-- Por eso el cálculo se mueve al controller (cajaController.crearCierre) y
-- la columna pasa a ser un valor STORED normal que el INSERT llena a mano.
--
-- Verificado a mano en la base de dev (decomotivo_test) antes y después de
-- este MODIFY: MySQL preserva el valor ya materializado de la columna
-- GENERATED STORED como dato literal al quitarle el atributo GENERATED (no
-- lo vacía ni lo recalcula) -- filas 8 y 9 siguen en 0.00 y 1000.00
-- respectivamente sin necesidad de un UPDATE explícito. Se deja este
-- comentario en vez de un UPDATE "por las dudas" porque un UPDATE no-op
-- sobre una columna que ya está bien no aporta nada y ensucia el diff de la
-- migración; si en otro entorno MySQL se comportara distinto, un
-- `SELECT id, diferencia_efectivo FROM cierres_caja WHERE id IN (8,9)`
-- después de correr esta migración lo detecta al toque.
ALTER TABLE cierres_caja
  MODIFY COLUMN diferencia_efectivo DECIMAL(10,2) NOT NULL;
