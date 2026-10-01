ALTER TABLE inventory_movements ADD COLUMN idempotency_key varchar(150);
CREATE UNIQUE INDEX inventory_movement_idempotency_key_unique ON inventory_movements(idempotency_key) WHERE idempotency_key IS NOT NULL;
ALTER TABLE inventory_location_stock ADD CONSTRAINT inventory_location_stock_quantity_nonnegative CHECK (quantity >= 0);
