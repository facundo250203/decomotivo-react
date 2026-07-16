-- Migration 010: agrega las categorías Regalería y Juguetería.
-- No destructiva: solo dos INSERT nuevos.
--
-- IMPORTANTE: este archivo tiene acentos (í). Aplicarlo con el cliente
-- mysql SIEMPRE con --default-character-set=utf8mb4, o el acento se graba
-- mal (mojibake) aunque el archivo esté en UTF-8 correcto (ya pasó una vez
-- con la migración 009). Ej.:
--   mysql --default-character-set=utf8mb4 -u root -p decomotivo < 010_categorias_regaleria_jugueteria.sql

INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
VALUES
  ('Regalería', 'regaleria', 'Artículos para regalar en cada ocasión', NULL, true, 8),
  ('Juguetería', 'jugueteria', 'Juguetes y artículos para jugar', NULL, true, 9);
