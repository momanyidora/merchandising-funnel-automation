export class InventoryItemNotFoundError extends Error {
  constructor() {
    super("Inventory item not found");
    this.name = "InventoryItemNotFoundError";
  }
}

export class InventoryLocationNotFoundError extends Error {
  constructor() {
    super("Inventory location not found");
    this.name = "InventoryLocationNotFoundError";
  }
}

export class InsufficientInventoryError extends Error {
  constructor() {
    super("Insufficient inventory");
    this.name = "InsufficientInventoryError";
  }
}

export class InsufficientLocationInventoryError extends Error {
  constructor() {
    super("Insufficient inventory at this location");
    this.name = "InsufficientLocationInventoryError";
  }
}

export class InvalidMovementQuantityError extends Error {
  constructor() {
    super("Movement quantity cannot be zero");
    this.name = "InvalidMovementQuantityError";
  }
}
