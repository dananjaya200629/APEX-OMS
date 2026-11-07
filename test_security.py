import os, tempfile, unittest

_tmp = tempfile.TemporaryDirectory()
os.environ['APEX_DATA_DIR'] = _tmp.name
os.environ['APEX_COOKIE_SECURE'] = 'false'
os.environ['APEX_OWNER_PASSWORD'] = 'UnitTest-Owner-Password-123!'

import auth_store
import state_store

class SecurityTests(unittest.TestCase):
    def test_password_hash_is_not_plaintext_and_verifies(self):
        encoded = auth_store.hash_password('Correct-Horse-Battery-123!')
        self.assertNotIn('Correct-Horse', encoded)
        self.assertTrue(auth_store.verify_password('Correct-Horse-Battery-123!', encoded))
        self.assertFalse(auth_store.verify_password('wrong', encoded))

    def test_state_sanitizer_removes_password_fields(self):
        payload = {'full': {'staff': [{'id':'S1','password':'plain'}], 'companies':[{'id':'C1','adminPassword':'plain'}], 'session': {'role':'Owner'}}}
        result = state_store.put_sanitized(payload)
        self.assertFalse(result.get('rejected'))
        stored = state_store.get_full()['db']
        self.assertNotIn('password', stored['staff'][0])
        self.assertNotIn('adminPassword', stored['companies'][0])
        self.assertNotIn('session', stored)

    def test_scoped_state_helper(self):
        from server import Handler
        h = object.__new__(Handler)
        db = {'companies':[{'id':'A'},{'id':'B'}], 'staff':[{'id':'1','companyId':'A'},{'id':'2','companyId':'B'}],
              'products':[{'id':1},{'id':2,'companyId':'B'}], 'leads':[{'no':'L1','companyId':'A'},{'no':'L2','companyId':'B'}],
              'stock':{'A':[1],'B':[2]}, 'orders':[], 'shipped':[], 'returned':[], 'stockRequests':[]}
        scoped = h._scope(db, {'role':'Admin','companyId':'A'})
        self.assertEqual([x['id'] for x in scoped['companies']], ['A'])
        self.assertEqual([x['id'] for x in scoped['staff']], ['1'])
        self.assertEqual([x['no'] for x in scoped['leads']], ['L1'])
        self.assertEqual(list(scoped['stock']), ['A'])

if __name__ == '__main__': unittest.main()
