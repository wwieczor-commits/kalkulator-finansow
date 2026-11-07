'use strict';
(()=>{
 const META='ww-kasa-sync-v1',dialog=$('sync-dialog');let meta={updatedAt:null,owner:null,pending:false,initialized:false};
 try{meta={...meta,...JSON.parse(localStorage.getItem(META)||'{}')}}catch{}
 let user=null,busy=false,choice=null,timer=null,client=null;
 const message=text=>$('sync-message').textContent=text,status=text=>$('sync-status').textContent=text;
 const persist=()=>{try{localStorage.setItem(META,JSON.stringify(meta))}catch{status('Brak pamięci lokalnej — eksportuj dane')}};
 const stamp=()=>new Date(Math.max(Date.now(),Date.parse(meta.updatedAt||0)+1||0)).toISOString();
 const hasData=data=>!!data&&(!!String(data.opening||'').trim()||data.income?.length||data.expense?.length);
 const snapshot=()=>JSON.parse(JSON.stringify({opening:state.opening,income:state.income,expense:state.expense}));
 function valid(data){return data&&typeof data.opening==='string'&&['income','expense'].every(k=>Array.isArray(data[k])&&data[k].length<=10000&&data[k].every(r=>r&&typeof r.name==='string'&&typeof r.amount==='string'&&['net','gross'].includes(r.mode)&&['23','8','5','0','zw'].includes(r.rate)&&typeof r.included==='boolean'))}
 function apply(data,time){if(!valid(data))throw new Error('Nieprawidłowe dane w chmurze — lokalne dane pozostają bez zmian.');state=JSON.parse(JSON.stringify(data));editing=null;$('opening').value=state.opening;$('add-form').replaceChildren();localStorage.setItem(KEY,JSON.stringify(state));meta={updatedAt:time,owner:user.id,pending:false,initialized:true};persist();render()}
 function niceError(error){if(error?.code==='PGRST205'||error?.code==='42P01')return 'Synchronizacja wymaga utworzenia tabeli kasa_state przez administratora.';return error?.message||'Nie udało się połączyć. Dane lokalne są bezpieczne.'}
 function showAccount(){const signed=!!user;$('sync-login').hidden=signed;$('sync-verify').hidden=true;$('sync-account').hidden=!signed;$('sync-open').textContent=signed?'Konto':'Synchronizuj';$('sync-account-email').textContent=user?.email||''}
 function ask(remote){choice={remote,userId:user.id};$('sync-conflict').hidden=false;status('Wybierz dane do synchronizacji');message('Wybierz dane z urządzenia lub chmury. Nic nie zostało nadpisane.');if(!dialog.open)dialog.showModal()}
 function done(){status('Zsynchronizowano '+new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',hour:'2-digit',minute:'2-digit'}).format(new Date()));message('Dane są zsynchronizowane.');}
 async function getRemote(){const {data,error}=await client.from('kasa_state').select('data,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;return data}
 async function upload(remote,force=false){const id=user.id,version=meta.updatedAt||stamp(),data=snapshot();let result;
 if(remote){result=await client.from('kasa_state').update({data,updated_at:version}).eq('user_id',id).eq('updated_at',remote.updated_at).select('updated_at')}
 else result=await client.from('kasa_state').insert({user_id:id,data,updated_at:version}).select('updated_at');
 if(result.error){if(result.error.code==='23505'){status('Wykryto równoczesny zapis — ponawiam odczyt');setTimeout(()=>sync(),500);return}throw result.error}
 if(!result.data?.length){status('Dane zmieniły się na drugim urządzeniu — ponawiam odczyt');setTimeout(()=>sync(),500);return}
 if(user?.id!==id)return;meta.owner=id;meta.initialized=true;if(meta.updatedAt===version){meta.pending=false}persist();if(!meta.pending)done();else setTimeout(()=>sync(),600)
 }
 async function sync(){if(!client||!user||busy||choice)return;if(!navigator.onLine){status('Offline — zapiszę później');return}busy=true;const id=user.id;
 try{const remote=await getRemote();if(user?.id!==id)return;
 if(remote&&(!valid(remote.data)||!Number.isFinite(Date.parse(remote.updated_at))))throw new Error('Nieprawidłowy zapis w chmurze. Nie nadpisano urządzenia.');
 const first=!meta.initialized||meta.owner!==id;
 if(first&&hasData(state)&&(hasData(remote?.data)||(meta.owner&&meta.owner!==id))){ask(remote);return}
 if(first){if(remote)apply(remote.data,remote.updated_at);else{meta.updatedAt=stamp();meta.owner=id;meta.initialized=true;meta.pending=true;persist();await upload(null)}done();return}
 if(!remote){meta.pending=true;meta.updatedAt=meta.updatedAt||stamp();persist();await upload(null);return}
 const rt=Date.parse(remote.updated_at),lt=Date.parse(meta.updatedAt||0)||0;
 if(rt>lt){apply(remote.data,remote.updated_at);done()}
 else if(meta.pending||lt>rt){await upload(remote)}else done();
 }catch(e){status(navigator.onLine?'Błąd synchronizacji — zapis lokalny':'Offline — zapiszę później');message(niceError(e))}finally{busy=false}}
 $('sync-use-local').onclick=async()=>{if(!choice||busy)return;const selected=choice;if(user?.id!==selected.userId)return;choice=null;$('sync-conflict').hidden=true;meta.owner=user.id;meta.initialized=true;meta.updatedAt=new Date(Math.max(Date.now(),Date.parse(selected.remote?.updated_at||0)+1||0)).toISOString();meta.pending=true;persist();busy=true;try{await upload(selected.remote,true)}catch(e){message(niceError(e));status('Nie zapisano w chmurze — dane lokalne zachowane')}finally{busy=false}};
 $('sync-use-cloud').onclick=()=>{if(!choice)return;try{if(user?.id!==choice.userId)return;apply(choice.remote?.data||{opening:'',income:[],expense:[]},choice.remote?.updated_at||stamp());choice=null;$('sync-conflict').hidden=true;done()}catch(e){message(niceError(e))}};
 window.addEventListener('kasa-local-change',()=>{meta.updatedAt=stamp();meta.pending=true;persist();clearTimeout(timer);status(user?(navigator.onLine?'Zapisuję…':'Offline — zapiszę później'):'Zapisano na tym urządzeniu');timer=setTimeout(sync,800)});
 $('sync-open').onclick=()=>dialog.showModal();$('sync-close').onclick=()=>dialog.close();$('sync-refresh').onclick=sync;
 $('sync-login').onsubmit=async e=>{e.preventDefault();if(!client)return;const button=e.target.querySelector('button');button.disabled=true;message('Wysyłam kod…');try{const {error}=await client.auth.signInWithOtp({email:$('sync-email').value.trim(),options:{shouldCreateUser:true}});if(error)throw error;$('sync-verify').hidden=false;message('Sprawdź e-mail i wpisz kod. Jeśli otrzymasz wyłącznie link, administrator musi dodać {{ .Token }} do szablonów wiadomości.')}catch(error){message(niceError(error))}finally{button.disabled=false}};
 $('sync-verify').onsubmit=async e=>{e.preventDefault();if(!client)return;const button=e.target.querySelector('button');button.disabled=true;try{const {data,error}=await client.auth.verifyOtp({email:$('sync-email').value.trim(),token:$('sync-code').value.trim(),type:'email'});if(error)throw error;$('sync-code').value='';user=data.user||data.session?.user;showAccount();await sync()}catch(error){message(niceError(error))}finally{button.disabled=false}};
 $('sync-logout').onclick=async()=>{try{if(meta.pending&&!confirm('Są niezapisane zmiany. Wylogować? Dane pozostaną na urządzeniu.'))return;const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;user=null;choice=null;$('sync-conflict').hidden=true;showAccount();status('Wylogowano — dane tylko na urządzeniu');message('Wylogowano z tego urządzenia.')}catch(error){message(niceError(error))}};
 for(const name of ['focus','online'])window.addEventListener(name,sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 try{const config=window.KASA_SYNC_CONFIG;client=window.KASA_TEST_CLIENT||window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'kasa-auth-aypx-v1'},global:{fetch:async(url,options={})=>{const controller=new AbortController(),t=setTimeout(()=>controller.abort(),15000);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(t)}}}});
 client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{user=session?.user||null;showAccount();if(user)sync()},0)});
 client.auth.getSession().then(({data,error})=>{if(error){message(niceError(error));return}user=data.session?.user||null;showAccount();if(user)sync()});
 }catch(e){status('Synchronizacja niedostępna — zapis lokalny');message(niceError(e))}
})();
