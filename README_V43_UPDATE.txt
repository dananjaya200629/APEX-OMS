APEX HOLDINGS OMS V43 — FINANCE & ROLE DASHBOARD UPDATE

- Removed Net Profit completely from the report table and Sales / Profit / Expense chart.
- Standard recognised-order Total Expenses = Wholesale Cost + Company Stock Price + Master Delivery Charge + Other Expense + Other Cost.
- Returned-order Total Expenses = Master Delivery Charge + Other Expense + Other Cost only.
- Moved Sales, Total Expenses and Profit to the far-right end of the report table in that order.
- The report footer shows totals only for Sales, Total Expenses and Profit.
- Staff dashboard now includes Best Call Centre and Sales Performance leaderboards plus a compact personal order-rate chart.
- Admin dashboard can select a staff member to view Confirm, Delivered and Returned rates.
- Owner dashboard can select a company to view Confirm, Delivered and Returned rates.
- Existing app workflows and data structures are preserved.

ADDITIONAL V43 FIXES
- New Order stock deduction is now based on Qty only. Changing the PCS / Pack
  selection does not change or consume stock.
- PCS / Pack still controls pack price, pack cost and reported sales PCS totals.
- Historical orders retain their previously saved stock movement quantity so
  pending-order edits and returned-order stock restoration remain consistent.
- Login now uses a standards-based sign-in form with username/current-password
  autocomplete and named fields, allowing the browser password manager to offer
  to save and autofill credentials after a successful login.
- Passwords are not copied into application local storage for autofill; saving
  and suggesting the credentials is handled by the browser's password manager.
