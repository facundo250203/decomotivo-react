-- Migration 026: control granular de qué campos de un producto se muestran
-- en la tienda pública. Distinto de `visible_publico` (que ya decide si el
-- producto entero aparece o no, filtrado en el WHERE de cada consulta
-- pública -- ese sigue siendo el único gate de "nombre y todo lo demás").
-- Estos 3 campos solo aplican a un producto que YA es visible: dejan de
-- renderizar precio/imagen/descripción puntualmente, sin sacar el producto
-- del catálogo.
--
-- Default true: todo el catálogo existente sigue mostrando lo mismo que hoy.

ALTER TABLE productos
  ADD COLUMN mostrar_precio BOOLEAN NOT NULL DEFAULT true AFTER visible_publico,
  ADD COLUMN mostrar_imagen BOOLEAN NOT NULL DEFAULT true AFTER mostrar_precio,
  ADD COLUMN mostrar_descripcion BOOLEAN NOT NULL DEFAULT true AFTER mostrar_imagen;
