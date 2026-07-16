-- Migration 013: vínculo opcional a un cliente registrado, tanto en
-- pedidos (encargos) como en ventas (caja). Nullable: se puede seguir
-- cargando un pedido/venta sin cliente registrado, igual que hasta ahora.

ALTER TABLE pedidos
  ADD COLUMN cliente_id INT NULL AFTER cliente_email;

ALTER TABLE pedidos
  ADD CONSTRAINT fk_pedidos_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);

ALTER TABLE ventas
  ADD COLUMN cliente_id INT NULL AFTER pedido_id;

ALTER TABLE ventas
  ADD CONSTRAINT fk_ventas_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
