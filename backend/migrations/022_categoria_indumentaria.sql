-- Migration 022: agrega la categoría Indumentaria. No destructiva: solo un
-- INSERT nuevo.
--
-- IMPORTANTE: este archivo tiene acentos. Aplicarlo con el cliente mysql
-- SIEMPRE con --default-character-set=utf8mb4, o el acento se graba mal
-- (mojibake) aunque el archivo en sí esté en UTF-8 correcto.
--   mysql --default-character-set=utf8mb4 -u root -p decomotivo < 022_categoria_indumentaria.sql

INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
VALUES (
  'Indumentaria',
  'indumentaria',
  'Remeras, buzos y prendas personalizadas',
  NULL,
  true,
  11
);
