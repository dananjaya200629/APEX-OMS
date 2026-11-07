APEX HOLDINGS OMS — V36 ANALYTICS & COST CONTROL UPDATE

DASHBOARD ANALYTICS
- Added a four-metric daily chart section for Sales, Profit, Expenses and Delivered Sale Quantity (PCS).
- Default date range is the latest 15 calendar days (today and the preceding 14 days).
- Start Date, End Date and Owner company filter are available.
- See More opens the complete Sales & Profit Report.

SALES & PROFIT REPORT
- Added a searchable, date-filterable order table with Order Number, Date & Time, customer, products, Qty, PCS, sale price, delivery charge, other expense, item cost, recognised sales, expenses, profit and status.
- Report defaults to the latest 15 calendar days and supports manual date ranges.
- Delivery Charge defaults to Rs. 350 per order and can be edited per order.
- Other Expense can be entered per order.
- Delivered orders recognise sales and item cost, then calculate profit after delivery and other expenses.
- Returned orders exclude item cost and sale revenue; delivery charge and other expenses remain as expenses.
- Pending and Shipped orders are not counted as completed sales or realised expenses.
- Admins see their own company data; Owner can review all companies or filter by company.

PRODUCT COST & PRICING MASTER
- Added a Product Cost & Pricing Master page for products in the selected company's Stock List.
- Configure wholesale price per PCS, inbound delivery cost per PCS and other cost per PCS.
- Configure manual real cost and sale price for 1, 2, 3, 4 PCS and additional PCS tiers.
- Product pricing is company-specific and is snapshotted into each new order line.

NEW ORDER / STOCK
- Added a separate PCS-per-pack selector alongside Qty.
- The selected PCS tier automatically supplies the configured sale price and real cost; sale price remains editable.
- Stock is deducted accurately using Qty × PCS.
- Pending order edit/delete and return stock restoration now account for PCS.

WAYBILL LAYOUT 3
- Replaced Layout 3 printing with a clean A4 portrait invoice / delivery note.
- Prints a maximum of two invoices per A4 page; additional invoices continue on following pages.
- Layouts 1 and 2 remain unchanged.

DATA & COMPATIBILITY
- Existing OMS records and login credentials are retained.
- Older orders receive the Rs. 350 default delivery charge and a legacy item-cost fallback.
- New accounting fields and product master details are stored in the existing OMS database and follow its current local/cloud sync mechanism.

START
- Windows: double-click start_server.bat
- Linux/macOS: ./start_server.sh
