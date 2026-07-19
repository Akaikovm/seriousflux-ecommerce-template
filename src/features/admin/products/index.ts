export { AdminProductsTable } from "./AdminProductsTable";
export { ProductForm } from "./ProductForm";
export type { ProductFormInventoryDefaults } from "./ProductForm";
export { StockStatusBadge } from "./StockStatusBadge";

// Server-safe mapper: import from `./admin-product-row` in Server Components
// (do not re-export here — this barrel also exports Client Components).
