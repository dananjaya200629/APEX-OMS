APEX HOLDINGS OMS V44 — OWNER MONTHLY STOCK INCOME

- Added a Stock Income card to the Owner Dashboard only, directly above Sales, Profit & Expense Analytics.
- Counts only stock requests with Approved status; Pending and rejected requests are excluded.
- Recognises income on the Owner approval date (approvedAt), falling back to the request date for older approved records.
- Monthly income is calculated from each approved request's stock total (request total, or quantity × unit cost when no total is stored).
- The current month remains ongoing and accumulates approved stock income as further requests are approved.
- Added Start Date / End Date filters, a horizontally scrollable monthly column chart, and a vertically scrollable monthly history table.
- Existing stock request records and other OMS workflows are preserved.
- JavaScript syntax checked successfully.
