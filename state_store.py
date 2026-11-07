"""Shared live state for APEX OMS.

Every browser keeps working from its own copy of the OMS data, but pushes small
changes here and polls for other people's changes, so all users see updates live.

Changes are merged per collection / per record (not whole-database overwrite), so two
people editing different leads, orders or stock requests at the same time do not erase
each other. Two people editing the very same record at the same moment: last save wins.
"""
import json, threading, time, os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('APEX_DATA_DIR', ROOT / 'data'))
STATE_FILE = Path(os.environ.get('APEX_STATE_FILE', DATA_DIR / 'oms_state.json'))
MAX_BYTES = 80 * 1024 * 1024

_lock = threading.Lock()
_state = {"version": 0, "db": None}


def _load():
    if not STATE_FILE.exists(): return
    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "db" not in data:
            raise ValueError("Invalid OMS state structure")
        _state.update(version=int(data.get("version", 0)), db=data["db"])
    except Exception as exc:
        raise RuntimeError(f"OMS database could not be read safely from {STATE_FILE}. Restore a verified backup before starting the service: {exc}") from exc

def _persist():
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(_state, ensure_ascii=False), encoding="utf-8")
    tmp.replace(STATE_FILE)


def _apply_array(cur, op):
    idf = op["idf"]
    cur = [x for x in (cur if isinstance(cur, list) else [])]
    dels = set(op.get("del", []))
    out, index = [], {}
    for item in cur:
        k = item.get(idf) if isinstance(item, dict) else None
        if k in dels:
            continue
        index[k] = len(out)
        out.append(item)
    for item in op.get("up", []):
        k = item.get(idf)
        if k in index:
            out[index[k]] = item
        else:
            index[k] = len(out)
            out.append(item)
    return out


def _apply_changes(db, changes):
    for key, op in changes.items():
        t = op.get("t")
        if t == "replace":
            db[key] = op.get("v")
        elif t == "arr":
            db[key] = _apply_array(db.get(key), op)
        elif t == "obj":
            cur = db.get(key) if isinstance(db.get(key), dict) else {}
            for k, v in op.get("set", {}).items():
                cur[k] = v
            for k in op.get("del", []):
                cur.pop(k, None)
            db[key] = cur
        elif t == "delete":
            db.pop(key, None)


def get(since):
    with _lock:
        if _state["db"] is None:
            return {"version": 0, "db": None}
        if since == _state["version"]:
            return {"version": _state["version"], "changed": False}
        return {"version": _state["version"], "changed": True, "db": json.loads(json.dumps(_state["db"]))}


def put(payload):
    with _lock:
        prev = _state["version"]
        if payload.get("full") is not None:
            # first upload only; never overwrite existing shared data with a full copy
            if _state["db"] is not None:
                return {"version": prev, "prev": prev, "rejected": True}
            db = payload["full"]
            db.pop("session", None)
            _state["db"] = db
        else:
            if _state["db"] is None:
                return {"version": 0, "prev": 0, "rejected": True}
            _apply_changes(_state["db"], payload.get("changes", {}))
        _state["version"] = prev + 1
        _persist()
        return {"version": _state["version"], "prev": prev}


_load()

def get_full():
    with _lock:
        return json.loads(json.dumps(_state))

def put_sanitized(payload):
    """Persist shared state after removing credential fields from any stored record."""
    def clean_db(db):
        if not isinstance(db,dict): return db
        db=json.loads(json.dumps(db))
        for s in db.get('staff',[]) if isinstance(db.get('staff'),list) else []:
            if isinstance(s,dict): s.pop('password',None)
        for c in db.get('companies',[]) if isinstance(db.get('companies'),list) else []:
            if isinstance(c,dict): c.pop('adminPassword',None)
        db.pop('session',None)
        return db
    clean=json.loads(json.dumps(payload))
    if clean.get('full') is not None: clean['full']=clean_db(clean['full'])
    else:
        changes=clean.get('changes',{})
        for key,op in changes.items():
            if key=='staff' and op.get('t')=='arr':
                for item in op.get('up',[]):
                    if isinstance(item,dict): item.pop('password',None)
            if key=='companies' and op.get('t')=='arr':
                for item in op.get('up',[]):
                    if isinstance(item,dict): item.pop('adminPassword',None)
    return put(clean)

def sanitize_existing_credentials():
    """One-time migration for V44 stores that previously kept passwords in shared JSON."""
    with _lock:
        if not isinstance(_state.get('db'), dict): return False
        changed=False
        for staff in _state['db'].get('staff',[]) if isinstance(_state['db'].get('staff'),list) else []:
            if isinstance(staff,dict) and 'password' in staff:
                staff.pop('password',None); changed=True
        for company in _state['db'].get('companies',[]) if isinstance(_state['db'].get('companies'),list) else []:
            if isinstance(company,dict) and 'adminPassword' in company:
                company.pop('adminPassword',None); changed=True
        if 'session' in _state['db']:
            _state['db'].pop('session',None); changed=True
        if changed: _persist()
        return changed
