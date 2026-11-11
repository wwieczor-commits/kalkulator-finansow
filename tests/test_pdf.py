from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page();page.goto((root/'index.html').as_uri())
 page.evaluate('''()=>{state={opening:'12 500',income:[{name:'Wynagrodzenie — miesiąc listopad',amount:'8000',mode:'gross',rate:'23',included:true},{name:'Projekt: Łódź, Żółć i Zażółć gęślą jaźń',amount:'2000',mode:'net',rate:'23',included:true}],expense:[{name:'Czynsz i opłaty za mieszkanie',amount:'2300',mode:'gross',rate:'23',included:true},{name:'Żywność, świeże warzywa',amount:'850',mode:'gross',rate:'5',included:true},{name:'Usługi — stawka zwolniona',amount:'100',mode:'gross',rate:'zw',included:true},{name:'Planowany rower — poza sumą',amount:'4500',mode:'gross',rate:'23',included:false}]};render()}''')
 with page.expect_download() as d:page.locator('#pdf').click()
 sample=root/'screenshots/v15-raport-przyklad.pdf';d.value.save_as(sample)
 assert page.evaluate('generateKasaPDF().doc.getNumberOfPages()')>=1
 page.evaluate("()=>{for(let i=0;i<95;i++)state.expense.push({name:'Wydatek '+i+' — Zażółć gęślą jaźń, długi opis kosztu działalności i wyposażenia biura',amount:'123,45',mode:'net',rate:'23',included:true})}")
 pages=page.evaluate('generateKasaPDF().doc.getNumberOfPages()');assert pages>=4,pages
 with page.expect_download() as d:page.locator('#pdf').click()
 long=root/'screenshots/v15-raport-wielostronicowy.pdf';d.value.save_as(long)
 b.close()
text=' '.join(subprocess.check_output(['pdftotext',str(sample),'-']).decode().split())
for phrase in ['Zażółć gęślą jaźń','Kapitał początkowy','Poza sumą','Planowany rower','Wojciech Wieczorek','STAN KOŃCOWY']:assert phrase in text,phrase
long_text=subprocess.check_output(['pdftotext','-layout',str(long),'-']).decode();assert long_text.count('VAT %')>=4
subprocess.run(['pdftoppm','-f','1','-singlefile','-scale-to','1500','-png',str(sample),str(root/'screenshots/v15-raport-p1')],check=True)
print('PASS PDF: Polish glyphs/text, excluded entries, multipage repeat headers;',pages,'pages for 95 extra rows')
