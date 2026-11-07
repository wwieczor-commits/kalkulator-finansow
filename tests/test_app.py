from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for name,options in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1366,'height':768}})]:
  context=browser.new_context(**options)
  page=context.new_page()
  page.goto('http://localhost:8767')
  for raw,want in [('12 500',12500),('12500,50',12500.5),('12,5 tys',12500),('12.5k',12500),('1,2 mln',1200000),('2 tys.',2000),('1200+300',1500),('1.234,56',1234.56),('1.2.3',None)]:
   got=page.evaluate('(raw)=>{const n=parseAmount(raw);return Number.isNaN(n)?null:n}',raw)
   assert got==want,(raw,got)
  page.locator('#opening').fill('10 tys.')
  page.locator('[data-add=income]').click()
  inc=page.locator('#income .card');inc.locator('.name').fill('Projekt — faktura');inc.locator('.amount').fill('2 tys');inc.locator('.mode').select_option('net')
  page.locator('[data-add=expense]').click()
  exp=page.locator('#expense .card');exp.locator('.name').fill('Sprzęt i narzędzia');exp.locator('.amount').fill('1230')
  assert '11' in page.locator('#remaining').inner_text() and '230' in page.locator('#remaining').inner_text()
  exp.locator('input[type=checkbox]').uncheck()
  assert page.locator('#sum-expense').inner_text().startswith('0,00')
  assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='12 460,00 zł'
  page.reload();assert page.locator('#expense .card').count()==1
  assert not page.locator('#expense input[type=checkbox]').is_checked()
  exp=page.locator('#expense .card');exp.locator('input[type=checkbox]').check()
  assert page.locator('#remaining').inner_text().replace('\xa0',' ')=='11 230,00 zł'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/'screenshots'/f'v1-{name}.png'),full_page=True)
  context.close()
 browser.close()
print('PASS: parser, net/gross, VAT, checkbox, persistence, totals and layouts on iPhone 13 + laptop')
