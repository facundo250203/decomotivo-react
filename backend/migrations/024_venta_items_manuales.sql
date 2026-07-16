-- Migration 024: ítems de venta no catalogados (producto manual/ad hoc).
-- Segunda de 3 features acordadas en la charla de diseño (ver decisión
-- arquitectónica guardada en Engram bajo el topic
-- architecture/ventas-clientes-extras) -- extras por línea queda para una
-- migración futura, no se toca acá.
--
-- A veces el vendedor vende algo que no está en el catálogo y nunca lo va a
-- estar (un ítem suelto, o algo que no vale la pena dar de alta como
-- producto permanente). Se carga como una línea más de la venta, con
-- descripción libre + precio a mano en vez de referenciar un producto real.
-- Sin cola de revisión ni promoción automática a catálogo -- el dueño
-- decide manualmente y por fuera del sistema si más adelante lo da de alta.
--
-- Un venta_item ahora puede NO tener producto_id (línea manual).
-- precio_unitario sigue siendo la fuente del subtotal generado (cantidad *
-- precio_unitario, ver migración 003) para no bifurcar ese cálculo por tipo
-- de línea -- precio_manual guarda el precio tal cual lo tipeó el vendedor,
-- útil para mostrar/consultar líneas manuales sin depender del join a
-- productos.
ALTER TABLE venta_items
  MODIFY COLUMN producto_id INT NULL;

ALTER TABLE venta_items
  ADD COLUMN descripcion_manual VARCHAR(255) NULL AFTER producto_variante_id,
  ADD COLUMN precio_manual DECIMAL(10,2) NULL AFTER descripcion_manual;

-- Invariante: o es un producto de catálogo (producto_id, sin variante fuera
-- de contexto porque producto_variante_id ya exige producto_id por su
-- propio FK) o es una línea manual (descripcion_manual + precio_manual > 0)
-- -- nunca ninguno de los dos, nunca los dos a la vez. A diferencia del
-- CHECK que no se pudo agregar en migración 023 (cliente_id participa en un
-- FK con ON DELETE SET NULL), fk_venta_items_producto es RESTRICT por
-- default, así que sí se puede referenciar producto_id en este CHECK.
ALTER TABLE venta_items
  ADD CONSTRAINT chk_venta_items_producto_o_manual CHECK (
    (producto_id IS NOT NULL AND descripcion_manual IS NULL AND precio_manual IS NULL)
    OR
    (
      producto_id IS NULL
      AND producto_variante_id IS NULL
      AND descripcion_manual IS NOT NULL
      AND TRIM(descripcion_manual) != ''
      AND precio_manual IS NOT NULL
      AND precio_manual > 0
    )
  );
