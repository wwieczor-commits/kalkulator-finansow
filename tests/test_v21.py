import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
nb=lambda s:s.replace('\xa0',' ').replace('\u202f',' ')
V19={'opening':'1 000,00','income':[{'name':'Stary przychód','amount':'2000','mode':'net','rate':'23','included':True}],'expense':[{'name':'Stary wydatek','amount':'123,00','mode':'gross','rate':'8','included':False}]}
with sync_playwright() as p:
 b=p.chromium.launch()
 for protocol,url in [('http','http://localhost:44391/'),('file',(root/'index.html').as_uri())]:
  for name,opts in [('iphone',p.devices['iPhone 13']),('laptop',{'viewport':{'width':1280,'height':800}})]:
   ctx=b.new_context(**opts);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url)
   # migration: v1.9 data under the same key loads into the inline rows
   page.evaluate('d=>localStorage.setItem("ww-finanse-v1",JSON.stringify(d))',V19);page.reload()
   r=page.locator('#income .row').first;assert r.locator('.name').input_value()=='Stary przychód'
   assert r.locator('.net').input_value()=='2 000,00' and r.locator('.gross').input_value()=='2 460,00'
   assert page.locator('#expense .row.off').count()==1 and nb(page.locator('#remaining').inner_text())=='3 460,00 zł'
   page.once('dialog',lambda d:d.accept());page.locator('#clear').click();assert page.locator('#income .row').count()==0
   for raw,want in [('12 500',12500),('12500,50',12500.5),('12.5',12.5),('12,5 tys',12500),('1200+300',1500)]:assert page.evaluate('x=>parseAmount(x)',raw)==want,raw
   page.locator('#opening').fill('68500');page.locator('#opening').blur();assert page.locator('#opening').input_value()=='68 500,00'
   def add(kind,label,amount,field='gross',rate='23',on=True):
    page.locator('#add-'+kind).click();row=page.locator(f'#{kind} .row').last
    assert page.evaluate('document.activeElement.classList.contains("name")')
    row.locator('.name').fill(label);row.locator('.rate').select_option(rate);row.locator('.'+field).fill(amount);row.locator('.'+field).blur()
    if not on:row.locator('[type=checkbox]').uncheck()
    return row
   k=add('income','Kacper','16000');assert k.locator('.net').input_value()=='13 008,13'
   d=add('income','Netrix Bon Danuta','22000','net',on=False);assert d.locator('.gross').input_value()=='27 060,00'
   add('income','Netrix wynagrodzenie','8600',on=False)
   assert page.locator('#income .row.off').count()==2
   assert page.locator('#income .row.off .name').first.evaluate('e=>getComputedStyle(e).textDecorationLine')=='line-through'
   page.locator('#add-income').click()
   add('expense','Kredyt','4000');add('expense','Rachunki','3200');add('expense','Rowery','1500');page.locator('#add-expense').click()
   assert nb(page.locator('#income-sum').inner_text())=='16 000,00 zł'
   assert nb(page.locator('#expense-sum').inner_text())=='8 700,00 zł'
   assert nb(page.locator('#sum-income').inner_text())=='+ 16 000,00 zł' and nb(page.locator('#sum-expense').inner_text())=='– 8 700,00 zł'
   assert nb(page.locator('#remaining').inner_text())=='75 800,00 zł'
   # live recalculation while typing, comma and dot both accepted, VAT change keeps typed side
   row=page.locator('#expense .row').nth(2);row.locator('.net').fill('1000.5');row.locator('.net').blur();assert row.locator('.gross').input_value()=='1 230,62'
   row.locator('.net').fill('1000.5');row.locator('.net').blur();assert row.locator('.gross').input_value()=='1 230,62'
   row.locator('.rate').select_option('zw');assert row.locator('.gross').input_value()=='1 000,50' and row.locator('.net').input_value()=='1 000,50'
   row.locator('.rate').select_option('8');assert row.locator('.gross').input_value()=='1 080,54'
   row.locator('.gross').fill('1500');row.locator('.gross').blur();row.locator('.rate').select_option('23');assert row.locator('.net').input_value()=='1 219,51'
   assert nb(page.locator('#remaining').inner_text())=='75 800,00 zł'
   # invalid input flagged, negative final in red
   row.locator('.gross').fill('abc');assert row.locator('.gross').get_attribute('aria-invalid')=='true';assert 'nieprawidłowe' in page.locator('#warning').inner_text()
   row.locator('.gross').fill('1500');row.locator('.gross').blur()
   page.locator('#opening').fill('-100000');assert 'neg' in page.locator('#remaining').get_attribute('class');page.locator('#opening').fill('68500');page.locator('#opening').blur()
   # delete + persistence
   add('expense','Usuń mnie','1');page.locator('#expense .row').last.locator('.del').click();assert page.locator('#expense .row').count()==4
   page.reload();assert page.locator('#income .row').count()==4 and page.locator('#income .row.off').count()==2
   assert nb(page.locator('#remaining').inner_text())=='75 800,00 zł'
   assert page.locator('.new-entry').count()==0
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
   assert page.locator('footer').inner_text().endswith('v2.1')
   assert page.evaluate('getComputedStyle(document.body).backgroundColor')=='rgb(17, 26, 36)'
   need=40 if name=='iphone' else 34
   for sel in ['.del','#income .row .net','#income .row .rate','#add-income','.chk']:
    h=page.locator(sel).first.bounding_box()['height'];assert h>=need,(sel,h)
   inc=page.locator('section.income').bounding_box();exp=page.locator('section.expense').bounding_box()
   if name=='laptop':assert abs(inc['y']-exp['y'])<1 and inc['x']+inc['width']<=exp['x'] and abs(inc['width']-exp['width'])<2,(inc,exp)
   else:assert exp['y']>=inc['y']+inc['height'] and abs(inc['x']-exp['x'])<1,(inc,exp)
   for w in ([1024,1280,1440] if name=='laptop' else [390,360,320]):
    page.set_viewport_size({'width':w,'height':800});page.wait_for_timeout(50)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('overflow',w)
    assert page.evaluate('[...document.querySelectorAll(".rows")].every(r=>r.scrollWidth<=r.clientWidth+1)'),('row overflow',w)
    assert page.evaluate('[...document.querySelectorAll(".row input.money")].every(i=>i.scrollWidth<=i.clientWidth+1)'),('amount clipped',w)
    if name=='laptop':
     i2=page.locator('section.income').bounding_box();e2=page.locator('section.expense').bounding_box();assert abs(i2['y']-e2['y'])<1,('not side by side',w)
   page.set_viewport_size(opts['viewport'] if 'viewport' in opts else {'width':1280,'height':800});page.wait_for_timeout(50)
   if name=='iphone':
    assert page.locator('#income .row .name').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=16
    nbx=page.locator('#income .row .net').first.bounding_box();gbx=page.locator('#income .row .gross').first.bounding_box();assert nbx['width']>=90 and gbx['width']>=90
   with page.expect_download() as dl:page.locator('#csv').click()
   assert dl.value.suggested_filename=='finanse.csv';csv=open(dl.value.path(),encoding='utf-8-sig').read();assert 'Kacper' in csv and 'Kapitał początkowy' in csv and csv.count('\n')==7,csv
   with page.expect_download() as dl:page.locator('#pdf').click()
   assert dl.value.suggested_filename.startswith('kasa-raport-');dl.value.save_as(root/'screenshots'/f'v21-raport-{protocol}-{name}.pdf')
   assert not errors,errors
   page.evaluate('window.scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100)
   f=page.locator('footer').bounding_box();assert f['y']+f['height']<=page.locator('.summary').bounding_box()['y']+1
   if protocol=='http':
    page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(100)
    page.screenshot(path=str(root/'screenshots'/f'v21-{name}-viewport.png'))
    vw=page.viewport_size['width'];page.set_viewport_size({'width':vw,'height':page.evaluate('document.documentElement.scrollHeight')});page.wait_for_timeout(200)
    page.screenshot(path=str(root/'screenshots'/f'v21-{name}.png'))
   ctx.close()
 b.close()
print('PASS v2.1: HTTP + file, iPhone + laptop, v1.9 migration, inline rows, netto<->brutto live recalculation, VAT change, exclusion, sums, final state, delete, persistence, CSV, PDF, no JS errors')
