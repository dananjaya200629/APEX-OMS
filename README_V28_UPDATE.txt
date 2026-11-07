APEX HOLDINGS OMS — V28 UPDATE

- Sidebar width is slightly reduced on desktop; the Lead List Note column is narrower.
- Lead import supports CSV, legacy XLS, and XLSX. Only the six source fields are required: Customer Name, Address, Contact No, Contact No 2, Other, Product Code. OMS creates Lead No / date, Pending status, Unassigned staff and a blank Note automatically.
- The new Import to Lead List action saves parsed rows directly into the selected company and opens the Lead List. Owner selects the target company; Company Admin imports only to their own company. Staff allocation remains available as an alternative action.
- Legacy .xls is parsed using xlrd; openpyxl handles .xlsx. The server launchers install dependencies from requirements.txt when needed.
- Owner can edit one shared Stock Unit Price from Stock List. New and pending company stock requests reflect the shared price; open company request forms refresh the unit price and total live through shared sync.
- Owner can set one global Company Commission Rate. Saving it updates the rate for every company and all commission calculations use the shared values.
- Owner-only Announcement page lets the Owner publish a headline, compressed poster image, animated scrolling text and an optional countdown. The banner appears for all users and updates via the existing live-sync server.

All previous V27 features and files are retained.
