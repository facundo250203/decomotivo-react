-- Migration 017: productos.en_oferta / precio_oferta -- permite marcar un
-- producto como "en oferta" con un precio rebajado. No es una categoría
-- real: el front lo agrupa en una ruta propia (/ofertas) filtrando por
-- este flag, sin que exista una fila en `categorias`.
--
-- Solo tiene sentido combinado con precio_tipo = 'fijo': un producto
-- "desde" o "a consultar" no tiene un precio de lista fijo contra el cual
-- tachar. Esa regla se valida en el controller, no acá.

ALTER TABLE productos
  ADD COLUMN precio_oferta DECIMAL(10,2) NULL AFTER precio_valor,
  ADD COLUMN en_oferta BOOLEAN NOT NULL DEFAULT false AFTER destacado;
