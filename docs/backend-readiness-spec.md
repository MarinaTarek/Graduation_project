# Navigen Distribution Suite — Future Backend Architecture Specification

**Status:** Architecture Ready (Frontend Data Contracts & Domain Decoupled)  
**Target:** Relational Persistence (e.g., PostgreSQL) & REST/GraphQL API  
**Scope:** Specification Only — No Backend Implementation  

---

## 1. Entity-Relationship & Relational Database Mapping

| Entity | Primary Key | Key Foreign Keys | Unique Constraints | Key Indexes |
|---|---|---|---|---|
| `users` | `id` (UUID / text) | `territory_id` -> `territories.id` | `email` (unique) | `idx_users_role`, `idx_users_status` |
| `customers` | `id` (UUID / text) | `rep_id` -> `users.id`, `territory_id` | `tax_number`, `commercial_reg` | `idx_customers_rep`, `idx_customers_status` |
| `products` | `code` (string) | `category_id` -> `categories.id` | `code` (unique) | `idx_products_category`, `idx_products_status` |
| `warehouses` | `id` (UUID / text) | `assigned_rep_id` -> `users.id` | `code` (unique) | `idx_warehouses_status`, `idx_warehouses_area` |
| `batches` | `id` (UUID / text) | `product_code` -> `products.code`, `warehouse_id` -> `warehouses.id` | `(product_code, batch_no)` | `idx_batches_fefo (expiry_date ASC)` |
| `sales_orders` | `id` (text / UUID) | `customer_id` -> `customers.id`, `rep_id` -> `users.id` | `id` (unique) | `idx_orders_customer`, `idx_orders_status`, `idx_orders_date` |
| `sales_order_items` | `id` (UUID) | `order_id` -> `sales_orders.id`, `product_code` -> `products.code` | `(order_id, product_code)` | `idx_order_items_order` |
| `stock_reservations`| `id` (UUID) | `order_id` -> `sales_orders.id`, `batch_id` -> `batches.id` | `(order_id, batch_id, status)` | `idx_reservations_order`, `idx_reservations_status` |
| `stock_movements` | `id` (UUID) | `batch_id` -> `batches.id`, `warehouse_id`, `customer_id`, `rep_id` | `id` (unique) | `idx_movements_batch`, `idx_movements_type_date` |
| `invoices` | `id` (UUID / text) | `order_id` -> `sales_orders.id`, `customer_id` -> `customers.id`, `rep_id` | `invoice_number` (unique) | `idx_invoices_customer`, `idx_invoices_status`, `idx_invoices_due` |
| `payments` | `id` (UUID / text) | `customer_id` -> `customers.id`, `received_by_id` -> `users.id` | `receipt_number` (unique) | `idx_payments_customer`, `idx_payments_date` |
| `payment_allocations`| `id` (UUID) | `payment_id` -> `payments.id`, `invoice_id` -> `invoices.id` | `(payment_id, invoice_id)` | `idx_allocations_invoice` |
| `returns` | `id` (UUID / text) | `order_id` -> `sales_orders.id`, `customer_id` -> `customers.id`, `rep_id` | `id` (unique) | `idx_returns_customer`, `idx_returns_status` |
| `credit_notes` | `id` (UUID / text) | `return_id` -> `returns.id`, `customer_id` -> `customers.id` | `id` (unique) | `idx_credit_notes_customer` |
| `visits` | `id` (UUID / text) | `customer_id` -> `customers.id`, `rep_id` -> `users.id` | `id` (unique) | `idx_visits_customer_date`, `idx_visits_rep_date` |
| `targets` | `id` (UUID / text) | `rep_id` -> `users.id` | `id` (unique) | `idx_targets_rep_period` |
| `budgets` | `id` (UUID / text) | `target_entity_id` -> polymorphic/FK | `id` (unique) | `idx_budgets_period` |
| `expenses` | `id` (UUID / text) | `employee_id` -> `users.id`, `budget_id` -> `budgets.id`, `visit_id` | `id` (unique) | `idx_expenses_employee_date`, `idx_expenses_status` |

---

## 2. Monetary & Quantity Representation

1. **Currency & Precision:**
   - Standard currency is **EGP** (Egyptian Pound).
   - Database columns for monetary amounts must be `DECIMAL(14, 2)` (or `NUMERIC(14, 2)`). Never use floating-point types (`REAL`, `FLOAT`, `DOUBLE PRECISION`).
   - Quantities in order items, batch receipts, reservations, and sample disbursements must be `INTEGER` (positive only, $\ge 1$).

2. **Date, Time & Timezone Rules:**
   - Store all operational timestamps as `TIMESTAMPTZ` (UTC ISO 8601 strings in frontend: `YYYY-MM-DDTHH:mm:ss.sssZ`).
   - Business calendar dates (`issueDate`, `dueDate`, `returnDate`, `startDate`, `endDate`) should be stored as ISO date `DATE` (`YYYY-MM-DD`).
   - Relative aging and overdue determinations must reference the official organization working date or server current date (`SYSTEM_CURRENT_DATE`).

---

## 3. Atomic Database Transactions (Critical Boundaries)

When implementing the future backend, the following workflows MUST be executed inside single atomic database transactions (`BEGIN ... COMMIT`) with row-level locking:

1. **Order Approval (`approveSalesOrder`):**
   - Verify unexpired available batch inventory using `SELECT ... FOR UPDATE`.
   - Allocate batches using FEFO (`expiry_date ASC`).
   - Insert rows into `stock_reservations`.
   - Insert row into `invoices` (`status = 'Pending'`).
   - Update `sales_orders` (`status = 'Approved'`).

2. **Order Dispatch (`dispatchSalesOrder`):**
   - Check `sales_orders` (`status == 'Approved'`).
   - Lock active `stock_reservations` for the order.
   - Insert outbound `stock_movements` (`type = 'sell_in'`).
   - Decrement physical batch available counts.
   - Mark `stock_reservations` as fulfilled.
   - Update `sales_orders` (`status = 'Dispatched'`).

3. **Order Cancellation (`cancelSalesOrder`):**
   - Check `sales_orders` status is `Pending` or `Approved`.
   - Release active `stock_reservations`.
   - Mark linked pending invoices as `Rejected` / `Voided`.
   - Update `sales_orders` (`status = 'Cancelled'`).

4. **Payment Recording & Allocation (`addCollectionPayment`):**
   - Lock target `invoices` rows using `SELECT ... FOR UPDATE`.
   - Verify remaining balance $\ge$ allocation amount for each invoice.
   - Insert `payments` receipt record (enforcing unique `receipt_number`).
   - Insert `payment_allocations` rows.
   - Recalculate and update `invoices` payment status (`Paid` or `Partially Paid`).

5. **Return Approval & Credit Note (`approveReturn`):**
   - Check return status is `Pending`.
   - Record `stock_movements` (`type = 'return'`). If disposition is `sellable`, increment available batch stock; if `damaged` or `expired`, route to quarantine.
   - Generate and insert `credit_notes` record.
   - Update `returns` (`status = 'Approved'`).

---

## 4. Authentication vs. Business Identity

- **Authentication Identity:** User authentication credentials, tokens, session claims, MFA, and account enable/disable flags belong to auth schemas.
- **Business Identity:** Role assignment (`admin`, `manager`, `rep`), territory assignment, historical attribution for stock movements, invoices, and visit logs belong to business schemas (`usersStore` domain).
- **Referential Protection:** Hard deletion of a user identity with historical business attributions must be forbidden. Deactivation (`status = 'Inactive'`) must be enforced, preserving foreign-key referential integrity across all historical transactions.
