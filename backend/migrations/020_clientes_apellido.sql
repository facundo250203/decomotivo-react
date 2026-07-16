-- Migration 020: separa nombre y apellido en clientes -- antes era un solo
-- campo de nombre completo, lo que hacía más fácil cargar el mismo cliente
-- dos veces con variaciones ("Juan Perez" vs "Juan Pérez" vs "Perez, Juan").
-- Con los campos separados es más fácil ordenar/comparar y detectar
-- duplicados al crear uno nuevo (ver clientesController.createCliente).
--
-- Nullable porque clientes ya cargados con el nombre completo en una sola
-- columna no tienen forma automática de separarse en nombre/apellido.

ALTER TABLE clientes
  ADD COLUMN apellido VARCHAR(150) NULL AFTER nombre;
