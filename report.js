'use strict';
function generateKasaPDF(){
 const opening=parseAmount(state.opening);
 if(!Number.isFinite(opening)||['income','expense'].some(k=>state[k].some(r=>r.included&&!values(r))))throw new Error('Popraw nieprawidłowe kwoty przed utworzeniem raportu.');
 const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 for(const [name,data] of Object.entries(window.KASA_PDF_FONTS)){doc.addFileToVFS(name+'.ttf',data);doc.addFont(name+'.ttf',name,'normal')}
 const green=[11,94,60],red=[139,48,57],ink=[35,39,30],muted=[115,120,107];
 const text=(str,x,y,{size=10,font='KasaSans',color=ink,align='left'}={})=>{doc.setFont(font,'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(str),x,y,{align})};
 const date=new Date(),dateStr=new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',dateStyle:'long',timeStyle:'short'}).format(date);
 const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const cash=n=>money(n).replace(/\u00a0|\u202f/g,' ');
 const totals={};for(const kind of ['income','expense']){totals[kind]={net:0,gross:0,vat:0};for(const row of state[kind])if(row.included){const v=values(row);if(v)for(const key of ['net','gross','vat'])totals[kind][key]=round(totals[kind][key]+v[key])}}
 const income=totals.income,expense=totals.expense,remaining=round(opening+income.gross-expense.gross);
 doc.setProperties({title:'Kasa — raport',author:'Wojciech Wieczorek',subject:'Przychody, wydatki i saldo brutto'});
 doc.setFillColor(241,237,228);doc.rect(0,0,210,53,'F');
 text('Kasa — raport',16,24,{font:'KasaSerif',size:26});text('Wygenerowano: '+dateStr+' · Europe/Warsaw',16,34,{size:8,color:muted});
 text('Saldo początkowe',16,45,{size:9});text(cash(opening),194,45,{align:'right',font:'KasaSerif',size:15});
 doc.setFillColor(...ink);doc.roundedRect(16,61,178,30,3,3,'F');text('ZOSTAŁO BRUTTO',22,69,{size:8,color:[196,207,188]});text(cash(remaining),22,83,{font:'KasaSerif',size:25,color:remaining<0?[255,184,178]:[193,237,197]});
 const metrics=[['Przychody brutto',cash(income.gross),green],['Wydatki brutto',cash(expense.gross),red],['Różnica netto',cash(round(income.net-expense.net)),ink],['VAT należny',cash(income.vat),ink],['VAT naliczony',cash(expense.vat),ink],['VAT do zapłaty*',cash(round(income.vat-expense.vat)),ink]];
 metrics.forEach(([label,value,color],i)=>{const x=16+(i%3)*61,y=102+Math.floor(i/3)*18;text(label,x,y,{size:8,color:muted});text(value,x,y+7,{font:'KasaSerif',size:14,color})});
 text('* Orientacyjna różnica VAT (należny − naliczony), nie deklaracja podatkowa.',16,139,{size:7,color:muted});
 let y=152;
 function table(kind){const color=kind==='income'?green:red,title=kind==='income'?'Przychody':'Wydatki';if(y>248){doc.addPage();y=23}text(title,16,y,{font:'KasaSerif',size:18,color});y+=7;
 const rows=state[kind].filter(r=>r.included).map((row,i)=>{const v=values(row);return [i+1,row.name||'Bez nazwy',cash(v.net),row.rate==='zw'?'zw.':row.rate+'%',cash(v.vat),cash(v.gross)]});
 doc.autoTable({startY:y,margin:{left:16,right:16,top:19,bottom:20},head:[['Lp','Opis','Netto','VAT %','VAT','Brutto']],body:rows.length?rows:[['—','Brak pozycji','—','—','—','—']],foot:[['','Suma',cash(totals[kind].net),'',cash(totals[kind].vat),cash(totals[kind].gross)]],showHead:'everyPage',showFoot:'lastPage',rowPageBreak:'avoid',styles:{font:'KasaSans',fontStyle:'normal',fontSize:8,cellPadding:3,textColor:ink,lineColor:[232,229,221],lineWidth:0.1,overflow:'linebreak'},headStyles:{fillColor:color,textColor:[255,255,255],fontStyle:'normal'},footStyles:{fillColor:[241,237,228],textColor:color,fontStyle:'normal'},alternateRowStyles:{fillColor:[251,249,244]},columnStyles:{0:{cellWidth:11},1:{cellWidth:55},2:{halign:'right',cellWidth:32},3:{halign:'center',cellWidth:16},4:{halign:'right',cellWidth:29},5:{halign:'right',cellWidth:35}}});
 y=doc.lastAutoTable.finalY+15;
 }
 table('income');table('expense');
 const excluded=[];for(const kind of ['income','expense'])for(const row of state[kind])if(!row.included){const v=values(row);excluded.push([kind==='income'?'Przychód':'Wydatek',row.name||'Bez nazwy',v?cash(v.gross):'Błędna kwota'])}
 if(y>245){doc.addPage();y=23}text('Poza sumą',16,y,{font:'KasaSerif',size:16,color:muted});
 if(excluded.length){doc.autoTable({startY:y+6,margin:{left:16,right:16,top:19,bottom:20},head:[['Typ','Opis','Brutto (nie wliczono)']],body:excluded,showHead:'everyPage',rowPageBreak:'avoid',styles:{font:'KasaSans',fontStyle:'normal',fontSize:8,cellPadding:3,textColor:muted},headStyles:{fillColor:[234,232,224],textColor:muted,fontStyle:'normal'},columnStyles:{0:{cellWidth:26},1:{cellWidth:105},2:{halign:'right',cellWidth:47}}})}else text('Brak wyłączonych pozycji.',16,y+8,{size:9,color:muted});
 const count=doc.getNumberOfPages();for(let page=1;page<=count;page++){doc.setPage(page);doc.setDrawColor(223,222,213);doc.line(16,281,194,281);text('© Wojciech Wieczorek',16,287,{size:8,color:muted});text(`${page} / ${count}`,194,287,{size:8,color:muted,align:'right'});if(page>1)text('Kasa — raport · '+day,16,11,{size:8,color:muted})}
 return {doc,filename:'kasa-raport-'+day+'.pdf'};
}
$('pdf').onclick=()=>{try{const {doc,filename}=generateKasaPDF();const anchor=document.createElement('a');if('download'in anchor){doc.save(filename)}else{const url=URL.createObjectURL(doc.output('blob'));const tab=window.open(url,'_blank');if(!tab)location.href=url;setTimeout(()=>URL.revokeObjectURL(url),120000)}$('status').textContent='Raport PDF gotowy.'}catch(e){$('status').textContent=e.message||'Nie udało się wygenerować PDF.'}};
