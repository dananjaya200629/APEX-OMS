"""Server-side authentication for APEX OMS. Passwords are PBKDF2-SHA256 hashes only."""
import base64, hashlib, hmac, json, os, secrets, threading, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
DATA_DIR=Path(os.environ.get('APEX_DATA_DIR', ROOT/'data'))
AUTH_FILE=Path(os.environ.get('APEX_AUTH_FILE', DATA_DIR/'auth_users.json'))
AUTH_FILE_WAS_MISSING = not AUTH_FILE.exists()
ITERATIONS=310_000
_lock=threading.RLock(); _users={}; _sessions={}

def _save():
    AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp=AUTH_FILE.with_suffix('.tmp'); tmp.write_text(json.dumps(_users,ensure_ascii=False),encoding='utf-8'); tmp.replace(AUTH_FILE)
def _load():
    global _users
    if AUTH_FILE.exists():
        try:
            loaded=json.loads(AUTH_FILE.read_text(encoding='utf-8'))
            if not isinstance(loaded,dict): raise ValueError('Invalid authentication store structure')
            _users=loaded
        except Exception as exc:
            raise RuntimeError(f'Authentication store could not be read safely from {AUTH_FILE}. Restore a verified backup before starting: {exc}') from exc
    email=os.environ.get('APEX_OWNER_USERNAME','owner@apexholdings.lk').strip().lower()
    password=os.environ.get('APEX_OWNER_PASSWORD','ApexOwner@2026')
    changed=False
    if email not in _users:
        if len(password) < 12: raise RuntimeError('APEX_OWNER_PASSWORD must be at least 12 characters for the initial Owner account.')
        _users[email]={'email':email,'name':'APEX Owner','role':'Owner','staffId':None,'companyId':None,'active':True,'hash':hash_password(password)}; changed=True
    # Legacy V44 demo accounts are seeded on the server only; their passwords are never sent to the browser.
    demo_companies=[('CMP-001','lfh','LFH@1001'),('CMP-002','kandy','KANDY@1002'),('CMP-003','colombo','COLOMBO@1003'),('CMP-004','galle','GALLE@1004'),('CMP-005','ruhuna','RUHUNA@1005')]
    for i,(cid,slug,admin_pw) in enumerate(demo_companies,1):
        rows=[(f'ST-{i}A',f'admin.{slug}@apexdemo.lk','Admin',admin_pw,f'{slug.title()} Admin'),
              (f'ST-{i}S',f'sales.{slug}@apexdemo.lk','Sales',f'Sales@{2000+i}',f'{slug.title()} Sales'),
              (f'ST-{i}W',f'ship.{slug}@apexdemo.lk','Shipping',f'Ship@{3000+i}',f'{slug.title()} Shipping')]
        for sid,mail,role,pw,name in rows:
            if mail not in _users:
                _users[mail]={'email':mail,'name':name,'role':role,'staffId':sid,'companyId':cid,'active':True,'hash':hash_password(pw)}; changed=True
    if changed: _save()

def hash_password(password):
    salt=secrets.token_bytes(16); digest=hashlib.pbkdf2_hmac('sha256',str(password).encode(),salt,ITERATIONS)
    return 'pbkdf2_sha256$%d$%s$%s'%(ITERATIONS,base64.b64encode(salt).decode(),base64.b64encode(digest).decode())
def verify_password(password, encoded):
    try:
        alg,it,salt,digest=encoded.split('$'); actual=hashlib.pbkdf2_hmac('sha256',str(password).encode(),base64.b64decode(salt),int(it))
        return alg=='pbkdf2_sha256' and hmac.compare_digest(actual,base64.b64decode(digest))
    except Exception: return False

def upsert_from_db(db):
    """Import credentials from a trusted state mutation; preserve hashes when a password is omitted."""
    if not isinstance(db,dict): return
    with _lock:
        old_users=dict(_users); next_users={}
        companies={c.get('id'):c for c in db.get('companies',[]) if isinstance(c,dict)}
        for staff in db.get('staff',[]) if isinstance(db.get('staff'),list) else []:
            if not isinstance(staff,dict) or not staff.get('email'): continue
            email=str(staff['email']).strip().lower(); sid=staff.get('id')
            prior=old_users.get(email) or next((u for u in old_users.values() if sid and u.get('staffId')==sid),{})
            password=staff.get('password')
            encoded=hash_password(password) if password else prior.get('hash','')
            company=companies.get(staff.get('companyId'),{})
            row={'email':email,'name':staff.get('name',''),'role':staff.get('type','Sales'),'staffId':sid,'companyId':staff.get('companyId'),'active':company.get('active',True) is not False,'hash':encoded}
            if encoded: next_users[email]=row
        # Preserve the owner account and any non-staff service accounts.
        for email,row in old_users.items():
            if row.get('role')=='Owner': next_users[email]=row
        _users.clear(); _users.update(next_users); _save()

def authenticate(email,password):
    with _lock:
        user=_users.get(str(email or '').strip().lower())
        if not user or not user.get('active',True) or not user.get('hash') or not verify_password(password,user['hash']): return None
        token=secrets.token_urlsafe(36); _sessions[token]=(dict(user),time.time()+60*60*12)
        return token, {k:user.get(k) for k in ('email','name','role','staffId','companyId')}
def session(token):
    if not token:return None
    with _lock:
        item=_sessions.get(token)
        if not item:return None
        if item[1]<time.time(): _sessions.pop(token,None); return None
        current=_users.get(item[0].get('email'))
        if not current or not current.get('active',True): _sessions.pop(token,None); return None
        return dict(current)
def revoke(token):
    with _lock: _sessions.pop(token,None)
_load()


def change_password(email, current_password, new_password):
    email=str(email or '').strip().lower()
    if len(str(new_password or ''))<12: return False, 'New password must be at least 12 characters.'
    with _lock:
        user=_users.get(email)
        if not user or not verify_password(current_password,user.get('hash','')): return False, 'Current password is incorrect.'
        user['hash']=hash_password(new_password); _save(); return True, 'Password updated.'
