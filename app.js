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
let editing=null,entryKind='income';
const blank=()=>({name:'',amount:'',mode:'gross',rate:'23',included:true});
function makeForm(kind,row,onSave,onCancel){
 const form=document.createElement('form');form.className='card entry-form';
 form.innerHTML=`<label>Opis<input class="name" placeholder="np. ${kind==='income'?'Wynagrodzenie':'Zakupy'}"></label><div class="fields"><label>Kwota <span class="amount-mode">brutto</span><input class="amount" inputmode="text" placeholder="np. 2,5 tys."></label><label class="select-label">Wpisuję<select class="mode"><option value="gross">Brutto</option><option value="net">Netto</option></select></label><label class="select-label">Stawka VAT<select class="rate"><option value="23">23%</option><option value="8">8%</option><option value="5">5%</option><option value="0">0%</option><option value="zw">zw.</option></select></label></div><output class="computed"></output><label class="check"><input type="checkbox">Wlicz do podsumowania</label><div class="form-actions"><button type="submit">${onCancel?'Zapisz zmiany':'Dodaj pozycję'}</button>${onCancel?'<button type="button" class="cancel secondary">Anuluj</button>':''}</div>`;
 for(const prop of ['name','amount','mode','rate']){const el=form.querySelector('.'+prop);el.value=row[prop];const change=value=>{row[prop]=value;updateCard(form,row)};if(prop==='amount')amountEvents(el,change);else el.addEventListener(prop==='name'?'input':'change',()=>change(el.value))}
 const check=form.querySelector('[type=checkbox]');check.checked=row.included;check.onchange=()=>row.included=check.checked;
 if(onCancel)form.querySelector('.cancel').onclick=onCancel;
 form.onsubmit=e=>{e.preventDefault();if(!row.amount.trim()||!values(row)){form.querySelector('.amount').setAttribute('aria-invalid','true');form.querySelector('.computed').textContent='Wpisz prawidłową kwotę.';form.querySelector('.amount').focus();return}row.amount=formatted(parseAmount(row.amount));row.name=row.name.trim()||'Bez nazwy';onSave(row)};
 for(const prop of ['mode','rate']){const select=form.querySelector('.'+prop),group=document.createElement('div');group.className='pills';group.setAttribute('role','group');group.setAttribute('aria-label',prop==='mode'?'Wpisuję':'Stawka VAT');for(const option of select.options){const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.dataset.value=option.value;button.setAttribute('aria-pressed',String(option.value===select.value));button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change'));for(const pill of group.children)pill.setAttribute('aria-pressed',String(pill===button))};group.append(button)}select.after(group);select.hidden=true}
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Odstępy same. Skróty: 540 tys, 1,5 mln.';form.querySelector('.amount').after(hint);
 form.classList.toggle('expense-form',kind==='expense');
 if(!onCancel)form.querySelector('[type=submit]').textContent=kind==='income'?'+ Dodaj przychód':'+ Dodaj wydatek';
 updateCard(form,row);return form;
}
function render(){for(const kind of ['income','expense']){
 const host=$(kind);host.replaceChildren();$(kind+'-count').textContent=state[kind].length+' wpisów';
 if(!state[kind].length){let el=document.createElement('p');el.className='empty';el.textContent='Brak pozycji. Dodaj pierwszą poniżej.';host.append(el)}
 state[kind].map((row,index)=>({row,index})).reverse().forEach(({row,index})=>{
 if(editing?.kind===kind&&editing.index===index){host.append(makeForm(kind,{...row},updated=>{state[kind][index]=updated;editing=null;save();render()},()=>{editing=null;render()}));return}
 const card=document.createElement('article');card.className='card compact'+(row.included?'':' excluded');
 card.innerHTML='<div class="row-info"><strong class="row-name"></strong><small class="row-hint"></small></div><strong class="row-amount"></strong><label class="check"><input type="checkbox">Wlicz</label><button class="edit icon secondary" aria-label="Edytuj pozycję">✎</button><button class="remove icon" aria-label="Usuń pozycję"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg></button>';
 card.prepend(card.querySelector('.check'));const v=values(row);card.querySelector('.row-name').textContent=row.name||'Bez nazwy';card.querySelector('.row-amount').textContent=v?money(v.gross):'Błędna kwota';card.querySelector('.row-hint').textContent=v?`netto ${money(v.net)} · VAT ${row.rate==='zw'?'zw.':row.rate+'%'} ${money(v.vat)}${row.included?'':' · poza sumą'}`:'Edytuj, aby poprawić kwotę';
 const check=card.querySelector('[type=checkbox]');check.checked=row.included;check.onchange=()=>{row.included=check.checked;card.classList.toggle('excluded',!row.included);save();render()};
 card.querySelector('.edit').onclick=()=>{editing={kind,index};render();host.querySelector('.entry-form .name').focus()};card.querySelector('.remove').onclick=()=>{state[kind].splice(index,1);editing=null;save();render()};host.append(card)
 });
 }totals();renderAdd()}
function renderAdd(){if($('add-form').firstChild)return;$('add-form').append(makeForm(entryKind,blank(),row=>{state[entryKind].push(row);$('add-form').replaceChildren();save();render()}))}
function updateCard(card,row){let v=values(row);card.querySelector('.amount-mode').textContent=row.mode==='net'?'netto':'brutto';card.querySelector('.amount').setAttribute('aria-invalid',!v);card.querySelector('.computed').textContent=!row.amount.trim()?'Wpisz kwotę — drugie ujęcie i VAT policzą się same.':v?`Odczytano: ${money(v.amount)} · Netto: ${money(v.net)} · VAT: ${money(v.vat)} · Brutto: ${money(v.gross)}`:'Nieprawidłowa kwota. Wpisz np. 12,5 tys. lub 1200+300.'}
function totals(){let opening=parseAmount(state.opening),invalid=!Number.isFinite(opening);$('opening').setAttribute('aria-invalid',invalid);$('opening-value').textContent=invalid?'Nieprawidłowe saldo':`Odczytano: ${money(opening)}`;if(invalid)opening=0;let sums={};for(let kind of ['income','expense']){sums[kind]={net:0,gross:0,vat:0};for(let row of state[kind]){if(!row.included)continue;let v=values(row);if(!v){invalid=true;continue}for(let k of ['net','gross','vat'])sums[kind][k]=round(sums[kind][k]+v[k])}}for(const kind of ['income','expense']){let sub=$(kind+'-subtotal');if(!sub){sub=document.createElement('div');sub.id=kind+'-subtotal';sub.className='section-subtotal';$(kind).after(sub)}sub.replaceChildren();const label=document.createElement('span');label.textContent='brutto';const amount=document.createElement('strong');amount.textContent=money(sums[kind].gross);sub.append(amount,label)}$('sum-opening').textContent=money(opening);$('sum-income').textContent=money(sums.income.gross);$('sum-expense').textContent=money(sums.expense.gross);let rest=round(opening+sums.income.gross-sums.expense.gross);$('remaining').textContent=money(rest);$('remaining').style.color=rest<0?'#8b3039':'#0b5e3c';$('secondary').textContent=`Start ${money(opening)} + przychody − wydatki. Różnica netto ${money(round(sums.income.net-sums.expense.net))}. VAT do zapłaty (orientacyjnie) ${money(round(sums.income.vat-sums.expense.vat))} (należny ${money(sums.income.vat)} − naliczony ${money(sums.expense.vat)}).`;$('warning').textContent=invalid?'Uwaga: nieprawidłowe kwoty pominięto. Popraw zaznaczone pola.':'';}
$('opening').value=state.opening;amountEvents($('opening'),value=>{state.opening=value;save();totals()});
 for(const kind of ['income','expense'])$('type-'+kind).onclick=()=>{entryKind=kind;for(const k of ['income','expense']){$('type-'+k).classList.toggle('active',k===kind);$('type-'+k).setAttribute('aria-pressed',String(k===kind))} $('add-form').replaceChildren();renderAdd()};
 $('clear').onclick=()=>{if(confirm('Usunąć wszystkie pozycje i saldo początkowe?')){state={opening:'',income:[],expense:[]};editing=null;$('opening').value='';$('add-form').replaceChildren();save();render()}};
$('csv').onclick=()=>{const quote=x=>'"'+String(x).replace(/"/g,'""')+'"';const rows=[['Typ','Nazwa','Kwota wpisana','Rodzaj','VAT %','Wlicz','Netto PLN','VAT PLN','Brutto PLN'],['Saldo początkowe','',state.opening,'brutto','','tak','','',parseAmount(state.opening)]];for(let kind of ['income','expense'])for(let row of state[kind]){let v=values(row);rows.push([kind==='income'?'Przychód':'Wydatek',row.name,row.amount,row.mode==='net'?'netto':'brutto',row.rate,row.included?'tak':'nie',v?.net??'',v?.vat??'',v?.gross??''])}const blob=new Blob(['\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='finanse.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
render();if(/^https?:$/.test(location.protocol)&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

// Keep the last entry and footer above the summary, including safe-area padding.
const summaryBar=document.querySelector('.summary');
const sizeSummary=()=>document.documentElement.style.setProperty('--summary-height',Math.ceil(summaryBar.getBoundingClientRect().height)+'px');
if('ResizeObserver' in window)new ResizeObserver(sizeSummary).observe(summaryBar);
window.addEventListener('resize',sizeSummary);sizeSummary();
