APEX HOLDINGS OMS — V25
1. LIVE UPDATES (needs the server running: start_server.bat / ./start_server.sh, then open http://127.0.0.1:8765)
   - Every change (leads, orders, stock, stock requests, companies, staff...) is sent to the server and every other open session
     picks it up within ~2 seconds, without refreshing. A green "Live" badge at the top shows the connection; "Offline" means
     changes stay in that browser only.
   - Changes are merged record by record, so two users working on different leads/orders do not overwrite each other. If two people
     edit the very same record at the same moment, the last save wins.
   - If the Owner blocks/deletes a company or changes a login, that company's open sessions are signed out automatically.
   - Pages with a form or open pop-up are not refreshed under the user's hands; filters/search boxes are kept when a page refreshes.
   - Shared data is saved in oms_state.json next to server.py (back this file up). To let other computers/phones on your network use the
     same system, start the server with:  APEX_HOST=0.0.0.0  (Windows: set APEX_HOST=0.0.0.0 before start_server.bat) and open
     http://<this-computer-IP>:8765 on them.
   - Passwords are still stored as plain text inside the OMS data (as in earlier versions) and the server has no extra login layer, so only
     use it on a trusted network. Before putting it on the public internet it needs a proper secured backend.
2. Owner > Company List: Edit Login (company name, admin username, password, manager, address, phone), Block / Unblock and Delete (these were
   already present and were re-tested).
3. Owner > Stock List: new "Stock Held By Companies" column shows every company that holds each product with its quantity; the search
   also matches company names.
4. Stock List search (name, product code, price, stock quantity) works for Owner, Admin, Sales and Shipping.
5. Owner > Company Stock Requests: "Approve" and "Reject" buttons on every request, plus "Approve Selected" / "Reject Selected".
6. Font: Inter for English and Noto Sans Sinhala (bundled, works offline) for Sinhala, with cleaner sizes and spacing.
