from playwright.sync_api import sync_playwright
import base64,json,time
uid='11111111-1111-4111-8111-111111111111'
def enc(d):return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')
token=enc({'alg':'HS256','typ':'JWT'})+'.'+enc({'sub':uid,'role':'authenticated','exp':int(time.time())+3600})+'.mock-signature'
user={'id':uid,'aud':'authenticated','role':'authenticated','email':'mock@example.test','created_at':'2026-01-01T00:00:00Z','app_metadata':{},'user_metadata':{}}
with sync_playwright() as p:
 b=p.chromium.launch();c=b.new_context();page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if '/auth/v1/user' in r.request.url:r.fulfill(json=user)
  elif '/rest/v1/kasa_state' in r.request.url:
   if r.request.method=='GET':r.fulfill(json=[])
   else:r.fulfill(json=[{'updated_at':json.loads(r.request.post_data or '{}').get('updated_at')}])
  else:r.fulfill(status=400,json={'error':'unexpected mock request'})
 c.route('https://aypxpsuzobcjoiquucws.supabase.co/**',route)
 # New browser context has no verifier and no previous session: link received on another device.
 page.goto('http://localhost:8767/?keep=1#access_token='+token+'&refresh_token=mock-refresh-token&expires_in=3600&token_type=bearer&type=magiclink')
 page.wait_for_function("document.getElementById('sync-open').textContent==='Konto'")
 assert page.url=='http://localhost:8767/?keep=1',page.url
 page.wait_for_function("document.getElementById('sync-status').textContent.startsWith('Zsynchronizowano')")
 assert not errors,errors
 c.close();b.close()
print('PASS real vendored Supabase SDK + mocked API: implicit magic link accepted in fresh browser, no PKCE verifier, URL cleaned, existing query preserved')
