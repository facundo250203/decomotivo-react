-- Migration 027: vender un producto por caja además de por unidad,
-- compartiendo el mismo contador de stock (productos.cantidad, siempre en
-- unidades sueltas). No es un combo (precio_tipo='combo' aparece
-- públicamente en /combos, que filtra por ese campo sin importar la
-- categoría real -- ver App.jsx -- y esto no es una receta de productos
-- distintos, es el mismo producto empaquetado). Es puramente un dato de
-- apoyo para la carga de ventas/pedidos, invisible en el catálogo público.
--
-- precio_caja es independiente de precio_valor * unidades_por_caja: el
-- precio por caja suele ser un descuento mayorista real (ej. caja de 10 a
-- $10.000 pero la unidad suelta a $1.500 c/u), no una simple división.
ALTER TABLE productos
  ADD COLUMN unidades_por_caja INT NULL AFTER mostrar_descripcion,
  ADD COLUMN precio_caja DECIMAL(10,2) NULL AFTER unidades_por_caja;

-- cajas_vendidas es solo para reconstruir el texto "Caja x10" en el detalle
-- de la venta/pedido (cantidad / cajas_vendidas = unidades por caja de ESA
-- venta puntual, sin depender de que productos.unidades_por_caja no haya
-- cambiado después). NULL = se vendió suelto, como siempre. No participa
-- del cálculo de stock ni de precio -- cantidad y precio_unitario ya vienen
-- calculados desde el frontend exactamente igual que hoy.
ALTER TABLE venta_items
  ADD COLUMN cajas_vendidas INT NULL AFTER cantidad;

ALTER TABLE pedido_items
  ADD COLUMN cajas_vendidas INT NULL AFTER cantidad;
