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
 mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
 link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>',
 exam:'<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>',
 cards:'<rect x="3" y="7" width="14" height="13" rx="2.5"/><path d="M7 3.5h12a2 2 0 012 2V16"/>',
 grad:'<path d="M12 4L2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 note:'<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
 dots:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
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
var S=null, view='start', planWeek=0, planDay=-1, calM=null, taskF='alle', fileF={mod:'',tag:'',q:''};
var user=null, P={name:'',study:'',accent:'#ff6b2c'}, channel=null, recovering=false, saveTimer=null, writing=false, syncState='lokal';

function emptyState(){
  return {v:1,updated:0,demo:false,semId:'sem1',types:['Vorlesung','Übung','Kolloquium'],
    semesters:[{id:'sem1',name:'Mein erstes Semester'}],modules:[],slots:[],tasks:[],files:[],contacts:[],exams:[],cards:[],sessions:[],notes:[],events:[],settings:{ects:180,perSem:30,grade:2,focus:25,brk:5}};
}
function loadLocal(){try{var r=localStorage.getItem(LS);if(r){var o=JSON.parse(r);if(o&&o.semesters)return ensureState(o);}}catch(e){}return null;}
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
  S=ensureState(d);ensureSem();
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
function mods(){return S.modules.filter(function(m){return inSem(m,S.semId);});}
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
var NAV=[['start','Start','home'],['plan','Stundenplan','cal'],['abgaben','Abgaben','check'],['pruefungen','Prüfungen','exam'],['lernen','Lernen','cards'],['wissen','Wissen','folder']];
var VIEWS=['start','plan','abgaben','pruefungen','lernen','wissen','noten','planung','module','kontakte','profil'];
function go(v){closeModal();view=v;try{history.replaceState(null,'','#'+v);}catch(e){}paintNav();render(true);window.scrollTo(0,0);}
function paintNav(){
  var inMain=NAV.some(function(n){return n[0]===view;});
  $('#links').innerHTML=NAV.map(function(n){return '<button data-go="'+n[0]+'"'+(view===n[0]?' aria-current="page"':'')+'>'+n[1]+'</button>';}).join('')+'<button data-act="more"'+(inMain?'':' aria-current="page"')+'>Mehr</button>';
  var t=[['start','Start','home'],['plan','Stundenplan','cal'],['new','Neu','plus'],['lernen','Lernen','cards'],['more','Mehr','dots']];
  $('#tabs').innerHTML=t.map(function(n){
    var cur=n[0]==='more'?(['start','plan','lernen'].indexOf(view)<0):view===n[0];
    var at=n[0]==='more'?'data-act="more"':'data-go="'+n[0]+'"';
    return '<button '+at+(cur?' aria-current="page"':'')+' aria-label="'+n[1]+'">'+ic(n[2])+'<span>'+n[1]+'</span></button>';}).join('');
  var opts=S.semesters.map(function(s){return '<option value="'+s.id+'"'+(s.id===S.semId?' selected':'')+'>'+esc(s.name)+'</option>';}).join('');
  $('#semsel').innerHTML=opts;$('#semsel2').innerHTML=opts;paintAvatar();
}

/* ---------- Views ---------- */
function render(anim){
  var v=$('#view');
  var html=({start:vStart,plan:vPlan,abgaben:vTasks,wissen:vFiles,module:vMods,profil:vProfile,noten:vNoten,planung:vPlanung,kontakte:vContacts,pruefungen:vExams,lernen:vLernen})[view]();
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

  var todayList=todayRows(now,nowMin);

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
  remH+=examRemind(now);

  return '<div class="ph"><div><h1>'+g+(P.name?', '+esc(P.name.split(' ')[0]):'')+'</h1><p>'+now.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})+' · KW '+isoWeek(now)+' · '+esc(sem?sem.name:'')+(P.study?' · '+esc(P.study):'')+'</p></div></div>'+
   '<div class="dash"><div class="col">'+(remH?'<div class="list">'+remH+'</div>':'')+stats+stats2()+
   '<div class="two"><div class="card"><h3>Fristen pro Woche <small>nächste 8 Wochen</small></h3>'+chart(all)+'<div class="legend"><span>offen</span><span class="g">abgegeben</span></div></div>'+feature+'</div>'+
   '<div class="card"><h3>Heute <button class="btn sm ghost" data-go="plan">Zum Plan</button></h3><div class="list">'+todayList+'</div></div></div>'+
   '<aside class="col"><div class="card">'+calendar(all)+'</div>'+dayCard()+'<div class="card"><h3>Anstehende Abgaben <button class="btn sm ghost" data-go="abgaben">Alle</button></h3><div class="list">'+
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
  var tabs=tabsHtml([['dateien','Dateien'],['notizen','Notizen']],wissenTab,'wtab');if(wissenTab==='notizen')return vNotes(tabs);
  var all=files(),tg={};all.forEach(function(f){(f.tags||[]).forEach(function(t){tg[t]=1;});});
  var q=fileF.q.toLowerCase();
  var f=all.filter(function(x){return (!fileF.mod||x.mod===fileF.mod)&&(!fileF.tag||(x.tags||[]).indexOf(fileF.tag)>-1)&&(!q||(x.title+' '+(x.note||'')+' '+(x.tags||[]).join(' ')+' '+(x.name||'')).toLowerCase().indexOf(q)>-1);}).sort(function(a,b){return (b.added||0)-(a.added||0);});
  var cards=f.map(function(x){var m=modById(x.mod),t=ftype(x);
    return '<button class="card fcard" data-act="openfile" data-id="'+x.id+'"><div class="ftype" style="background:'+t[1]+'">'+t[0]+'</div><div class="t">'+esc(x.title)+'</div>'+(m?'<div class="s hint"><span class="dot" style="display:inline-block;background:'+m.color+';margin-right:5px"></span>'+esc(m.short)+'</div>':'')+(x.note?'<div class="n">'+esc(x.note)+'</div>':'')+'<div class="tags">'+(x.tags||[]).map(function(g){return '<span class="pill">'+esc(g)+'</span>';}).join('')+'</div></button>';}).join('');
  return '<div class="ph"><div><h1>Wissen</h1><p>Skripte, Folien und Notizen, verknüpft mit Modul und Veranstaltung.</p></div><div class="acts"><button class="btn pri" data-act="newfile">'+ic('up')+' Hinzufügen</button></div></div>'+
   tabs+'<div class="filters"><input class="fi" id="fq" type="search" placeholder="Suchen in Titel, Notizen, Tags" value="'+esc(fileF.q)+'" style="max-width:320px"><select class="fi" id="fmod" style="max-width:220px"><option value="">Alle Module</option>'+mods().map(function(m){return '<option value="'+m.id+'"'+(fileF.mod===m.id?' selected':'')+'>'+esc(m.short)+' · '+esc(m.name)+'</option>';}).join('')+'</select><select class="fi" id="ftag" style="max-width:180px"><option value="">Alle Tags</option>'+Object.keys(tg).sort().map(function(t){return '<option'+(fileF.tag===t?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select></div>'+
   (cards?'<div class="fgrid">'+cards+'</div>':'<div class="card empty">Noch keine Einträge. Lade ein PDF hoch oder schreib eine Notiz.</div>');
}

function vMods(){
  var cards=mods().map(function(m){var ns=S.slots.filter(function(s){return s.mod===m.id;}).length,nt=S.tasks.filter(function(t){return t.mod===m.id;}).length,nf=S.files.filter(function(f){return f.mod===m.id;}).length;
    return '<div class="card mcard"><div class="bar" style="background:'+m.color+'"></div><div><span class="pill">'+esc(m.short)+'</span></div><h3>'+esc(m.name)+'</h3><div class="hint">'+(m.kind==='ku'?'Kolloquium + Übung':'Vorlesung + Übung')+(m.ects?' · '+m.ects+' ECTS':'')+(m.sem2?' · über 2 Semester':'')+'</div>'+(profName(m)?'<div class="cline">'+ic('user')+esc(profName(m))+'</div>':'')+'<div class="row"><span class="pill '+pillFor(modStatus(m))+'">'+modStatus(m)+'</span>'+(hasGrade(m)?'<span class="pill">Note '+fmtGrade(m.grade)+'</span>':'')+'</div><div class="row"><span class="pill">'+ns+' Termine</span><span class="pill">'+nt+' Abgaben</span><span class="pill">'+nf+' Dateien</span></div><div class="row"><button class="btn sm" data-act="editmod" data-id="'+m.id+'">Bearbeiten</button></div></div>';}).join('');
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
  S=ensureState(loadLocal()||emptyState());ensureSem();
  P=loadProfileLocal();applyAccent(P.accent);tLoad();
  hideAuth();paintNav();render(true);
  setSync(navigator.onLine?'speichert':'offline');
  pull();fetchProfile();subscribe();
}
function stopSession(){
  var had=!!user;
  if(channel&&supabase){supabase.removeChannel(channel);channel=null;}
  user=null;LS='studium:anon';S=emptyState();T.running=false;cardSession=null;deckMod='';document.title='Studium';P={name:'',study:'',accent:'#ff6b2c'};applyAccent(P.accent);
  closeModal();
  if(had){view='start';try{history.replaceState(null,'','#start');}catch(e){}}
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
function fileForm(id,page){
  var f=id?S.files.filter(function(x){return x.id===id;})[0]:{title:'',mod:fileF.mod||'',slot:'',tags:[],note:''};
  var so=[['','–']].concat(slots().map(function(s){return [s.id,slotLabel(s)+' ('+DS[s.day]+')'];}));
  var upl=!id?'<label class="fl">Datei (PDF, Folien, Foto, optional)<input class="fi" type="file" name="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"></label>':'';
  var prev='';
  if(id&&f.path)prev='<div class="preview" id="pv"><div class="empty">Lädt …</div></div><div id="pvl"></div>';

  modal(id?'Eintrag':'Neuer Eintrag',
   prev+fld('Titel','title','text',f.title,'required')+'<div class="frow">'+sel('Modul','mod',[['','– ohne –']].concat(modOpts()),f.mod)+sel('Verknüpft mit','slot',so,f.slot)+'</div>'+fld('Tags (Komma getrennt)','tags','text',(f.tags||[]).join(', '))+'<label class="fl">Notizen<textarea class="fi" name="note">'+esc(f.note||'')+'</textarea></label>'+upl+(id?fileNotes(id):''),
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
  if(id&&f.path)showPreview(f,page);
}
function showPreview(f,page){
  supabase.storage.from('dateien').createSignedUrl(f.path,3600).then(function(r){
    var pv=$('#pv');if(!pv)return;
    if(r.error||!r.data){pv.innerHTML='<div class="empty">Datei nicht erreichbar.</div>';return;}
    var u=r.data.signedUrl,ct=f.ct||'';
    pv.innerHTML=/^image\//.test(ct)?'<img src="'+u+'" alt="'+esc(f.title)+'">':(ct==='application/pdf'?'<iframe src="'+u+(page?'#page='+page:'')+'" title="'+esc(f.title)+'"></iframe>':'<div class="empty">Keine Vorschau für diesen Dateityp.</div>');
    var l=$('#pvl');if(l)l.innerHTML='<a class="btn" href="'+u+'" target="_blank" rel="noopener">Öffnen oder herunterladen</a>';
  });
}
/* ======================================================================
   Ausbau: Kontakte, Noten und ECTS, Planung, Prüfungen, Lernen, Notizen
   ====================================================================== */
var STATUS_M=[['laufend','laufend'],['geplant','geplant'],['bestanden','bestanden']];
var EXAM_KINDS=['Klausur','Mündliche Prüfung','Projekt','Kolloquium','Sonstige'];
var CTYPES=[['dozent','Dozent'],['gruppe','Lerngruppe'],['sonst','Sonstige']];
var BOX_DAYS=[0,1,3,7,16,35];
var wissenTab='dateien', lernTab='karten', deckMod='', cardSession=null, contactF='alle';
var T={mode:'focus',running:false,endAt:0,left:25*60000,full:25*60000,mod:'',begin:0,rounds:0};
var LSTM='studium:timer';

/* ---------- Daten-Helfer ---------- */
function ensureState(o){
  ['modules','slots','tasks','files','contacts','exams','cards','sessions','notes','events'].forEach(function(k){if(!Array.isArray(o[k]))o[k]=[];});
  if(!o.settings||typeof o.settings!=='object')o.settings={};
  var s=o.settings;
  if(!(+s.ects>0))s.ects=180;
  if(!(+s.perSem>0))s.perSem=30;
  if(!(+s.grade>0))s.grade=2;
  if(!(+s.focus>0))s.focus=25;
  if(!(+s.brk>0))s.brk=5;
  return o;
}
function todayStr(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function contactById(id){return S.contacts.filter(function(c){return c.id===id;})[0];}
function fileById(id){return S.files.filter(function(f){return f.id===id;})[0];}
function cardById(id){return S.cards.filter(function(c){return c.id===id;})[0];}
function profName(m){var c=m&&m.prof?contactById(m.prof):null;return c?c.name:'';}
function modStatus(m){return m.status||'laufend';}
function modEcts(m){return +m.ects||0;}
function modWeight(m){return (m.weight===''||m.weight==null)?modEcts(m):(+m.weight||0);}
function hasGrade(m){return m.grade!=null&&m.grade!==''&&!isNaN(+m.grade);}
function fmtGrade(g){return (g==null||g===''||isNaN(+g))?'–':(+g).toFixed(1).replace('.',',');}
function fmtNum(n){return String(Math.round(n*10)/10).replace('.',',');}
function fmtMin(min){min=Math.round(min);var h=Math.floor(min/60),m=min%60;return h?(h+' h'+(m?' '+m+' min':'')):m+' min';}
function fmtClock(ms){var s=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(s/60);return pad(m)+':'+pad(s%60);}
function pillFor(st){return st==='bestanden'?'good':(st==='geplant'?'':'acc');}
function tabsHtml(items,cur,act){return '<div class="chips">'+items.map(function(i){return '<button class="chip" data-act="'+act+'" data-t="'+i[0]+'" aria-pressed="'+(cur===i[0])+'">'+i[1]+'</button>';}).join('')+'</div>';}
function semName(id){var s=S.semesters.filter(function(x){return x.id===id;})[0];return s?s.name:'';}

function gradeStats(){
  var r={ects:0,w:0,gw:0,planned:0,running:0};
  S.modules.forEach(function(m){
    var e=modEcts(m),st=modStatus(m);
    if(st==='bestanden'){r.ects+=e;if(hasGrade(m)){var wt=modWeight(m);r.w+=wt;r.gw+=wt*(+m.grade);}}
    else if(st==='geplant')r.planned+=e;else r.running+=e;
  });
  r.avg=r.w?r.gw/r.w:null;
  return r;
}
function semSums(semId){
  var r={done:0,run:0,plan:0};
  S.modules.forEach(function(m){if(!inSem(m,semId))return;var e=modEcts(m)*(m.sem2?0.5:1),st=modStatus(m);if(st==='bestanden')r.done+=e;else if(st==='geplant')r.plan+=e;else r.run+=e;});
  return r;
}
function stackHtml(done,run,plan,total){
  total=Math.max(total,done+run+plan,1);
  function w(x){return (x/total*100).toFixed(2)+'%';}
  return '<div class="stack" role="img" aria-label="'+fmtNum(done)+' bestanden, '+fmtNum(run)+' laufend, '+fmtNum(plan)+' geplant"><i class="s-done" style="width:'+w(done)+'"></i><i class="s-run" style="width:'+w(run)+'"></i><i class="s-plan" style="width:'+w(plan)+'"></i></div>';
}

/* ---------- Noten und ECTS ---------- */
function calcDefaultR(st){
  var r=0;S.modules.forEach(function(m){if(modStatus(m)!=='bestanden')r+=modWeight(m);});
  if(r<=0)r=Math.max(0,(S.settings.ects||180)-st.w);
  return r;
}
function calcNeed(X,R,st){return (X*(st.w+R)-st.gw)/R;}
function calcText(X,R){
  var st=gradeStats();
  if(!(X>=1&&X<=5))return 'Gib einen Wunsch-Schnitt zwischen 1,0 und 4,0 ein.';
  if(!(R>0))return 'Es sind keine gewichteten ECTS mehr offen. Dein aktueller Schnitt ist '+fmtGrade(st.avg)+'.';
  var need=calcNeed(X,R,st),best=(st.gw+R)/(st.w+R),head;
  if(need<1)head='<b>Schnitt '+fmtGrade(X)+' ist nicht mehr erreichbar.</b> Mit lauter 1,0 wären noch '+fmtGrade(best)+' möglich.';
  else if(need>4)head='<b>Schnitt '+fmtGrade(X)+' ist sicher.</b> Es reicht, die restlichen '+fmtNum(R)+' ECTS zu bestehen.';
  else head='Du brauchst im Schnitt <b>'+fmtGrade(need)+'</b> in den restlichen '+fmtNum(R)+' ECTS.';
  var rows=[1.5,2,2.5,3].map(function(x){var n=calcNeed(x,R,st);return '<div class="crow"><span>Schnitt '+fmtGrade(x)+'</span><b>'+(n<1?'nicht erreichbar':(n>4?'sicher':'Ø '+fmtGrade(n)+' nötig'))+'</b></div>';}).join('');
  return head+'<div class="cmp">'+rows+'</div>';
}
function vNoten(){
  var st=gradeStats(),Tg=S.settings.ects||180,per=S.settings.perSem||30;
  var left=Math.max(0,Tg-st.ects-st.running-st.planned);
  var rowsSem=S.semesters.map(function(s){var q=semSums(s.id),n=q.done+q.run+q.plan;
    return '<div class="srow"><div class="sl"><span>'+esc(s.name)+(s.id===S.semId?' <span class="pill acc">aktiv</span>':'')+'</span><span class="hint">'+fmtNum(q.done)+' von '+fmtNum(n)+' ECTS bestanden</span></div>'+stackHtml(q.done,q.run,q.plan,per)+'</div>';}).join('');
  var graded=S.modules.filter(function(m){return modStatus(m)==='bestanden'&&hasGrade(m);}).sort(function(a,b){return a.grade-b.grade;});
  var gl=graded.length?graded.map(function(m){return '<button class="item" data-act="editmod" data-id="'+m.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(m.name)+'</div><div class="s">'+fmtNum(modEcts(m))+' ECTS · Gewicht '+fmtNum(modWeight(m))+' · '+esc(semLabel(m))+'</div></span><span class="pill good">'+fmtGrade(m.grade)+'</span></button>';}).join(''):'<div class="empty">Noch keine benoteten Module. Setze bei einem Modul den Status „bestanden“ und trage die Note ein.</div>';
  var X=S.settings.grade||2,R=calcDefaultR(st);
  return '<div class="ph"><div><h1>Noten und ECTS</h1><p>Fortschritt bis zum Abschluss und Notenschnitt mit Gewichtung.</p></div><div class="acts"><button class="btn" data-go="module">Module bearbeiten</button></div></div>'+
   '<div class="ngrid"><div class="col">'+
   '<div class="card"><h3>ECTS bis zum Abschluss <small>Ziel '+Tg+'</small></h3><div class="bignum"><span>'+fmtNum(st.ects)+'</span><small>von '+Tg+' ECTS bestanden</small></div>'+stackHtml(st.ects,st.running,st.planned,Tg)+
   '<div class="legend"><span class="g">bestanden</span><span>laufend</span><span class="n">geplant</span></div><p class="hint" style="margin:10px 0 0">Noch nicht verplant: '+fmtNum(left)+' ECTS.</p></div>'+
   '<div class="card"><h3>Pro Semester <small>Richtwert '+per+' ECTS</small></h3><div class="list">'+rowsSem+'</div></div>'+
   '<div class="card"><h3>Benotete Module <small>Schnitt '+fmtGrade(st.avg)+'</small></h3><div class="list">'+gl+'</div></div></div>'+
   '<div class="col"><div class="card"><h3>Was brauche ich noch?</h3><div class="calc"><div class="frow"><label class="fl">Wunsch-Schnitt<input class="fi" id="calcX" type="number" inputmode="decimal" step="0.1" min="1" max="4" value="'+X+'"></label><label class="fl">Restliche ECTS (gewichtet)<input class="fi" id="calcR" type="number" inputmode="decimal" step="0.5" min="0" value="'+R+'"></label></div><div class="calc-res" id="calcres" aria-live="polite">'+calcText(X,R)+'</div><p class="hint" style="margin:0">Der Wert für die restlichen ECTS ist die Summe aller Module, die noch nicht bestanden sind. Du kannst ihn ändern.</p></div></div>'+
   '<div class="card"><h3>Einstellungen</h3><div class="frow"><label class="fl">ECTS bis zum Abschluss<input class="fi" id="setEcts" type="number" inputmode="numeric" min="1" value="'+Tg+'"></label><label class="fl">ECTS pro Semester<input class="fi" id="setPer" type="number" inputmode="numeric" min="1" value="'+per+'"></label></div></div></div></div>';
}

/* ---------- Semesterplanung ---------- */
function vPlanung(){
  var st=gradeStats(),Tg=S.settings.ects||180,per=S.settings.perSem||30,used=st.ects+st.running+st.planned,left=Math.max(0,Tg-used);
  var need=left?Math.ceil(left/per):0;
  var cards=S.semesters.map(function(s){
    var q=semSums(s.id),mm=S.modules.filter(function(m){return inSem(m,s.id);});
    var range=(s.start||s.end)?'<div class="hint">'+(s.start?new Date(s.start).toLocaleDateString('de-DE'):'')+' bis '+(s.end?new Date(s.end).toLocaleDateString('de-DE'):'')+'</div>':'';
    return '<div class="card sem"><h3><span>'+esc(s.name)+(s.id===S.semId?' <span class="pill acc">aktiv</span>':'')+'</span><button class="btn sm ghost" data-act="editsem" data-id="'+s.id+'">Bearbeiten</button></h3>'+range+
     '<div class="srow" style="margin:10px 0 12px"><div class="sl"><span class="hint">'+fmtNum(q.done+q.run+q.plan)+' von '+per+' ECTS</span></div>'+stackHtml(q.done,q.run,q.plan,per)+'</div>'+
     '<div class="list">'+(mm.length?mm.map(function(m){return '<button class="item" data-act="editmod" data-id="'+m.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(m.name)+'</div><div class="s">'+fmtNum(modEcts(m))+' ECTS'+(m.sem2?' · Teil '+(m.sem===s.id?1:2)+' von 2':'')+(profName(m)?' · '+esc(profName(m)):'')+'</div></span><span class="pill '+pillFor(modStatus(m))+'">'+modStatus(m)+'</span></button>';}).join(''):'<div class="empty">Noch keine Module.</div>')+'</div>'+
     '<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="newmodsem" data-sem="'+s.id+'">'+ic('plus2')+' Modul</button>'+(s.id===S.semId?'':'<button class="btn sm" data-act="setsem" data-id="'+s.id+'">Als aktiv setzen</button>')+'</div></div>';}).join('');
  return '<div class="ph"><div><h1>Semesterplanung</h1><p>Verteile deine Module auf die Semester und behalte die ECTS im Blick.</p></div><div class="acts"><button class="btn pri" data-act="newsem">'+ic('plus2')+' Semester</button></div></div>'+
   '<div class="card" style="margin-bottom:18px"><h3>Bis zum Abschluss <small>Ziel '+Tg+' ECTS</small></h3>'+stackHtml(st.ects,st.running,st.planned,Tg)+
   '<div class="legend"><span class="g">bestanden</span><span>laufend</span><span class="n">geplant</span></div><p class="hint" style="margin:10px 0 0">'+(left?'Noch nicht verplant: '+fmtNum(left)+' ECTS. Bei '+per+' ECTS pro Semester sind das etwa '+need+' weitere Semester.':'Alle ECTS bis zum Abschluss sind verplant.')+'</p></div>'+
   '<div class="sgrid">'+cards+'</div>';
}
function semForm(id){
  var s=id?S.semesters.filter(function(x){return x.id===id;})[0]:{name:'',start:'',end:''};
  var nm=S.modules.filter(function(m){return inSem(m,id);}).length;
  modal(id?'Semester bearbeiten':'Neues Semester',fld('Name','name','text',s.name,'required placeholder="z. B. Sommersemester 2027"')+'<div class="frow">'+fld('Beginn','start','date',s.start||'')+fld('Ende','end','date',s.end||'')+'</div>',function(fd){
    var n=fd.get('name').trim();if(!n)return false;
    if(id){s.name=n;s.start=fd.get('start')||'';s.end=fd.get('end')||'';}
    else{var o={id:uid(),name:n,start:fd.get('start')||'',end:fd.get('end')||''};S.semesters.push(o);S.semId=o.id;}
    touch();paintNav();render();},
   (id&&S.semesters.length>1&&!nm)?{del:function(){S.semesters=S.semesters.filter(function(x){return x.id!==id;});ensureSem();touch();paintNav();render();}}:{});
}

/* ---------- Kontakte ---------- */
function normUrl(u){u=String(u||'').trim();if(!u)return '';return /^https?:\/\//i.test(u)?u:'https://'+u;}
function vContacts(){
  var ctn=S.contacts.slice().sort(function(a,b){return a.name.localeCompare(b.name,'de');});
  var f=ctn.filter(function(c){return contactF==='alle'||c.type===contactF;});
  var chips=[['alle','Alle'],['dozent','Dozenten'],['gruppe','Lerngruppen'],['sonst','Sonstige']].map(function(c){return '<button class="chip" data-act="cfilter" data-f="'+c[0]+'" aria-pressed="'+(contactF===c[0])+'">'+c[1]+'</button>';}).join('');
  var cards=f.map(function(c){
    var tn=CTYPES.filter(function(t){return t[0]===c.type;})[0];
    var ms=c.type==='dozent'?S.modules.filter(function(m){return m.prof===c.id;}):(c.mod&&modById(c.mod)?[modById(c.mod)]:[]);
    var lines='';
    if(c.email)lines+='<div class="cline">'+ic('mail')+'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a></div>';
    if(c.phone)lines+='<div class="cline">'+ic('phone')+'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">'+esc(c.phone)+'</a></div>';
    if(c.room)lines+='<div class="cline">'+ic('pin')+esc(c.room)+'</div>';
    if(c.hours)lines+='<div class="cline">'+ic('clock')+esc(c.hours)+'</div>';
    if(c.link)lines+='<div class="cline">'+ic('link')+'<a href="'+esc(normUrl(c.link))+'" target="_blank" rel="noopener">'+esc(c.link.replace(/^https?:\/\//i,''))+'</a></div>';
    return '<div class="card ccard"><div class="chead"><div class="cav" style="background:'+(ms[0]?ms[0].color:'var(--accent)')+'">'+esc(c.name.trim().split(/\s+/).slice(-2).map(function(w){return w[0]||'';}).join('').toUpperCase()||'?')+'</div><div class="grow"><div class="t" style="font-weight:700">'+esc(c.name)+'</div><span class="pill">'+(tn?tn[1]:'Sonstige')+'</span></div><button class="btn sm ghost" data-act="editcontact" data-id="'+c.id+'">Bearbeiten</button></div>'+
      (ms.length?'<div class="tags">'+ms.map(function(m){return '<span class="pill" style="background:color-mix(in srgb,'+m.color+' 22%,transparent)">'+esc(m.short)+' · '+esc(m.name)+'</span>';}).join('')+'</div>':'')+lines+(c.note?'<div class="cnote">'+esc(c.note)+'</div>':'')+'</div>';}).join('');
  return '<div class="ph"><div><h1>Kontakte</h1><p>Dozenten und Lerngruppen mit Kontaktdaten. Dozenten wählst du beim Modul aus.</p></div><div class="acts"><button class="btn pri" data-act="newcontact">'+ic('plus2')+' Kontakt</button></div></div>'+
   '<div class="chips">'+chips+'</div>'+(cards?'<div class="mgrid">'+cards+'</div>':'<div class="card empty">Noch keine Kontakte in dieser Ansicht. Lege einen Dozenten an, dann kannst du ihn beim Modul auswählen.</div>');
}
function contactForm(id,pre){
  var c=id?contactById(id):{type:(pre&&pre.type)||'dozent',name:'',email:'',phone:'',room:'',hours:'',link:'',mod:'',note:''};
  modal(id?'Kontakt bearbeiten':'Neuer Kontakt',
   sel('Art','type',CTYPES,c.type)+fld('Name','name','text',c.name,'required maxlength="80" placeholder="z. B. Prof. Dr. Müller"')+
   '<div class="frow">'+fld('E-Mail','email','email',c.email,'autocomplete="off"')+fld('Telefon','phone','tel',c.phone,'autocomplete="off"')+'</div>'+
   '<div class="frow">'+fld('Büro oder Raum','room','text',c.room||'')+fld('Sprechzeit','hours','text',c.hours||'','placeholder="z. B. Di 14 bis 15 Uhr"')+'</div>'+
   fld('Link (z. B. Chat-Gruppe, Webseite)','link','text',c.link||'')+
   sel('Modul (optional, für Lerngruppen)','mod',[['','– keins –']].concat(S.modules.map(function(m){return [m.id,m.short+' · '+m.name];})),c.mod||'')+
   '<label class="fl">Notizen (bei Lerngruppen: Mitglieder und Treffzeiten)<textarea class="fi" name="note">'+esc(c.note||'')+'</textarea></label>',
   function(fd){
     var o={id:id||uid(),type:fd.get('type'),name:fd.get('name').trim(),email:fd.get('email').trim(),phone:fd.get('phone').trim(),room:fd.get('room').trim(),hours:fd.get('hours').trim(),link:fd.get('link').trim(),mod:fd.get('mod'),note:fd.get('note')};
     if(!o.name)return false;
     if(id)S.contacts=S.contacts.map(function(x){return x.id===id?o:x;});else S.contacts.push(o);touch();render();},
   id?{del:function(){S.contacts=S.contacts.filter(function(x){return x.id!==id;});S.modules.forEach(function(m){if(m.prof===id)m.prof='';});touch();render();}}:{});
}

/* ---------- Module ---------- */
function modForm(id,semPre){
  var m=id?modById(id):{name:'',short:'',color:COLORS[S.modules.length%COLORS.length],kind:'vu',sem:semPre||S.semId,ects:'',weight:'',status:'laufend',grade:null,prof:''};
  var profs=S.contacts.filter(function(c){return c.type==='dozent';}).sort(function(a,b){return a.name.localeCompare(b.name,'de');});
  modal(id?'Modul bearbeiten':'Neues Modul',
   fld('Name','name','text',m.name,'required')+'<div class="frow">'+fld('Kürzel','short','text',m.short,'required maxlength="6" placeholder="z. B. AN1"')+sel('Semester','sem',S.semesters.map(function(s){return [s.id,s.name];}),m.sem)+'</div>'+
   '<div class="frow">'+sel('Aufbau','kind',[['vu','Vorlesung + Übung'],['ku','Kolloquium + Übung']],m.kind)+sel('Läuft auch im Semester','sem2',[['','– nur ein Semester –']].concat(S.semesters.map(function(s){return [s.id,s.name];})),m.sem2||'')+'</div>'+
   '<div class="frow">'+sel('Dozent','prof',[['','– keiner –']].concat(profs.map(function(c){return [c.id,c.name];})),m.prof||'')+fld('Neuer Dozent','newprof','text','','placeholder="Name eintragen zum Anlegen" maxlength="80"')+'</div>'+
   '<div class="frow">'+fld('ECTS','ects','number',m.ects===''||m.ects==null?'':m.ects,'step="0.5" min="0" inputmode="decimal"')+fld('Gewichtung für den Schnitt','weight','number',m.weight===''||m.weight==null?'':m.weight,'step="0.5" min="0" inputmode="decimal" placeholder="leer = wie ECTS"')+'</div>'+
   '<div class="frow">'+sel('Status','status',STATUS_M,modStatus(m))+fld('Endnote (1,0 bis 5,0)','grade','number',hasGrade(m)?m.grade:'','step="0.1" min="1" max="5" inputmode="decimal"')+'</div>'+
   '<p class="hint" style="margin:-4px 0 0">Die Note zählt erst, wenn der Status „bestanden“ ist. Gewichtung 0 bedeutet unbenotet.</p>'+
   '<div class="fl">Farbe<div class="swatches">'+COLORS.map(function(c,i){return '<label><input type="radio" name="color" value="'+c+'"'+(c===m.color?' checked':'')+'><span style="background:'+c+'" title="Farbe '+(i+1)+'"></span></label>';}).join('')+'</div></div>',
   function(fd){
     var g=fd.get('grade');
     if(g!==''&&(+g<1||+g>5)){toast('Die Note muss zwischen 1,0 und 5,0 liegen.');return false;}
     var prof=fd.get('prof'),np=fd.get('newprof').trim();
     if(np){var ex=S.contacts.filter(function(c){return c.type==='dozent'&&c.name.toLowerCase()===np.toLowerCase();})[0];
       if(ex)prof=ex.id;else{var c={id:uid(),type:'dozent',name:np,email:'',phone:'',room:'',hours:'',link:'',mod:'',note:''};S.contacts.push(c);prof=c.id;}}
     var o={id:id||uid(),sem:fd.get('sem'),sem2:(fd.get('sem2')&&fd.get('sem2')!==fd.get('sem'))?fd.get('sem2'):'',name:fd.get('name').trim(),short:fd.get('short').trim(),color:fd.get('color')||COLORS[0],kind:fd.get('kind'),prof:prof,ects:fd.get('ects')===''?'':+fd.get('ects'),weight:fd.get('weight')===''?'':+fd.get('weight'),status:fd.get('status'),grade:g===''?null:+g};
     if(id)S.modules=S.modules.map(function(x){return x.id===id?o:x;});else S.modules.push(o);
     touch();render();paintNav();},
   id?{del:function(){S.modules=S.modules.filter(function(x){return x.id!==id;});S.slots=S.slots.filter(function(x){return x.mod!==id;});S.tasks=S.tasks.filter(function(x){return x.mod!==id;});S.exams=S.exams.filter(function(x){return x.mod!==id;});S.cards=S.cards.filter(function(x){return x.mod!==id;});S.sessions=S.sessions.filter(function(x){return x.mod!==id;});
     S.files.forEach(function(f){if(f.mod===id){f.mod='';f.slot='';}});S.notes.forEach(function(n){if(n.mod===id){n.mod='';n.slot='';}});S.contacts.forEach(function(c){if(c.mod===id)c.mod='';});touch();render();}}:{});
}

/* ---------- Prüfungen ---------- */
function vExams(){
  var now=new Date(),ids=modIds();
  var all=S.exams.filter(function(e){return ids.indexOf(e.mod)>-1;});
  var upcoming=function(e){return !e.date||new Date(e.date)>=now;};
  var open=all.filter(function(e){return !e.registered&&upcoming(e);}).sort(function(a,b){return String(a.regDeadline||a.date||'9').localeCompare(String(b.regDeadline||b.date||'9'));});
  var reg=all.filter(function(e){return e.registered&&upcoming(e);}).sort(function(a,b){return String(a.date||'9').localeCompare(String(b.date||'9'));});
  var past=all.filter(function(e){return !upcoming(e);}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  function row(e){
    var m=modById(e.mod),pills='';
    if(!e.registered&&e.regDeadline){var n=dayDiff(new Date(e.regDeadline),now);
      pills+=n<0?'<span class="pill bad">Frist verpasst</span>':(n===0?'<span class="pill bad">Anmeldung heute</span>':'<span class="pill '+(n<=7?'warn':'')+'">Anmelden bis '+new Date(e.regDeadline).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' (in '+n+' T.)</span>');}
    if(e.date&&upcoming(e)){var d=dayDiff(new Date(e.date),now);pills+='<span class="pill acc">'+(d===0?'heute':d===1?'morgen':'in '+d+' Tagen')+'</span>';}
    return '<div class="trow'+(e.registered?' done ex':'')+'"><button class="chk" data-act="toggleexam" data-id="'+e.id+'" aria-label="'+(e.registered?'Anmeldung zurücknehmen':'Als angemeldet markieren')+'">'+ic('tick')+'</button>'+
     '<button class="item" style="background:none;padding:0" data-act="editexam" data-id="'+e.id+'"><span class="grow"><div class="tt t" style="white-space:normal">'+esc(m.short)+' · '+esc(e.kind||'Prüfung')+'</div><div class="ts"><span>'+(e.date?fmtDT(new Date(e.date)):'Termin offen')+'</span>'+(e.room?'<span>'+esc(e.room)+'</span>':'')+'<span>'+esc(m.name)+'</span></div></span></button><div class="right">'+pills+'</div><span></span></div>';
  }
  function sect(t,l,empty){return '<h3 class="sh">'+t+'</h3><div class="list">'+(l.length?l.map(row).join(''):'<div class="card empty">'+empty+'</div>')+'</div>';}
  return '<div class="ph"><div><h1>Prüfungen</h1><p>Anmeldefristen, Termine und Räume. Hake ab, sobald du angemeldet bist.</p></div><div class="acts"><button class="btn pri" data-act="newexam">'+ic('plus2')+' Prüfung</button></div></div>'+
   sect('Anmeldung offen',open,'Nichts offen.')+sect('Angemeldet',reg,'Noch keine angemeldete Prüfung.')+(past.length?sect('Vergangen',past,''):'');
}
function examForm(id){
  if(!need())return;
  var e=id?S.exams.filter(function(x){return x.id===id;})[0]:{mod:mods()[0].id,kind:'Klausur',date:'',room:'',regDeadline:'',registered:false,note:''};
  modal(id?'Prüfung bearbeiten':'Neue Prüfung',
   sel('Modul','mod',modOpts(),e.mod)+'<div class="frow">'+sel('Art','kind',EXAM_KINDS.map(function(k){return [k,k];}),e.kind)+fld('Raum','room','text',e.room||'')+'</div>'+
   '<div class="frow">'+fld('Termin','date','datetime-local',e.date||'')+fld('Anmeldefrist','regDeadline','date',e.regDeadline||'')+'</div>'+
   '<label class="ckl"><input type="checkbox" name="registered"'+(e.registered?' checked':'')+'> Ich bin schon angemeldet</label>'+
   '<label class="fl">Notiz<textarea class="fi" name="note">'+esc(e.note||'')+'</textarea></label>',
   function(fd){var o={id:id||uid(),mod:fd.get('mod'),kind:fd.get('kind'),room:fd.get('room').trim(),date:fd.get('date'),regDeadline:fd.get('regDeadline'),registered:fd.get('registered')==='on',note:fd.get('note')};
     if(id)S.exams=S.exams.map(function(x){return x.id===id?o:x;});else S.exams.push(o);touch();render();},
   id?{del:function(){S.exams=S.exams.filter(function(x){return x.id!==id;});touch();render();}}:{});
}
function examRemind(now){
  return S.exams.filter(function(e){var m=modById(e.mod);if(!m||e.registered||!e.regDeadline)return false;var n=dayDiff(new Date(e.regDeadline),now);return n>=0&&n<=7;}).map(function(e){
    var m=modById(e.mod),n=dayDiff(new Date(e.regDeadline),now);
    return '<div class="remind">'+ic('check')+'<span class="grow" style="flex:1"><b>Prüfungsanmeldung '+esc(m.short)+' · '+esc(e.kind||'Prüfung')+'</b><div class="s" style="color:var(--muted)">Anmelden bis '+new Date(e.regDeadline).toLocaleDateString('de-DE')+' ('+(n===0?'heute':n===1?'morgen':'in '+n+' Tagen')+')</div></span></div>';}).join('');
}

/* ---------- Start: zweite Kennzahlen-Reihe ---------- */
function dueAll(){var ids=modIds(),t=todayStr();return S.cards.filter(function(c){return ids.indexOf(c.mod)>-1&&c.due<=t;});}
function minutesOn(dayStr){var t=0;S.sessions.forEach(function(s){if(todayStr(new Date(s.at))===dayStr)t+=s.min;});return t;}
function stats2(){
  var st=gradeStats(),Tg=S.settings.ects||180,due=dueAll().length,today=minutesOn(todayStr());
  return '<div class="stats">'+
   '<button class="card stat" data-go="noten"><div class="k"><span>ECTS</span></div><div class="v">'+Math.round(st.ects)+'<small>/ '+Tg+'</small></div><div class="viz"><div class="prog"><i style="width:'+Math.min(100,st.ects/Tg*100).toFixed(1)+'%"></i></div></div></button>'+
   '<button class="card stat" data-go="noten"><div class="k"><span>Notenschnitt</span></div><div class="v">'+fmtGrade(st.avg)+'</div><div class="viz"><div class="hint">'+(st.w?fmtNum(st.w)+' ECTS gewichtet':'noch keine Note')+'</div></div></button>'+
   '<button class="card stat" data-go="lernen"><div class="k"><span>Karten fällig</span></div><div class="v">'+due+'<small>heute</small></div><div class="viz"><div class="hint">'+(due?'Jetzt wiederholen':'alles gelernt')+'</div></div></button>'+
   '<button class="card stat" data-go="lernen" data-t="zeit"><div class="k"><span>Lernzeit heute</span></div><div class="v">'+today+'<small>min</small></div><div class="viz"><div class="hint">'+(T.running?(T.mode==='focus'?'Timer läuft':'Pause läuft'):'Timer starten')+'</div></div></button></div>';
}

/* ---------- Lernen ---------- */
function vLernen(){
  var tabs=tabsHtml([['karten','Karteikarten'],['zeit','Lernzeit']],lernTab,'ltab');
  if(lernTab==='zeit')return '<div class="ph"><div><h1>Lernzeit</h1><p>Pomodoro-Timer mit Zeiterfassung pro Modul.</p></div><div class="acts"><button class="btn" data-act="addsess">Zeit nachtragen</button></div></div>'+tabs+vTimer();
  return vKarten(tabs);
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function vKarten(tabs){
  if(cardSession)return vSession();
  if(deckMod&&modById(deckMod))return vDeck(tabs);
  var ms=mods(),due=dueAll().length,t=todayStr();
  var decks=ms.map(function(m){var cs=S.cards.filter(function(c){return c.mod===m.id;}),d=cs.filter(function(c){return c.due<=t;}).length,known=cs.filter(function(c){return c.box>=3;}).length;
    return '<div class="card mcard"><div class="bar" style="background:'+m.color+'"></div><h3 style="margin:0">'+esc(m.name)+'</h3><div class="hint">'+cs.length+' Karten · '+d+' fällig</div><div class="prog"><i style="width:'+(cs.length?known/cs.length*100:0).toFixed(1)+'%"></i></div><div class="hint">'+known+' sicher gelernt</div><div class="row"><button class="btn sm pri" data-act="cardstart" data-mod="'+m.id+'"'+(d?'':' disabled')+'>Lernen</button><button class="btn sm" data-act="deck" data-mod="'+m.id+'">Karten</button></div></div>';}).join('');
  return '<div class="ph"><div><h1>Karteikarten</h1><p>Lernen mit Wiederholung. Gewusste Karten kommen in immer größeren Abständen wieder.</p></div><div class="acts"><button class="btn" data-act="cardimport">Importieren</button><button class="btn pri" data-act="newcard">'+ic('plus2')+' Karte</button></div></div>'+tabs+
   '<div class="card dueline"><div><div class="bignum"><span>'+due+'</span><small>'+(due===1?'Karte':'Karten')+' heute fällig</small></div></div><button class="btn pri" data-act="cardstart" data-mod=""'+(due?'':' disabled')+'>Alle fälligen lernen</button></div>'+
   '<div class="mgrid" style="margin-top:18px">'+(decks||'<div class="card empty">Lege zuerst ein Modul an.</div>')+'</div>';
}
function vDeck(tabs){
  var m=modById(deckMod),cs=S.cards.filter(function(c){return c.mod===deckMod;}).sort(function(a,b){return (b.added||0)-(a.added||0);}),t=todayStr();
  var rows=cs.map(function(c){return '<button class="item" data-act="editcard" data-id="'+c.id+'"><span class="grow"><div class="t" style="white-space:normal">'+esc(c.front)+'</div><div class="s" style="white-space:normal">'+esc(c.back)+'</div></span><span class="pill'+(c.due<=t?' warn':'')+'">Stufe '+c.box+'</span></button>';}).join('');
  return '<div class="ph"><div><h1>'+esc(m.name)+'</h1><p>'+cs.length+' Karten in diesem Stapel.</p></div><div class="acts"><button class="btn" data-act="deckback">Zurück</button><button class="btn" data-act="cardimport" data-mod="'+m.id+'">Importieren</button><button class="btn pri" data-act="newcard" data-mod="'+m.id+'">'+ic('plus2')+' Karte</button></div></div>'+
   '<div class="list">'+(rows||'<div class="card empty">Noch keine Karten. Füge eine hinzu oder importiere mehrere auf einmal.</div>')+'</div>';
}
function ivLabel(box){var d=BOX_DAYS[box];return d<=1?'morgen':'in '+d+' Tagen';}
function vSession(){
  var s=cardSession;
  if(s.i>=s.queue.length){
    return '<div class="ph"><div><h1>Geschafft</h1><p>'+s.total+' Karten wiederholt, '+s.again+' Mal „Nochmal“.</p></div></div><div class="card dueline"><div class="hint">Die Karten kommen je nach Antwort in einigen Tagen wieder.</div><button class="btn pri" data-act="cardend">Fertig</button></div>';
  }
  var c=cardById(s.queue[s.i]),m=modById(c.mod);
  return '<div class="ph"><div><h1>Lernen</h1><p>'+(s.i+1)+' von '+s.queue.length+' · '+esc(m?m.name:'')+'</p></div><div class="acts"><button class="btn" data-act="cardend">Beenden</button></div></div>'+
   '<div class="prog" style="max-width:640px;margin:0 auto 16px"><i style="width:'+(s.i/s.queue.length*100).toFixed(1)+'%"></i></div>'+
   '<div class="fc" data-act="flip" role="button" tabindex="0" aria-label="Karte umdrehen"><div class="fc-in'+(s.flipped?' flipped':'')+'"><div class="face front"><small>Frage</small><span>'+esc(c.front).replace(/\n/g,'<br>')+'</span></div><div class="face back"><small>Antwort</small><span>'+esc(c.back).replace(/\n/g,'<br>')+'</span></div></div></div>'+
   '<p class="hint" style="text-align:center;margin:12px 0 0"'+(s.flipped?' hidden':'')+' id="fliphint">Tippen oder Leertaste zum Umdrehen</p>'+
   '<div class="rate"'+(s.flipped?'':' hidden')+'><button class="btn" data-act="rate" data-q="0"><b>Nochmal</b><small>morgen</small></button><button class="btn" data-act="rate" data-q="1"><b>Gut</b><small>'+ivLabel(Math.min(5,c.box+1))+'</small></button><button class="btn pri" data-act="rate" data-q="2"><b>Leicht</b><small>'+ivLabel(Math.min(5,c.box+2))+'</small></button></div>';
}
function cardStart(mod){
  var ids=dueAll().filter(function(c){return !mod||c.mod===mod;}).map(function(c){return c.id;});
  if(!ids.length){toast('Keine Karten fällig.');return;}
  cardSession={queue:shuffle(ids),i:0,flipped:false,total:ids.length,again:0};
  render(true);
}
function cardFlip(){
  if(!cardSession||cardSession.flipped||cardSession.i>=cardSession.queue.length)return;
  cardSession.flipped=true;
  var fi=$('.fc-in');if(fi)fi.classList.add('flipped');
  var r=$('.rate');if(r)r.hidden=false;
  var h=$('#fliphint');if(h)h.hidden=true;
}
function cardRate(q){
  var s=cardSession;if(!s||!s.flipped)return;
  var c=cardById(s.queue[s.i]);if(!c)return;
  if(q===0){c.box=1;s.queue.push(c.id);s.again++;}else c.box=Math.min(5,(c.box||0)+q);
  c.due=todayStr(addDays(new Date(),BOX_DAYS[c.box]));c.reps=(c.reps||0)+1;
  s.i++;s.flipped=false;touch();render();
}
function cardForm(id,modPre){
  if(!need())return;
  var c=id?cardById(id):{mod:modPre||deckMod||mods()[0].id,front:'',back:''};
  modal(id?'Karte bearbeiten':'Neue Karte',sel('Modul','mod',modOpts(),c.mod)+'<label class="fl">Vorderseite (Frage)<textarea class="fi" name="front" required>'+esc(c.front)+'</textarea></label><label class="fl">Rückseite (Antwort)<textarea class="fi" name="back" required>'+esc(c.back)+'</textarea></label>',
   function(fd){var f=fd.get('front').trim(),b=fd.get('back').trim();if(!f||!b)return false;
     if(id){c.mod=fd.get('mod');c.front=f;c.back=b;}else S.cards.push({id:uid(),mod:fd.get('mod'),front:f,back:b,box:0,due:todayStr(),added:Date.now(),reps:0});
     touch();render();if(!id)toast('Karte gespeichert');},
   id?{del:function(){S.cards=S.cards.filter(function(x){return x.id!==id;});touch();render();}}:{});
}
function cardImport(modPre){
  if(!need())return;
  modal('Karten importieren',sel('Modul','mod',modOpts(),modPre||deckMod||mods()[0].id)+'<label class="fl">Eine Karte pro Zeile: Frage ; Antwort<textarea class="fi" name="lines" rows="8" required placeholder="Was ist eine Ableitung ; Grenzwert des Differenzenquotienten"></textarea></label>',
   function(fd){var n=0,mod=fd.get('mod');
     fd.get('lines').split(/\r?\n/).forEach(function(l){var i=l.indexOf(';');if(i<0)i=l.indexOf('\t');if(i<1)return;var f=l.slice(0,i).trim(),b=l.slice(i+1).trim();if(f&&b){S.cards.push({id:uid(),mod:mod,front:f,back:b,box:0,due:todayStr(),added:Date.now(),reps:0});n++;}});
     if(!n){toast('Keine Zeile mit „Frage ; Antwort“ gefunden.');return false;}
     touch();render();toast(n+' Karten importiert');},{ok:'Importieren'});
}

/* ---------- Timer ---------- */
function tSetMode(m){
  T.mode=m;
  T.full=(m==='focus'?(S.settings.focus||25):(T.rounds>0&&T.rounds%4===0?15:(S.settings.brk||5)))*60000;
  T.left=T.full;T.running=false;T.begin=0;T.endAt=0;
}
function tSave(){try{localStorage.setItem(LSTM+':'+(user?user.id:''),JSON.stringify({mode:T.mode,running:T.running,endAt:T.endAt,left:T.left,full:T.full,mod:T.mod,begin:T.begin,rounds:T.rounds}));}catch(e){}}
function tLoad(){
  tSetMode('focus');T.mod='';T.rounds=0;
  try{var r=JSON.parse(localStorage.getItem(LSTM+':'+(user?user.id:''))||'null');
    if(r&&(r.mode==='focus'||r.mode==='break')){T.mode=r.mode;T.running=!!r.running;T.endAt=+r.endAt||0;T.left=+r.left||0;T.full=+r.full||T.full;T.mod=r.mod||'';T.begin=+r.begin||0;T.rounds=+r.rounds||0;}}catch(e){}
  if(T.running&&T.endAt<=Date.now())tDone(true);
}
function addSession(min,when){S.sessions.push({id:uid(),mod:T.mod||'',min:min,at:when||T.begin||Date.now()});touch();}
function tStart(){
  if(T.running)return;
  if(T.left<=0)tSetMode(T.mode);
  if(T.mode==='focus'&&!T.begin)T.begin=Date.now();
  T.endAt=Date.now()+T.left;T.running=true;tSave();
}
function tPause(){if(!T.running)return;T.left=Math.max(0,T.endAt-Date.now());T.running=false;tSave();}
function tStop(){
  var left=T.running?Math.max(0,T.endAt-Date.now()):T.left,el=T.full-left;
  if(T.mode==='focus'&&el>=60000){addSession(Math.round(el/60000));toast(Math.round(el/60000)+' Minuten gespeichert');}
  tSetMode('focus');tSave();render();
}
function beep(){try{var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();setTimeout(function(){o.stop();a.close();},380);}catch(e){}}
function tDone(silent){
  T.running=false;
  if(T.mode==='focus'){addSession(Math.round(T.full/60000));T.rounds++;tSetMode('break');T.running=true;T.endAt=Date.now()+T.left;if(!silent){beep();toast('Fokus geschafft. Zeit für eine Pause.');}}
  else{tSetMode('focus');if(!silent){beep();toast('Pause vorbei.');}}
  tSave();document.title='Studium';if(!silent||view==='lernen')render();
}
function tickDom(){
  var left=T.running?Math.max(0,T.endAt-Date.now()):T.left;
  var el=$('#tmr');if(el)el.textContent=fmtClock(left);
  var rp=$('#ringp');if(rp)rp.style.strokeDashoffset=(553*(1-left/T.full)).toFixed(1);
  document.title=T.running?fmtClock(left)+' · Studium':'Studium';
}
setInterval(function(){
  if(!user||!T.running)return;
  if(T.endAt-Date.now()<=0){tDone();return;}
  tickDom();
},250);
function weekDays(){var a=[],n=new Date();for(var i=6;i>=0;i--)a.push(addDays(n,-i));return a;}
function vTimer(){
  var left=T.running?Math.max(0,T.endAt-Date.now()):T.left,focus=T.mode==='focus';
  var today=minutesOn(todayStr()),wk=weekDays(),vals=wk.map(function(d){return minutesOn(todayStr(d));}),mx=Math.max.apply(null,vals.concat([30])),sum=vals.reduce(function(a,b){return a+b;},0);
  var wkStart=todayStr(wk[0]),byMod={};
  S.sessions.forEach(function(s){if(todayStr(new Date(s.at))>=wkStart)byMod[s.mod||'']=(byMod[s.mod||'']||0)+s.min;});
  var bm=Object.keys(byMod).sort(function(a,b){return byMod[b]-byMod[a];}),bmx=bm.length?byMod[bm[0]]:1;
  var bars='<div class="week">'+wk.map(function(d,i){return '<div><span>'+(vals[i]?vals[i]:'')+'</span><i style="height:'+Math.max(3,vals[i]/mx*100)+'%"></i><span>'+DS.concat(['So'])[(d.getDay()+6)%7]+'</span></div>';}).join('')+'</div>';
  var mrows=bm.length?bm.map(function(k){var m=k?modById(k):null;return '<div class="srow"><div class="sl"><span>'+esc(m?m.name:'Ohne Modul')+'</span><span class="hint">'+fmtMin(byMod[k])+'</span></div><div class="prog"><i style="width:'+(byMod[k]/bmx*100).toFixed(1)+'%;background:'+(m?m.color:'var(--accent)')+'"></i></div></div>';}).join(''):'<div class="empty">Diese Woche noch keine Lernzeit.</div>';
  var recent=S.sessions.slice().sort(function(a,b){return b.at-a.at;}).slice(0,6).map(function(s){var m=s.mod?modById(s.mod):null;return '<div class="item"><span class="dot" style="background:'+(m?m.color:'var(--dim)')+'"></span><span class="grow"><div class="t">'+esc(m?m.name:'Ohne Modul')+'</div><div class="s">'+fmtDT(new Date(s.at))+'</div></span><span class="pill">'+fmtMin(s.min)+'</span><button class="ibtn" data-act="delsess" data-id="'+s.id+'" aria-label="Eintrag löschen">'+ic('x')+'</button></div>';}).join('');
  var C=553;
  return '<div class="tgrid"><div class="card timer"><div class="seg" role="tablist"><button type="button" role="tab" aria-selected="'+focus+'" data-act="tmode" data-m="focus">Fokus</button><button type="button" role="tab" aria-selected="'+(!focus)+'" data-act="tmode" data-m="break">Pause</button></div>'+
   '<div class="ring'+(focus?'':' brk')+'"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="rt" cx="100" cy="100" r="88"/><circle class="rp" id="ringp" cx="100" cy="100" r="88" style="stroke-dasharray:'+C+';stroke-dashoffset:'+(C*(1-left/T.full)).toFixed(1)+'"/></svg><div class="time"><span id="tmr" role="timer">'+fmtClock(left)+'</span><small>'+(focus?'Fokus':'Pause')+(T.rounds?' · Runde '+(T.rounds+(focus?1:0)):'')+'</small></div></div>'+
   '<label class="fl" style="max-width:360px;margin:0 auto;width:100%">Modul<select class="fi" id="tmod"><option value="">– ohne Modul –</option>'+mods().map(function(m){return '<option value="'+m.id+'"'+(T.mod===m.id?' selected':'')+'>'+esc(m.short)+' · '+esc(m.name)+'</option>';}).join('')+'</select></label>'+
   '<div class="trow2">'+(T.running?'<button class="btn pri" data-act="tpause">Pause</button>':'<button class="btn pri" data-act="tstart">'+(T.left<T.full?'Weiter':'Start')+'</button>')+'<button class="btn" data-act="treset">Zurücksetzen</button>'+(focus?'<button class="btn" data-act="tstop">Beenden und speichern</button>':'')+'</div>'+
   '<div class="frow" style="max-width:360px;margin:0 auto;width:100%"><label class="fl">Fokus (Min.)<input class="fi" id="tfocus" type="number" inputmode="numeric" min="1" max="180" value="'+(S.settings.focus||25)+'"></label><label class="fl">Pause (Min.)<input class="fi" id="tbrk" type="number" inputmode="numeric" min="1" max="60" value="'+(S.settings.brk||5)+'"></label></div></div>'+
   '<div class="col"><div class="card"><h3>Letzte 7 Tage <small>heute '+fmtMin(today)+' · Woche '+fmtMin(sum)+'</small></h3>'+bars+'</div><div class="card"><h3>Diese Woche pro Modul</h3><div class="list">'+mrows+'</div></div>'+(recent?'<div class="card"><h3>Letzte Einträge</h3><div class="list">'+recent+'</div></div>':'')+'</div></div>';
}
function sessForm(){
  modal('Lernzeit nachtragen',sel('Modul','mod',[['','– ohne Modul –']].concat(modOpts()),T.mod||'')+'<div class="frow">'+fld('Minuten','min','number','45','required min="1" max="720" inputmode="numeric"')+fld('Datum','day','date',todayStr(),'required')+'</div>',function(fd){
    var m=+fd.get('min');if(!(m>=1))return false;var d=new Date(fd.get('day')+'T12:00');
    S.sessions.push({id:uid(),mod:fd.get('mod'),min:Math.round(m),at:d.getTime()});touch();render();});
}

/* ---------- Notizen ---------- */
function vNotes(tabs){
  var q=fileF.q.toLowerCase(),ids=modIds();
  var list=S.notes.filter(function(n){return (!n.mod||ids.indexOf(n.mod)>-1)&&(!fileF.mod||n.mod===fileF.mod)&&(!q||(n.title+' '+n.text).toLowerCase().indexOf(q)>-1);}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))||(b.added||0)-(a.added||0);});
  var cards=list.map(function(n){var m=n.mod?modById(n.mod):null,sl=n.slot?S.slots.filter(function(s){return s.id===n.slot;})[0]:null,f=n.file?fileById(n.file):null;
    return '<div class="card fcard"><button class="nbtn" data-act="editnote" data-id="'+n.id+'"><div class="t">'+esc(n.title||'Notiz')+'</div><div class="hint">'+(m?esc(m.short):'')+(sl?' · '+esc(sl.type):'')+(n.date?' · '+new Date(n.date).toLocaleDateString('de-DE'):'')+'</div>'+(n.text?'<div class="n" style="-webkit-line-clamp:4">'+esc(n.text)+'</div>':'')+'</button>'+(f?'<button class="pill acc fbtn" data-act="openfile" data-id="'+f.id+'"'+(n.page?' data-page="'+esc(n.page)+'"':'')+'>'+esc(f.title)+(n.page?', S. '+esc(n.page):'')+'</button>':'')+'</div>';}).join('');
  return '<div class="ph"><div><h1>Wissen</h1><p>Notizen pro Vorlesung, verknüpft mit deinen Dateien und Seiten.</p></div><div class="acts"><button class="btn pri" data-act="newnote">'+ic('plus2')+' Notiz</button></div></div>'+tabs+
   '<div class="filters"><input class="fi" id="fq" type="search" placeholder="Suchen in Titel und Text" value="'+esc(fileF.q)+'" style="max-width:320px"><select class="fi" id="fmod" style="max-width:220px"><option value="">Alle Module</option>'+mods().map(function(m){return '<option value="'+m.id+'"'+(fileF.mod===m.id?' selected':'')+'>'+esc(m.short)+' · '+esc(m.name)+'</option>';}).join('')+'</select></div>'+
   (cards?'<div class="fgrid">'+cards+'</div>':'<div class="card empty">Noch keine Notizen. Schreib eine zu einer Vorlesung und verknüpfe sie mit einem PDF.</div>');
}
function fileNotes(fid){
  var l=S.notes.filter(function(n){return n.file===fid;}).sort(function(a,b){return (+a.page||0)-(+b.page||0);});
  return '<div class="fl">Notizen zu dieser Datei<div class="list">'+(l.length?l.map(function(n){return '<button type="button" class="item" data-act="editnote" data-id="'+n.id+'" data-close><span class="grow"><div class="t">'+esc(n.title||'Notiz')+'</div></span>'+(n.page?'<span class="pill">S. '+esc(n.page)+'</span>':'')+'</button>';}).join(''):'<div class="hint">Noch keine.</div>')+'</div><button type="button" class="btn sm" style="justify-self:start" data-act="newnote" data-file="'+fid+'" data-close>'+ic('plus2')+' Notiz zur Datei</button></div>';
}
function noteForm(id,pre){
  var n=id?S.notes.filter(function(x){return x.id===id;})[0]:{title:'',mod:fileF.mod||'',slot:'',file:'',page:'',text:'',date:todayStr()};
  if(!id&&pre&&pre.file){n.file=pre.file;var pf=fileById(pre.file);if(pf&&pf.mod)n.mod=pf.mod;}
  var so=[['','–']].concat(slots().map(function(s){return [s.id,slotLabel(s)+' ('+DS[s.day]+')'];}));
  var fo=[['','– keine –']].concat(files().map(function(f){return [f.id,f.title];}));
  modal(id?'Notiz bearbeiten':'Neue Notiz',
   fld('Titel','title','text',n.title,'required placeholder="z. B. Vorlesung 3: Stetigkeit"')+'<div class="frow">'+sel('Modul','mod',[['','– ohne –']].concat(modOpts()),n.mod)+fld('Datum','date','date',n.date||'')+'</div>'+
   '<div class="frow">'+sel('Veranstaltung','slot',so,n.slot)+sel('Verknüpfte Datei','file',fo,n.file)+'</div>'+fld('Seite in der Datei','page','number',n.page||'','min="1" inputmode="numeric"')+
   '<label class="fl">Text<textarea class="fi" name="text" rows="8" style="min-height:160px">'+esc(n.text||'')+'</textarea></label>'+
   (id&&n.file&&fileById(n.file)?'<button type="button" class="btn" style="justify-self:start" data-act="openfile" data-id="'+n.file+'"'+(n.page?' data-page="'+esc(n.page)+'"':'')+' data-close>Datei öffnen'+(n.page?' auf Seite '+esc(n.page):'')+'</button>':''),
   function(fd){var o={id:id||uid(),title:fd.get('title').trim(),mod:fd.get('mod'),slot:fd.get('slot'),file:fd.get('file'),page:fd.get('page'),text:fd.get('text'),date:fd.get('date'),added:n.added||Date.now()};
     if(!o.title)return false;if(id)S.notes=S.notes.map(function(x){return x.id===id?o:x;});else S.notes.push(o);touch();render();},
   id?{del:function(){S.notes=S.notes.filter(function(x){return x.id!==id;});touch();render();}}:{});
}

/* ---------- Menüs ---------- */
function moreMenu(){
  var items=[['abgaben','Abgaben','check'],['pruefungen','Prüfungen','exam'],['lernen','Lernen','cards'],['wissen','Wissen und Notizen','folder'],['noten','Noten und ECTS','grad'],['planung','Semesterplanung','grid'],['module','Module','layers'],['kontakte','Kontakte','users'],['profil','Profil','user']];
  modal('Mehr','<div class="tilegrid">'+items.map(function(x){return '<button type="button" class="item tile" data-go="'+x[0]+'"'+(view===x[0]?' aria-current="page"':'')+'>'+ic(x[2])+'<span class="grow t">'+x[1]+'</span></button>';}).join('')+'</div>',null,{nofocus:true});
  $('.sh-f').style.display='none';
}
function newMenu(){
  var items=[['newtask','Abgabe','check'],['newslot','Termin im Stundenplan','cal'],['newevent','Privater Termin','pin'],['newexam','Prüfung','exam'],['newcard','Karteikarte','cards'],['newnote','Notiz','note'],['newfile','Datei','folder'],['newmod','Modul','layers'],['newcontact','Kontakt','users']];
  modal('Neu anlegen','<div class="tilegrid">'+items.map(function(x){return '<button type="button" class="item tile" data-act="'+x[0]+'" data-close>'+ic(x[2])+'<span class="grow t">'+x[1]+'</span></button>';}).join('')+'</div>',null,{nofocus:true});
  $('.sh-f').style.display='none';
}

/* ---------- Ereignisse (Ausbau) ---------- */
document.addEventListener('input',function(e){
  var id=e.target.id;
  if(id==='calcX'||id==='calcR'){var x=parseFloat($('#calcX').value),r=parseFloat($('#calcR').value);var o=$('#calcres');if(o)o.innerHTML=calcText(x,r);}
});
document.addEventListener('change',function(e){
  var t=e.target,id=t.id;
  if(id==='calcX'){var x=parseFloat(t.value);if(x>=1&&x<=5){S.settings.grade=x;touch();}}
  else if(id==='setEcts'||id==='setPer'){var v=Math.round(+t.value);if(v>0){if(id==='setEcts')S.settings.ects=v;else S.settings.perSem=v;touch();render();}}
  else if(id==='tmod'){T.mod=t.value;tSave();}
  else if(id==='tfocus'||id==='tbrk'){var n=Math.round(+t.value);if(n>0){if(id==='tfocus')S.settings.focus=n;else S.settings.brk=n;touch();if(!T.running&&T.left===T.full)tSetMode(T.mode);render();}}
});
document.addEventListener('keydown',function(e){
  if(view!=='lernen'||!cardSession||!$('#modal').hidden)return;
  var tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  if(e.key===' '||e.key==='Enter'){if(!cardSession.flipped){e.preventDefault();cardFlip();}}
  else if(cardSession.flipped&&(e.key==='1'||e.key==='2'||e.key==='3'))cardRate(+e.key-1);
});
function actMore(a,d){
  switch(a){
   case 'more':moreMenu();return true;
   case 'calsel':calSel=d.d;render();return true;
   case 'newevent':eventForm(null,d.date);return true;case 'editevent':eventForm(d.id);return true;
   case 'newcontact':contactForm(null,d);return true;case 'editcontact':contactForm(d.id);return true;
   case 'cfilter':contactF=d.f;render();return true;
   case 'newexam':examForm();return true;case 'editexam':examForm(d.id);return true;
   case 'toggleexam':var ex=S.exams.filter(function(x){return x.id===d.id;})[0];ex.registered=!ex.registered;touch();render();return true;
   case 'newnote':noteForm(null,{file:d.file});return true;case 'editnote':noteForm(d.id);return true;
   case 'wtab':wissenTab=d.t;render(true);return true;
   case 'ltab':lernTab=d.t;render(true);return true;
   case 'newcard':cardForm(null,d.mod);return true;case 'editcard':cardForm(d.id);return true;
   case 'cardimport':cardImport(d.mod);return true;
   case 'cardstart':cardStart(d.mod||'');return true;
   case 'deck':deckMod=d.mod;render(true);return true;case 'deckback':deckMod='';render(true);return true;
   case 'flip':cardFlip();return true;
   case 'rate':cardRate(+d.q);return true;
   case 'cardend':cardSession=null;render(true);return true;
   case 'tstart':tStart();render();return true;
   case 'tpause':tPause();render();return true;
   case 'treset':tSetMode(T.mode);tSave();render();return true;
   case 'tstop':tStop();return true;
   case 'tmode':if(!T.running){tSetMode(d.m);tSave();render();}else toast('Pausiere den Timer, um die Phase zu wechseln.');return true;
   case 'addsess':sessForm();return true;
   case 'delsess':S.sessions=S.sessions.filter(function(x){return x.id!==d.id;});touch();render();return true;
   case 'newmodsem':modForm(null,d.sem);return true;
   case 'setsem':S.semId=d.id;touch();paintNav();render();return true;
  }
  return false;
}

/* ======================================================================
   Private Termine, Tagesansicht im Kalender, Module über zwei Semester
   ====================================================================== */
var calSel=null;
var EV_REPEAT=[['','einmalig'],['weekly','jede Woche'],['biweekly','alle 2 Wochen'],['monthly','jeden Monat']];
var DS7=['Mo','Di','Mi','Do','Fr','Sa','So'];

function inSem(m,id){return m.sem===id||m.sem2===id;}
function semLabel(m){return semName(m.sem)+(m.sem2?' + '+semName(m.sem2):'');}
function minToStr(m){m=Math.max(0,Math.min(1439,m));return pad(Math.floor(m/60))+':'+pad(m%60);}
function evEnd(e){return e.end||minToStr(toMin(e.start)+60);}
function evTime(e){return e.start?(e.start+(e.end?'–'+e.end:'')):'ganztägig';}
function occurs(e,d){
  var ds=todayStr(d);
  if(!e.date||ds<e.date)return false;
  if(e.until&&ds>e.until)return false;
  if(ds===e.date)return true;
  var r=e.repeat||'';if(!r)return false;
  var a=new Date(e.date+'T12:00'),b=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
  var n=Math.round((b-a)/864e5);
  if(r==='weekly')return n%7===0;
  if(r==='biweekly')return n%14===0;
  if(r==='monthly')return a.getDate()===b.getDate();
  return false;
}
function eventsOn(date){
  return S.events.filter(function(e){return occurs(e,date);}).sort(function(a,b){return String(a.start||'').localeCompare(String(b.start||''));});
}
function slotRow(s,extra){
  var m=modById(s.mod);
  return '<button class="item" data-act="editslot" data-id="'+s.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(m.short)+' · '+esc(s.type)+'</div><div class="s">'+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+'</div></span>'+(extra||'')+'</button>';
}
function evRow(e){
  return '<button class="item" data-act="editevent" data-id="'+e.id+'"><span class="dot" style="background:'+(e.color||'var(--accent)')+'"></span><span class="grow"><div class="t">'+esc(e.title)+'</div><div class="s">'+evTime(e)+(e.place?' · '+esc(e.place):'')+'</div></span><span class="pill">privat</span></button>';
}
function todayRows(now,nowMin){
  var rows=[];
  slotsOn(now).forEach(function(s){var cur=toMin(s.start)<=nowMin&&nowMin<toMin(s.end);rows.push({k:s.start,h:slotRow(s,cur?'<span class="pill acc">läuft</span>':'')});});
  eventsOn(now).forEach(function(e){rows.push({k:e.start||'00:00',h:evRow(e)});});
  rows.sort(function(a,b){return a.k.localeCompare(b.k);});
  return rows.length?rows.map(function(r){return r.h;}).join(''):'<div class="empty">Heute ist frei.</div>';
}
function dayRows(date){
  var rows=[],ids=modIds();
  slotsOn(date).forEach(function(s){rows.push({k:s.start,h:slotRow(s)});});
  eventsOn(date).forEach(function(e){rows.push({k:e.start||'00:00',h:evRow(e)});});
  tasks().forEach(function(t){if(dayDiff(new Date(t.due),date)!==0)return;var m=modById(t.mod),d=new Date(t.due);
    rows.push({k:pad(d.getHours())+':'+pad(d.getMinutes()),h:'<button class="item" data-act="edittask" data-id="'+t.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(t.title)+'</div><div class="s">'+esc(m.short)+' · Frist '+pad(d.getHours())+':'+pad(d.getMinutes())+' Uhr</div></span><span class="pill '+(isOpen(t)?'warn':'good')+'">Abgabe</span></button>'});});
  S.exams.forEach(function(e){if(ids.indexOf(e.mod)<0)return;var m=modById(e.mod);
    if(e.date&&dayDiff(new Date(e.date),date)===0){var d=new Date(e.date);rows.push({k:pad(d.getHours())+':'+pad(d.getMinutes()),h:'<button class="item" data-act="editexam" data-id="'+e.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">'+esc(m.short)+' · '+esc(e.kind||'Prüfung')+'</div><div class="s">'+pad(d.getHours())+':'+pad(d.getMinutes())+' Uhr'+(e.room?' · '+esc(e.room):'')+'</div></span><span class="pill bad">Prüfung</span></button>'});}
    if(!e.registered&&e.regDeadline&&dayDiff(new Date(e.regDeadline),date)===0)rows.push({k:'23:59',h:'<button class="item" data-act="editexam" data-id="'+e.id+'"><span class="dot" style="background:'+m.color+'"></span><span class="grow"><div class="t">Anmeldefrist '+esc(m.short)+' · '+esc(e.kind||'Prüfung')+'</div><div class="s">heute anmelden</div></span><span class="pill warn">Frist</span></button>'});
  });
  rows.sort(function(a,b){return a.k.localeCompare(b.k);});
  return rows;
}
function dayCard(){
  var sel=calSel?new Date(calSel+'T12:00'):new Date(),rows=dayRows(sel);
  return '<div class="card"><h3><span>'+sel.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})+'</span><button class="btn sm" data-act="newevent" data-date="'+todayStr(sel)+'">'+ic('plus2')+' Privat</button></h3><div class="list">'+(rows.length?rows.map(function(r){return r.h;}).join(''):'<div class="empty">An diesem Tag steht nichts an.</div>')+'</div></div>';
}
function calendar(all){
  var now=new Date();if(!calM)calM=new Date(now.getFullYear(),now.getMonth(),1);
  var first=calM,start=monday(first),cells='',fr={},selStr=calSel||todayStr();
  all.forEach(function(t){if(isOpen(t)){var d=new Date(t.due);fr[d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()]=1;}});
  S.exams.forEach(function(e){if(!modById(e.mod))return;[e.date,(e.registered?'':e.regDeadline)].forEach(function(x){if(x){var d=new Date(x);fr[d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()]=1;}});});
  for(var i=0;i<42;i++){var d=addDays(start,i);if(i>=35&&d.getMonth()!==first.getMonth())break;
    var key=d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(),ds=todayStr(d);
    var cl='d'+(d.getMonth()!==first.getMonth()?' o':'')+(dayDiff(d,now)===0?' t':'')+(fr[key]?' f':'')+(eventsOn(d).length?' p':'')+(ds===selStr?' s':'');
    cells+='<button type="button" class="'+cl+'" data-act="calsel" data-d="'+ds+'" aria-pressed="'+(ds===selStr)+'" aria-label="'+d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})+'">'+d.getDate()+'</button>';}
  return '<div class="cal"><div class="cal-h"><button class="ibtn" data-act="calprev" aria-label="Vorheriger Monat">'+ic('left')+'</button><span>'+first.toLocaleDateString('de-DE',{month:'long',year:'numeric'})+'</span><button class="ibtn" data-act="calnext" aria-label="Nächster Monat">'+ic('right')+'</button></div><div class="cal-g">'+DS7.map(function(x){return '<div class="w">'+x+'</div>';}).join('')+cells+'</div><div class="legend" style="margin-top:10px;flex-wrap:wrap"><span class="r">Abgabe, Prüfung, Frist</span><span class="p">Privat</span></div></div>';
}
function eventForm(id,datePre){
  var e=id?S.events.filter(function(x){return x.id===id;})[0]:{title:'',date:datePre||todayStr(),start:'',end:'',place:'',repeat:'',until:'',note:'',color:COLORS[5]};
  modal(id?'Privaten Termin bearbeiten':'Privater Termin',
   fld('Titel','title','text',e.title,'required maxlength="80" placeholder="z. B. Zahnarzt, Sport, Geburtstag"')+
   '<div class="frow">'+fld('Datum','date','date',e.date,'required')+sel('Wiederholung','repeat',EV_REPEAT,e.repeat||'')+'</div>'+
   '<div class="frow">'+fld('Beginn (optional)','start','time',e.start||'')+fld('Ende (optional)','end','time',e.end||'')+'</div>'+
   '<div class="frow">'+fld('Ort','place','text',e.place||'')+fld('Wiederholen bis (optional)','until','date',e.until||'')+'</div>'+
   '<label class="fl">Notiz<textarea class="fi" name="note">'+esc(e.note||'')+'</textarea></label>'+
   '<div class="fl">Farbe<div class="swatches">'+COLORS.map(function(c,i){return '<label><input type="radio" name="color" value="'+c+'"'+(c===(e.color||COLORS[5])?' checked':'')+'><span style="background:'+c+'" title="Farbe '+(i+1)+'"></span></label>';}).join('')+'</div></div>',
   function(fd){
     var st=fd.get('start'),en=fd.get('end');
     if(!st)en='';
     if(st&&en&&toMin(en)<=toMin(st)){toast('Das Ende muss nach dem Beginn liegen.');return false;}
     var o={id:id||uid(),title:fd.get('title').trim(),date:fd.get('date'),start:st,end:en,place:fd.get('place').trim(),repeat:fd.get('repeat'),until:fd.get('until'),note:fd.get('note'),color:fd.get('color')||COLORS[5]};
     if(!o.title||!o.date)return false;
     if(o.until&&o.until<o.date){toast('„Bis“ liegt vor dem Datum.');return false;}
     if(id)S.events=S.events.map(function(x){return x.id===id?o:x;});else S.events.push(o);
     calSel=o.date;touch();render();},
   id?{del:function(){S.events=S.events.filter(function(x){return x.id!==id;});touch();render();}}:{});
}

/* ---------- Stundenplan (mit privaten Terminen, heutiger Tag hervorgehoben) ---------- */
function vPlan(){
  var now=new Date(),mon=addDays(monday(now),planWeek*7),wk=isoWeek(mon),nowMin=now.getHours()*60+now.getMinutes();
  var ss=slots(),cols=ss.some(function(s){return s.day===5;})?6:5;
  for(var q=5;q<7;q++){if(eventsOn(addDays(mon,q)).length)cols=Math.max(cols,q+1);}
  var lo=8,hi=18;
  ss.forEach(function(s){lo=Math.min(lo,Math.floor(toMin(s.start)/60));hi=Math.max(hi,Math.ceil(toMin(s.end)/60));});
  for(var q2=0;q2<cols;q2++)eventsOn(addDays(mon,q2)).forEach(function(e){if(e.start){lo=Math.min(lo,Math.floor(toMin(e.start)/60));hi=Math.max(hi,Math.ceil(toMin(evEnd(e))/60));}});
  hi=Math.min(hi,24);
  var PX=54,H=(hi-lo)*PX,head='<div></div>',body='',hrs='';
  for(var h=lo;h<=hi;h++){hrs+='<span style="top:'+((h-lo)*PX)+'px">'+pad(h)+':00</span>';}
  function ov(a1,a2,b1,b2){return a1<b2&&b1<a2;}
  for(var d=0;d<cols;d++){
    var date=addDays(mon,d),today=dayDiff(date,now)===0,sl=slotsOn(date),evs=eventsOn(date),timed=evs.filter(function(e){return e.start;});
    var ad=evs.filter(function(e){return !e.start;}).map(function(e){return '<em class="ad" style="--c:'+(e.color||'var(--accent)')+'" title="'+esc(e.title)+'">'+esc(e.title)+'</em>';}).join('');
    head+='<div class="hd'+(today?' today':'')+'"'+(today?' aria-current="date"':'')+'>'+DS7[d]+'<small>'+pad(date.getDate())+'.'+pad(date.getMonth()+1)+'.</small>'+ad+'</div>';
    var lines='';for(var h2=lo;h2<hi;h2++)lines+='<div class="hl" style="top:'+((h2-lo)*PX)+'px"></div>';
    var blocks=sl.map(function(s){var m=modById(s.mod),top=(toMin(s.start)-lo*60)/60*PX,hh=(toMin(s.end)-toMin(s.start))/60*PX;
      var half=timed.some(function(e){return ov(toMin(s.start),toMin(s.end),toMin(e.start),toMin(evEnd(e)));});
      return '<button class="blk'+(s.bi?' bi':'')+'" data-act="editslot" data-id="'+s.id+'" style="top:'+top+'px;height:'+Math.max(hh-2,28)+'px;background:'+m.color+(half?';right:calc(50% + 2px)':'')+'"><b>'+esc(m.short)+' · '+esc(s.type)+'</b><span>'+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+'</span></button>';}).join('');
    var eb=timed.map(function(e){var top=(toMin(e.start)-lo*60)/60*PX,hh=(toMin(evEnd(e))-toMin(e.start))/60*PX;
      var half=sl.some(function(s){return ov(toMin(s.start),toMin(s.end),toMin(e.start),toMin(evEnd(e)));});
      return '<button class="blk ev" data-act="editevent" data-id="'+e.id+'" style="top:'+top+'px;height:'+Math.max(hh-2,28)+'px;--c:'+(e.color||'var(--accent)')+(half?';left:calc(50% + 2px)':'')+'"><b>'+esc(e.title)+'</b><span>'+e.start+(e.end?'–'+e.end:'')+(e.place?' · '+esc(e.place):'')+'</span></button>';}).join('');
    var nl=(today&&nowMin>=lo*60&&nowMin<=hi*60)?'<div class="nowline" style="top:'+((nowMin-lo*60)/60*PX)+'px"><i></i></div>':'';
    body+='<div class="dcol'+(today?' today':'')+'" style="height:'+H+'px">'+lines+blocks+eb+nl+'</div>';
  }
  var grid='<div class="grid" style="--cols:'+cols+'">'+head+'<div class="hours" style="height:'+H+'px">'+hrs+'</div>'+body+'</div>';
  // Handy: Tagesliste
  if(planDay<0){var wd=(now.getDay()+6)%7;planDay=wd<cols?wd:0;}
  if(planDay>=cols)planDay=0;
  var tabs='<div class="tabs" role="group" aria-label="Wochentag">'+DS7.slice(0,cols).map(function(n,i){var dt=addDays(mon,i),td=dayDiff(dt,now)===0;return '<button data-act="planday" data-i="'+i+'" class="'+(td?'today':'')+'" aria-pressed="'+(planDay===i)+'">'+n+'<small>'+pad(dt.getDate())+'.'+pad(dt.getMonth()+1)+'.</small></button>';}).join('')+'</div>';
  var pdate=addDays(mon,planDay),rows=[];
  slotsOn(pdate).forEach(function(s){var m=modById(s.mod);rows.push({k:s.start,h:'<button class="item" data-act="editslot" data-id="'+s.id+'" style="border-left:5px solid '+m.color+'"><span class="grow"><div class="t">'+esc(m.name)+'</div><div class="s">'+esc(s.type)+' · '+s.start+'–'+s.end+(s.room?' · '+esc(s.room):'')+(s.bi?' · alle 2 Wochen':'')+'</div></span></button>'});});
  eventsOn(pdate).forEach(function(e){rows.push({k:e.start||'00:00',h:'<button class="item" data-act="editevent" data-id="'+e.id+'" style="border-left:5px dashed '+(e.color||'var(--accent)')+'"><span class="grow"><div class="t">'+esc(e.title)+'</div><div class="s">'+evTime(e)+(e.place?' · '+esc(e.place):'')+'</div></span><span class="pill">privat</span></button>'});});
  rows.sort(function(a,b){return a.k.localeCompare(b.k);});
  var list='<div class="list">'+(rows.length?rows.map(function(r){return r.h;}).join(''):'<div class="empty">Kein Termin an diesem Tag.</div>')+'</div>';
  return '<div class="ph"><div><h1>Stundenplan</h1><p>Wöchentlich gleich, zweiwöchige Übungen erscheinen nur in der passenden KW. Private Termine sind gestrichelt.</p></div><div class="acts"><button class="btn" data-act="newevent">'+ic('plus2')+' Privat</button><button class="btn pri" data-act="newslot">'+ic('plus2')+' Termin</button></div></div>'+
   '<div class="weekbar"><button class="ibtn" data-act="wprev" aria-label="Vorherige Woche">'+ic('left')+'</button><span class="wk">KW '+wk+' · '+pad(mon.getDate())+'.'+pad(mon.getMonth()+1)+'.</span><button class="ibtn" data-act="wnext" aria-label="Nächste Woche">'+ic('right')+'</button>'+(planWeek?'<button class="btn sm" data-act="wnow">Diese Woche</button>':'')+'</div>'+
   '<div class="card">'+(mods().length||S.events.length?grid+'<div class="daylist">'+tabs+list+'</div>':'<div class="empty">Lege zuerst unter „Module“ ein Modul an.</div>')+'</div>';
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click',function(e){
  var c=e.target.closest('[data-close]');
  if(c&&c.closest('#modal')){var a0=c.dataset.act;closeModal();if(a0)act(a0,c.dataset);return;}
  if(e.target.id==='modal'){closeModal();return;}
  var g=e.target.closest('[data-go]');
  if(g){if(g.dataset.go==='new'){newMenu();return;}if(g.dataset.t)lernTab=g.dataset.t;go(g.dataset.go);return;}
  var a=e.target.closest('[data-act]');
  if(a&&a.dataset.act==='eye'){var i=a.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password';return;}
  if(a)act(a.dataset.act,a.dataset);
});
function act(a,d){
  if(actMore(a,d))return;
  switch(a){
   case 'newslot':slotForm();break;case 'editslot':slotForm(d.id);break;
   case 'newtask':taskForm();break;case 'edittask':taskForm(d.id);break;
   case 'newmod':modForm();break;case 'editmod':modForm(d.id);break;
   case 'newfile':fileForm();break;case 'openfile':fileForm(d.id,d.page);break;
   case 'newsem':semForm();break;case 'editsem':semForm(d.id);break;
   case 'toggletask':var t=S.tasks.filter(function(x){return x.id===d.id;})[0];t.status=isOpen(t)?'abgegeben':'offen';touch();render();break;
   case 'tfilter':taskF=d.f;render();break;
   case 'wprev':planWeek--;render();break;case 'wnext':planWeek++;render();break;case 'wnow':planWeek=0;planDay=-1;render();break;
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
var h=(location.hash||'').replace('#','');if(VIEWS.indexOf(h)>-1)view=h;
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
