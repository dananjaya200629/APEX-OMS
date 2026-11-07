APEX HOLDINGS OMS — V21 LEAD IMPORT FIX

Fixes:
- Added “Import to Lead List” directly after CSV/XLS/XLSX preview.
- Direct import saves every valid imported row to db.leads with generated Lead No, Lead Date, Pending status, blank note, and Unassigned staff.
- Company Admin imports are saved to that admin's own company.
- Owner imports prompt for a target company, then save leads into that company's Lead List.
- After import, the app opens Lead List. The imported rows are visible without requiring staff assignment first.
- Existing “Assign Imported Leads” workflow remains available for users who want to distribute leads to Sales/Shipping staff.

Import file columns:
Customer Name, Address, Contact No, Contact No 2, Other, Product Code

Validation performed:
- JavaScript syntax check (node --check app.js).

SUPERSEDED BY V22:
V22 removes unassigned import. Every imported lead must be assigned to a Sales/Shipping user before it is saved. The Lead List daily visibility, historical date filtering, bulk reassignment/deletion and chart toggles are also updated in V22.
