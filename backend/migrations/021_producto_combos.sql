-- Migration 021: combos de producto (receta de productos/variantes ya
-- existentes, vendidos juntos con precio de promo). Resuelve el caso "mate +
-- bombilla a precio combo" -- hoy el dueño lo modela como un producto nuevo
-- con stock propio, que queda desincronizado del stock real de sus
-- componentes (vender el mate suelto no descuenta el combo, y viceversa).
--
-- Un producto con precio_tipo='combo' es una RECETA: no tiene stock propio.
-- Ignora productos.cantidad, stock_minimo y controla_stock -- su stock
-- disponible se CALCULA en tiempo real como el mínimo, entre todos sus
-- componentes, de floor(stock_del_componente / cantidad_requerida) (ver
-- calcularStockCombo en backend/utils/stockMovements.js). Vender un combo no
-- descuenta ningún contador propio: descuenta stock de cada componente real,
-- multiplicado por la cantidad que ese componente requiere por combo.
--
-- NO hace falta agregar producto_combo_id a venta_items/pedido_items/
-- compra_items/movimientos_stock: al vender un combo se inserta una fila en
-- movimientos_stock POR CADA COMPONENTE, usando las columnas producto_id/
-- producto_variante_id que ya existen desde la migración 018. La fila de
-- venta_items/pedido_items para el combo en sí sigue apuntando al producto
-- combo (para que el ticket/pedido muestre "1x Combo Mate + Bombilla"), pero
-- el movimiento de stock real queda repartido entre los componentes.

CREATE TABLE producto_combo_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  combo_producto_id INT NOT NULL,
  componente_producto_id INT NOT NULL,
  componente_variante_id INT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_combo_items_combo FOREIGN KEY (combo_producto_id) REFERENCES productos(id),
  CONSTRAINT fk_combo_items_componente FOREIGN KEY (componente_producto_id) REFERENCES productos(id),
  CONSTRAINT fk_combo_items_variante FOREIGN KEY (componente_variante_id) REFERENCES producto_variantes(id)
);

CREATE INDEX idx_combo_items_combo_id ON producto_combo_items(combo_producto_id);
CREATE INDEX idx_combo_items_componente_id ON producto_combo_items(componente_producto_id);

-- 'combo': el stock se deriva de la receta, no de productos.cantidad (esa
-- columna queda sin usar para este tipo, igual que precio_valor queda sin
-- usar para 'variantes').
ALTER TABLE productos
  MODIFY COLUMN precio_tipo ENUM('fijo','desde','consultar','variantes','combo') DEFAULT 'fijo';
