-- Migration 014: agrega la categoría Impresiones (fotocopias e impresiones
-- en blanco y negro y color). No destructiva: solo un INSERT nuevo.
--
-- IMPORTANTE: este archivo tiene acentos (í). Aplicarlo con el cliente
-- mysql SIEMPRE con --default-character-set=utf8mb4, o el acento se graba
-- mal (mojibake) aunque el archivo en sí esté en UTF-8 correcto.
--   mysql --default-character-set=utf8mb4 -u root -p decomotivo < 014_categoria_impresiones.sql

INSERT INTO categorias (nombre, slug, descripcion, imagen_background, activa, orden)
VALUES (
  'Impresiones',
  'impresiones',
  'Fotocopias e impresiones en blanco y negro y color',
  NULL,
  true,
  10
);
