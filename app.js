'use strict';
const KEY='ww-finanse-v1', money=n=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',useGrouping:'always'}).format(n), round=n=>Math.round((n+Number.EPSILON)*100)/100;
function parseAmount(raw){
 let s=String(raw).toLowerCase().trim().replace(/zł|pln/g,'').replace(/[\s\u00a0]/g,'');if(!s)return 0;
 // Only addition/subtraction of monetary terms: no eval or executable expressions.
 const parts=s.match(/[+-]?[^+-]+/g);if(!parts||parts.join('')!==s)return NaN;
 let sum=0;for(let term of parts){let mult=1;const suffix=term.match(/(tys\.?|tyś\.?|k|mln\.?)$/);if(suffix){mult=suffix[1].startsWith('mln')?1e6:1e3;term=term.slice(0,-suffix[0].length)}
 if(term.includes(',')){if((term.match(/,/g)||[]).length!==1)return NaN;term=term.replace(/\./g,'').replace(',','.')}else if(/^[+-]?\d{1,3}(\.\d{3})+$/.test(term))term=term.replace(/\./g,'');
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(term))return NaN;sum+=Number(term)*mult;}
 return Number.isFinite(sum)&&Math.abs(sum)<=1e12?round(sum):NaN;
}
window.parseAmount=parseAmount;
let state={opening:'',income:[],expense:[]};try{let stored=JSON.parse(localStorage.getItem(KEY));if(stored&&Array.isArray(stored.income)&&Array.isArray(stored.expense))state=stored}catch{}
const $=id=>document.getElementById(id);
function values(row){const amount=parseAmount(row.amount);if(!Number.isFinite(amount))return null;const rate=row.rate==='zw'?0:Number(row.rate)/100;let net=row.mode==='net'?amount:round(amount/(1+rate));let gross=row.mode==='gross'?amount:round(amount*(1+rate));return {net,gross,vat:round(gross-net),amount};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('status').textContent='Zapisano w tej przeglądarce'}catch{$('status').textContent='Nie można zapisać danych — eksportuj CSV.'}}
const formatted=n=>{const [integer,decimal]=n.toFixed(2).split('.');return integer.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+','+decimal};
function formatTyping(el){
 const raw=el.value,start=el.selectionStart,end=el.selectionEnd;
 const position=n=>raw.slice(0,n).replace(/\s/g,'').length;
 const left=position(start),right=position(end);
 // Group integer terms only; retain suffixes and unfinished arithmetic/decimals.
 const next=raw.replace(/([+-]?)([\d ]+)([,.]\d*)?/g,(whole,sign,int,decimal='')=>{
   const digits=int.replace(/ /g,'');return sign+digits.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+decimal;
 });
 if(next===raw)return;el.value=next;
 const locate=n=>{let count=0;for(let i=0;i<next.length;i++){if(!/\s/.test(next[i]))count++;if(count===n)return i+1}return next.length};
 el.setSelectionRange(left?locate(left):0,right?locate(right):0);
}
function amountEvents(el,change){el.addEventListener('input',()=>{formatTyping(el);change(el.value)});el.addEventListener('blur',()=>{const n=parseAmount(el.value);if(el.value.trim()&&Number.isFinite(n)){el.value=formatted(n);change(el.value)}})}
// v2.0: inline rows. Model unchanged from v1.x: {name, amount, mode:'net'|'gross', rate, included};
// `amount`/`mode` hold the field the user typed last, the other one is derived — so v1.9 data loads as-is.
const blank=()=>({name:'',amount:'',mode:'gross',rate:'23',included:true});
const RATES=[['23','23%'],['8','8%'],['5','5%'],['0','0%'],['zw','zw.']];
const isBlank=row=>!String(row.name||'').trim()&&!String(row.amount||'').trim();
window.isBlank=isBlank;
function normalize(){state.opening=state.opening??'';for(const kind of ['income','expense'])state[kind]=state[kind].filter(r=>r&&typeof r==='object').map(r=>({name:String(r.name??''),amount:String(r.amount??''),mode:r.mode==='net'?'net':'gross',rate:RATES.some(([v])=>v===String(r.rate))?String(r.rate):'23',included:r.included!==false}))}
normalize();
function rowEl(kind,row){
 const el=document.createElement('div');el.className='row'+(row.included?'':' off');
 el.innerHTML=`<label class="chk"><input type="checkbox" aria-label="Wlicz do sumy"></label><label class="cell c-name"><span class="cl">Nazwa</span><input class="name" autocomplete="off" placeholder="Nazwa ${kind==='income'?'przychodu':'wydatku'}"></label><label class="cell c-net"><span class="cl">Netto</span><input class="net money" inputmode="decimal" autocomplete="off" placeholder="0,00"></label><label class="cell c-vat"><span class="cl">VAT</span><select class="rate">${RATES.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label class="cell c-gross"><span class="cl">Brutto</span><input class="gross money" inputmode="decimal" autocomplete="off" placeholder="0,00"></label><button type="button" class="del" aria-label="Usuń pozycję">×</button>`;
 const q=s=>el.querySelector(s),name=q('.name'),net=q('.net'),gross=q('.gross'),rate=q('.rate'),check=q('[type=checkbox]');
 name.value=row.name;rate.value=row.rate;check.checked=row.included;
 const fill=()=>{const v=values(row),empty=!row.amount.trim(),bad=!empty&&!v;const src=row.mode==='net'?net:gross,dst=row.mode==='net'?gross:net;
  src.setAttribute('aria-invalid',String(bad));dst.setAttribute('aria-invalid','false');
  if(document.activeElement!==src)src.value=empty?'':(bad?row.amount:formatted(row.mode==='net'?v.net:v.gross));
  dst.value=empty||bad?'':formatted(row.mode==='net'?v.gross:v.net)};
 fill();
 const changed=()=>{fill();totals();save()};
 amountEvents(net,v=>{row.mode='net';row.amount=v;changed()});
 amountEvents(gross,v=>{row.mode='gross';row.amount=v;changed()});
 rate.onchange=()=>{row.rate=rate.value;changed()};
 name.addEventListener('input',()=>{row.name=name.value;save()});
 check.onchange=()=>{row.included=check.checked;el.classList.toggle('off',!row.included);totals();save()};
 q('.del').onclick=()=>{const i=state[kind].indexOf(row);if(i>=0)state[kind].splice(i,1);save();render()};
 return el;
}
function render(){for(const kind of ['income','expense']){const host=$(kind);host.replaceChildren();host.closest('.ledger').classList.toggle('is-empty',!state[kind].length);
 if(!state[kind].length){const p=document.createElement('p');p.className='empty';p.textContent='Brak pozycji. Dodaj pierwszą poniżej.';host.append(p)}
 for(const row of state[kind])host.append(rowEl(kind,row))}
 const o=parseAmount(state.opening);$('opening').value=state.opening.trim()&&Number.isFinite(o)?formatted(o):state.opening;totals()}
function totals(){
 let opening=parseAmount(state.opening),invalid=!Number.isFinite(opening);$('opening').setAttribute('aria-invalid',String(invalid));if(invalid)opening=0;
 const sums={};for(const kind of ['income','expense']){sums[kind]={net:0,gross:0,vat:0};for(const row of state[kind]){if(!row.included)continue;const v=values(row);if(!v){invalid=true;continue}for(const k of ['net','gross','vat'])sums[kind][k]=round(sums[kind][k]+v[k])}}
 const rest=round(opening+sums.income.gross-sums.expense.gross);
 $('income-sum').textContent=money(sums.income.gross);$('expense-sum').textContent=money(sums.expense.gross);
 $('sum-income').textContent='+ '+money(sums.income.gross);$('sum-expense').textContent='– '+money(sums.expense.gross);
 $('remaining').textContent=money(rest);$('remaining').classList.toggle('neg',rest<0);$('sum-final').classList.toggle('neg',rest<0);
 const set=(id,n)=>$(id).textContent=money(n);set('sum-opening',opening);set('sum-income-net',sums.income.net);set('sum-expense-net',sums.expense.net);set('sum-diff-net',round(sums.income.net-sums.expense.net));set('sum-vat-in',sums.income.vat);set('sum-vat-out',sums.expense.vat);set('sum-vat',round(sums.income.vat-sums.expense.vat));set('sum-final',rest);
 $('warning').textContent=invalid?'Uwaga: nieprawidłowe kwoty pominięto. Popraw zaznaczone pola.':'';
}
amountEvents($('opening'),value=>{state.opening=value;save();totals()});
for(const kind of ['income','expense'])$('add-'+kind).onclick=()=>{state[kind].push(blank());save();render();const rows=$(kind).querySelectorAll('.row');rows[rows.length-1].querySelector('.name').focus()};
$('clear').onclick=()=>{if(confirm('Usunąć wszystkie pozycje i kapitał początkowy?')){state={opening:'',income:[],expense:[]};save();render()}};
$('csv').onclick=()=>{const quote=x=>'"'+String(x).replace(/"/g,'""')+'"';const rows=[['Typ','Nazwa','Kwota wpisana','Rodzaj','VAT %','Wlicz','Netto PLN','VAT PLN','Brutto PLN'],['Kapitał początkowy','',state.opening,'','','tak','','',parseAmount(state.opening)]];for(let kind of ['income','expense'])for(let row of state[kind]){if(isBlank(row))continue;let v=values(row);rows.push([kind==='income'?'Przychód':'Wydatek',row.name,row.amount,row.mode==='net'?'netto':'brutto',row.rate,row.included?'tak':'nie',v?.net??'',v?.vat??'',v?.gross??''])}const blob=new Blob(['\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='finanse.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
render();if(/^https?:$/.test(location.protocol)&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
// Keep the footer above the sticky bar, including safe-area padding.
const summaryBar=document.querySelector('.summary');
const sizeSummary=()=>document.documentElement.style.setProperty('--summary-height',Math.ceil(summaryBar.getBoundingClientRect().height)+'px');
if('ResizeObserver' in window)new ResizeObserver(sizeSummary).observe(summaryBar);
window.addEventListener('resize',sizeSummary);sizeSummary();
