from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch()
 for protocol,url in [('http','http://localhost:8767'),('file',(root/'index.html').as_uri())]:
  for name,opts in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1366,'height':768}})]:
   context=b.new_context(**opts);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url);page.evaluate('localStorage.clear()');page.reload()
   for raw,want in [('12 500',12500),('12500,50',12500.5),('12,5 tys',12500),('12.5k',12500),('1,2 mln',1200000),('1200+300',1500)]:assert page.evaluate('x=>parseAmount(x)',raw)==want
   page.locator('#opening').fill('12,5 tys');page.locator('#opening').blur();assert page.locator('#opening').input_value()=='12 500,00'
   def add(kind,desc,amount,mode='gross'):
    page.locator('#type-'+kind).click();form=page.locator('#add-form form');form.locator('.name').fill(desc);form.locator('.amount').fill(amount);form.locator('.pills').first.locator('[data-value='+mode+']').click();form.locator('[type=submit]').click()
   add('income','Wynagrodzenie','8000');add('income','Projekt dodatkowy','2000','net');add('income','Sprzedaż sprzętu','1500')
   add('expense','Czynsz i media','2300');add('expense','Zakupy spożywcze','850');add('expense','Planowany rower','4500')
   page.locator('#expense .compact').first.locator('[type=checkbox]').uncheck();assert 'poza sumą' in page.locator('#expense .compact').first.inner_text()
   assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='21 310,00 zł'
   assert page.locator('#expense-subtotal strong').inner_text().replace('\xa0',' ')=='3 150,00 zł'
   page.locator('#income .compact').first.locator('.edit').click();edit=page.locator('#income form');edit.locator('.amount').fill('1200+300');edit.locator('.amount').blur();assert edit.locator('.amount').input_value()=='1 500,00';edit.locator('[type=submit]').click()
   page.reload();assert page.locator('#expense .excluded').count()==1
   page.locator('#type-income').click()
   with page.expect_download() as d:page.locator('#csv').click()
   assert d.value.suggested_filename=='finanse.csv'
   add('income','Usuń mnie','1');page.locator('#income .compact').first.locator('.remove').click();assert page.locator('#income .compact').count()==3
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.locator('footer').inner_text().endswith('v1.5')
   if name=='iphone':assert page.locator('#add-form .name').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=16
   assert not errors,errors
   with page.expect_download() as pdf_download:page.locator('#pdf').click()
   assert pdf_download.value.suggested_filename.startswith('kasa-raport-')
   pdf_download.value.save_as(root/'screenshots'/f'v15-raport-{protocol}-{name}.pdf')
   page.screenshot(path=str(root/'screenshots'/f'v15-{protocol}-{name}.png'),full_page=True)
   context.close()
 b.close()
print('PASS v1.5: HTTP + file, iPhone + laptop, parsing/formatting, shared add form, edit/delete/exclusion, totals, persistence, CSV and no JS errors')
