import csv, io, json, os, re, shutil, subprocess, tempfile, uuid, zipfile, time, copy
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from email.parser import BytesParser
from email.policy import default
from openpyxl import load_workbook
try:
    import xlrd  # supports legacy binary .xls files without requiring LibreOffice
except ImportError:  # launcher installs requirements.txt on first run
    xlrd = None
from urllib.parse import urlsplit, parse_qs, unquote
import state_store
import auth_store

# Migrate any previous V44 shared-state passwords into the server-side PBKDF2 store.
_existing_state = state_store.get_full().get('db')
if _existing_state is not None:
    _legacy_passwords = any(isinstance(x,dict) and x.get('password') for x in _existing_state.get('staff',[]))
    _has_staff = bool(_existing_state.get('staff'))
    if auth_store.AUTH_FILE_WAS_MISSING and _has_staff and not _legacy_passwords:
        raise RuntimeError('The existing OMS database has users but the authentication hash file is missing. Restore a complete database + authentication backup; do not start with a newly generated Owner-only auth file.')
    auth_store.upsert_from_db(_existing_state)
    state_store.sanitize_existing_credentials()

ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('APEX_DATA_DIR', ROOT / 'data'))
UPLOAD_DIR = Path(os.environ.get('APEX_UPLOAD_DIR', DATA_DIR / 'uploads' / 'announcement'))
PORT = int(os.environ.get("APEX_PORT", "8765"))
HOST = os.environ.get("APEX_HOST", "127.0.0.1")   # set APEX_HOST=0.0.0.0 to let other devices on your network connect


def find_soffice():
    for name in ("soffice", "libreoffice", "soffice.exe", "libreoffice.exe"):
        p = shutil.which(name)
        if p:
            return p
    # LibreOffice on Windows is often installed but not added to PATH.
    for base in (os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)")):
        if base:
            candidate = Path(base) / "LibreOffice" / "program" / "soffice.exe"
            if candidate.exists():
                return str(candidate)
    return None


def parse_xlsx(data):
    wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    ws = wb.active
    cell_rows = list(ws.iter_rows())
    if not cell_rows:
        return []
    headers = [re.sub(r"[^a-z0-9]+", " ", str(c.value or "").lower()).strip() for c in cell_rows[0]]
    rows = []
    for row_index, cells in enumerate(cell_rows):
        out = []
        for col_index, cell in enumerate(cells):
            value = cell.value
            if value is None:
                out.append("")
                continue
            header = headers[col_index] if col_index < len(headers) else ""
            if row_index > 0 and re.search(r"(contact no|contact number|phone|tel)", header) and isinstance(value, (int, float)) and not isinstance(value, bool):
                digits = str(int(value)) if float(value).is_integer() else str(value)
                fmt = str(getattr(cell, "number_format", "") or "").split(";")[0]
                zero_mask = len(fmt) if fmt and set(fmt) == {"0"} else 0
                out.append(digits.zfill(max(10, zero_mask)))
            else:
                text_value = str(value)
                if row_index > 0 and re.search(r"(contact no|contact number|phone|tel)", header) and re.fullmatch(r"\d{9}", text_value):
                    text_value = "0" + text_value
                out.append(text_value)
        rows.append(out)
    wb.close()
    return rows


def parse_xls(data):
    """Read legacy .xls directly with xlrd; LibreOffice is retained as a fallback."""
    if xlrd is not None:
        book = xlrd.open_workbook(file_contents=data, formatting_info=True)
        sheet = book.sheet_by_index(0)
        if sheet.nrows == 0:
            return []
        headers = [re.sub(r"[^a-z0-9]+", " ", str(sheet.cell_value(0, c) or "").lower()).strip()
                   for c in range(sheet.ncols)]
        rows = []
        for ri in range(sheet.nrows):
            row = []
            for ci in range(sheet.ncols):
                cell = sheet.cell(ri, ci)
                value = cell.value
                if value == "" or value is None:
                    row.append("")
                    continue
                header = headers[ci] if ci < len(headers) else ""
                if ri > 0 and re.search(r"(contact no|contact number|phone|tel)", header) and cell.ctype == xlrd.XL_CELL_NUMBER:
                    digits = str(int(value)) if float(value).is_integer() else str(value)
                    mask_width = 0
                    try:
                        xf = book.xf_list[cell.xf_index]
                        fmt = book.format_map[xf.format_key].format_str
                        first_section = str(fmt).split(";")[0]
                        if first_section and set(first_section) == {"0"}:
                            mask_width = len(first_section)
                    except Exception:
                        pass
                    row.append(digits.zfill(max(10, mask_width)))
                else:
                    text_value = str(int(value)) if isinstance(value, float) and value.is_integer() else str(value)
                    if ri > 0 and re.search(r"(contact no|contact number|phone|tel)", header) and re.fullmatch(r"\d{9}", text_value):
                        text_value = "0" + text_value
                    row.append(text_value)
            rows.append(row)
        return rows

    # Fallback for environments where xlrd has not yet been installed.
    soffice = find_soffice()
    if not soffice:
        raise RuntimeError("Legacy .xls import requires xlrd. Start the OMS with start_server.bat / start_server.sh to install required dependencies, or save the file as .xlsx/.csv.")
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "upload.xls"
        src.write_bytes(data)
        out = Path(td) / "out"
        out.mkdir()
        proc = subprocess.run([soffice, "--headless", "--convert-to", "xlsx", "--outdir", str(out), str(src)],
                              capture_output=True, text=True, timeout=60)
        xlsx_path = out / "upload.xlsx"
        if proc.returncode == 0 and xlsx_path.exists():
            return parse_xlsx(xlsx_path.read_bytes())
        detail = proc.stderr.strip() or "Could not convert XLS file"
        raise RuntimeError(detail)


_login_attempts = {}
_login_lock = __import__('threading').Lock()

def create_backup_file():
    backup_dir=Path(os.environ.get('APEX_BACKUP_DIR',DATA_DIR/'backups')); backup_dir.mkdir(parents=True,exist_ok=True)
    stamp=time.strftime('%Y%m%d-%H%M%S',time.gmtime()); dest=backup_dir/f'apex-oms-backup-{stamp}.zip'
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
        for f,rel in ((state_store.STATE_FILE,'database/oms_state.json'),(auth_store.AUTH_FILE,'database/auth_users.json')):
            if f.exists(): z.write(f,rel)
        if UPLOAD_DIR.exists():
            for f in UPLOAD_DIR.rglob('*'):
                if f.is_file(): z.write(f,str(Path('uploads/announcement')/f.relative_to(UPLOAD_DIR)))
    backups=sorted(backup_dir.glob('apex-oms-backup-*.zip'),key=lambda x:x.stat().st_mtime,reverse=True)
    for old in backups[30:]:
        try: old.unlink()
        except OSError: pass
    return dest

def automatic_backup_loop():
    while True:
        time.sleep(24*60*60)
        try: create_backup_file()
        except Exception as exc: print('Automatic backup failed:',exc,flush=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_json(self, payload, status=200):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _token(self):
        cookie = self.headers.get('Cookie', '')
        for part in cookie.split(';'):
            k, _, v = part.strip().partition('=')
            if k == 'apex_session': return v
        return ''

    def _user(self):
        return auth_store.session(self._token())

    def _require_user(self):
        user = self._user()
        if not user: self.end_json({'error':'Authentication required'}, 401)
        return user

    def _visible_company_ids(self, db, user):
        if user.get('role') == 'Owner': return {c.get('id') for c in db.get('companies',[]) if isinstance(c,dict)}
        root=user.get('companyId'); visible={root}
        if user.get('role')!='Admin': return visible
        changed=True
        companies=db.get('companies',[]) if isinstance(db,dict) else []
        while changed:
            changed=False
            for company in companies:
                if isinstance(company,dict) and company.get('parentCompanyId') in visible and company.get('id') not in visible:
                    visible.add(company.get('id')); changed=True
        return visible

    def _scope(self, db, user):
        if not isinstance(db, dict) or user.get('role') == 'Owner': return db
        cid = user.get('companyId'); visible=self._visible_company_ids(db,user)
        out = copy.deepcopy(db)
        out['companies'] = [x for x in db.get('companies',[]) if x.get('id') in visible]
        out['staff'] = [x for x in db.get('staff',[]) if x.get('companyId') in visible]
        out['products'] = [x for x in db.get('products',[]) if not x.get('companyId') or x.get('companyId') in visible]
        for key in ('leads','orders','shipped','returned','stockRequests'):
            out[key] = [x for x in db.get(key,[]) if x.get('companyId') in visible]
        out['stock'] = {key:db.get('stock',{}).get(key,[]) for key in visible if key in db.get('stock',{})}
        return out

    def _validate_scope(self, payload, user):
        if user.get('role') == 'Owner': return True
        if payload.get('full') is not None: return False
        cid=user.get('companyId'); role=user.get('role'); changes=payload.get('changes',{})
        allowed={
            'Admin': {'companies','staff','products','stock','leads','orders','shipped','returned','stockRequests','nextOrder','nextWaybill'},
            'Sales': {'leads','orders','stockRequests','nextOrder'},
            'Shipping': {'shipped','returned','nextWaybill'},
        }.get(role,set())
        if any(key not in allowed for key in changes): return False
        global_db=state_store.get_full().get('db') or {}
        visible=self._visible_company_ids(global_db,user)
        new_child_ids=set()
        company_op=changes.get('companies')
        if company_op:
            if role!='Admin' or company_op.get('t')!='arr' or company_op.get('del'): return False
            for item in company_op.get('up',[]):
                if not isinstance(item,dict): return False
                prior=next((c for c in global_db.get('companies',[]) if c.get('id')==item.get('id')),None)
                if prior: return False
                if item.get('parentCompanyId')!=cid or item.get('createdByAdminId')!=user.get('staffId'): return False
                if any(str(c.get('name','')).strip().lower()==str(item.get('name','')).strip().lower() for c in global_db.get('companies',[])): return False
                new_child_ids.add(item.get('id'))
        def existing_items(key,field):
            return {x.get(field):x for x in global_db.get(key,[]) if isinstance(x,dict) and x.get(field) is not None}
        for key,op in changes.items():
            if key=='companies': continue
            if key=='nextOrder' or key=='nextWaybill':
                if op.get('t')!='replace' or not isinstance(op.get('v'),(int,float)): return False
                continue
            if key=='stock':
                if role!='Admin' or op.get('t')!='obj': return False
                for company_key,value in op.get('set',{}).items():
                    if company_key!=cid and not (company_key in new_child_ids and value==[]): return False
                if any(k!=cid for k in op.get('del',[])): return False
                continue
            if op.get('t')!='arr': return False
            field=op.get('idf','id'); old=existing_items(key,field)
            for item in op.get('up',[]):
                if not isinstance(item,dict): return False
                company_id=item.get('companyId')
                if key=='staff':
                    if role!='Admin': return False
                    prior=old.get(item.get(field))
                    if prior and prior.get('type')=='Admin':
                        if prior.get('id')!=user.get('staffId') or item.get('type')!='Admin' or item.get('email')!=prior.get('email') or item.get('companyId')!=cid or item.get('password'): return False
                        changed={k for k in set(prior)|set(item) if prior.get(k)!=item.get(k)}
                        if not changed.issubset({'name','phone'}): return False
                    elif prior:
                        if prior.get('companyId')!=cid or prior.get('type') not in ('Sales','Shipping') or company_id!=cid or item.get('type')!=prior.get('type'): return False
                    elif not (company_id==cid and item.get('type') in ('Sales','Shipping')) and not (company_id in new_child_ids and item.get('type')=='Admin'):
                        return False
                    email=str(item.get('email','')).strip().lower()
                    if not email: return False
                    for existing in global_db.get('staff',[]):
                        if existing.get('id')!=item.get('id') and str(existing.get('email','')).strip().lower()==email: return False
                    for other in op.get('up',[]):
                        if other is not item and str(other.get('email','')).strip().lower()==email: return False
                elif key=='products':
                    if role!='Admin' or company_id!=cid: return False
                    prior=old.get(item.get(field))
                    if prior and prior.get('companyId')!=cid: return False
                elif key in ('leads','orders','shipped','returned','stockRequests'):
                    if company_id not in visible and company_id not in new_child_ids: return False
                    prior=old.get(item.get(field))
                    if prior and prior.get('companyId')!=company_id: return False
                    if key=='leads' and item.get('assignedStaffId'):
                        assignee=next((x for x in global_db.get('staff',[])+op.get('up',[]) if x.get('id')==item.get('assignedStaffId')),None)
                        if not assignee or assignee.get('companyId')!=company_id: return False
                    if key=='returned' and item.get('orderId'):
                        order=next((x for x in global_db.get('orders',[]) if x.get('id')==item.get('orderId')),None)
                        if order and order.get('companyId')!=company_id: return False
                    if key=='stockRequests':
                        if prior and item.get('status')!=prior.get('status'): return False
                        if not prior and item.get('status','Pending')!='Pending': return False
            if op.get('del'):
                if key not in ('staff','products','leads','orders','stockRequests'): return False
                if key in ('staff','products') and role!='Admin': return False
                if key=='leads' and role!='Admin': return False
                for ident in op.get('del',[]):
                    prior=old.get(ident)
                    if not prior or prior.get('companyId') not in visible: return False
                    if key=='staff' and (prior.get('companyId')!=cid or prior.get('type') not in ('Sales','Shipping')): return False
                    if key=='products' and prior.get('companyId')!=cid: return False
        return True

    def do_GET(self):
        parts = urlsplit(self.path)
        if parts.path == '/api/health':
            return self.end_json({'ok':True,'service':'APEX OMS','version':'V44-GH'})
        if parts.path == '/api/backup':
            user=self._require_user()
            if not user: return
            if user.get('role')!='Owner': return self.end_json({'error':'Owner only'},403)
            try: dest=create_backup_file()
            except Exception: return self.end_json({'error':'Backup creation failed'},500)
            self.send_response(200); self.send_header('Content-Type','application/zip'); self.send_header('Content-Disposition',f'attachment; filename="{dest.name}"'); self.send_header('Content-Length',str(dest.stat().st_size)); self.end_headers()
            with dest.open('rb') as f: shutil.copyfileobj(f,self.wfile)
            return
        if parts.path == '/api/state':
            user = self._require_user()
            if not user: return
            try: since = int((parse_qs(parts.query).get('since', ['-1'])[0] or '-1'))
            except (TypeError,ValueError): return self.end_json({'error':'Invalid sync version'},400)
            data = state_store.get(since)
            if data.get('db') is not None: data['db'] = self._scope(data['db'], user)
            return self.end_json(data)
        if parts.path.startswith('/uploads/'):
            if not self._require_user(): return
            rel=parts.path[len('/uploads/'):].replace('\\','/')
            target=(UPLOAD_DIR/rel.split('/',1)[-1]).resolve() if rel.startswith('announcement/') else None
            if not target or UPLOAD_DIR.resolve() not in target.parents or not target.is_file(): return self.send_error(404)
            import mimetypes
            self.send_response(200); self.send_header('Content-Type',mimetypes.guess_type(str(target))[0] or 'application/octet-stream'); self.send_header('Content-Length',str(target.stat().st_size)); self.send_header('Cache-Control','private, max-age=3600'); self.end_headers()
            with target.open('rb') as f: shutil.copyfileobj(f,self.wfile)
            return
        # Serve only the public front-end allow-list. Python modules, runtime data,
        # environment files, repository metadata and deployment configuration are never web-accessible.
        public_files={'/','/index.html','/styles.css','/app.js','/sync.js','/i18n-data.js','/i18n.js'}
        public_path=unquote(parts.path)
        if public_path in public_files:
            return super().do_GET()
        if public_path.startswith('/assets/'):
            asset=(ROOT/public_path.lstrip('/')).resolve()
            assets_root=(ROOT/'assets').resolve()
            if assets_root in asset.parents and asset.is_file() and asset.suffix.lower() in ('.png','.jpg','.jpeg','.webp','.gif','.svg','.woff','.woff2','.ttf'):
                return super().do_GET()
        return self.send_error(404)

    def do_HEAD(self):
        parts=urlsplit(self.path); public_path=unquote(parts.path)
        public_files={'/','/index.html','/styles.css','/app.js','/sync.js','/i18n-data.js','/i18n.js'}
        if public_path in public_files: return super().do_HEAD()
        if public_path.startswith('/assets/'):
            asset=(ROOT/public_path.lstrip('/')).resolve(); assets_root=(ROOT/'assets').resolve()
            if assets_root in asset.parents and asset.is_file() and asset.suffix.lower() in ('.png','.jpg','.jpeg','.webp','.gif','.svg','.woff','.woff2','.ttf'):
                return super().do_HEAD()
        return self.send_error(404)

    def do_PUT(self):
        if urlsplit(self.path).path != '/api/state': return self.send_error(404)
        user = self._require_user()
        if not user: return
        length = int(self.headers.get('Content-Length', '0'))
        if length <= 0 or length > state_store.MAX_BYTES: return self.end_json({'error':'Invalid or oversized payload'}, 413)
        try: payload = json.loads(self.rfile.read(length).decode('utf-8'))
        except Exception: return self.end_json({'error':'Bad JSON'}, 400)
        if not isinstance(payload,dict): return self.end_json({'error':'Invalid payload'},400)
        if not self._validate_scope(payload,user): return self.end_json({'error':'You do not have permission to change this data'},403)
        # Hash any newly supplied credentials before the shared state sanitizer removes them.
        if payload.get('full') is not None: auth_store.upsert_from_db(payload['full'])
        else:
            # Existing server state plus incoming changes is inspected after applying the patch.
            before = state_store.get_full().get('db') or {}
            probe = copy.deepcopy(before)
            from state_store import _apply_changes
            _apply_changes(probe, payload.get('changes',{}))
            auth_store.upsert_from_db(probe)
        result = state_store.put_sanitized(payload)
        if payload.get('full') is not None and not result.get('rejected'):
            try: create_backup_file()
            except Exception as exc: print('Initial data backup failed:',exc,flush=True)
        return self.end_json(result)

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == '/api/login':
            length = int(self.headers.get('Content-Length','0'))
            if length > 16_384: return self.end_json({'error':'Invalid request'},413)
            try: body=json.loads(self.rfile.read(length).decode('utf-8'))
            except Exception: return self.end_json({'error':'Invalid login request'},400)
            ip=self.client_address[0]+'|'+str(body.get('email','')).strip().lower()
            with _login_lock:
                attempts=[t for t in _login_attempts.get(ip,[]) if time.time()-t<300]
                if len(attempts)>=10: return self.end_json({'error':'Too many login attempts. Try again in five minutes.'},429)
            result=auth_store.authenticate(body.get('email'),body.get('password'))
            if result and result[1].get('role')!='Owner' and state_store.get_full().get('db') is None:
                auth_store.revoke(result[0]); result=None
            if not result:
                with _login_lock: _login_attempts.setdefault(ip,[]).append(time.time())
                return self.end_json({'error':'Invalid email or password'},401)
            with _login_lock: _login_attempts.pop(ip,None)
            token,user=result
            self.send_response(200); self.send_header('Content-Type','application/json; charset=utf-8')
            secure='; Secure' if os.environ.get('APEX_COOKIE_SECURE', 'true').lower()=='true' else ''
            self.send_header('Set-Cookie',f'apex_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200{secure}')
            self.send_header('Cache-Control','no-store'); self.end_headers()
            raw=json.dumps({'user':user},ensure_ascii=False).encode(); self.wfile.write(raw); return
        if path == '/api/logout':
            auth_store.revoke(self._token()); self.send_response(200)
            self.send_header('Set-Cookie','apex_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
            self.send_header('Content-Length','0'); self.end_headers(); return
        if path == '/api/change-password':
            user=self._require_user()
            if not user: return
            length=int(self.headers.get('Content-Length','0'))
            if length>16384: return self.end_json({'error':'Invalid request'},413)
            try: body=json.loads(self.rfile.read(length).decode('utf-8'))
            except Exception: return self.end_json({'error':'Invalid request'},400)
            ok,message=auth_store.change_password(user.get('email'),body.get('currentPassword'),body.get('newPassword'))
            return self.end_json({'ok':ok,'message':message},200 if ok else 400)
        if path == '/api/backup':
            user=self._require_user()
            if not user: return
            if user.get('role')!='Owner': return self.end_json({'error':'Owner only'},403)
            try: dest=create_backup_file()
            except Exception as exc: return self.end_json({'error':'Backup creation failed'},500)
            self.send_response(200); self.send_header('Content-Type','application/zip'); self.send_header('Content-Disposition',f'attachment; filename="{dest.name}"'); self.send_header('Content-Length',str(dest.stat().st_size)); self.end_headers()
            with dest.open('rb') as f: shutil.copyfileobj(f,self.wfile)
            return
        if path == '/api/restore':
            user=self._require_user()
            if not user: return
            if user.get('role')!='Owner': return self.end_json({'error':'Owner only'},403)
            length=int(self.headers.get('Content-Length','0'))
            if length<=0 or length>300*1024*1024: return self.end_json({'error':'Backup file too large or empty'},413)
            try:
                body=self.rfile.read(length); ctype=self.headers.get('Content-Type','')
                msg=BytesParser(policy=default).parsebytes((f'Content-Type: {ctype}\r\nMIME-Version: 1.0\r\n\r\n').encode()+body)
                part=next((x for x in msg.iter_attachments() if x.get_param('name',header='content-disposition')=='file'),None)
                if part is None: return self.end_json({'error':'No backup file supplied'},400)
                raw=part.get_payload(decode=True) or b''
                with zipfile.ZipFile(io.BytesIO(raw)) as z:
                    names=z.namelist()
                    if len(names)>10000 or sum(i.file_size for i in z.infolist())>500*1024*1024: return self.end_json({'error':'Backup archive exceeds restore limits'},413)
                    allowed={'database/oms_state.json','database/auth_users.json'}
                    for info in z.infolist():
                        safe_name=info.filename.replace('\\','/')
                        name=Path(safe_name)
                        if name.is_absolute() or '..' in name.parts: return self.end_json({'error':'Unsafe backup archive path'},400)
                        if safe_name not in allowed and not safe_name.startswith('uploads/announcement/'): return self.end_json({'error':'Unexpected file in backup archive'},400)
                    DATA_DIR.mkdir(parents=True,exist_ok=True)
                    if UPLOAD_DIR.exists(): shutil.rmtree(UPLOAD_DIR)
                    UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
                    if 'database/oms_state.json' in names:
                        state_store.STATE_FILE.write_bytes(z.read('database/oms_state.json'))
                    if 'database/auth_users.json' in names:
                        auth_store.AUTH_FILE.write_bytes(z.read('database/auth_users.json'))
                    for archive_name in names:
                        safe_name=archive_name.replace('\\','/')
                        if safe_name.startswith('uploads/announcement/') and not safe_name.endswith('/'):
                            dest=UPLOAD_DIR/safe_name.split('/',2)[-1]; dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(z.read(archive_name))
                state_store._load(); auth_store._load()
                return self.end_json({'ok':True,'message':'Backup restored. Sign in again.'})
            except Exception as exc: return self.end_json({'error':'Backup restore failed: '+str(exc)},400)
        if path in ('/api/announcement-media','/api/parse-excel'):
            user=self._require_user()
            if not user: return
        if path == '/api/announcement-media':
            if user.get('role') not in ('Owner','Admin'): return self.end_json({'error':'Owner/Admin only'},403)
            try:
                length=int(self.headers.get('Content-Length','0'))
                if length<=0: return self.end_json({'error':'No media file uploaded'},400)
                if length>25*1024*1024+256*1024: return self.end_json({'error':'Media must be smaller than 25 MB'},413)
                body=self.rfile.read(length); content_type=self.headers.get('Content-Type','')
                msg=BytesParser(policy=default).parsebytes((f'Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n').encode()+body)
                item=next((part for part in msg.iter_attachments() if part.get_param('name',header='content-disposition')=='file'),None)
                if item is None: return self.end_json({'error':'No media file uploaded'},400)
                data=item.get_payload(decode=True) or b''; mime=(item.get_content_type() or '').lower(); name=item.get_filename() or ''
                allowed={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','image/avif':'.avif','video/mp4':'.mp4','video/webm':'.webm','video/ogg':'.ogv'}
                if mime not in allowed:
                    ext=Path(name).suffix.lower(); by_ext={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.ogv':'video/ogg','.ogg':'video/ogg'}; mime=by_ext.get(ext,'')
                if mime not in allowed: return self.end_json({'error':'Unsupported media type'},415)
                if not data or len(data)>25*1024*1024: return self.end_json({'error':'Invalid media size'},413)
                target=UPLOAD_DIR; target.mkdir(parents=True,exist_ok=True)
                filename=f'banner_{uuid.uuid4().hex}{allowed[mime]}'; (target/filename).write_bytes(data)
                return self.end_json({'url':f'/uploads/announcement/{filename}','type':mime,'size':len(data)},201)
            except Exception as e: return self.end_json({'error':'Media upload failed'},500)
        if path != '/api/parse-excel': return self.send_error(404)
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length<=0 or length>20*1024*1024: return self.end_json({'error':'Excel file too large or empty'},413)
            body=self.rfile.read(length); content_type=self.headers.get('Content-Type','')
            msg=BytesParser(policy=default).parsebytes((f'Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n').encode()+body)
            item=next((p for p in msg.iter_attachments() if p.get_param('name',header='content-disposition')=='file'),None)
            if item is None: return self.end_json({'error':'No file uploaded'},400)
            data=item.get_payload(decode=True) or b''; name=item.get_filename() or ''; lower=name.lower()
            if lower.endswith('.xlsx'): rows=parse_xlsx(data)
            elif lower.endswith('.xls'): rows=parse_xls(data)
            else: return self.end_json({'error':'Only .xls and .xlsx are accepted'},400)
            return self.end_json(rows)
        except Exception as e: return self.end_json({'error':'Excel import failed: '+str(e)},400)


if __name__ == "__main__":
    print(f"APEX HOLDINGS OMS running at http://{HOST if HOST != '0.0.0.0' else '127.0.0.1'}:{PORT}")
    print("APEX OMS API and web server ready. Data directory:", DATA_DIR, flush=True)
    import threading
    try: create_backup_file()
    except Exception as exc: print('Initial backup skipped:',exc,flush=True)
    threading.Thread(target=automatic_backup_loop,daemon=True).start()
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
