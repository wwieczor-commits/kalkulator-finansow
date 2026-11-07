from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch()
 for name,options in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1366,'height':768}})]:
  context=b.new_context(**options);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto((root/'index.html').as_uri());page.evaluate('localStorage.clear()');page.reload();page.locator('#opening').fill('12,5 tys');page.locator('#opening').blur()
  def add(kind,name,amount,mode='gross'):
   form=page.locator('#'+kind+'-add form');form.locator('.name').fill(name);form.locator('.amount').fill(amount);form.locator('.mode').select_option(mode);form.locator('[type=submit]').click()
  add('income','Wynagrodzenie','8 tys');add('income','Zlecenie dodatkowe','2 tys','net');add('income','Sprzedaż sprzętu','1250')
  add('expense','Czynsz i media','2300');add('expense','Zakupy spożywcze','850');add('expense','Planowany nowy rower','4,5 tys')
  page.locator('#expense .compact').first.locator('[type=checkbox]').uncheck()
  assert page.locator('#expense .compact').first.locator('.row-name').inner_text()=='Planowany nowy rower'
  assert page.locator('#expense .compact.excluded').count()==1
  assert page.locator('#income-subtotal strong').inner_text().replace('\xa0',' ')=='11 710,00 zł'
  assert page.locator('#expense-subtotal strong').inner_text().replace('\xa0',' ')=='3 150,00 zł'
  assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='21 060,00 zł'
  for kind in ['income','expense']:
   assert page.evaluate('(kind)=>!!(document.getElementById(kind+"-add").compareDocumentPosition(document.getElementById(kind)) & Node.DOCUMENT_POSITION_FOLLOWING)',kind)
   assert page.locator('#'+kind+'-add form').count()==1
  page.locator('#income .compact').first.locator('.edit').click();edit=page.locator('#income form');edit.locator('.amount').fill('1500');edit.locator('[type=submit]').click()
  assert page.locator('#income .compact').first.locator('.row-amount').inner_text().replace('\xa0',' ')=='1 500,00 zł'
  page.reload();assert page.locator('#expense .compact.excluded').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/'screenshots'/f'v12-{name}.png'),full_page=True)
  assert not errors,errors
  context.close()
 b.close()
print('PASS v1.2: file:// iPhone 13 + laptop, form/list order, newest first, subtotals, exclusions, edit, persistence, layout')
