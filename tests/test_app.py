from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for protocol,url in [('http','http://localhost:8767'),('file',(root/'index.html').as_uri())]:
  for device,options in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1366,'height':768}})]:
   context=browser.new_context(**options);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url);page.evaluate('localStorage.clear()');page.reload()
   for raw,want in [('12 500',12500),('12500,50',12500.5),('12,5 tys',12500),('12.5k',12500),('1,2 mln',1200000),('2 tys.',2000),('1200+300',1500),('1.234,56',1234.56),('1.2.3',None)]:
    assert page.evaluate('(x)=>{let n=parseAmount(x);return Number.isNaN(n)?null:n}',raw)==want
   opening=page.locator('#opening');opening.press_sequentially('1250000,50');assert opening.input_value()=='1 250 000,50'
   opening.fill('10 tys.');opening.blur();assert opening.input_value()=='10 000,00'
   opening.fill('12500');opening.evaluate('(e)=>e.setSelectionRange(2,2)');opening.press_sequentially('3');assert opening.input_value()=='123 500';assert opening.evaluate('(e)=>e.selectionStart')==3
   opening.fill('10 tys.');opening.blur()
   def add(kind,name,amount,mode='gross'):
    form=page.locator('#'+kind+'-add form');form.locator('.name').fill(name);form.locator('.amount').fill(amount);form.locator('.mode').select_option(mode);form.locator('[type=submit]').click()
   add('income','Projekt — faktura','2 tys','net');add('expense','Sprzęt i narzędzia','1230')
   assert page.locator('#income .compact').count()==1 and page.locator('#income .amount').count()==0
   assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='11 230,00 zł'
   check=page.locator('#expense .compact [type=checkbox]');check.uncheck()
   assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='12 460,00 zł'
   page.locator('#expense .edit').click();edit=page.locator('#expense form');edit.locator('.amount').fill('1200+300');edit.locator('.amount').blur();assert edit.locator('.amount').input_value()=='1 500,00';edit.locator('[type=submit]').click()
   page.locator('#expense .compact [type=checkbox]').check();assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='10 960,00 zł'
   page.reload();assert page.locator('#expense .compact').count()==1
   assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='10 960,00 zł'
   add('expense','Pozycja testowa do usunięcia','1');page.locator('#expense .compact').last.locator('.remove').click();assert page.locator('#expense .compact').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(root/'screenshots'/f'v11-{protocol}-{device}.png'),full_page=True)
   assert not errors,errors
   if protocol=='file':assert page.evaluate("!/^https?:$/.test(location.protocol)")
   context.close()
 browser.close()
print('PASS: HTTP + file, iPhone + laptop; typing/caret/blur, parsing, compact add/edit/delete, totals, checkbox, persistence, no page errors')
