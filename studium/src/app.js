import './style.css';
import { supabase, configured } from './supabase.js';

if ('serviceWorker' in navigator && import.meta.env.PROD) { window.addEventListener('load', function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); }); }

var LS='studium:anon', LST='studium-app:theme', LSP='studium:profile';
var DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
var DS=['Mo','Di','Mi','Do','Fr','Sa'];
var COLORS=['#ff8a4c','#ff6b8b','#3fd0c0','#a495ff','#f6c344','#5db4ff'];
var STATUS=['offen','in Arbeit','abgegeben','bewertet'];
var IC={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
 cal:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
 check:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
 folder:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
 layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
 plus2:'<path d="M12 5v14M5 12h14"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 tick:'<path d="M5 12l5 5 9-10"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 pin:'<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 left:'<path d="M15 6l-6 6 6 6"/>',
 right:'<path d="M9 6l6 6-6 6"/>',
 up:'<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
function ic(n,c){return '<svg class="ic '+(c||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';}
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);}
function pad(n){return (n<10?'0':'')+n;}
function sod(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function isoWeek(d){var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);var y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7);}
function monday(d){var x=sod(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function fmtD(d){return d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});}
function fmtDT(d){return fmtD(d)+', '+pad(d.getHours())+':'+pad(d.getMinutes())+' Uhr';}
function toMin(t){var p=String(t).split(':');return (+p[0])*60+(+p[1]||0);}
function dayDiff(a,b){return Math.round((sod(a)-sod(b))/864e5);}

/* ---------- Daten ---------- */
var S=null, view='start', planWeek=0, planDay=0, calM=null, taskF='alle', fileF={mod:'',tag:'',q:''};
var user=null, P={name:'',study:'',accent:'#ff6b2c'}, channel=null, recovering=false, saveTimer=null, writing=false, syncState='lokal';

function emptyState(){
  return {v:1,updated:0,demo:false,semId:'sem1',types:['Vorlesung','Übung','Kolloquium'],
    semesters:[{id:'sem1',name:'Mein erstes Semester'}],modules:[],slots:[],tasks:[],files:[]};
}
function loadLocal(){try{var r=localStorage.getItem(LS);if(r){var o=JSON.parse(r);if(o&&o.semesters)return o;}}catch(e){}return null;}
function touch(){
  S.updated=Date.now();
  try{localStorage.setItem(LS,JSON.stringify(S));}catch(e){}
  queueSave();
}
function queueSave(){
  if(!user)return;
  setSync(navigator.onLine?'speichert':'offline');
  clearTimeout(saveTimer);saveTimer=setTimeout(flush,800);
}
async function flush(){
  if(!user)return;
  if(writing){queueSave();return;}
  writing=true;
  try{
    var r=await supabase.from('app_state').upsert({user_id:user.id,data:S,updated_at:new Date().toISOString()});
    if(r.error)throw r.error;
    setSync('sync');
  }catch(e){setSync(navigator.onLine?'fehler':'offline');}
  writing=false;
}
function setSync(s){
  syncState=s;
  var t={sync:'Synchronisiert',speichert:'Speichert …',fehler:'Sync-Fehler',offline:'Offline'}[s]||'';
  ['sync','sync2'].forEach(function(id){var e=$('#'+id);if(e){e.dataset.s=s;e.textContent=t;}});
}
function ensureSem(){if(!S.semesters.some(function(x){return x.id===S.semId;}))S.semId=S.semesters[0].id;}
function applyRemote(d){
  S=d;ensureSem();
  try{localStorage.setItem(LS,JSON.stringify(S));}catch(e){}
  paintNav();render();
}
async function pull(){
  if(!user)return;
  var r=await supabase.from('app_state').select('data').eq('user_id',user.id).maybeSingle();
  if(r.error){setSync(navigator.onLine?'fehler':'offline');return;}
  var d=r.data&&r.data.data;
  if(d&&d.semesters){
    if((d.updated||0)>(S.updated||0))applyRemote(d);
    else if((d.updated||0)<(S.updated||0)){queueSave();return;}
    setSync('sync');
  }else{flush();}
}
function subscribe(){
  if(channel){supabase.removeChannel(channel);channel=null;}
  channel=supabase.channel('state-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'app_state',filter:'user_id=eq.'+user.id},function(p){
    var d=p.new&&p.new.data;
    if(d&&d.semesters&&(d.updated||0)>(S.updated||0))applyRemote(d);
  }).subscribe();
}

/* ---------- Profil + Akzentfarbe ---------- */
var ACCENTS=['#ff6b2c','#ff3b30','#ff5d8f','#a78bfa','#5b8cff','#22c3ee','#2dd4a0','#f5b82e'];
function applyAccent(hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex||''))hex='#ff6b2c';
  var r=parseInt(hex.substr(1,2),16),g=parseInt(hex.substr(3,2),16),b=parseInt(hex.substr(5,2),16);
  var lum=(0.299*r+0.587*g+0.114*b)/255;
  var root=document.documentElement;
  root.style.setProperty('--accent',hex);
  root.style.setProperty('--accent-fg',lum>0.58?'#1a0b03':'#ffffff');
}
function initials(){
  var n=(P.name||(user&&user.email)||'?').trim();
  var w=n.split(/\s+/);
  return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase();
}
function paintAvatar(){
  var a=$('#bprof');if(!a)return;
  a.textContent=initials();
  a.setAttribute('aria-current',view==='profil'?'page':'false');
}
async function fetchProfile(){
  var r=await supabase.from('profiles').select('name,study,accent').eq('id',user.id).maybeSingle();
  if(r.data){P={name:r.data.name||'',study:r.data.study||'',accent:r.data.accent||'#ff6b2c'};
    try{localStorage.setItem(LSP+':'+user.id,JSON.stringify(P));}catch(e){}
    applyAccent(P.accent);paintAvatar();if(view==='start'||view==='profil')render();}
}
function loadProfileLocal(){try{var r=localStorage.getItem(LSP+':'+user.id);if(r)return JSON.parse(r);}catch(e){}return {name:(user.user_metadata&&user.user_metadata.name)||'',study:'',accent:'#ff6b2c'};}

/* ---------- Abfragen ---------- */
function mods(){return S.modules.filter(function(m){return m.sem===S.semId;});}
function modById(id){return S.modules.filter(function(m){return m.id===id;})[0];}
function modIds(){return mods().map(function(m){return m.id;});}
function slots(){var ids=modIds();return S.slots.filter(function(s){return ids.indexOf(s.mod)>-1;});}
function tasks(){var ids=modIds();return S.tasks.filter(function(t){return ids.indexOf(t.mod)>-1;});}
function files(){var ids=modIds();return S.files.filter(function(f){return !f.mod||ids.indexOf(f.mod)>-1;});}
function isOpen(t){return t.status==='offen'||t.status==='in Arbeit';}
function slotsOn(date){
  var wk=isoWeek(date),day=(date.getDay()+6)%7;
  return slots().filter(function(s){return s.day===day&&(!s.bi||s.par===wk%2);}).sort(function(a,b){return toMin(a.start)-toMin(b.start);});
}
function byDue(a,b){return new Date(a.due)-new Date(b.due);}
function slotLabel(s){var m=modById(s.mod);return (m?m.short:'?')+' · '+s.type;}
function countdown(due){
  var n=dayDiff(new Date(due),new Date());
  if(n<0)return {t:'überfällig ('+(-n)+' T.)',c:'bad'};
  if(n===0)return {t:'heute',c:'bad'};
  if(n===1)return {t:'morgen',c:'warn'};
  return {t:'in '+n+' Tagen',c:n<=3?'warn':''};
}

/* ---------- Icons / Navigation ---------- */
var NAV=[['start','Start','home'],['plan','Stundenplan','cal'],['abgaben','Abgaben','check'],['wissen','Wissen','folder'],['module','Module','layers']];
function go(v){view=v;try{history.replaceState(null,'','#'+v);}catch(e){}paintNav();render(true);window.scrollTo(0,0);}
function paintNav(){
  $('#links').innerHTML=NAV.map(function(n){return '<button data-go="'+n[0]+'"'+(view===n[0]?' aria-current="page"':'')+'>'+n[1]+'</button>';}).join('');
  var t=[['start','Start','home'],['plan','Stundenplan','cal'],['new','Neu','plus'],['wissen','Wissen','folder'],['abgaben','Abgaben','check']];
  $('#tabs').innerHTML=t.map(function(n){return '<button data-go="'+n[0]+'"'+(view===n[0]?' aria-current="page"':'')+' aria-label="'+n[1]+'">'+ic(n[2])+'<span>'+n[1]+'</span></button>';}).join('');
  var opts=S.semesters.map(function(s){return '<option value="'+s.id+'"'+(s.id===S.semId?' selected':'')+'>'+esc(s.name)+'</option>';}).join('');
  $('#semsel').innerHTML=opts;$('#semsel2').innerHTML=opts;paintAvatar();
}

/* ---------- Views ---------- */
function render(anim){
  var v=$('#view');
  var html=({start:vStart,plan:vPlan,abgaben:vTasks,wissen:vFiles,module:vMods,profil:vProfile})[view]();
  var demo=S.demo?'<div class="demo"><span>Das sind Beispieldaten. Du kannst alles bearbeiten oder löschen.</span><button class="btn sm" data-act="cleardemo">Beispieldaten entfernen</button></div>':'';
  v.classList.toggle('anim',!!anim);
  v.innerHTML=demo+html;
  if(anim){stagger(v);countUps(v);}
}
function stagger(v){
  var els=v.querySelectorAll('.card,.trow,.remind,.item,.demo');
  for(var i=0;i<els.length;i++)els[i].style.setProperty('--i',Math.min(i,16));
}
function countUps(v){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  v.querySelectorAll('.stat .v').forEach(function(el){
    var n=el.firstChild;if(!n||n.nodeType!==3||!/^\d+$/.test(n.nodeValue))return;
    var to=+n.nodeValue,t0=performance.now(),dur=750;
    function step(t){var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);n.nodeValue=String(Math.round(to*e));if(k<1)requestAnimationFrame(step);}
    n.nodeValue='0';requestAnimationFrame(step);
  });
}

function vStart(){
  var now=new Date(), todays=slotsOn(now), nowMin=now.getHours()*60+now.getMinutes();
  var all=tasks(), open=all.filter(isOpen).sort(byDue), next=open[0];
  var doneN=all.filter(function(t){return !isOpen(t);}).length;
  var upc=null, upDay=null;
  for(var i=0;i<8&&!upc;i++){var d=addDays(now,i);var ss=slotsOn(d).filter(function(s){return i>0||toMin(s.end)>nowMin;});if(ss.length){upc=ss[0];upDay=d;}}
  var g=now.getHours()<11?'Guten Morgen':now.getHours()<18?'Guten Tag':'Guten Abend';
  var sem=S.semesters.filter(function(s){return s.id===S.semId;})[0];

  var feature='<div class="card feature"><div class="tag">Als Nächstes</div>'+
    (upc?'<div><div class="big">'+esc(modById(upc.mod).name.replace(' (Beispiel)',''))+'</div><div style="font-weight:600;margin-top:2px">'+esc(upc.type)+'</div></div><div class="meta"><span>'+ic('clock')+(dayDiff(upDay,now)===0?'Heute':fmtD(upDay))+', '+upc.start+'–'+upc.end+'</span>'+(upc.room?'<span>'+ic('pin')+esc(upc.room)+'</span>':'')+'</div>'
     :'<div class="big">Keine Termine in Sicht</div><div class="meta"><span>Trag im Stundenplan Veranstaltungen ein.</span></div>')+'</div>';

  var todayList=todays.length?todays.map(function(s){var m=modById(s.mod);var cur=toMin(s.start)<=nowMin&&nowMin<toMin(s.end);
    return '<button class="item" data-act="editslot" data-id="'+s.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(m.short)+' · '+esc(s.type)+'</div><div class="s">'+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+'</div></span>'+(cur?'<span class="pill acc">läuft</span>':'')+'</button>';}).join('')
    :'<div class="empty">Heute ist frei.</div>';

  // Statistik-Karten
  var barsT=todays.length?'<div class="bars">'+todays.map(function(s){var h=(toMin(s.end)-toMin(s.start))/60;return '<b style="height:'+Math.round(Math.min(30,8+h*10))+'px"></b>';}).join('')+'</div>':'<div class="hint">frei</div>';
  var ratio=all.length?doneN/all.length:0, L=Math.PI*36;
  var arc='<svg viewBox="0 0 90 48" width="90" height="48" aria-hidden="true"><path d="M9 45a36 36 0 0172 0" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round"/><path d="M9 45a36 36 0 0172 0" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+(L*ratio).toFixed(1)+' '+L.toFixed(1)+'"/></svg>';
  var nd=next?dayDiff(new Date(next.due),now):null;
  var pr=nd==null?0:Math.max(0,Math.min(1,1-nd/14));
  var graded=all.filter(function(t){return t.status==='bewertet'&&t.pts!=null&&t.max;});
  var sp=0,sm=0;graded.forEach(function(t){sp+=+t.pts;sm+=+t.max;});
  var pct=sm?Math.round(sp/sm*100):null;
  var barsP=graded.length?'<div class="bars">'+graded.slice(0,8).map(function(t){return '<b style="height:'+Math.max(5,Math.round(t.pts/t.max*30))+'px"></b>';}).join('')+'</div>':'<div class="hint">noch nichts bewertet</div>';

  var stats='<div class="stats">'+
   '<div class="card stat"><div class="k"><span>Heute</span></div><div class="v">'+todays.length+'<small>Termine</small></div><div class="viz">'+barsT+'</div></div>'+
   '<div class="card stat"><div class="k"><span>Abgaben</span></div><div class="v">'+open.length+'<small>offen</small></div><div class="viz">'+arc+'</div></div>'+
   '<div class="card stat"><div class="k"><span>Nächste Frist</span></div><div class="v">'+(next?(nd<=0?(nd<0?'!':'0'):nd)+'<small>'+(nd===1?'Tag':'Tage')+'</small>':'–')+'</div><div class="viz">'+(next?'<div class="prog"><i style="width:'+Math.round(pr*100)+'%"></i></div><div class="hint" style="margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(modById(next.mod).short)+' · '+esc(next.title)+'</div>':'<div class="hint">alles erledigt</div>')+'</div></div>'+
   '<div class="card stat"><div class="k"><span>Punkte</span></div><div class="v">'+(pct==null?'–':pct+'<small>%</small>')+'</div><div class="viz">'+barsP+'</div></div></div>';

  // Erinnerungen
  var rem=open.filter(function(t){var ms=new Date(t.due)-now;return t.remind>0&&ms<=t.remind*60000;}).slice(0,3);
  var remH=rem.map(function(t){var c=countdown(t.due);return '<div class="remind">'+ic('clock')+'<span class="grow" style="flex:1"><b>'+esc(modById(t.mod).short)+' · '+esc(t.title)+'</b><div class="s" style="color:var(--muted)">Frist '+fmtDT(new Date(t.due))+' ('+c.t+')</div></span></div>';}).join('');

  return '<div class="ph"><div><h1>'+g+(P.name?', '+esc(P.name.split(' ')[0]):'')+'</h1><p>'+now.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})+' · KW '+isoWeek(now)+' · '+esc(sem?sem.name:'')+(P.study?' · '+esc(P.study):'')+'</p></div></div>'+
   '<div class="dash"><div class="col">'+(remH?'<div class="list">'+remH+'</div>':'')+stats+
   '<div class="two"><div class="card"><h3>Fristen pro Woche <small>nächste 8 Wochen</small></h3>'+chart(all)+'<div class="legend"><span>offen</span><span class="g">abgegeben</span></div></div>'+feature+'</div>'+
   '<div class="card"><h3>Heute im Stundenplan <button class="btn sm ghost" data-go="plan">Zum Plan</button></h3><div class="list">'+todayList+'</div></div></div>'+
   '<aside class="col"><div class="card">'+calendar(all)+'</div><div class="card"><h3>Anstehende Abgaben <button class="btn sm ghost" data-go="abgaben">Alle</button></h3><div class="list">'+
   (open.length?open.slice(0,4).map(function(t){var m=modById(t.mod),c=countdown(t.due);return '<button class="item" data-act="edittask" data-id="'+t.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(t.title)+'</div><div class="s">'+esc(m.short)+' · '+fmtD(new Date(t.due))+'</div></span><span class="pill '+c.c+'">'+c.t+'</span></button>';}).join(''):'<div class="empty">Keine offenen Abgaben.</div>')+
   '</div></div></aside></div>';
}

function chart(all){
  var m0=monday(new Date()), W=8, cnt=[];
  for(var i=0;i<W;i++){cnt.push({o:0,d:0});}
  all.forEach(function(t){var w=Math.floor(dayDiff(new Date(t.due),m0)/7);if(w>=0&&w<W){if(isOpen(t))cnt[w].o++;else cnt[w].d++;}});
  var mx=3;cnt.forEach(function(c){mx=Math.max(mx,c.o+c.d);});
  var vw=520,vh=190,pl=26,pb=24,pt=10,iw=vw-pl-6,ih=vh-pb-pt,bw=iw/W,s='';
  for(var k=0;k<=mx;k++){var y=pt+ih-ih*k/mx;s+='<line class="gl" x1="'+pl+'" x2="'+(vw-6)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-8)+'" y="'+(y+4)+'" text-anchor="end">'+k+'</text>';}
  cnt.forEach(function(c,i){
    var x=pl+i*bw+bw*.22,w=bw*.56,hO=ih*c.o/mx,hD=ih*c.d/mx;
    if(c.o)s+='<rect class="b-open" x="'+x+'" y="'+(pt+ih-hO)+'" width="'+w+'" height="'+hO+'" rx="4"/>';
    if(c.d)s+='<rect class="b-done" x="'+x+'" y="'+(pt+ih-hO-hD)+'" width="'+w+'" height="'+hD+'" rx="4"/>';
    s+='<text x="'+(x+w/2)+'" y="'+(vh-6)+'" text-anchor="middle">KW '+isoWeek(addDays(m0,i*7))+'</text>';
  });
  return '<svg class="chart" viewBox="0 0 '+vw+' '+vh+'" role="img" aria-label="Anzahl der Abgabefristen pro Kalenderwoche">'+s+'</svg>';
}

function calendar(all){
  var now=new Date();if(!calM)calM=new Date(now.getFullYear(),now.getMonth(),1);
  var first=calM,start=monday(first),cells='',fr={};
  all.forEach(function(t){if(isOpen(t)){var d=new Date(t.due);fr[d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()]=1;}});
  for(var i=0;i<42;i++){var d=addDays(start,i);if(i>=35&&d.getMonth()!==first.getMonth())break;
    var cl='d'+(d.getMonth()!==first.getMonth()?' o':'')+(dayDiff(d,now)===0?' t':'')+(fr[d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()]?' f':'');
    cells+='<div class="'+cl+'">'+d.getDate()+'</div>';}
  return '<div class="cal"><div class="cal-h"><button class="ibtn" data-act="calprev" aria-label="Vorheriger Monat">'+ic('left')+'</button><span>'+first.toLocaleDateString('de-DE',{month:'long',year:'numeric'})+'</span><button class="ibtn" data-act="calnext" aria-label="Nächster Monat">'+ic('right')+'</button></div><div class="cal-g">'+DS.concat(['So']).map(function(x){return '<div class="w">'+x+'</div>';}).join('')+cells+'</div><div class="hint" style="margin-top:10px"><span style="color:var(--red)">●</span> Abgabefrist</div></div>';
}

function vPlan(){
  var now=new Date(), mon=addDays(monday(now),planWeek*7), wk=isoWeek(mon);
  var ss=slots(), sat=ss.some(function(s){return s.day===5;}), cols=sat?6:5;
  var lo=8,hi=18;ss.forEach(function(s){lo=Math.min(lo,Math.floor(toMin(s.start)/60));hi=Math.max(hi,Math.ceil(toMin(s.end)/60));});
  var PX=54, H=(hi-lo)*PX;
  var head='<div></div>',body='',hrs='';
  for(var h=lo;h<=hi;h++){hrs+='<span style="top:'+((h-lo)*PX)+'px">'+pad(h)+':00</span>';}
  var dayHtml=[];
  for(var d=0;d<cols;d++){
    var date=addDays(mon,d),today=dayDiff(date,now)===0;
    head+='<div class="hd'+(today?' today':'')+'">'+DS[d]+'<small>'+pad(date.getDate())+'.'+pad(date.getMonth()+1)+'.</small></div>';
    var lines='';for(var h2=lo;h2<hi;h2++)lines+='<div class="hl" style="top:'+((h2-lo)*PX)+'px"></div>';
    var blocks=slotsOn(date).map(function(s){var m=modById(s.mod),top=(toMin(s.start)-lo*60)/60*PX,hh=(toMin(s.end)-toMin(s.start))/60*PX;
      return '<button class="blk'+(s.bi?' bi':'')+'" data-act="editslot" data-id="'+s.id+'" style="top:'+top+'px;height:'+Math.max(hh-2,28)+'px;background:'+m.color+'"><b>'+esc(m.short)+' · '+esc(s.type)+'</b><span>'+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+'</span></button>';}).join('');
    body+='<div class="dcol" style="height:'+H+'px">'+lines+blocks+'</div>';
  }
  var grid='<div class="grid" style="--cols:'+cols+'">'+head+'<div class="hours" style="height:'+H+'px">'+hrs+'</div>'+body+'</div>';
  // Handy: Tagesliste
  if(planDay>=cols)planDay=0;
  var tabs='<div class="tabs" role="group" aria-label="Wochentag">'+DS.slice(0,cols).map(function(n,i){var dt=addDays(mon,i);return '<button data-act="planday" data-i="'+i+'" aria-pressed="'+(planDay===i)+'">'+n+'<small>'+pad(dt.getDate())+'.'+pad(dt.getMonth()+1)+'.</small></button>';}).join('')+'</div>';
  var dl=slotsOn(addDays(mon,planDay));
  var list='<div class="list">'+(dl.length?dl.map(function(s){var m=modById(s.mod);return '<button class="item" data-act="editslot" data-id="'+s.id+'" style="border-left:5px solid '+m.color+'"><span class="grow"><div class="t">'+esc(m.name)+'</div><div class="s">'+esc(s.type)+' · '+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+(s.bi?' · alle 2 Wochen':'')+'</div></span></button>';}).join(''):'<div class="empty">Kein Termin an diesem Tag.</div>')+'</div>';
  return '<div class="ph"><div><h1>Stundenplan</h1><p>Wöchentlich gleich, zweiwöchige Übungen erscheinen nur in der passenden KW.</p></div><div class="acts"><button class="btn pri" data-act="newslot">'+ic('plus2')+' Termin</button></div></div>'+
   '<div class="weekbar"><button class="ibtn" data-act="wprev" aria-label="Vorherige Woche">'+ic('left')+'</button><span class="wk">KW '+wk+' · '+pad(mon.getDate())+'.'+pad(mon.getMonth()+1)+'.</span><button class="ibtn" data-act="wnext" aria-label="Nächste Woche">'+ic('right')+'</button>'+(planWeek?'<button class="btn sm" data-act="wnow">Diese Woche</button>':'')+'</div>'+
   '<div class="card">'+(mods().length?grid+'<div class="daylist">'+tabs+list+'</div>':'<div class="empty">Lege zuerst unter „Module“ ein Modul an.</div>')+'</div>';
}

function vTasks(){
  var all=tasks().sort(byDue);
  var f=all.filter(function(t){return taskF==='alle'||(taskF==='offen'?isOpen(t):taskF==='abgegeben'?t.status==='abgegeben':t.status==='bewertet');});
  var chips=['alle','offen','abgegeben','bewertet'].map(function(c){return '<button class="chip" data-act="tfilter" data-f="'+c+'" aria-pressed="'+(taskF===c)+'">'+c[0].toUpperCase()+c.slice(1)+'</button>';}).join('');
  var rows=f.map(function(t){var m=modById(t.mod),c=countdown(t.due),done=!isOpen(t);
    return '<div class="trow'+(done?' done':'')+'"><button class="chk" data-act="toggletask" data-id="'+t.id+'" aria-label="Als abgegeben markieren">'+ic('tick')+'</button>'+
    '<button class="item" style="background:none;padding:0" data-act="edittask" data-id="'+t.id+'"><span class="grow"><div class="tt t" style="white-space:normal">'+esc(t.title)+'</div><div class="ts"><span><span class="dot" style="display:inline-block;background:'+m.color+';margin-right:5px"></span>'+esc(m.name)+'</span><span>'+fmtDT(new Date(t.due))+'</span></div></span></button>'+
    '<div class="right">'+(t.pts!=null&&t.pts!==''?'<span class="pill good">'+t.pts+(t.max?' / '+t.max:'')+' P.</span>':'')+'<span class="pill">'+t.status+'</span>'+(done?'':'<span class="pill '+c.c+'">'+c.t+'</span>')+'</div><span></span></div>';}).join('');
  return '<div class="ph"><div><h1>Abgaben</h1><p>Fristen, Status und Punkte deiner Übungsserien.</p></div><div class="acts"><button class="btn pri" data-act="newtask">'+ic('plus2')+' Abgabe</button></div></div>'+
   '<div class="chips">'+chips+'</div><div class="list">'+(rows||'<div class="card empty">Hier ist nichts.</div>')+'</div>';
}

function ftype(f){var n=(f.name||'').toLowerCase();if(/\.pdf$/.test(n))return ['PDF','#ff8a4c'];if(/\.pptx?$/.test(n))return ['PPT','#f6c344'];if(/\.docx?$/.test(n))return ['DOC','#5db4ff'];if(/\.(png|jpe?g|heic|webp|gif)$/.test(n))return ['IMG','#3fd0c0'];return [f.path?'DAT':'NOTIZ','#a495ff'];}
function vFiles(){
  var all=files(),tg={};all.forEach(function(f){(f.tags||[]).forEach(function(t){tg[t]=1;});});
  var q=fileF.q.toLowerCase();
  var f=all.filter(function(x){return (!fileF.mod||x.mod===fileF.mod)&&(!fileF.tag||(x.tags||[]).indexOf(fileF.tag)>-1)&&(!q||(x.title+' '+(x.note||'')+' '+(x.tags||[]).join(' ')+' '+(x.name||'')).toLowerCase().indexOf(q)>-1);}).sort(function(a,b){return (b.added||0)-(a.added||0);});
  var cards=f.map(function(x){var m=modById(x.mod),t=ftype(x);
    return '<button class="card fcard" data-act="openfile" data-id="'+x.id+'"><div class="ftype" style="background:'+t[1]+'">'+t[0]+'</div><div class="t">'+esc(x.title)+'</div>'+(m?'<div class="s hint"><span class="dot" style="display:inline-block;background:'+m.color+';margin-right:5px"></span>'+esc(m.short)+'</div>':'')+(x.note?'<div class="n">'+esc(x.note)+'</div>':'')+'<div class="tags">'+(x.tags||[]).map(function(g){return '<span class="pill">'+esc(g)+'</span>';}).join('')+'</div></button>';}).join('');
  return '<div class="ph"><div><h1>Wissen</h1><p>Skripte, Folien und Notizen, verknüpft mit Modul und Veranstaltung.</p></div><div class="acts"><button class="btn pri" data-act="newfile">'+ic('up')+' Hinzufügen</button></div></div>'+
   '<div class="filters"><input class="fi" id="fq" type="search" placeholder="Suchen in Titel, Notizen, Tags" value="'+esc(fileF.q)+'" style="max-width:320px"><select class="fi" id="fmod" style="max-width:220px"><option value="">Alle Module</option>'+mods().map(function(m){return '<option value="'+m.id+'"'+(fileF.mod===m.id?' selected':'')+'>'+esc(m.short)+' · '+esc(m.name)+'</option>';}).join('')+'</select><select class="fi" id="ftag" style="max-width:180px"><option value="">Alle Tags</option>'+Object.keys(tg).sort().map(function(t){return '<option'+(fileF.tag===t?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select></div>'+
   (cards?'<div class="fgrid">'+cards+'</div>':'<div class="card empty">Noch keine Einträge. Lade ein PDF hoch oder schreib eine Notiz.</div>');
}

function vMods(){
  var cards=mods().map(function(m){var ns=S.slots.filter(function(s){return s.mod===m.id;}).length,nt=S.tasks.filter(function(t){return t.mod===m.id;}).length,nf=S.files.filter(function(f){return f.mod===m.id;}).length;
    return '<div class="card mcard"><div class="bar" style="background:'+m.color+'"></div><div><span class="pill">'+esc(m.short)+'</span></div><h3>'+esc(m.name)+'</h3><div class="hint">'+(m.kind==='ku'?'Kolloquium + Übung':'Vorlesung + Übung')+'</div><div class="row"><span class="pill">'+ns+' Termine</span><span class="pill">'+nt+' Abgaben</span><span class="pill">'+nf+' Dateien</span></div><div class="row"><button class="btn sm" data-act="editmod" data-id="'+m.id+'">Bearbeiten</button></div></div>';}).join('');
  return '<div class="ph"><div><h1>Module</h1><p>Ein Modul besteht aus Vorlesung + Übung oder Kolloquium + Übung.</p></div><div class="acts"><button class="btn" data-act="newsem">Neues Semester</button><button class="btn pri" data-act="newmod">'+ic('plus2')+' Modul</button></div></div>'+
   '<div class="mgrid">'+(cards||'<div class="card empty">Noch kein Modul in diesem Semester.</div>')+'</div>'+
   '<div class="card" style="margin-top:18px"><h3>Veranstaltungstypen</h3><div class="tags" style="margin-bottom:12px">'+S.types.map(function(t){return '<span class="pill">'+esc(t)+(['Vorlesung','Übung','Kolloquium'].indexOf(t)<0?' <button class="ibtn" style="width:18px;height:18px;border-radius:6px" data-act="deltype" data-t="'+esc(t)+'" aria-label="Typ entfernen">'+ic('x')+'</button>':'')+'</span>';}).join('')+'</div><form id="typeform" style="display:flex;gap:8px;max-width:360px"><input class="fi" id="newtype" placeholder="Weiteren Typ hinzufügen, z. B. Tutorium"><button class="btn">Hinzufügen</button></form></div>'+
   '<div class="card" style="margin-top:18px"><h3>Semester</h3><div class="list">'+S.semesters.map(function(s){return '<div class="item"><span class="grow t">'+esc(s.name)+(s.id===S.semId?' <span class="pill acc">aktiv</span>':'')+'</span><button class="btn sm" data-act="editsem" data-id="'+s.id+'">Umbenennen</button></div>';}).join('')+'</div></div>';
}


function vProfile(){
  var custom=ACCENTS.indexOf(P.accent)<0;
  return '<div class="ph"><div><h1>Profil</h1><p>Name, Studiengang und Farbe der App.</p></div></div>'+
  '<div class="prof"><form class="card" id="profform" style="display:grid;gap:16px">'+
   '<div class="who"><div class="bigav" id="pav">'+esc(initials())+'</div><div><div class="disp" style="font-size:26px;line-height:1.1" id="pnm">'+esc(P.name||'Dein Name')+'</div><div class="hint">'+esc(user?user.email:'')+'</div></div></div>'+
   fld('Name','name','text',P.name,'maxlength="60" autocomplete="name"')+
   fld('Studiengang','study','text',P.study,'maxlength="80" placeholder="z. B. Mathematik B.Sc."')+
   '<div class="fl">Akzentfarbe<div class="swatches" id="accsw">'+ACCENTS.map(function(c){return '<label><input type="radio" name="accent" value="'+c+'"'+(c===P.accent?' checked':'')+'><span style="background:'+c+'" title="'+c+'"></span></label>';}).join('')+
   '<label class="cust" title="Eigene Farbe"><input type="color" name="custom" value="'+P.accent+'" id="acccustom"><span class="'+(custom?'on':'')+'" style="background:'+(custom?P.accent:'conic-gradient(#ff3b30,#f5b82e,#2dd4a0,#5b8cff,#a78bfa,#ff3b30)')+'"></span></label></div></div>'+
   '<div class="sh-f"><span class="sp"></span><button class="btn pri" type="submit">Speichern</button></div></form>'+
  '<div class="col"><div class="card" style="display:grid;gap:12px"><h3>Konto</h3><div class="hint">Angemeldet als <b style="color:var(--fg)">'+esc(user?user.email:'')+'</b></div>'+
   '<div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-go="module">Module und Semester</button><button class="btn" data-act="newpw">Passwort ändern</button><button class="btn danger" data-act="logout">Abmelden</button></div></div>'+
   '<div class="card"><h3>Sync</h3><div class="hint">Deine Daten liegen in deinem Supabase-Konto und sind auf allen Geräten gleich. Der Stundenplan bleibt auch offline verfügbar.</div></div></div></div>';
}
function pwForm(){
  modal('Passwort ändern',fld('Neues Passwort','pw','password','','required minlength="8" autocomplete="new-password"'),function(fd){
    return supabase.auth.updateUser({password:fd.get('pw')}).then(function(r){if(r.error){toast(authMsg(r.error));return false;}toast('Passwort geändert');return true;});
  });
}
document.addEventListener('submit',function(e){
  if(e.target.id!=='profform')return;
  e.preventDefault();
  var fd=new FormData(e.target),acc=fd.get('accent')||P.accent;
  var np={name:String(fd.get('name')||'').trim(),study:String(fd.get('study')||'').trim(),accent:acc};
  P=np;applyAccent(P.accent);
  try{localStorage.setItem(LSP+':'+user.id,JSON.stringify(P));}catch(x){}
  paintAvatar();
  supabase.from('profiles').upsert({id:user.id,name:P.name,study:P.study,accent:P.accent,updated_at:new Date().toISOString()}).then(function(r){toast(r.error?'Speichern fehlgeschlagen.':'Profil gespeichert');});
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(!t.closest||!t.closest('#profform'))return;
  if(t.name==='accent'){applyAccent(t.value);var cs=$('#acccustom');if(cs){cs.value=t.value;cs.nextElementSibling.className='';}}
  if(t.name==='custom'){applyAccent(t.value);var rr=$('#accsw input[name=accent]:checked');if(rr)rr.checked=false;t.nextElementSibling.className='on';t.nextElementSibling.style.background=t.value;
    var hid=$('#acchid');if(!hid){hid=document.createElement('input');hid.type='hidden';hid.name='accent';hid.id='acchid';t.form.appendChild(hid);}hid.value=t.value;}
  if(t.name==='name'){var n=$('#pnm');if(n)n.textContent=t.value||'Dein Name';var a=$('#pav');if(a){var w=t.value.trim().split(/\s+/);a.textContent=t.value.trim()?((w[0][0]||'')+(w.length>1?w[w.length-1][0]:'')).toUpperCase():initials();}}
});

/* ---------- Login ---------- */
var authMode='login';
function authMsg(e){
  var m=(e&&e.message||'').toLowerCase();
  if(m.indexOf('invalid login')>-1)return 'E-Mail oder Passwort stimmt nicht.';
  if(m.indexOf('not confirmed')>-1)return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if(m.indexOf('already registered')>-1)return 'Zu dieser E-Mail gibt es schon ein Konto.';
  if(m.indexOf('at least')>-1||m.indexOf('weak')>-1)return 'Das Passwort braucht mindestens 8 Zeichen.';
  if(m.indexOf('rate')>-1||m.indexOf('seconds')>-1)return 'Zu viele Versuche. Warte kurz und probier es erneut.';
  if(m.indexOf('network')>-1||m.indexOf('fetch')>-1)return 'Keine Verbindung. Prüfe dein Netz.';
  if(m.indexOf('same')>-1)return 'Das neue Passwort muss sich vom alten unterscheiden.';
  return 'Das hat nicht geklappt. Versuch es noch einmal.';
}
function pwField(name,auto){return '<label class="fl">Passwort<span class="pwrap"><input class="fi" name="'+name+'" type="password" required minlength="8" autocomplete="'+auto+'" id="'+name+'"><button type="button" class="eye" data-act="eye" aria-label="Passwort anzeigen">'+ic('eye')+'</button></span></label>';}
function showAuth(mode,note){
  authMode=mode;
  var h='';
  if(mode==='config'){
    h='<h2>Supabase fehlt</h2><p class="lead">Trage <code>VITE_SUPABASE_URL</code> und <code>VITE_SUPABASE_ANON_KEY</code> in deine Umgebungsvariablen ein (lokal in <code>.env</code>, auf Vercel in den Project Settings) und starte neu.</p>';
  }else if(mode==='confirm'){
    h='<h2>Fast geschafft</h2><p class="lead">Wir haben dir eine E-Mail geschickt. Öffne den Link darin, dann kannst du dich anmelden.</p><button class="btn pri wide" type="button" data-act="auth" data-m="login">Zur Anmeldung</button>';
  }else if(mode==='sent'){
    h='<h2>E-Mail unterwegs</h2><p class="lead">Wenn es zu dieser Adresse ein Konto gibt, bekommst du gleich einen Link zum Zurücksetzen.</p><button class="btn pri wide" type="button" data-act="auth" data-m="login">Zur Anmeldung</button>';
  }else{
    var title={login:'Willkommen zurück',register:'Konto erstellen',forgot:'Passwort vergessen',recover:'Neues Passwort'}[mode];
    var sub={login:'Melde dich an, um deinen Stundenplan zu sehen.',register:'In einer Minute startklar.',forgot:'Wir schicken dir einen Link per E-Mail.',recover:'Wähle ein neues Passwort für dein Konto.'}[mode];
    h='<h2>'+title+'</h2><p class="lead">'+sub+'</p>';
    if(mode==='login'||mode==='register')h+='<div class="seg" role="tablist"><button type="button" role="tab" aria-selected="'+(mode==='login')+'" data-act="auth" data-m="login">Anmelden</button><button type="button" role="tab" aria-selected="'+(mode==='register')+'" data-act="auth" data-m="register">Registrieren</button></div>';
    h+='<form id="authform" style="display:grid;gap:14px">';
    if(mode==='register')h+=fld('Name','name','text','','required autocomplete="name" maxlength="60"');
    if(mode!=='recover')h+=fld('E-Mail','email','email','','required autocomplete="email" inputmode="email"');
    if(mode==='login')h+=pwField('password','current-password');
    if(mode==='register')h+=pwField('password','new-password');
    if(mode==='recover')h+=pwField('password','new-password');
    h+='<div class="autherr" id="autherr" role="alert" hidden></div>';
    h+='<button class="btn pri wide" type="submit" id="authgo">'+{login:'Anmelden',register:'Konto erstellen',forgot:'Link senden',recover:'Passwort speichern'}[mode]+'</button>';
    h+='</form>';
    if(mode==='login')h+='<button class="link" type="button" data-act="auth" data-m="forgot">Passwort vergessen?</button>';
    if(mode==='forgot')h+='<button class="link" type="button" data-act="auth" data-m="login">Zurück zur Anmeldung</button>';
    if(note)h+='<div class="authnote">'+esc(note)+'</div>';
  }
  var box=$('#authbox');box.innerHTML=h;
  box.classList.remove('swap');void box.offsetWidth;box.classList.add('swap');
  $('#auth').hidden=false;document.body.classList.add('locked');
  var f=box.querySelector('input');if(f&&mode!=='config')setTimeout(function(){try{f.focus({preventScroll:true});}catch(e){}},60);
}
function hideAuth(){$('#auth').hidden=true;document.body.classList.remove('locked');}
function authErr(t){var e=$('#autherr');if(!e)return;e.textContent=t;e.hidden=false;var b=$('#authbox');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');}
document.addEventListener('submit',function(e){
  if(e.target.id!=='authform')return;
  e.preventDefault();
  var fd=new FormData(e.target),btn=$('#authgo'),label=btn.textContent;
  var email=String(fd.get('email')||'').trim(),pw=String(fd.get('password')||'');
  if(authMode!=='forgot'&&pw.length<8&&authMode!=='login'){authErr('Das Passwort braucht mindestens 8 Zeichen.');return;}
  btn.disabled=true;btn.classList.add('busy');btn.textContent='Einen Moment …';
  var p;
  if(authMode==='login')p=supabase.auth.signInWithPassword({email:email,password:pw});
  else if(authMode==='register')p=supabase.auth.signUp({email:email,password:pw,options:{data:{name:String(fd.get('name')||'').trim()},emailRedirectTo:location.origin}});
  else if(authMode==='forgot')p=supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
  else p=supabase.auth.updateUser({password:pw});
  p.then(function(r){
    btn.disabled=false;btn.classList.remove('busy');btn.textContent=label;
    if(r.error){authErr(authMsg(r.error));return;}
    if(authMode==='register'&&!(r.data&&r.data.session)){showAuth('confirm');return;}
    if(authMode==='forgot'){showAuth('sent');return;}
    if(authMode==='recover'){recovering=false;supabase.auth.getSession().then(function(x){if(x.data.session)startSession(x.data.session.user);});}
  }).catch(function(){btn.disabled=false;btn.classList.remove('busy');btn.textContent=label;authErr(authMsg({message:'network'}));});
});

/* ---------- Sitzung ---------- */
function startSession(u){
  user=u;LS='studium:'+u.id;
  S=loadLocal()||emptyState();ensureSem();
  P=loadProfileLocal();applyAccent(P.accent);
  hideAuth();paintNav();render(true);
  setSync(navigator.onLine?'speichert':'offline');
  pull();fetchProfile();subscribe();
}
function stopSession(){
  if(channel&&supabase){supabase.removeChannel(channel);channel=null;}
  user=null;LS='studium:anon';S=emptyState();P={name:'',study:'',accent:'#ff6b2c'};applyAccent(P.accent);
  closeModal();view='start';
  try{history.replaceState(null,'','#start');}catch(e){}
}
window.addEventListener('online',function(){if(user)queueSave();});
window.addEventListener('offline',function(){if(user)setSync('offline');});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&user)pull();});

/* ---------- Dialoge ---------- */
function fld(label,name,type,val,extra){return '<label class="fl">'+label+'<input class="fi" name="'+name+'" type="'+type+'" value="'+esc(val==null?'':val)+'" '+(extra||'')+'></label>';}
function sel(label,name,opts,val){return '<label class="fl">'+label+'<select class="fi" name="'+name+'">'+opts.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(val)?' selected':'')+'>'+esc(o[1])+'</option>';}).join('')+'</select></label>';}
var armedDel=false;
function modal(title,body,onSave,o){
  o=o||{};armedDel=false;
  var m=$('#modal');
  m.innerHTML='<div class="sheet'+(o.wide?' wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="sh-h"><h2>'+esc(title)+'</h2><button class="ibtn" type="button" data-close aria-label="Schließen">'+ic('x')+'</button></div><form id="mform">'+body+'<div class="sh-f">'+(o.del?'<button type="button" class="btn danger" data-del>Löschen</button>':'')+'<span class="sp"></span><button type="button" class="btn ghost" data-close>Abbrechen</button>'+(onSave?'<button class="btn pri" type="submit">'+(o.ok||'Speichern')+'</button>':'')+'</div></form></div>';
  m.hidden=false;
  var f=$('#mform');
  f.addEventListener('submit',function(e){e.preventDefault();if(!onSave)return;var r=onSave(new FormData(f),f);if(r&&r.then){r.then(function(ok){if(ok!==false)closeModal();});}else if(r!==false)closeModal();});
  var d=$('[data-del]',f);
  if(d)d.addEventListener('click',function(){if(!armedDel){armedDel=true;d.textContent='Wirklich löschen?';return;}o.del();closeModal();});
  var first=$('input,select,textarea',f);if(first&&!o.nofocus)first.focus();
}
function closeModal(){var m=$('#modal');m.hidden=true;m.innerHTML='';}
function toast(t){var e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){e.hidden=true;},2600);}
function modOpts(){return mods().map(function(m){return [m.id,m.short+' · '+m.name];});}
function need(){if(!mods().length){toast('Lege zuerst ein Modul an.');go('module');return false;}return true;}

function slotForm(id){
  if(!need())return;
  var s=id?S.slots.filter(function(x){return x.id===id;})[0]:{mod:mods()[0].id,type:S.types[0],day:0,start:'09:15',end:'10:45',room:'',bi:false,par:isoWeek(new Date())%2};
  var rhythm=s.bi?(s.par===1?'odd':'even'):'week';
  modal(id?'Termin bearbeiten':'Neuer Termin',
   sel('Modul','mod',modOpts(),s.mod)+'<div class="frow">'+sel('Art','type',S.types.map(function(t){return [t,t];}),s.type)+sel('Wochentag','day',DAYS.map(function(d,i){return [i,d];}),s.day)+'</div><div class="frow">'+fld('Beginn','start','time',s.start,'required')+fld('Ende','end','time',s.end,'required')+'</div>'+fld('Raum','room','text',s.room)+
   sel('Rhythmus','rhythm',[['week','jede Woche'],['odd','alle 2 Wochen, ungerade KW'],['even','alle 2 Wochen, gerade KW']],rhythm),
   function(fd){var st=fd.get('start'),en=fd.get('end');if(toMin(en)<=toMin(st)){toast('Das Ende muss nach dem Beginn liegen.');return false;}
    var r=fd.get('rhythm'),o={id:id||uid(),mod:fd.get('mod'),type:fd.get('type'),day:+fd.get('day'),start:st,end:en,room:fd.get('room'),bi:r!=='week',par:r==='odd'?1:0};
    if(id)S.slots=S.slots.map(function(x){return x.id===id?o:x;});else S.slots.push(o);touch();render();},
   id?{del:function(){S.slots=S.slots.filter(function(x){return x.id!==id;});touch();render();}}:{});
}
function taskForm(id){
  if(!need())return;
  var t=id?S.tasks.filter(function(x){return x.id===id;})[0]:{mod:mods()[0].id,title:'',due:(function(){var d=addDays(new Date(),7);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T23:59';})(),status:'offen',pts:'',max:'',remind:1440,note:''};
  modal(id?'Abgabe bearbeiten':'Neue Abgabe',
   sel('Modul','mod',modOpts(),t.mod)+fld('Titel','title','text',t.title,'required placeholder="z. B. Übungsserie 3"')+'<div class="frow">'+fld('Frist','due','datetime-local',t.due,'required')+sel('Status','status',STATUS.map(function(x){return [x,x];}),t.status)+'</div><div class="frow">'+fld('Punkte erreicht','pts','number',t.pts,'step="0.5" min="0"')+fld('Punkte maximal','max','number',t.max,'step="0.5" min="0"')+'</div>'+
   sel('Erinnerung','remind',[[0,'keine'],[1440,'1 Tag vorher'],[4320,'3 Tage vorher'],[10080,'1 Woche vorher']],t.remind)+'<label class="fl">Notiz<textarea class="fi" name="note">'+esc(t.note||'')+'</textarea></label>',
   function(fd){var o={id:id||uid(),mod:fd.get('mod'),title:fd.get('title').trim(),due:fd.get('due'),status:fd.get('status'),pts:fd.get('pts')===''?null:+fd.get('pts'),max:fd.get('max')===''?null:+fd.get('max'),remind:+fd.get('remind'),note:fd.get('note')};
    if(!o.title)return false;if(id)S.tasks=S.tasks.map(function(x){return x.id===id?o:x;});else S.tasks.push(o);touch();render();},
   id?{del:function(){S.tasks=S.tasks.filter(function(x){return x.id!==id;});touch();render();}}:{});
}
function modForm(id){
  var m=id?modById(id):{name:'',short:'',color:COLORS[mods().length%COLORS.length],kind:'vu'};
  modal(id?'Modul bearbeiten':'Neues Modul',
   fld('Name','name','text',m.name,'required')+fld('Kürzel','short','text',m.short,'required maxlength="6" placeholder="z. B. AN1"')+sel('Aufbau','kind',[['vu','Vorlesung + Übung'],['ku','Kolloquium + Übung']],m.kind)+
   '<div class="fl">Farbe<div class="swatches">'+COLORS.map(function(c,i){return '<label><input type="radio" name="color" value="'+c+'"'+(c===m.color?' checked':'')+'><span style="background:'+c+'" title="Farbe '+(i+1)+'"></span></label>';}).join('')+'</div></div>',
   function(fd){var o={id:id||uid(),sem:id?m.sem:S.semId,name:fd.get('name').trim(),short:fd.get('short').trim(),color:fd.get('color')||COLORS[0],kind:fd.get('kind')};
    if(id)S.modules=S.modules.map(function(x){return x.id===id?o:x;});else S.modules.push(o);touch();render();},
   id?{del:function(){S.modules=S.modules.filter(function(x){return x.id!==id;});S.slots=S.slots.filter(function(x){return x.mod!==id;});S.tasks=S.tasks.filter(function(x){return x.mod!==id;});S.files.forEach(function(f){if(f.mod===id){f.mod='';f.slot='';}});touch();render();}}:{});
}
function fileForm(id){
  var f=id?S.files.filter(function(x){return x.id===id;})[0]:{title:'',mod:fileF.mod||'',slot:'',tags:[],note:''};
  var so=[['','–']].concat(slots().map(function(s){return [s.id,slotLabel(s)+' ('+DS[s.day]+')'];}));
  var upl=!id?'<label class="fl">Datei (PDF, Folien, Foto, optional)<input class="fi" type="file" name="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"></label>':'';
  var prev='';
  if(id&&f.path)prev='<div class="preview" id="pv"><div class="empty">Lädt …</div></div><div id="pvl"></div>';

  modal(id?'Eintrag':'Neuer Eintrag',
   prev+fld('Titel','title','text',f.title,'required')+'<div class="frow">'+sel('Modul','mod',[['','– ohne –']].concat(modOpts()),f.mod)+sel('Verknüpft mit','slot',so,f.slot)+'</div>'+fld('Tags (Komma getrennt)','tags','text',(f.tags||[]).join(', '))+'<label class="fl">Notizen<textarea class="fi" name="note">'+esc(f.note||'')+'</textarea></label>'+upl,
   function(fd){
     var o={id:id||uid(),title:fd.get('title').trim(),mod:fd.get('mod'),slot:fd.get('slot'),tags:fd.get('tags').split(',').map(function(x){return x.trim();}).filter(Boolean),note:fd.get('note'),added:f.added||Date.now(),path:f.path,name:f.name,ct:f.ct};
     var file=fd.get('file');
     function save(){if(id)S.files=S.files.map(function(x){return x.id===id?o:x;});else S.files.push(o);touch();render();}
     if(file&&file.size){
       if(file.size>50*1024*1024){toast('Die Datei ist größer als 50 MB.');return false;}
       toast('Lädt hoch …');
       var key=user.id+'/'+uid()+'-'+file.name.replace(/[^\w.\-]+/g,'_');
       return supabase.storage.from('dateien').upload(key,file,{contentType:file.type||undefined}).then(function(r){if(r.error)throw r.error;o.path=key;o.name=file.name;o.ct=file.type;if(!o.title)o.title=file.name;save();toast('Hochgeladen');return true;}).catch(function(){toast('Upload fehlgeschlagen.');return false;});
     }
     if(!o.title)return false;save();},
   id?{wide:true,del:function(){S.files=S.files.filter(function(x){return x.id!==id;});touch();render();if(f.path){supabase.storage.from('dateien').remove([f.path]).catch(function(){});}}}:{});
  if(id&&f.path)showPreview(f);
}
function showPreview(f){
  supabase.storage.from('dateien').createSignedUrl(f.path,3600).then(function(r){
    var pv=$('#pv');if(!pv)return;
    if(r.error||!r.data){pv.innerHTML='<div class="empty">Datei nicht erreichbar.</div>';return;}
    var u=r.data.signedUrl,ct=f.ct||'';
    pv.innerHTML=/^image\//.test(ct)?'<img src="'+u+'" alt="'+esc(f.title)+'">':(ct==='application/pdf'?'<iframe src="'+u+'" title="'+esc(f.title)+'"></iframe>':'<div class="empty">Keine Vorschau für diesen Dateityp.</div>');
    var l=$('#pvl');if(l)l.innerHTML='<a class="btn" href="'+u+'" target="_blank" rel="noopener">Öffnen oder herunterladen</a>';
  });
}
function semForm(id){
  var s=id?S.semesters.filter(function(x){return x.id===id;})[0]:{name:''};
  modal(id?'Semester umbenennen':'Neues Semester',fld('Name','name','text',s.name,'required placeholder="z. B. Sommersemester 2027"'),function(fd){
    var n=fd.get('name').trim();if(!n)return false;
    if(id){s.name=n;}else{var o={id:uid(),name:n};S.semesters.push(o);S.semId=o.id;}
    touch();paintNav();render();});
}
function newMenu(){
  modal('Neu anlegen','<div class="list">'+[['newtask','Abgabe','check'],['newslot','Termin im Stundenplan','cal'],['newfile','Datei oder Notiz','folder'],['newmod','Modul','layers']].map(function(x){return '<button type="button" class="item" data-act="'+x[0]+'" data-close>'+ic(x[2])+'<span class="grow t">'+x[1]+'</span></button>';}).join('')+'</div>',null,{nofocus:true});
  $('.sh-f').style.display='none';
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click',function(e){
  var c=e.target.closest('[data-close]');
  if(c&&c.closest('#modal')){var a0=c.dataset.act;closeModal();if(a0)act(a0,c.dataset);return;}
  if(e.target.id==='modal'){closeModal();return;}
  var g=e.target.closest('[data-go]');
  if(g){if(g.dataset.go==='new'){newMenu();return;}go(g.dataset.go);return;}
  var a=e.target.closest('[data-act]');
  if(a&&a.dataset.act==='eye'){var i=a.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password';return;}
  if(a)act(a.dataset.act,a.dataset);
});
function act(a,d){
  switch(a){
   case 'newslot':slotForm();break;case 'editslot':slotForm(d.id);break;
   case 'newtask':taskForm();break;case 'edittask':taskForm(d.id);break;
   case 'newmod':modForm();break;case 'editmod':modForm(d.id);break;
   case 'newfile':fileForm();break;case 'openfile':fileForm(d.id);break;
   case 'newsem':semForm();break;case 'editsem':semForm(d.id);break;
   case 'toggletask':var t=S.tasks.filter(function(x){return x.id===d.id;})[0];t.status=isOpen(t)?'abgegeben':'offen';touch();render();break;
   case 'tfilter':taskF=d.f;render();break;
   case 'wprev':planWeek--;render();break;case 'wnext':planWeek++;render();break;case 'wnow':planWeek=0;render();break;
   case 'planday':planDay=+d.i;render();break;
   case 'calprev':calM=new Date(calM.getFullYear(),calM.getMonth()-1,1);render();break;
   case 'calnext':calM=new Date(calM.getFullYear(),calM.getMonth()+1,1);render();break;
   case 'deltype':S.types=S.types.filter(function(x){return x!==d.t;});touch();render();break;
   case 'logout':supabase.auth.signOut();break;
   case 'newpw':pwForm();break;
   case 'auth':showAuth(d.m);break;
   case 'cleardemo':
     S.modules=S.modules.filter(function(x){return !x.demo;});S.slots=S.slots.filter(function(x){return !x.demo;});S.tasks=S.tasks.filter(function(x){return !x.demo;});S.demo=false;touch();render();toast('Beispieldaten entfernt');break;
  }
}
document.addEventListener('input',function(e){
  if(e.target.id==='fq'){fileF.q=e.target.value;var p=e.target.selectionStart;render();var n=$('#fq');n.focus();try{n.setSelectionRange(p,p);}catch(x){}}
});
document.addEventListener('change',function(e){
  if(e.target.id==='fmod'){fileF.mod=e.target.value;render();}
  if(e.target.id==='ftag'){fileF.tag=e.target.value;render();}
  if(e.target.id==='semsel'||e.target.id==='semsel2'){S.semId=e.target.value;touch();paintNav();render(true);}
});
document.addEventListener('submit',function(e){
  if(e.target.id==='typeform'){e.preventDefault();var v=$('#newtype').value.trim();if(v&&S.types.indexOf(v)<0){S.types.push(v);touch();render();}}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#modal').hidden)closeModal();});
$('#bnew').innerHTML=ic('plus2')+' Neu';$('#bnew').addEventListener('click',newMenu);
$('#bprof').addEventListener('click',function(){go('profil');});
$('#bsearch').innerHTML=ic('search');$('#bsearch').addEventListener('click',function(){go('wissen');setTimeout(function(){var q=$('#fq');if(q)q.focus();},0);});
$('#btheme').innerHTML=ic('sun');
$('#btheme').addEventListener('click',function(){var r=document.documentElement,n=r.dataset.theme==='light'?'dark':'light';r.dataset.theme=n;try{localStorage.setItem(LST,n);}catch(e){}});
try{var th=localStorage.getItem(LST);if(th)document.documentElement.dataset.theme=th;}catch(e){}

/* ---------- Start ---------- */
S=emptyState();
var h=(location.hash||'').replace('#','');if(NAV.some(function(n){return n[0]===h;})||h==='profil')view=h;
paintNav();
if(!configured){showAuth('config');}
else{
  supabase.auth.onAuthStateChange(function(ev,session){
    setTimeout(function(){
      if(ev==='PASSWORD_RECOVERY'){recovering=true;showAuth('recover');return;}
      if(session){if(!recovering&&(!user||user.id!==session.user.id))startSession(session.user);}
      else{stopSession();showAuth('login');}
    },0);
  });
}
