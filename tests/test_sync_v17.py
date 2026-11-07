from pathlib import Path
from playwright.sync_api import sync_playwright
from copy import deepcopy
root=Path(__file__).resolve().parents[1]
cloud={'row':None,'writes':0}
mock='''(()=>{let session=null;const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.test'};let cb=()=>{};
function chain(action,payload){let expected;return {eq(k,v){if(k==='updated_at')expected=v;return this},select(){return window.mockDB({action,payload,expected})},maybeSingle(){return window.mockDB({action:'read'})}}}
window.KASA_TEST_CLIENT={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:f=>{cb=f;return {data:{subscription:{unsubscribe(){}}}}},signInWithOtp:async options=>{window.otpOptions=options;return {error:null}},verifyOtp:async()=>{session={user};cb('SIGNED_IN',session);return {data:{user,session},error:null}},signOut:async()=>{session=null;cb('SIGNED_OUT',null);return {error:null}}},from:()=>({select:()=>chain('read'),insert:data=>chain('insert',data),update:data=>chain('update',data)})};})();'''
def db(args):
 if args['action']=='read':return {'data':deepcopy(cloud['row']),'error':None}
 if args['action']=='update' and cloud['row']['updated_at']!=args.get('expected'):return {'data':[],'error':None}
 if args['action']=='insert' and cloud['row']:return {'error':{'code':'23505'}}
 cloud['row']=deepcopy(args['payload']);cloud['writes']+=1;return {'data':[{'updated_at':cloud['row']['updated_at']}],'error':None}
with sync_playwright() as p:
 b=p.chromium.launch()
 for protocol,url in [('http','http://localhost:8767')]:
  cloud.update(row=None,writes=0);contexts=[];pages=[]
  for device,options in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1366,'height':768}})]:
   c=b.new_context(**options);contexts.append(c);c.expose_binding('mockDB',lambda source,args:db(args));c.add_init_script(mock);page=c.new_page();page.goto(url);pages.append(page)
  a,bb=pages
  cloud['row']={'data':{'opening':'500','income':[],'expense':[]},'updated_at':'2026-01-01T00:00:00.000Z'}
  a.locator('#opening').fill('12,5 tys');a.locator('#opening').blur()
  def login(page):
   page.locator('#sync-open').click();page.locator('#sync-email').fill('test@example.test');page.locator('#sync-login button').click();page.locator('#sync-code-fallback summary').click();page.locator('#sync-code').fill('123456');page.locator('#sync-verify button').click()
  login(a);assert a.evaluate('window.otpOptions.options.emailRedirectTo')=='https://wwieczor-commits.github.io/kalkulator-finansow/';a.locator('#sync-conflict').wait_for(state='visible');assert cloud['writes']==0
  a.locator('#sync-use-local').click();a.wait_for_function("document.getElementById('sync-status').textContent.startsWith('Zsynchronizowano')");assert cloud['row']['data']['opening']=='12 500,00'
  a.locator('#sync-close').click()
  login(bb);bb.wait_for_function("document.getElementById('opening').value==='12 500,00'");bb.locator('#sync-close').click()
  a.locator('#opening').fill('20 tys');a.locator('#opening').blur();a.wait_for_function("document.getElementById('sync-status').textContent.startsWith('Zsynchronizowano')")
  bb.evaluate("window.dispatchEvent(new Event('focus'))");bb.wait_for_function("document.getElementById('opening').value==='20 000,00'")
  contexts[1].set_offline(True);bb.locator('#opening').fill('25 tys');bb.locator('#opening').blur();assert 'Offline' in bb.locator('#sync-status').inner_text()
  contexts[1].set_offline(False);bb.evaluate("window.dispatchEvent(new Event('online'))");bb.wait_for_function("document.getElementById('sync-status').textContent.startsWith('Zsynchronizowano')")
  a.evaluate("window.dispatchEvent(new Event('focus'))");a.wait_for_function("document.getElementById('opening').value==='25 000,00'")
  for name,page in [('iphone',a),('laptop',bb)]:
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(root/'screenshots'/f'v17-{protocol}-{name}.png'),full_page=True)
  bb.locator('#sync-open').click();bb.locator('#sync-logout').click();bb.wait_for_function("document.getElementById('sync-open').textContent==='Synchronizuj'")
  for c in contexts:c.close()
 c=b.new_context();c.expose_binding('mockDB',lambda source,args:db(args));c.add_init_script(mock);page=c.new_page();page.goto('http://localhost:8767');page.locator('#opening').fill('7777');page.locator('#opening').blur();cloud.update(row={'data':{'opening':'','income':[],'expense':[]},'updated_at':'2026-01-01T00:00:00.000Z'},writes=0)
 login(page);page.wait_for_function("document.getElementById('sync-status').textContent.startsWith('Zsynchronizowano')");assert cloud['row']['data']['opening']=='7 777,00';assert page.locator('#sync-conflict').is_hidden();c.close()
 c=b.new_context();page=c.new_page();page.goto((root/'index.html').as_uri());page.locator('#sync-open').click();assert page.locator('#sync-login button').is_disabled();assert page.locator('#sync-email').is_disabled();assert page.locator('#sync-code-fallback').is_hidden();assert 'Synchronizacja na stronie WWW' in page.locator('#sync-status').inner_text();c.close()
 b.close()
print('PASS MOCK SYNC: HTTP/file; two devices, OTP flow (mock), first-login explicit choice, cloud pull, debounced writes, focus refresh, offline replay, logout')
