-- Migration 028: reorganización de categorías del catálogo, acordada con
-- el dueño. No destructiva para productos existentes:
--
-- "Mates y Vasos" se renombra en el lugar a "Mates" (mismo id=1, mismo
-- slug base sin el "-vasos") -- todos los productos que ya estaban ahí
-- quedan automáticamente bajo "Mates" sin tocar sus filas. El dueño va a
-- reasignar a mano, desde ProductForm, los que en realidad son tazas/vasos
-- hacia la categoría nueva "Tazas y Vasos" (decisión explícita: no se
-- intenta adivinar por el nombre del producto).
--
-- Después se agregan 7 categorías nuevas: Tazas y Vasos, Descartables,
-- Cumpleaños, Bijouterie, Cosmética Capilar, Mercería, Bienestar, y
-- Perfumería y Belleza (esta última agrupa perfumes de ambiente, esmaltes,
-- maquillaje y máscaras faciales -- confirmado con el dueño).
--
-- IMPORTANTE: este archivo tiene acentos/ñ. Aplicarlo con el cliente mysql
-- SIEMPRE con --default-character-set=utf8mb4, o se graba mojibake.

UPDATE categorias
SET nombre = 'Mates',
    slug = 'mates',
    descripcion = 'Mates de algarrobo personalizados'
WHERE id = 1 AND slug = 'mates-vasos';

INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
VALUES
  ('Tazas y Vasos', 'tazas-vasos', 'Tazas y vasos personalizados', NULL, true, 12),
  ('Descartables', 'descartables', 'Vasos, platos y cubiertos descartables', NULL, true, 13),
  ('Cumpleaños', 'cumpleanos', 'Cotillón y artículos para fiestas', NULL, true, 14),
  ('Bijouterie', 'bijouterie', 'Aros, collares, pulseras y anillos', NULL, true, 15),
  ('Cosmética Capilar', 'cosmetica-capilar', 'Tratamientos y productos para el cuidado del cabello', NULL, true, 16),
  ('Mercería', 'merceria', 'Hilos, botones, cintas y accesorios de costura', NULL, true, 17),
  ('Bienestar', 'bienestar', 'Incienso, lámparas de sal, sales y Flores de Bach', NULL, true, 18),
  ('Perfumería y Belleza', 'perfumeria-belleza', 'Perfumes de ambiente, esmaltes, maquillaje y máscaras faciales', NULL, true, 19);
