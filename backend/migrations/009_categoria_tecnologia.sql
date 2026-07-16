-- Migration 009: agrega la categoría Tecnología (cargadores, pilas,
-- adaptadores, fundas de celular). No destructiva: solo un INSERT nuevo.
--
-- IMPORTANTE: este archivo tiene un acento (í). Aplicarlo con el cliente
-- mysql SIEMPRE con --default-character-set=utf8mb4, o el acento se graba
-- mal (mojibake) aunque el archivo en sí esté en UTF-8 correcto. Ya pasó
-- una vez corriendo esta migración sin el flag. Ej.:
--   mysql --default-character-set=utf8mb4 -u root -p decomotivo < 009_categoria_tecnologia.sql

INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
VALUES (
  'Tecnología',
  'tecnologia',
  'Cargadores, pilas, adaptadores y fundas para celular',
  NULL,
  true,
  7
);
