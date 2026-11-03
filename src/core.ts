document.documentElement.lang='tr';
/* ---------- yardımcılar ---------- */
const rnd=(a: number,b: number)=>a+Math.random()*(b-a), rint=(a: number,b: number)=>Math.floor(rnd(a,b+1)), pick=<T>(a:readonly T[]):T=>a[rint(0,a.length-1)];
const cl=(v: number,a: number=0,b: number=100)=>Math.max(a,Math.min(b,v)), r0=Math.round, chance=(p: number)=>Math.random()*100<p;
const esc=(s: unknown)=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const SAVE='muhur-avrupa-2';
/* ---------- sabit dünya ---------- */
const W=768,H=700;
const REGW:Record<Regime,string>={cum:'Cumhuriyeti',fed:'Federasyonu',kra:'Krallığı',cun:'Askerî Konseyi'};
const REGN:Record<Regime,string>={cum:'Cumhuriyet',fed:'Federasyon',kra:'Krallık',cun:'Askerî yönetim'};
const TITLE:Record<Regime,string>={cum:'Cumhurbaşkanı',fed:'Federal Başkan',kra:'Hükümdar',cun:'Konsey Başkanı'};

const EXTRA=['#d4c24f','#5c86c9','#b4d264','#e08aa8','#9f7be0','#e29a56'];
const FN=['Ada','Defne','Elif','Leyla','Selin','Nehir','Zeynep','Mira','Sevda','Pelin','Ali','Baran','Cem','Deniz','Emre','Kaan','Ozan','Tolga','Yusuf','Sinan','Halil'];
const LN=['Akdoğan','Bozkurt','Çelikel','Demirci','Erdem','Güven','Karaca','Kılınç','Özkan','Saygın','Tekin','Yalın','Ulusoy','Sezer','Tuna','Vural','Aydemir','Korkmaz'];
const EDU=['İlkokul','Lise','Üniversite','Yüksek lisans','Doktora'];
const JOBS:Record<string,number>={'İşçi':3,'Çiftçi':3,'Öğretmen':4,'Gazeteci':4,'Esnaf':5,'Subay':5,'Mühendis':6,'Avukat':7,'Doktor':7};
const IDEO:Record<string,string>={Liberal:'Özgürlük Partisi','Sosyal demokrat':'Halkın Emeği Partisi',Muhafazakâr:'Gelenek Partisi',Milliyetçi:'Vatan Partisi',Sosyalist:'İşçi Birliği',Çevreci:'Yeşil Yol Partisi'};
const POS:Record<string,string>={vatandas:'Vatandaş',uye:'Hareket üyesi',hareket:'Hareket lideri',parti:'Parti lideri',belediye:'Belediye başkanı',vali:'Bölge yöneticisi',bakan:'Koalisyon ortağı',general:'General',muhalefet:'Muhalefet lideri',eski:'Eski lider',bakanNPC:'Bakan'};
const TAXF=[0,.65,1,1.4], TAXN=['','Düşük','Orta','Yüksek'], AUTON=['Merkeze bağlı','Geniş yetkili','Özerk','Tam özerk'];
const MINN={eko:'Ekonomi',ici:'İçişleri',sav:'Savunma',dis:'Dışişleri'};
/* ---------- piksel harita üretimi ---------- */
const h2=(x: number,y: number)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
const sm=(t: number)=>t*t*(3-2*t);
function vn(x: number,y: number){const i=Math.floor(x),j=Math.floor(y),f=sm(x-i),g=sm(y-j);
 const a=h2(i,j),b=h2(i+1,j),c=h2(i,j+1),d=h2(i+1,j+1);return a+(b-a)*f+(c-a)*g+(a-b-c+d)*f*g}
const fbm=(x: number,y: number)=>vn(x/11,y/11)*.6+vn(x/5,y/5)*.28+vn(x/2.4,y/2.4)*.12;
const CENT=DEF.flatMap(d=>d.rs.map(r=>({x:r[1],y:r[2]})));
const grid=new Int16Array(W*H).fill(-1), elev=new Float32Array(W*H);

let gi=0;for(let i=0;i<MAP_RUNS.length;i+=2){grid.fill(MAP_RUNS[i],gi,gi+MAP_RUNS[i+1]);gi+=MAP_RUNS[i+1]}
const BORDERS=new Set<string>();

const hex=(c: string)=>[1,3,5].map(i=>parseInt(c.substr(i,2),16));
const mix=(a: number[],b: number[],t: number)=>a.map((v,i)=>v+(b[i]-v)*t);
const ramp=(v: number)=>v<50?mix([201,63,74],[236,185,79],v/50):mix([236,185,79],[92,190,110],(v-50)/50);
/* Avrupa olay sistemi: ses yalnızca kullanıcı etkileşiminden sonra başlar. */
let soundOn=localStorage.getItem('muhur-sound')==='true',audioCtx:AudioContext=null,lastPresented:QueuedEvent=null;
function unlockAudio(){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{})}catch(e){}}
function sfx(kind: string='event'){if(!soundOn)return;unlockAudio();if(!audioCtx)return;const notes=kind==='uprising'?[110,130,110,82]:kind==='secret'?[330,440,554,660]:kind==='war'?[130,98,65]:[262,330,392];notes.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+i*.13;o.type=kind==='uprising'||kind==='war'?'triangle':'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.24)})}
function eventScene(secret: boolean=false){return `<div class="event-scene ${secret?'secret-scene':''}" aria-hidden="true"><span>${secret?'✦':'◆'}</span><span>${secret?'☾':'⚑'}</span><span>${secret?'✦':'◆'}</span></div>`}
let presentEvent = function(){const q=G&&G.q[0];if(q&&q!==lastPresented){lastPresented=q;sfx(q.id==='uprising'?'uprising':q.secret?'secret':'event')}if(!q)lastPresented=null}
let unrestRisk = function(c: Country){const rs=crs(c),loyal=rs.reduce((s,r)=>s+r.loyal,0)/(rs.length||1);return cl(5+Math.max(0,55-c.stab)*.9+Math.max(0,45-c.econ)*.6+Math.max(0,45-loyal)*.5+(c.T<0?15:0)+(inWar(c)?10:0),5,90)}
let startUprising = function(c: Country,r: Region,forced: boolean=false){G.unrest ||= [];if(G.unrest.some(u=>u.r===r.id))return;const u={r:r.id,age:0,power:forced?45:rint(24,45)};G.unrest.push(u);r.loyal=cl(r.loyal-8);c.stab=cl(c.stab-5);say(`${r.n}: ${c.stab>50?'Beklenmedik protestolar':'Ayaklanma'} başladı.`);if(c.id===cOf(me()).id)G.q.push({id:'uprising',r:r.id});}
let unrestStep = function(){G.unrest ||= [];G.discoveries ||= [];
 G.unrest=G.unrest.filter(u=>{if(u.power<=0)return false;const r=G.rs[u.r],c=G.cs[r.c];u.age++;u.power=cl(u.power+Math.max(0,45-c.stab)*.15-4);r.wealth=cl(r.wealth-2);c.stab=cl(c.stab-2);if(u.age>=4||u.power<=0){say(`${r.n}: sokak hareketi sona erdi.`);return false}return true});
 const c=cOf(me()),risk=unrestRisk(c);if(!G.unrest.some(u=>G.rs[u.r].c===c.id)&&chance(risk))startUprising(c,pick(crs(c)));
 const others=alive().filter(k=>k.id!==c.id&&!G.unrest.some(u=>G.rs[u.r].c===k.id));if(others.length){const k=pick(others);if(chance(unrestRisk(k)))startUprising(k,pick(crs(k)))}
 if(!G.q.length&&chance(7)){const secrets=[['cat','Mührün gerçek sahibi','Saray kedisi mührün üzerine uyudu. Toplantı, mama gelene kadar ertelendi.'],['radio','Gece yarısı frekansı','Eski radyodan bir ses geldi: “Bir dönem daha...” Arşivde unutulmuş bir dayanışma ağı keşfedildi.'],['tea','Çay diplomasisi','Zirvede son bardak çay paylaşıldı. En sert rakipler bile bir anlığına gülümsedi.']].filter(s=>!G.discoveries.includes(s[0]));if(secrets.length){const s=pick(secrets);G.discoveries.push(s[0]);c.appr=cl(c.appr+3);G.q.push({id:'info',k:'Gizli olay · '+G.discoveries.length+'/3',title:s[1],text:s[2]+' Halk desteği +3.',secret:true});say('Gizli olay keşfedildi: '+s[1])}}
}
let uprisingModal = function(q: QueuedEvent){const r=G.rs[q.r],c=G.cs[r.c],leader=c.leader===G.pid;return `<div class="modalbg"><div class="modal band uprising" role="dialog" aria-modal="true" aria-label="Ayaklanma"><div class="event-scene" aria-hidden="true"><span>⚑</span><span>⚑</span><span>⚑</span><i></i></div><div class="kick">SON DAKİKA · ${esc(c.n)}</div><h2>${esc(r.n)} meydanları doldu</h2><p>İyi göstergeler huzuru garanti etmiyor. Yerel talepler ülke çapında bir harekete dönüşebilir. Kararın sonraki dönemleri etkileyecek.</p><div class="acts">${(leader?[
 ['Temsilcilerle görüş','12 hazine; sadakat +15, istikrar +6'],['Acil destek paketi','25 hazine; zenginlik +8, sadakat +12'],['Güç kullan','İstikrar +4; sadakat −18, itibar −10. Hareket büyüyebilir.']]:[['Dayanışma örgütle','5 para; itibar +6, örgüt +4'],['Arabuluculuk yap','İtibar +3; sadakat +8'],['Uzak dur','Sağlığını korursun; hareket sürer']]).map((v,i)=>`<button class="big" data-q="${i}" ${leader&&i<2&&c.T<(i===0?12:25)||!leader&&i===0&&me().money<5?'disabled':''}><b>${v[0]}</b><span>${v[1]}</span></button>`).join('')}</div></div></div>`}
let resolveUprising = function(q:QueuedEvent,i:number):boolean|void{const r=G.rs[q.r],c=G.cs[r.c],u=(G.unrest||[]).find(u=>u.r===r.id);if(c.leader===G.pid){if(i===0){if(c.T<12)return;c.T-=12;r.loyal=cl(r.loyal+15);c.stab=cl(c.stab+6);if(u)u.power=0}else if(i===1){if(c.T<25)return;c.T-=25;r.wealth=cl(r.wealth+8);r.loyal=cl(r.loyal+12);if(u)u.power=0}else{c.stab=cl(c.stab+4);r.loyal=cl(r.loyal-18);D({rep:-10});if(u)u.power=cl(u.power+25)}}else if(i===0){if(me().money<5)return;D({money:-5,rep:6,org:4})}else if(i===1){D({rep:3});r.loyal=cl(r.loyal+8);if(u)u.power=Math.max(0,u.power-15)}else D({health:2});say(`${r.n}: ${['görüşme ve dayanışma','destek ve arabuluculuk','sert tutum veya bekleme'][i]} kararı alındı.`);G.unrest=(G.unrest||[]).filter(u=>u.power>0);T('Kararın uygulandı');}

/* Harita emirleri: hedef seç, emri onayla, bir sonraki dönemde sonucu gör. */
let mapActions = function(){const c=leads(me());if(!c)return[];const r=G.rs[G.sel],target=G.cs[r.c],own=target.id===c.id;
 const busy=(G.operations||[]).some(o=>o.r===r.id),baseLock=busy?'Bu bölgede devam eden bir emir var':null;
 const add=(id:OperationKind,title:string,desc:string,cost:number,lock:string=null)=>A('op:'+id,title,desc,{cost3:cost,lock:baseLock||lock,run(){ui.sheet={t:'operation',kind:id,r:r.id,cost};}});
 if(own)return[add('independence','Bağımsızlık referandumu','Bölgeyi bağımsız bir devlete dönüştürecek referandumu destekle. Başkent ayrılamaz.',20,crs(c).length<2||r.id===c.cap?'Başkent veya ülkenin tek bölgesi ayrılamaz':r.loyal>55?'Bağımsızlık talebi zayıf; sadakat en fazla 55 olmalı':null)];
 const border=crs(c).some(a=>adj(a,r));
 return [add('conquest','➜ Bu bölgeyi fethet',`Bir dönemlik harekât. Başarı ihtimali %${conquestOdds(c,target)}. Savaş ve ordu kaybı riski.`,30,!border?'Bölgeyle kara sınırın olmalı':c.allies.includes(target.id)?'Önce ittifakı sona erdirmelisin':c.army<20?'En az 20 ordu gerekli':null),
 add('destabilize','Orayı karıştır','Bir sonraki dönem ayaklanma çıkarma girişimi. Başarı %65; yakalanırsan ilişkiler −25.',18),
 add('election','Orada seçim talep et','Uluslararası gözlem altında seçim çağrısı. İlişkiler en az 10 ise kabul şansı %70, aksi halde %25.',15),
 add('independence','Bağımsızlık hareketini destekle','Düşük sadakatli, başkent olmayan bölgede ayrılık referandumu. Başarı %60; ilişkiler −30.',25,crs(target).length<2||target.cap===r.id?'Başkent veya tek bölgeli ülke bölünemez':r.loyal>55?'Bağımsızlık talebi zayıf; sadakat en fazla 55 olmalı':null)];
}
function conquestOdds(c: Country,t: Country){return r0(cl(50+(c.army-t.army)*.65+(c.econ-t.econ)*.15,15,85))}
let operationModal = function(s: Sheet){const names:Partial<Record<OperationKind,string>>={conquest:'Fetih harekâtı',destabilize:'Karıştırma operasyonu',election:'Seçim çağrısı',independence:'Bağımsızlık referandumu'};const r=G.rs[s.r];return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true"><div class="kick">EMRİ ONAYLA · ${esc(r.n)}</div><h2>${names[s.kind]}</h2><p>Hedef: ${esc(G.cs[r.c].n)} / ${esc(r.n)}. Maliyet: ${s.cost} hazine ve 1 eylem. Sonuç bir sonraki dönemde belli olur; başarı garanti değildir.</p><div class="acts"><button class="big prime" data-confirm-op="1"><b>Emri ver · ${s.cost} hazine</b></button><button class="big" data-close="1"><b>Vazgeç</b><span>Hazine veya eylem harcanmaz.</span></button></div></div></div>`}
let confirmOperation = function(){const s=ui.sheet,c=leads(me());if(!s||s.t!=='operation'||!c)return;const action=mapActions().find(a=>a.id==='op:'+s.kind);if(!action||can(action))return;
 c.T-=s.cost;G.ap--;G.operations ||= [];const nearest=crs(c).reduce((a,b)=>Math.hypot(a.x-G.rs[s.r].x,a.y-G.rs[s.r].y)<Math.hypot(b.x-G.rs[s.r].x,b.y-G.rs[s.r].y)?a:b);
 G.operations.push({kind:s.kind,r:s.r,from:nearest.id,c:c.id,target:G.rs[s.r].c,turn:G.turn});say(`${G.rs[s.r].n}: ${action.title} emri verildi.`);ui.sheet=null;sfx(s.kind==='conquest'?'war':'event');save();render()}
let operationsStep = function(){const pending=G.operations||[];G.operations=[];for(const o of pending){const r=G.rs[o.r],c=G.cs[o.c],t=G.cs[r.c];if(!c.alive||r.c!==o.target){say(`${r.n}: yönetim değiştiği için emir iptal edildi.`);continue}let text='',title='Emrin sonucu';
 if(o.kind==='conquest'){if(c.id===t.id)continue;declareWar(c,t);const success=chance(conquestOdds(c,t));c.army=cl(c.army-rint(4,10));t.army=cl(t.army-rint(3,8));if(success){capture(r,c);title='Bölge ele geçirildi';text=`${r.n} artık ${c.n} yönetiminde. Savaş ve düşük yerel sadakat devam ediyor.`}else{title='Harekât püskürtüldü';text=`${r.n} savunması ilerleyişi durdurdu. Hazine harcandı ve ordun yıprandı.`}sfx('war')}
 else if(o.kind==='destabilize'){if(chance(65)){startUprising(t,r,true);text=`${r.n} bölgesinde ayaklanma başladı. Yerel ekonomi ve istikrar baskı altında.`}else{c.rel[t.id]=t.rel[c.id]=cl((c.rel[t.id]||0)-25,-100,100);text='Operasyon açığa çıktı. İlişkiler 25 puan düştü.'}}
 else if(o.kind==='election'){if(chance((c.rel[t.id]||0)>=10?70:25)){const old=P(t.leader),candidate=mkP({r:t.cap,pos:'lider',fame:65,org:60});old.pos='eski';t.leader=candidate.id;t.reg='cum';t.appr=cl(t.appr+8);t.stab=cl(t.stab-4);text=`${t.n} seçim çağrısını kabul etti. Simülasyon seçimini ${candidate.name} kazandı; yeni bir hükûmet kuruldu.`}else text=`${t.n} seçim çağrısını reddetti. Maliyet geri alınmadı.`}
 else{if(crs(t).length<2||t.cap===r.id||r.loyal>55){text='Referandum koşulları değişti. Ayrılma gerçekleşmedi.'}else if(chance(c.id===t.id?80:60)){const nc=makeCountry(r,mkP({r:r.id,pos:'lider'}).id,t.id);t.stab=cl(t.stab-12);updEcon(t);text=`Referandum sonrasında ${nc.n} bağımsızlığını ilan etti. Yeni devlet otomatik olarak senin toprağın olmaz; kara sınırın varsa sonraki dönemde fetih emri verebilirsin.`}else{text='Referandumda bağımsızlık talebi çoğunluğa ulaşamadı.';r.loyal=cl(r.loyal-5)}if(c.id!==t.id)c.rel[t.id]=t.rel[c.id]=cl((c.rel[t.id]||0)-30,-100,100)}
 say(`${r.n}: ${text}`);if(c.leader===G.pid)G.q.push({id:'info',k:'Harita emri',title,text});}}
function drawOperations(x: CanvasRenderingContext2D){for(const o of G.operations||[]){const a=G.rs[o.from],b=G.rs[o.r],ang=Math.atan2(b.y-a.y,b.x-a.x);x.save();x.strokeStyle=o.kind==='conquest'?'#ff6571':'#f7d778';x.fillStyle=x.strokeStyle;x.lineWidth=4;x.setLineDash(matchMedia('(prefers-reduced-motion:reduce)').matches?[]:[10,6]);x.lineDashOffset=-blink*4;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();x.setLineDash([]);x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x-15*Math.cos(ang-.5),b.y-15*Math.sin(ang-.5));x.lineTo(b.x-15*Math.cos(ang+.5),b.y-15*Math.sin(ang+.5));x.closePath();x.fill();x.restore()}}
let installPrompt:BeforeInstallPromptEvent=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.querySelector('#install-app')?.classList.add('available')});
document.addEventListener('click',async e=>{if(eventElement(e).closest<HTMLButtonElement>('[data-confirm-op]'))confirmOperation();if(eventElement(e).closest('#install-app')&&installPrompt){await installPrompt.prompt();installPrompt=null;document.querySelector('#install-app')?.classList.remove('available')}});


/* ---------- oyun durumu ---------- */
let G:GameState=null;
const ui:UIState={view:'title',sheet:null,flash:null,cnew:{},pick:'hepsi'};
const me=()=>G.ps[G.pid], P=(id: number)=>G.ps[id], cOf=(p: Person)=>G.cs[G.rs[p.r].c];
const crs=(c: Country)=>G.rs.filter(r=>r.c===c.id), alive=()=>G.cs.filter(c=>c.alive);
const dateStr=(t: number=G.turn)=>(t%2?'Güz':'Bahar')+' '+(2030+Math.floor(t/2));
function freeName(){for(let i=0;i<40;i++){const n=pick(FN)+' '+pick(LN);if(!G.ps.some(x=>x.alive&&x.name===n))return n}return pick(FN)+' '+pick(LN)}
let mkP = function(o:Partial<Person>={}){const p:Person=Object.assign({id:G.ps.length,name:o.name??freeName(),age:rint(38,62),edu:rint(1,4),job:pick(Object.keys(JOBS)),money:rint(10,60),ideo:pick(Object.keys(IDEO)),speech:rint(25,70),lead:rint(25,70),rep:rint(30,70),fame:rint(15,60),org:rint(10,50),health:rint(60,95),r:0,pos:'vatandas',party:null,hist:[],alive:true,seed:rint(1,99999),cand:null,jail:0,legacy:0,cool:{}},o);G.ps.push(p);return p}
let newGame = function(){
 G={v:2,unrest:[],discoveries:[],turn:0,cs:[],rs:[],ps:[],pid:null,log:[],q:[],ap:2,wars:[],sel:0,tab:'karakter',mapMode:'ulke',extra:0};
 DEF.forEach((d,i)=>{const c={id:i,n:d.n,reg:d.reg,col:d.col,tax:2,T:rint(70,150),econ:50,stab:rint(45,72),appr:rint(40,66),army:rint(35,65),rel:{},allies:[],trade:[],off:rint(0,7),alive:true,cap:G.rs.length,min:{}} as Country;
  G.cs.push(c);
  d.rs.forEach(a=>{const id=G.rs.length;G.rs.push({id,n:a[0],c:i,x:a[1],y:a[2],pop:+rnd(1,6).toFixed(1),wealth:rint(32,68),infra:rint(30,65),edu:rint(30,65),loyal:rint(40,70),auto:d.reg==='fed'?1:0,tax:2,bud:rint(12,30),adm:rint(25,50),cen:rint(10,50),sup:3,gov:null,mayor:null});});
 });
 G.cs.forEach(c=>{const cap=c.cap,lead=mkP({r:cap,pos:'lider',fame:rint(70,90),org:rint(50,80),age:rint(45,68)});c.leader=lead.id;
  c.gen=mkP({r:cap,pos:'general',job:'Subay',lead:rint(50,80)}).id;
  if(c.reg==='cum'||c.reg==='fed'){const o=mkP({r:cap,pos:'muhalefet',fame:rint(40,70),org:rint(35,60)});o.party=IDEO[o.ideo];c.opp=o.id}else{c.opp=mkP({r:cap,pos:'parti',fame:rint(20,45),org:rint(20,40)}).id;P(c.opp).party=IDEO[P(c.opp).ideo]}
  for(const k of keysOf(MINN))c.min[k]=mkP({r:cap,pos:'bakanNPC'}).id;
  G.cs.forEach(o=>{if(o.id!==c.id)c.rel[o.id]=rint(-55,45)});
 });
 G.cs.forEach(c=>G.cs.forEach(o=>{if(o.id<c.id)o.rel[c.id]=c.rel[o.id]}));
 G.rs.forEach(r=>{r.gov=mkP({r:r.id,pos:'vali'}).id;r.mayor=mkP({r:r.id,pos:'belediye'}).id});
 G.cs.forEach(updEcon);
 say(`Dünya tarihi yeniden başlıyor: ${alive().length} devlet, ${G.rs.length} bölge.`);
}
const updEcon=(c: Country)=>{const rs=crs(c),t=rs.reduce((s,r)=>s+r.pop,0)||1;c.econ=rs.reduce((s,r)=>s+r.wealth*r.pop,0)/t};
const full=(c: Country)=>c.n+' '+REGW[c.reg];
const ltitle=(c: Country)=>TITLE[c.reg];
const posName=(p: Person)=>{if(p.pos==='lider'){const c=G.cs.find(c=>c.alive&&c.leader===p.id);return c?ltitle(c):'Lider'}return POS[p.pos]||'Vatandaş'};
function say(t: string){G.log.unshift({d:dateStr(),t});if(G.log.length>160)G.log.pop()}
function hist(p: Person,t: string){p.hist.push({a:Math.floor(p.age),t})}
const info=(k: string,title: string,text: string,extra: Partial<QueuedEvent>={})=>G.q.push(Object.assign({id:'info',k,title,text},extra));
function natSup(p: Person,c: Country=cOf(p)){const rs=crs(c),t=rs.reduce((s,r)=>s+r.pop,0)||1;return rs.reduce((s,r)=>s+r.sup*r.pop,0)/t}
const adj=(a: Region,b: Region)=>BORDERS.has([Math.min(a.id,b.id),Math.max(a.id,b.id)].join(":"));
let countryGraphGame:GameState=null,countryGraphKey='',countryGraph:Map<number,Set<number>>=null;
function countryAdjacency(){const key=G.rs.map(r=>r.c).join(',');if(countryGraphGame===G&&countryGraphKey===key)return countryGraph;const graph=new Map(G.cs.map(c=>[c.id,new Set<number>()]));for(const pair of BORDERS){const [a,b]=pair.split(':').map(Number),ca=G.rs[a].c,cb=G.rs[b].c;if(ca!==cb){graph.get(ca).add(cb);graph.get(cb).add(ca);}}countryGraphGame=G;countryGraphKey=key;countryGraph=graph;return graph;}
const cAdj=(a: Country,b: Country)=>!!(a&&b&&countryAdjacency().get(a.id)?.has(b.id));
const atWar=(a: number,b: number)=>G.wars.find(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a));
const inWar=(c: Country)=>G.wars.some(w=>w.a===c.id||w.b===c.id);
const leads=(p: Person)=>G.cs.find(c=>c.alive&&c.leader===p.id);
function nextIn(c: Country,mod: number,rem: number){for(let i=1;i<=mod;i++)if((G.turn+i+c.off)%mod===rem)return i;return mod}
const natElect=(c: Country)=>c.reg==='cum'||c.reg==='fed', locElect=(c: Country)=>c.reg!=='cun';
/* kişi sisteme girerken destek tablosu */
function seedSup(p: Person){const c=cOf(p);G.rs.forEach(r=>{r.sup=r.c===c.id?4:1});
 const set=(v: number)=>crs(c).forEach(r=>r.sup=v);
 if(p.pos==='lider')set(c.appr);else if(p.pos==='muhalefet')set(30);else if(p.pos==='general'||p.pos==='bakanNPC')set(16);else if(p.pos==='parti')set(14);
 if(p.pos==='belediye'){set(10);G.rs[p.r].sup=45}if(p.pos==='vali'){set(12);G.rs[p.r].sup=52}
 if(p.pos==='bakanNPC')p.pos='bakan';
 p.ai=false;}
/* ---------- oyuncu değişim yardımcıları ---------- */
let TOAST:string[]=[];
const LBL:Partial<Record<NumericPersonKey,string>>={fame:'Tanınırlık',rep:'İtibar',org:'Örgüt',money:'Para',speech:'Hitabet',lead:'Liderlik',health:'Sağlık'};
function D(o:Partial<Record<NumericPersonKey,number>>){const p=me();for(const k of Object.keys(o) as NumericPersonKey[]){if(k==='money')p.money=Math.max(0,p.money+o[k]);else p[k]=cl(p[k]+o[k]);const v=r0(o[k]);if(v)TOAST.push(`${LBL[k]} ${v>0?'+':''}${v}`)}}
function S(rs: Region[],n: number){rs.forEach(r=>r.sup=cl(r.sup+n));TOAST.push(`Destek ${n>0?'+':''}${r0(n)}`)}
const T=(t: string)=>TOAST.push(t);
function becomeLeader(p: Person,c: Country,how: string){const old=P(c.leader);if(old&&old.id!==p.id)old.pos='eski';
 clearOffice(p);c.leader=p.id;p.pos='lider';p.r=c.cap;p.cand=null;p.legacy+=40;
 if(natSup(p,c)<c.appr)crs(c).forEach(r=>r.sup=Math.max(r.sup,c.appr));
 hist(p,`${ltitle(c)} oldu (${how})`);say(`${p.name}, ${how} yoluyla ${full(c)} yönetimini devraldı.`)}
function clearOffice(p: Person){G.rs.forEach(r=>{if(r.gov===p.id)r.gov=mkP({r:r.id,pos:'vali'}).id;if(r.mayor===p.id)r.mayor=mkP({r:r.id,pos:'belediye'}).id})}
let makeCountry = function(r: Region,leaderId: number,parent: number){G.extra++;const id=G.cs.length,c={id,n:r.n,reg:'cum',col:EXTRA[(G.extra-1)%EXTRA.length],tax:2,T:30,econ:r.wealth,stab:45,appr:55,army:25,rel:{},allies:[],trade:[],off:rint(0,7),alive:true,cap:r.id,min:{}} as Country;
 G.cs.push(c);c.leader=leaderId;c.gen=mkP({r:r.id,pos:'general',job:'Subay'}).id;const o=mkP({r:r.id,pos:'muhalefet'});o.party=IDEO[o.ideo];c.opp=o.id;
 for(const k of keysOf(MINN))c.min[k]=mkP({r:r.id,pos:'bakanNPC'}).id;
 G.cs.forEach(o2=>{if(o2.id!==id){c.rel[o2.id]=o2.id===parent?-45:rint(-10,20);o2.rel[id]=c.rel[o2.id]}});
 r.c=id;r.auto=0;r.cen=50;return c}
let capture = function(r: Region,to: Country){const from=G.cs[r.c];r.c=to.id;r.loyal=25;r.auto=0;r.gov=mkP({r:r.id,pos:'vali'}).id;
 if(from.cap===r.id){const left=crs(from);if(left.length)from.cap=left[0].id}
 if(!crs(from).length){from.alive=false;G.wars=G.wars.filter(w=>w.a!==from.id&&w.b!==from.id);say(`${full(from)} tarih sahnesinden silindi.`)}
 updEcon(from);updEcon(to);}
/* ---------- dünya adımı ---------- */
function peace(a: number,b: number){G.wars=G.wars.filter(w=>!((w.a===a&&w.b===b)||(w.a===b&&w.b===a)))}
function declareWar(a: Country,b: Country){if(atWar(a.id,b.id))return;G.wars.push({a:a.id,b:b.id,front:0,t:0});a.rel[b.id]=b.rel[a.id]=-70;say(`${a.n}, ${b.n} ile savaşa girdi.`);
 b.allies.forEach(id=>{const x=G.cs[id];if(x&&x.alive&&x.id!==a.id&&!atWar(a.id,id)&&G.wars.length<4&&chance(50)){G.wars.push({a:a.id,b:id,front:0,t:0});say(`${x.n}, müttefiki ${b.n} için savaşa katıldı.`)}})}
let worldStep = function(){
 const p=me(),mine=leads(p),neighborGraph=countryAdjacency();
 G.rs.forEach(r=>{const c=G.cs[r.c],war=inWar(c);
  r.wealth=cl(r.wealth+(r.infra-50)/110+(r.edu-50)/130+rnd(-.7,.7)-(war?.6:0)-(r.tax-2)*.2);
  r.infra=cl(r.infra+rnd(-.2,.35));r.edu=cl(r.edu+rnd(-.15,.3));r.pop=+Math.max(.3,r.pop*(1+rnd(-.002,.008))).toFixed(2);
  const tgt=50+(c.appr-50)*.5+r.auto*6-(c.tax-2)*8-(r.tax-2)*5;r.loyal=cl(r.loyal+(tgt-r.loyal)*.1+rnd(-1.5,1.5));
  r.bud+=r.wealth*r.pop*TAXF[r.tax]*.018*(1+r.auto*.5)*(1+r.adm/200);
  r.cen=cl(r.cen+rnd(-1.2,1.2));
  r.sup=cl(r.sup-.5);});
 alive().forEach(c=>{updEcon(c);const rs=crs(c),war=inWar(c),min=(k: MinisterKey)=>P(c.min[k])||{lead:40};
  const inc=rs.reduce((s,r)=>s+r.wealth*r.pop*TAXF[c.tax]*.05,0)*(1+min('eko').lead/250)+c.trade.length*4;
  const maintenance=Math.min(c.army*.15+3,Math.max(2,inc*.65))+(war?Math.min(8,inc*.3+2):0);c.T+=inc-maintenance;c.lastBudget={income:inc,maintenance,balance:inc-maintenance};
  const at=50+(c.econ-50)*.6+(c.stab-50)*.3-(c.tax-2)*11-(war?7:0)+(c.T<0?-10:0);c.appr=cl(c.appr+(at-c.appr)*.15+rnd(-2.2,2.2));
  const st=56+(c.appr-50)*.45+min('ici').lead/14-(war?10:0)-(c.reg==='cun'?5:0)-(c.T<0?12:0);c.stab=cl(c.stab+(st-c.stab)*.13+rnd(-2.2,2.2));
  c.army=cl(c.army+(min('sav').lead-50)/120-(war?1.4:0)+rnd(-.3,.3));
  if(c.id!==(mine&&mine.id)){
   if(c.T<20&&c.tax<3&&chance(30))c.tax++;else if(c.T>170&&c.tax>1&&chance(25))c.tax--;
   if(c.T>90&&chance(35)){c.T-=35;c.army=cl(c.army+5)}
   if(c.T>70&&chance(30)){c.T-=30;const r=pick(rs);r.infra=cl(r.infra+6);r.edu=cl(r.edu+3)}
  }
 });
 alive().forEach(c=>{if(mine&&c.id===mine.id)return;
  const n=alive().filter(o=>o.id!==c.id&&neighborGraph.get(c.id).has(o.id));if(!n.length)return;const o=pick(n);
  c.rel[o.id]=o.rel[c.id]=cl((c.rel[o.id]||0)+rnd(-7,6),-100,100);
  if(c.rel[o.id]<-35&&!atWar(c.id,o.id)&&G.wars.length<2&&c.army>o.army+2&&chance(c.reg==='cun'?30:c.reg==='kra'?18:10))declareWar(c,o);
  if(c.rel[o.id]>55&&!c.allies.includes(o.id)&&chance(10)){c.allies.push(o.id);o.allies.push(c.id);say(`${c.n} ve ${o.n} ittifak kurdu.`)}});
 alive().forEach(c=>{const ai=c.leader!==p.id;
  if(ai&&c.stab<12&&chance(14)&&c.gen!==p.id){const g=P(c.gen);c.leader=g.id;g.pos='lider';c.reg='cun';c.gen=mkP({r:c.cap,pos:'general',job:'Subay'}).id;c.stab=cl(c.stab+15);say(`${c.n} ordusu yönetime el koydu. Başa ${g.name} geçti.`)}
  if(!ai&&c.stab<10&&chance(18)&&c.reg!=='cun'){const g=P(c.gen);g.pos='lider';c.leader=g.id;c.reg='cun';c.gen=mkP({r:c.cap,pos:'general',job:'Subay'}).id;p.pos='eski';hist(p,'Askerî müdahaleyle görevden alındı');say(`${c.n} ordusu ${p.name} yönetimini devirdi.`);
   info('Darbe','Ordu seni devirdi',`İstikrar çöktü. ${g.name} yönetime el koydu. Artık sıradan bir yurttaş olarak devam ediyorsun.`)}
 });
 elections();
 G.ps.forEach(n=>{if(!n.alive)return;n.age+=.5;if(n.id!==G.pid&&n.age>58&&chance((n.age-58)*.25))n.alive=false});
 alive().forEach(c=>{
  if(!P(c.leader).alive){const n=mkP({r:c.cap,pos:'lider'});say(`${P(c.leader).name} öldü. ${full(c)} yönetimine ${n.name} geçti.`);c.leader=n.id;c.appr=cl(c.appr+rnd(-6,8))}
  if(!P(c.gen).alive)c.gen=mkP({r:c.cap,pos:'general',job:'Subay'}).id;
  if(!P(c.opp).alive||P(c.opp).pos==='eski'||P(c.opp).pos==='lider'){const o=mkP({r:c.cap,pos:natElect(c)?'muhalefet':'parti'});o.party=IDEO[o.ideo];c.opp=o.id}
  for(const k of keysOf(MINN))if(!P(c.min[k]).alive)c.min[k]=mkP({r:c.cap,pos:'bakanNPC'}).id;});
 G.rs.forEach(r=>{if(!P(r.gov).alive)r.gov=mkP({r:r.id,pos:'vali'}).id;if(!P(r.mayor).alive)r.mayor=mkP({r:r.id,pos:'belediye'}).id});
}
let elections = function(){const p=me(),pc=cOf(p);
 alive().forEach(c=>{const nat=natElect(c)&&(G.turn+c.off)%8===0,loc=locElect(c)&&(G.turn+c.off)%6===3,reg=natElect(c)&&(G.turn+c.off)%8===4;
  if(nat){
   if(c.leader===p.id)playerVote('ulusal',c,true);
   else if(c.id===pc.id&&p.cand==='ulusal')playerVote('ulusal',c,false);
   else if(c.leader!==p.id){const inc=P(c.leader);if(!chance(c.appr+8)){const o=P(c.opp);if(o.id===p.id){}else{inc.pos='eski';c.leader=o.id;o.pos='lider';c.appr=cl(c.appr+10);say(`${c.n} seçimlerinde ${o.name} iktidara geldi.`)}}}
   if(c.id===pc.id&&p.pos==='bakan'&&c.leader!==p.id&&p.cand!=='ulusal'){p.pos=p.party?'parti':'vatandas'}
  }
  if(loc&&c.id===pc.id){const r=G.rs[p.r];if(r.mayor===p.id)playerVote('belediye',c,true);else if(p.cand==='belediye')playerVote('belediye',c,false)}
  if(reg&&c.id===pc.id){const r=G.rs[p.r];if(r.gov===p.id)playerVote('vali',c,true);else if(p.cand==='vali')playerVote('vali',c,false)}
 });
}
function playerVote(kind: string,c: Country,inc: boolean){const p=me(),r=G.rs[p.r],sup=kind==='ulusal'?natSup(p,c):r.sup;
 let you,riv;
 if(kind==='ulusal'){you=sup*.72+p.org*.15+p.speech*.1+(p.party?5:0)+rnd(-7,7);riv=inc?34+rnd(-6,6):27+c.appr*.36+rnd(-6,6)}
 else{you=sup*.75+p.org*.13+p.speech*.1+rnd(-7,7);riv=(inc?26:22+r.loyal*.2)+rnd(-6,6)}
 const share=you/(you+riv)*100,win=you>riv,nm={ulusal:'Genel seçim',belediye:'Belediye seçimi',vali:'Bölge seçimi'}[kind];
 const place=kind==='ulusal'?c.n:r.n;p.cand=null;
 const bars={you:share,riv:100-share};
 if(win){
  if(inc){p.legacy+=5;info(nm,'Görevi korudun',`${place} halkı sana yeniden güvendi.`,{bars});hist(p,`${nm} yeniden kazanıldı`);return}
  if(kind==='ulusal'){becomeLeader(p,c,'seçim');info(nm,'Seçimi kazandın',`Artık ${full(c)} senin yönetiminde. Devlet sekmesi açıldı.`,{bars});G.tab='devlet'}
  if(kind==='belediye'){clearOffice(p);r.mayor=p.id;p.pos='belediye';p.legacy+=8;hist(p,`${r.n} belediye başkanı oldu`);say(`${p.name}, ${r.n} belediye başkanı seçildi.`);info(nm,'Belediye senin',`${r.n} kentini yöneteceksin. Bölge sekmesinde yerel yetkilerin açıldı.`,{bars})}
  if(kind==='vali'){clearOffice(p);r.gov=p.id;p.pos='vali';p.legacy+=15;hist(p,`${r.n} bölge yöneticisi oldu`);say(`${p.name}, ${r.n} bölge yöneticisi seçildi.`);info(nm,'Bölge senin',`Bütçeyi, vergileri ve merkezle ilişkileri artık sen belirliyorsun.`,{bars})}
  return}
 if(inc){
  if(kind==='ulusal'){const o=P(c.opp);o.pos='lider';c.leader=o.id;p.pos=p.party?'muhalefet':'eski';c.opp=p.party?p.id:c.opp;hist(p,'Seçimi kaybetti ve görevi bıraktı');say(`${o.name} seçimi kazandı, ${p.name} görevi bıraktı.`);info(nm,'Seçimi kaybettin',`Görevi ${o.name} devraldı. Karakterin yaşamaya devam ediyor.`,{bars})}
  else{clearOffice(p);p.pos=p.party?'parti':'vatandas';hist(p,`${place} seçimini kaybetti`);info(nm,'Görevi kaybettin',`${place} başka bir ismi seçti.`,{bars})}
  return}
 if(kind==='ulusal'&&share>=36)G.q.push({id:'e_koalisyon',bars});
 else info(nm,'Kazanamadın',`Oyların %${r0(share)} kadarını aldın. Örgütünü büyütüp yeniden deneyebilirsin.`,{bars});
}
/* ---------- olay kartları ---------- */
const EV:Record<string,EventCard>={
 e_koalisyon:{k:'Genel seçim',t:'Koalisyon teklifi',x:p=>`Seçimi kazanamadın ama iktidar senin oylarına muhtaç. Hükûmete katılabilirsin.`,c:[
  {t:'Hükûmete katıl',n:'Koalisyon ortağı olursun',f(p){clearOffice(p);p.pos='bakan';p.legacy+=12;hist(p,'Koalisyonla hükûmete girdi');D({fame:6});S(crs(cOf(p)),3)}},
  {t:'Muhalefette kal',n:'Halk desteği artar',f(p){p.pos='muhalefet';cOf(p).opp=p.id;D({rep:5});S(crs(cOf(p)),4)}}]},
 e_istifa:{k:'Anayasal kriz',t:'Yönetim istifa etti',x:p=>`${cOf(p).n} yönetimi krizi aşamadı ve çekildi. Hükûmeti kurma görevi sana teklif ediliyor.`,c:[
  {t:'Görevi kabul et',n:'Devletin başına geçersin',f(p){const c=cOf(p);if(c.reg==='kra'||c.reg==='cun')c.reg='cum';becomeLeader(p,c,'anayasal kriz');G.tab='devlet'}},
  {t:'Reddet',n:'İtibarın artar',f(p){D({rep:6})}}]},
 e_rusvet:{k:'Kapalı kapılar',t:'Zengin bir iş insanı kapını çaldı',x:()=>'Kampanyana büyük bir bağış öneriyor. Karşılığında bir ihale istiyor.',cond:p=>p.pos!=='vatandas'&&p.pos!=='uye',c:[
  {t:'Parayı al',n:'+25 para, itibar düşer',f(){D({money:25,rep:-8})}},{t:'Reddet',n:'İtibarın artar',f(){D({rep:5})}}]},
 e_roportaj:{k:'Basın',t:'Yerel gazete röportaj istiyor',x:()=>'Sorular sert olacak. Ne kadar açık konuşacaksın?',c:[
  {t:'Açık konuş',n:'Tanınırsın, risklidir',f(p){D(chance(60)?{fame:7,rep:2}:{fame:5,rep:-4})}},{t:'Temkinli konuş',n:'Az ama güvenli',f(){D({fame:2,rep:1})}}]},
 e_saglik:{k:'Sağlık',t:'Doktor uyarıyor',x:()=>'Yoğun tempo vücudunu yıpratıyor. Bir süre yavaşlaman öneriliyor.',cond:p=>p.age>=40,c:[
  {t:'Tedavi ol',n:'-8 para, sağlık artar',f(){D({money:-8,health:14})}},{t:'Çalışmaya devam et',n:'Sağlık düşer',f(){D({health:-8,org:3})}}]},
 e_dost:{k:'Eski dost',t:'Eski bir arkadaşın yardım istiyor',x:()=>'İşini kaybetmiş. Senden borç istiyor.',c:[
  {t:'Yardım et',n:'-6 para, itibar artar',f(p){D({money:-6,rep:4})}},{t:'Geri çevir',n:'Bir şey değişmez',f(){}}]},
 e_sizinti:{k:'Sızıntı',t:'Eline gizli bir belge geçti',x:p=>`${cOf(p).n} yönetiminin kirli bir ihalesi belgelenmiş.`,cond:p=>['hareket','parti','muhalefet'].includes(p.pos),c:[
  {t:'Kamuoyuna açıkla',n:'İstikrar düşer, destek artar',f(p){const c=cOf(p);c.stab=cl(c.stab-8);c.appr=cl(c.appr-6);D({fame:8});S(crs(c),4)}},{t:'Pazarlık kozu yap',n:'Para gelir, itibar düşer',f(){D({money:15,rep:-5})}}]},
 e_baski:{k:'Baskı',t:'Örgütüne baskı başladı',x:()=>'Toplantıların yasaklandı, üyelerin izleniyor.',cond:p=>['cun','kra'].includes(cOf(p).reg)&&['hareket','parti'].includes(p.pos),c:[
  {t:'Yeraltına çekil',n:'Örgüt küçülür, güvendesin',f(){D({org:-6})}},{t:'Meydan oku',n:'Tanınırsın, hapis riski',f(p){D({fame:8});if(chance(35)){p.jail=2;T('Hapse girdin')}}}]},
 e_sel:{k:'Felaket',t:'Bölgende sel oldu',x:p=>`${G.rs[p.r].n} sular altında. İnsanlar yardım bekliyor.`,cond:p=>['vali','belediye'].includes(p.pos),c:[
  {t:'Bütçeden yardım et',n:'-15 bütçe, destek artar',f(p){const r=G.rs[p.r];r.bud=Math.max(0,r.bud-15);S([r],7)}},{t:'Merkezden iste',n:'Merkez ilişkisi düşer',f(p){const r=G.rs[p.r];r.cen=cl(r.cen-8);r.infra=cl(r.infra-3)}}]},
 e_grev:{k:'Grev',t:'Belediye çalışanları iş bıraktı',x:()=>'Sendika zam istiyor. Kent durma noktasına geliyor.',cond:p=>['vali','belediye'].includes(p.pos),c:[
  {t:'Zam ver',n:'-10 bütçe, destek artar',f(p){const r=G.rs[p.r];r.bud=Math.max(0,r.bud-10);S([r],4)}},{t:'Geri adım atma',n:'Destek düşer',f(p){const r=G.rs[p.r];S([r],-5);r.adm=cl(r.adm+3)}}]},
 e_merkez:{k:'Merkez',t:'Merkezî hükûmet daha fazla pay istiyor',x:()=>'Bölgenin gelirinden daha büyük bir pay talep ediliyor.',cond:p=>p.pos==='vali',c:[
  {t:'Kabul et',n:'-12 bütçe, ilişki düzelir',f(p){const r=G.rs[p.r];r.bud=Math.max(0,r.bud-12);r.cen=cl(r.cen+12)}},{t:'Karşı çık',n:'Siyasi kriz riski',f(p){const r=G.rs[p.r];r.cen=cl(r.cen-15);S([r],5)}}]},
 e_komplo:{k:'İstihbarat',t:'Generaller arasında komplo söylentisi',x:p=>`Raporlara göre ${P(leads(p).gen).name} sana karşı örgütleniyor.`,cond:p=>p.pos==='lider',c:[
  {t:'Generali görevden al',n:'Ordu zayıflar, tehdit biter',f(p){const c=leads(p);c.gen=mkP({r:c.cap,pos:'general',job:'Subay'}).id;c.army=cl(c.army-6);T('Yeni general atandı')}},{t:'Ödenekle gönlünü al',n:'-25 hazine, ordu güçlenir',f(p){const c=leads(p);c.T-=25;c.army=cl(c.army+4);T('Hazine -25')}}]},
 e_kriz:{k:'Ekonomi',t:'Piyasalarda panik',x:()=>'Yatırımcılar çekiliyor, fiyatlar hızla yükseliyor.',cond:p=>p.pos==='lider',c:[
  {t:'Kemer sık',n:'Halk desteği düşer, hazine korunur',f(p){const c=leads(p);c.appr=cl(c.appr-8);c.T+=25;T('Hazine +25')}},{t:'Para bas',n:'Bugün rahatlar, zenginlik düşer',f(p){const c=leads(p);c.appr=cl(c.appr+4);crs(c).forEach(r=>r.wealth=cl(r.wealth-3));T('Zenginlik düştü')}}]},
 e_protesto:{k:'Sokaklar',t:'Başkentte büyük gösteriler',x:()=>'On binlerce kişi meydanda. Taleplerini duymanı istiyorlar.',cond:p=>p.pos==='lider',c:[
  {t:'Temsilcileri kabul et',n:'Destek artar, istikrar düşer',f(p){const c=leads(p);c.appr=cl(c.appr+7);c.stab=cl(c.stab-3);T('Halk desteği +7')}},{t:'Polisle dağıt',n:'İstikrar artar, destek düşer',f(p){const c=leads(p);c.stab=cl(c.stab+5);c.appr=cl(c.appr-10);D({rep:-6})}}]},
 e_sinir:{k:'Sınır',t:'Komşu devletle sınır gerginliği',x:p=>`Sınırda askerî devriyeler karşı karşıya geldi.`,cond:p=>p.pos==='lider'&&alive().some(o=>o.id!==leads(p).id&&cAdj(leads(p),o)),c:[
  {t:'Diplomatik çözüm',n:'İlişkiler korunur',f(p){const c=leads(p);alive().filter(o=>o.id!==c.id&&cAdj(c,o)).forEach(o=>{c.rel[o.id]=o.rel[c.id]=cl((c.rel[o.id]||0)+5,-100,100)});T('Komşu ilişkileri +5')}},{t:'Güç göster',n:'Ordu moral bulur, ilişkiler bozulur',f(p){const c=leads(p);c.army=cl(c.army+4);alive().filter(o=>o.id!==c.id&&cAdj(c,o)).forEach(o=>{c.rel[o.id]=o.rel[c.id]=cl((c.rel[o.id]||0)-10,-100,100)});T('Ordu +4')}}]}
};
function drawEvent(){const p=me();
 const c=cOf(p);
 if(!G.q.length&&c.stab<22&&c.leader!==p.id&&(['muhalefet','bakan'].includes(p.pos)||(p.party&&natSup(p)>=25))&&chance(30)){G.q.push({id:'e_istifa'});return}
 if(G.q.length||!chance(48))return;
 const ks=Object.keys(EV).filter(k=>!['e_koalisyon','e_istifa'].includes(k)&&(!EV[k].cond||EV[k].cond(p)));
 if(ks.length)G.q.push({id:pick(ks)});
}
/* ---------- dönem sonu ---------- */
let endTurn = function(){if(G.q.length||ui.sheet)return;const p=me();G.turn++;
 const off={belediye:3,vali:5,bakan:6,lider:10,general:5,muhalefet:2}[p.pos]||0;p.money+=off;
 worldStep();operationsStep();unrestStep();syncPlayer();
 p.fame=cl(p.fame-.4);if(p.age>50)p.health=cl(p.health-.5);p.health=cl(p.health+(p.age<50?.5:0));
 if(p.pos==='lider'){const c=leads(p);if(c)crs(c).forEach(r=>r.sup=r.sup+(c.appr-r.sup)*.25)}
 if(p.pos==='vali'||p.pos==='belediye'){const r=G.rs[p.r];r.sup=r.sup+(r.loyal*.5+r.infra*.3+r.wealth*.2-r.sup)*.08}
 Object.keys(p.cool).forEach(k=>{if(--p.cool[k]<=0)delete p.cool[k]});
 if(p.jail>0){p.jail--;if(!p.jail)info('Özgürlük','Hapisten çıktın','Tanınırlığın arttı, ama örgütün zayıfladı.')}
 const dc=p.age>60?(p.age-60)*.28+(100-p.health)*.03:(p.health<12?5:0);
 if(p.alive&&(chance(dc)||p.health<=0)){die(p);}
 else{drawEvent();}
 G.ap=p.jail?0:(p.pos==='lider'?3:2);ui.flash=dateStr();save();render();}
function syncPlayer(){const p=me();
 if(p.pos==='lider'&&!leads(p)){p.pos='eski';hist(p,'Devleti ortadan kalktı');info('Yıkılış','Devletin düştü','Ülkenin son toprakları da kaybedildi. Yaşamına sıradan bir yurttaş olarak devam ediyorsun.')}
 const m=leads(p);if(m&&G.rs[p.r].c!==m.id)p.r=m.cap;
 if(p.pos==='vali'&&G.rs[p.r].gov!==p.id){p.pos=p.party?'parti':'vatandas';hist(p,'Bölge yönetimini kaybetti');info('Görev','Bölge elinden gitti',`${G.rs[p.r].n} artık ${full(cOf(p))} toprağı.`)}
 if(p.pos==='belediye'&&G.rs[p.r].mayor!==p.id){p.pos=p.party?'parti':'vatandas'}
}
function die(p: Person){p.alive=false;const c=cOf(p);hist(p,'Hayatını kaybetti');say(`${p.name} ${Math.floor(p.age)} yaşında öldü.`);
 const m=leads(p);if(m){const n=mkP({r:m.cap,pos:'lider'});m.leader=n.id}clearOffice(p);
 G.q=[{id:'death',pid:p.id}];}
/* ---------- eylemler ---------- */
function A(id:string,title:string,desc:string,o:Partial<Action>={}):Action{return Object.assign({id,title,desc,ap:1,cost:0},o)}
let charA = function():Action[]{const p=me(),c=cOf(p),r=G.rs[p.r],out=[];const reg=c.reg;
 const elect=(kind: string)=>({belediye:nextIn(c,6,3),vali:nextIn(c,8,4),ulusal:nextIn(c,8,0)}[kind]);
 if(p.pos!=='lider')out.push(A('work','Çalış',`${p.job} olarak para kazan.`,{run(){D({money:r0(JOBS[p.job]*(1+p.edu*.25)+rnd(0,3))})}}));
 out.push(A('study',`Eğitim: ${EDU[Math.min(4,p.edu+1)]}`,'Hitabetin ve liderliğin gelişir.',{cost:8+p.edu*5,lock:p.edu>=4?'En yüksek eğitimdesin':null,run(){p.edu++;D({speech:4,lead:4});hist(p,EDU[p.edu]+' eğitimini tamamladı')}}));
 out.push(A('meet','Halk toplantısı',`${r.n} halkıyla buluş.`,{run(){S([r],r0(rnd(3,6)+p.speech/30));D({rep:1,fame:1})}}));
 out.push(A('talk','Siyasi konuşma','Sesini daha geniş kitlelere duyur.',{run(){D({fame:r0(rnd(3,6)+p.speech/25),speech:1});if(reg==='cun'&&chance(15)){p.jail=1;T('Gözaltına alındın')}}}));
 if(p.pos==='vatandas')out.push(A('join','Bir harekete katıl','Yerel bir siyasi harekette görev al.',{lock:p.fame<6?'Tanınırlık 6 gerekli':null,run(){p.pos='uye';hist(p,'Siyasi harekete katıldı');D({org:6,fame:2})}}));
 if(p.pos==='vatandas'||p.pos==='uye')out.push(A('move','Kendi hareketini kur','Destekçilerini bir çatı altında topla.',{lock:p.fame<15?'Tanınırlık 15 gerekli':null,run(){p.pos='hareket';hist(p,'Kendi siyasi hareketini kurdu');D({org:10,fame:4,lead:2});p.legacy+=3}}));
 if(['hareket','belediye','vali','bakan'].includes(p.pos)&&!p.party)out.push(A('party','Parti kur',reg==='cun'?'Askerî yönetimde partiler yasak.':'Seçime girmek için resmî parti gerekir.',{cost:20,lock:reg==='cun'?'Bu rejimde yasak':p.org<25?'Örgüt 25 gerekli':null,run(){p.party=IDEO[p.ideo];if(p.pos==='hareket')p.pos='parti';hist(p,p.party+' kuruldu');D({org:10,fame:5});p.legacy+=5}}));
 if(p.party||['hareket','uye'].includes(p.pos))out.push(A('org','Teşkilat büyüt','Örgütün ve ülke genelinde desteğin artar.',{cost:5,run(){D({org:r0(rnd(5,9)+p.lead/30)});S(crs(c),2)}}));
 if(['hareket','parti','muhalefet'].includes(p.pos)||p.party)out.push(A('ally','Siyasi ittifak kur','Başka gruplarla ortak hareket et.',{lock:p.cool.ally?`${p.cool.ally} dönem sonra`:p.org<20?'Örgüt 20 gerekli':null,run(){p.cool.ally=6;S(crs(c),5);D({org:5,rep:-1})}}));
 if(['hareket','parti','muhalefet'].includes(p.pos))out.push(A('prot','Toplumsal hareket başlat','Meydanları doldur. İstikrar düşer.',{lock:p.org<30?'Örgüt 30 gerekli':null,run(){S(crs(c),4);D({fame:8});c.stab=cl(c.stab-6);c.appr=cl(c.appr-3);T('Ülke istikrarı -6');if(reg==='cun'&&chance(30)||reg==='kra'&&chance(15)){p.jail=3;T('Hapse girdin')}}}));
 if(locElect(c)&&!['belediye','vali','lider'].includes(p.pos)&&p.cand!=='belediye')out.push(A('c:belediye',`${r.n} belediye adayı ol`,`Seçime ${elect('belediye')} dönem var.`,{lock:p.fame<15?'Tanınırlık 15 gerekli':r.sup<15?'Bölge desteği 15 gerekli':null,run(){p.cand='belediye';T('Aday oldun')}}));
 if(natElect(c)&&!['vali','lider'].includes(p.pos)&&p.cand!=='vali')out.push(A('c:vali',`${r.n} bölge seçimine gir`,`Seçime ${elect('vali')} dönem var.`,{lock:p.fame<30?'Tanınırlık 30 gerekli':r.sup<30?'Bölge desteği 30 gerekli':null,run(){p.cand='vali';T('Aday oldun')}}));
 if(!natElect(c)&&!['vali','lider'].includes(p.pos))out.push(A('appoint','Yöneticiliğe atanma iste','Bu rejimde bölgeleri saray veya konsey atar.',{lock:p.rep<50?'İtibar 50 gerekli':p.cool.app?`${p.cool.app} dönem sonra`:null,tag:`%${r0(cl(p.rep*.6+p.lead*.2-5,5,80))}`,run(){p.cool.app=4;if(chance(cl(p.rep*.6+p.lead*.2-5,5,80))){clearOffice(p);r.gov=p.id;p.pos='vali';p.legacy+=15;hist(p,`${r.n} bölge yöneticiliğine atandı`);T('Atandın')}else T('Başvurun reddedildi')}}));
 if(natElect(c)&&p.pos!=='lider'&&p.cand!=='ulusal')out.push(A('c:ulusal','Genel seçimde aday ol',`Seçime ${elect('ulusal')} dönem var.`,{lock:!p.party?'Parti gerekli':p.fame<40?'Tanınırlık 40 gerekli':null,run(){p.cand='ulusal';T('Aday oldun')}}));
 if(natElect(c)&&p.party&&p.pos!=='lider')out.push(A('gensoru','Parlamentoda güven oylaması','Yönetimi meclis çoğunluğuyla düşür.',{lock:natSup(p)<40?'Ülke desteği 40 gerekli':c.appr>=45?'Yönetim desteği 45 altına inmeli':null,tag:`%${r0(cl(natSup(p)-c.appr/2+p.lead/4,5,85))}`,run(){p.cool.gen=1;if(chance(cl(natSup(p)-c.appr/2+p.lead/4,5,85))){becomeLeader(p,c,'meclis güvenoyu');G.tab='devlet';T('Hükûmeti devraldın')}else{D({rep:-4});T('Oylama kaybedildi')}}}));
 if(p.pos==='bakan')out.push(A('devral','Hükûmeti devral','Koalisyon krizinde başbakanlığı talep et.',{lock:c.stab>=35?'İstikrar 35 altına inmeli':null,run(){becomeLeader(p,c,'hükûmet krizi');G.tab='devlet'}}));
 if(p.pos!=='lider'){const pw=p.pos==='general'?35+p.lead*.5-c.stab*.45:p.org>=60?natSup(p)*.5+p.org*.25-c.stab*.5+10:0,ch=r0(cl(pw,5,85));
  out.push(A('coup',p.pos==='general'?'Yönetime el koy':'Devrim başlat','Başarısız olursan hapse girersin.',{lock:p.pos==='general'?null:(p.org<60?'Örgüt 60 gerekli':p.fame<50?'Tanınırlık 50 gerekli':null),tag:`%${ch}`,run(){if(chance(ch)){c.stab=cl(c.stab-18);const pre=p.pos==='general';if(pre)c.gen=mkP({r:c.cap,pos:'general',job:'Subay'}).id;c.reg=pre?'cun':'cum';becomeLeader(p,c,pre?'askerî müdahale':'devrim');G.tab='devlet';T('İktidar senin')}else{p.jail=4;D({org:-15,fame:6,rep:-4});hist(p,'İktidar girişimi başarısız oldu, hapse girdi');say(`${p.name} başarısız bir girişim sonrası hapsedildi.`);T('Hapse girdin')}}}));}
 out.push(A('rest','Dinlen','Sağlığını toparla.',{lock:p.health>=95?'Sağlığın iyi':null,run(){D({health:12})}}));
 if(p.pos==='lider')out.push(A('quit','Görevi bırak','Sıradan yurttaş olarak yaşamaya devam et.',{run(){const m=leads(p),n=mkP({r:m.cap,pos:'lider'});m.leader=n.id;p.pos='eski';hist(p,'Görevini kendi isteğiyle bıraktı');say(`${p.name} görevi ${n.name} adlı isme devretti.`)}}));
 if(['vali','belediye'].includes(p.pos))out.push(A('quit2','Görevi bırak','Yerel görevden çekil.',{run(){clearOffice(p);p.pos=p.party?'parti':'vatandas';hist(p,'Yerel görevini bıraktı')}}));
 return out;}
function regionA():Action[]{const p=me(),r=G.rs[p.r],c=cOf(p),out=[];
 if(p.pos==='vali'||p.pos==='belediye'){const v=p.pos==='vali';
  if(v){const b=(id:string,t:string,d:string,k:'wealth'|'infra'|'edu')=>out.push(A(id,t,d,{cost2:14,run(){r[k]=cl(r[k]+6);r.bud-=14;S([r],2)}}));
   b('i:edu','Eğitime yatırım','Okullar ve burslar. Zenginliği uzun vadede artırır.','edu');b('i:infra','Altyapıya yatırım','Yol, su ve enerji.','infra');
   out.push(A('i:eco','Yerel ekonomi teşviki','Esnaf ve üretimi destekle.',{cost2:18,run(){r.wealth=cl(r.wealth+5);r.bud-=18;S([r],1)}}));
   out.push(A('i:adm','Yerel kadro kur','Yetkin yöneticiler atanır, gelir artar.',{cost2:10,run(){r.adm=cl(r.adm+10);r.bud-=10;T('Kadro +10')}}));
   out.push(A('i:cen','Merkezle görüş',`${ltitle(c)} ile ilişkiyi onar.`,{run(){r.cen=cl(r.cen+10);T('Merkez ilişkisi +10')}}));
   const ch=r0(cl(r.sup*.6+r.cen*.25-r.auto*18,5,85));
   out.push(A('i:auto','Özerklik talep et',`Şu an: ${AUTON[r.auto]}.`,{tag:`%${ch}`,lock:r.auto>=3?'En yüksek seviyede':p.cool.auto?`${p.cool.auto} dönem sonra`:null,run(){p.cool.auto=3;if(chance(ch)){r.auto++;hist(p,`${r.n} için ${AUTON[r.auto].toLowerCase()} statü kazandı`);p.legacy+=6;T('Özerklik kazanıldı')}else{r.cen=cl(r.cen-12);T('Merkez reddetti')}}}));
   const ic=r0(cl(r.sup*.65+r.auto*12+r.wealth*.1-c.army*.3,5,90));
   out.push(A('i:ind','Bağımsızlık ilan et','Yeni bir devlet kurarsın. Savaş çıkabilir.',{tag:`%${ic}`,lock:crs(c).length<2?'Ülkenin tek bölgesi':r.id===c.cap?'Başkent ayrılamaz':r.auto<1&&r.sup<60?'Özerklik veya destek 60 gerekli':null,run(){if(chance(ic)){const nc=makeCountry(r,p.id,c.id);p.pos='lider';r.gov=mkP({r:r.id,pos:'vali'}).id;nc.appr=cl(r.sup);nc.stab=50;p.legacy+=50;hist(p,`${r.n} bağımsızlığını ilan etti, ${ltitle(nc)} oldu`);say(`${r.n} bağımsız oldu: ${full(nc)}.`);if(chance(55-r.auto*10))declareWar(c,nc);G.tab='devlet';T('Bağımsız bir devletsin')}else{r.cen=0;S([r],-10);p.jail=2;T('İlan bastırıldı, hapistesin')}}}));
  } else {
   out.push(A('m:city','Kent hizmetlerini iyileştir','Yollar, parklar, toplu taşıma.',{cost2:10,run(){r.infra=cl(r.infra+3);r.bud-=10;S([r],4)}}));
   out.push(A('m:land','Halk günü düzenle','Vatandaşın sorunlarını yerinde dinle.',{run(){S([r],4);D({rep:2})}}));
  }}
 return out;}
function stateA():Action[]{const p=me(),c=leads(p);if(!c)return[];const out=[],rs=crs(c);
 const b=(id:string,t:string,d:string,cost:number,f:()=>void)=>out.push(A(id,t,d,{cost3:cost,run(){c.T-=cost;f()}}));
 b('s:army','Orduyu güçlendir','Savunma ve caydırıcılık.',40,()=>{c.army=cl(c.army+7);T('Ordu +7')});
 b('s:edu','Eğitim seferberliği','Tüm bölgelerde eğitim yükselir.',40,()=>{rs.forEach(r=>r.edu=cl(r.edu+4));T('Eğitim +4')});
 b('s:inf','Altyapı programı','Yollar ve enerji hatları.',40,()=>{rs.forEach(r=>r.infra=cl(r.infra+4));T('Altyapı +4')});
 b('s:wel','Sosyal destek paketi','Halk desteği kısa sürede yükselir.',30,()=>{c.appr=cl(c.appr+9);T('Halk desteği +9')});
 if(natElect(c))out.push(A('s:early','Erken seçim','Bir sonraki dönem seçim yapılır.',{lock:G.turn<4?'Henüz erken':null,run(){c.off=(8-(G.turn+1)%8)%8;T('Seçim kararı alındı')}}));
 return out;}
function sheetA():Action[]{const p=me(),c=leads(p),out:Action[]=[];if(!c)return out;
 alive().filter(o=>o.id!==c.id).forEach(o=>{const near=cAdj(c,o),w=atWar(c.id,o.id),rel=c.rel[o.id]||0;
  out.push(A('d:vis:'+o.id,'Resmî ziyaret','İlişki +12',{run(){c.rel[o.id]=o.rel[c.id]=cl(rel+12+P(c.min.dis).lead/20,-100,100);T('İlişki arttı')}}));
  out.push(A('d:tra:'+o.id,'Ticaret anlaşması','Her dönem hazineye +4',{lock:rel<15?'İlişki 15 gerekli':c.trade.includes(o.id)?'Anlaşma var':null,run(){c.trade.push(o.id);o.trade.push(c.id);T('Anlaşma imzalandı')}}));
  out.push(A('d:all:'+o.id,'İttifak öner','Savaşta karşılıklı destek',{lock:rel<45?'İlişki 45 gerekli':c.allies.includes(o.id)?'Zaten müttefik':null,run(){c.allies.push(o.id);o.allies.push(c.id);say(`${c.n} ve ${o.n} ittifak kurdu.`);T('İttifak kuruldu')}}));
  if(w)out.push(A('d:pea:'+o.id,'Barış teklif et','Savaşı bitir',{tag:`%${r0(cl(55+(c.army-o.army)*.6,15,90))}`,run(){if(chance(cl(55+(c.army-o.army)*.6,15,90))){peace(c.id,o.id);c.rel[o.id]=o.rel[c.id]=-20;say(`${c.n} ile ${o.n} barış imzaladı.`);T('Barış sağlandı')}else T('Teklif reddedildi')}}));
  else out.push(A('d:war:'+o.id,'Savaş ilan et',`Ordun ${r0(c.army)}, onların ${r0(o.army)}`,{lock:!near?'Komşun değil':c.allies.includes(o.id)?'Müttefikin':null,run(){declareWar(c,o);T('Savaş başladı')}}));});
 for(const k of keysOf(MINN))[0,1,2].forEach(i=>out.push(A(`mn:${k}:${i}`,'Ata','',{run(){const n=ui.cand[i];c.min[k]=mkP({r:c.cap,pos:'bakanNPC',name:n.name,lead:n.lead,seed:n.seed}).id;T(`${n.name} atandı`)}})));
 (['cum','fed','kra','cun'] as const).forEach(g=>out.push(A('reg:'+g,REGN[g],'',{lock:c.reg===g?'Mevcut rejim':null,run(){c.reg=g;c.stab=cl(c.stab-20);p.legacy+=20;if(g==='fed')crs(c).forEach(r=>r.auto=Math.max(1,r.auto));hist(p,`Rejimi değiştirdi: ${REGN[g]}`);say(`${c.n} rejimi değişti: ${REGN[g]}.`);T('İstikrar -20')}})));
 G.rs.filter(r=>r.c===c.id).forEach(r=>{
  out.push(A('r:gov:'+r.id,'Yönetici değiştir','Yeni yönetici atarsın.',{run(){r.gov=mkP({r:r.id,pos:'vali'}).id;r.loyal=cl(r.loyal+5);T('Yönetici atandı')}}));
  out.push(A('r:aut:'+r.id,'Özerklik tanı',`Şu an: ${AUTON[r.auto]}.`,{lock:r.auto>=3?'En yüksek seviyede':null,run(){r.auto++;r.loyal=cl(r.loyal+8);T('Özerklik verildi')}}));
  out.push(A('r:inv:'+r.id,'Bölgeye yatırım','Altyapı ve zenginlik artar.',{cost3:15,run(){c.T-=15;r.infra=cl(r.infra+5);r.wealth=cl(r.wealth+3);T('Yatırım yapıldı')}}));});
 return out;}
function moveA():Action[]{const p=me(),r=G.rs[G.sel];return r.id===p.r||p.pos==='lider'||p.pos==='vali'||p.pos==='belediye'?[]:[A('mv:'+r.id,'Buraya taşın',`${full(G.cs[r.c])} vatandaşı olursun.`,{cost:5,run(){const old=cOf(p);p.r=r.id;p.cand=null;if(G.cs[r.c].id!==old.id){if(['bakan','muhalefet','general'].includes(p.pos))p.pos=p.party?'parti':'vatandas';crs(G.cs[r.c]).forEach(x=>x.sup=Math.max(x.sup,4))}S([r],2);hist(p,`${r.n} bölgesine taşındı`)}})]}
function can(a: Action){const p=me();if(p.jail)return 'Hapistesin';if(a.lock)return a.lock;if(a.ap>G.ap)return 'Eylem hakkın kalmadı';
 if(a.cost&&p.money<a.cost)return `${a.cost} para gerekli`;if(a.cost2&&G.rs[p.r].bud<a.cost2)return `${a.cost2} bütçe gerekli`;
 if(a.cost3&&leads(p).T<a.cost3)return `${a.cost3} hazine gerekli`;return null}
let doAct = function(id: string){const a=[...charA(),...regionA(),...stateA(),...sheetA(),...moveA(),...mapActions()].find(x=>x.id===id);if(!a||can(a))return;
 if(id.startsWith('op:')){a.run();render();return}
 TOAST=[];if(a.cost)me().money-=a.cost;G.ap-=a.ap;a.run();ui.sheet=null;showToast();save();render()}
let showToast:TimedToast=function(){const t=document.getElementById('toast');if(!TOAST.length)return;t.textContent=TOAST.join(' · ');t.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.hidden=true,2200);TOAST=[]}
/* ---------- kayıt ---------- */
let save = function(){try{localStorage.setItem(SAVE,JSON.stringify(G))}catch(e){}}
let load = function(){try{const s=localStorage.getItem(SAVE);return s?JSON.parse(s):null}catch(e){return null}}
/* ---------- çizim ---------- */
function portrait(cv: HTMLCanvasElement,seed: number){const x=cv.getContext('2d'),S=[...'0123456789abcdef'].slice(),h=(n: number)=>h2(seed*.137,n*1.7);cv.width=cv.height=14;x.clearRect(0,0,14,14);
 const skin=['#f1c9a5','#d9a273','#b57b4f','#8a5a3a'][Math.floor(h(1)*4)],hair=['#2a1f1a','#5a3a22','#a5763a','#8c8c8c','#141414'][Math.floor(h(2)*5)],suit=['#26465a','#5a2f3a','#34503a','#3c3c4c','#6a5a2a'][Math.floor(h(3)*5)];
 x.fillStyle='#1c4252';x.fillRect(0,0,14,14);x.fillStyle=suit;x.fillRect(2,10,10,4);x.fillStyle='#e8e8dc';x.fillRect(6,10,2,3);
 x.fillStyle=skin;x.fillRect(4,3,6,7);x.fillRect(6,9,2,2);x.fillStyle=hair;x.fillRect(4,2,6,2);x.fillRect(3,3,1,h(4)>.5?5:2);x.fillRect(10,3,1,h(4)>.5?5:2);
 x.fillStyle='#111';x.fillRect(5,6,1,1);x.fillRect(8,6,1,1);x.fillStyle='#7a3a30';x.fillRect(6,8,2,1);}
function sealCanvas(cv: HTMLCanvasElement){const x=cv.getContext('2d'),n=24;cv.width=cv.height=n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=Math.atan2(j-11.5,i-11.5),d=Math.hypot(i-11.5,j-11.5),e=10.5+Math.sin(a*7)*1.1;if(d<e){x.fillStyle=d>e-2?'#94203a':d>7.5?'#d63a55':d>6.5?'#94203a':'#d63a55';x.fillRect(i,j,1,1)}}
 x.fillStyle='#ecb94f';[[9,8,6,1],[11,8,2,8],[9,15,6,1],[8,11,8,1]].forEach(a=>x.fillRect(a[0],a[1],a[2],a[3]));}
let blink=0;
/* Geometry is immutable after district expansion; colours are invalidated by game state. */
const mapRasterCache:RasterCache={geometry:null,key:null,canvas:null,builds:0,hits:0};
function ensureMapGeometry(){if(mapRasterCache.geometry)return mapRasterCache.geometry;
 const flags=new Uint8Array(W*H),bounds=Array.from({length:REGION_LAYOUT.length},():Bounds|null=>null),sea=new Uint8ClampedArray(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,g=grid[i],k=i*4;sea[k+3]=255;
  if(g<0){const near=(x>0&&grid[i-1]>=0)||(x+1<W&&grid[i+1]>=0)||(y>0&&grid[i-W]>=0)||(y+1<H&&grid[i+W]>=0)||(x>1&&grid[i-2]>=0)||(x+2<W&&grid[i+2]>=0)||(y>1&&grid[i-W*2]>=0)||(y+2<H&&grid[i+W*2]>=0);sea[k]=near?26:(x+y*3)%17===0&&y%5===0?20:13;sea[k+1]=near?72:(x+y*3)%17===0&&y%5===0?56:39;sea[k+2]=near?84:(x+y*3)%17===0&&y%5===0?70:51;continue;}
  let f=(x+y)%2===0?32:0;const l=x>0?grid[i-1]:-1,r=x+1<W?grid[i+1]:-1,u=y>0?grid[i-W]:-1,d=y+1<H?grid[i+W]:-1;
  if(l<0||r<0||u<0||d<0)f|=16;if(l>=0&&l!==g)f|=1;if(r>=0&&r!==g)f|=2;if(u>=0&&u!==g)f|=4;if(d>=0&&d!==g)f|=8;flags[i]=f;
  const b=bounds[g];if(b){if(x<b.x0)b.x0=x;if(x>b.x1)b.x1=x;if(y<b.y0)b.y0=y;if(y>b.y1)b.y1=y;}else bounds[g]={x0:x,x1:x,y0:y,y1:y};
 }
 mapRasterCache.canvas=document.createElement('canvas');mapRasterCache.canvas.width=W;mapRasterCache.canvas.height=H;return mapRasterCache.geometry={flags,bounds,sea};
}
function mapRasterKey(){return G.mapMode+'|'+G.sel+'|'+G.cs.map(c=>c.col).join(',')+'|'+G.rs.map(r=>r.c+':'+(G.mapMode==='sad'?r.loyal:G.mapMode==='zen'?r.wealth:G.mapMode==='des'?r.sup:'')).join(',')+'|'+G.wars.map(w=>w.a+':'+w.b).sort().join(',');}
function buildMapRaster(key: string){const geometry=ensureMapGeometry(),ctx=mapRasterCache.canvas.getContext('2d'),img=ctx.createImageData(W,H);img.data.set(geometry.sea);const data=img.data,flags=geometry.flags,owners=G.rs.map(r=>r.c),cols=G.cs.map(c=>hex(c.col)),n=G.cs.length,war=new Uint8Array(n*n);
 for(const w of G.wars){war[w.a*n+w.b]=1;war[w.b*n+w.a]=1;}
 const palettes=G.rs.map(r=>{const rgb=G.mapMode==='ulke'?cols[r.c]:ramp(G.mapMode==='sad'?r.loyal:G.mapMode==='zen'?r.wealth:r.sup);return [rgb,rgb.map(v=>v*.8),rgb.map(v=>v*.464),rgb.map(v=>v*.82),rgb.map(v=>v*.656)];});
 for(let i=0;i<grid.length;i++){const g=grid[i];if(g<0)continue;const f=flags[i],owner=owners[g],k=i*4;let border=false,battle=false,other;
  if(f&1&&(other=owners[grid[i-1]])!==owner){border=true;battle ||= !!war[owner*n+other];}if(f&2&&(other=owners[grid[i+1]])!==owner){border=true;battle ||= !!war[owner*n+other];}if(f&4&&(other=owners[grid[i-W]])!==owner){border=true;battle ||= !!war[owner*n+other];}if(f&8&&(other=owners[grid[i+W]])!==owner){border=true;battle ||= !!war[owner*n+other];}
  if(g===G.sel&&(f&15)){data[k]=255;data[k+1]=226;data[k+2]=120;}
  else if(border){data[k]=battle?214:15;data[k+1]=battle?58:20;data[k+2]=battle?85:26;}
  else{const rgb=palettes[g][f&16?(f&32?4:3):f&32?(f&15?2:1):0];data[k]=rgb[0];data[k+1]=rgb[1];data[k+2]=rgb[2];}
 }
 ctx.putImageData(img,0,0);mapRasterCache.key=key;mapRasterCache.builds++;
}
let drawMap = function(cv: HTMLCanvasElement){if(!cv)return;ensureMapGeometry();const key=mapRasterKey();if(mapRasterCache.key!==key)buildMapRaster(key);else mapRasterCache.hits++;
 if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;const x=cv.getContext('2d');x.drawImage(mapRasterCache.canvas,0,0);drawOperations(x);
 for(const r of G.rs){const c=G.cs[r.c],cap=c.cap===r.id;x.fillStyle='#10161c';x.fillRect(r.x-(cap?2:1),r.y-(cap?2:1),cap?5:3,cap?5:3);x.fillStyle=cap?'#ecb94f':'#eef1e4';x.fillRect(r.x-(cap?1:0),r.y-(cap?1:0),cap?3:1,cap?3:1);}
 for(const u of G.unrest||[]){const r=G.rs[u.r];x.strokeStyle='#ff6571';x.lineWidth=3;x.beginPath();x.arc(r.x,r.y,9,0,Math.PI*2);x.stroke();}
 const pr=G.rs[me().r];x.fillStyle='#d63a55';x.fillRect(pr.x-1,pr.y-6,3,3);x.fillRect(pr.x,pr.y-3,1,1);
}

/* ---------- arayüz parçaları ---------- */
const bar=(l:string,v:number,col?:string)=>`<div class="bar"><div class="l"><span>${l}</span><b>${r0(v)}</b></div><div class="t"><div class="f" style="width:${cl(v)}%;${col?`background:${col}`:''}"></div></div></div>`;
const toneBar=(l: string,v: number)=>bar(l,v,v<30?'var(--bad)':v>60?'var(--good)':'var(--brass)');
function actBtn(a: Action){const w=can(a),tag=a.tag||(a.cost?`${a.cost} para`:a.cost2?`${a.cost2} bütçe`:a.cost3?`${a.cost3} hazine`:'');
 return `<button class="act" data-a="${a.id}" ${w?'aria-disabled="true"':''}><b>${esc(a.title)}<i class="tag" style="font-style:normal">${esc(tag)}</i></b><span>${esc(a.desc)}</span>${w?`<span class="why">${esc(w)}</span>`:''}</button>`}
const list=(a: Action[])=>`<div class="acts">${a.map(actBtn).join('')}</div>`;
function header(){const p=me(),c=cOf(p),m=leads(p);return `<header class="top band"><div class="toprow"><div class="date">${dateStr()}</div><button class="chip" data-sound="1" aria-pressed="${soundOn}">Ses: ${soundOn?'Açık':'Kapalı'}</button><div class="pips" aria-label="Kalan eylem: ${G.ap}"><span>Eylem</span>${[...Array(p.pos==='lider'?3:2)].map((_,i)=>`<i class="pip ${i<G.ap?'':'off'}"></i>`).join('')}</div></div>
 <div class="who">${esc(p.name)}, ${Math.floor(p.age)} · ${esc(posName(p))} · ${esc(c.n)}</div>
 <div class="stats"><span>Para <b>${r0(p.money)}</b></span><span>Destek <b>%${r0(natSup(p))}</b></span>${m?`<span>Hazine <b>${r0(m.T)}</b></span>`:`<span>Tanınırlık <b>${r0(p.fame)}</b></span>`}${p.jail?`<span class="warn">Hapis: ${p.jail} dönem</span>`:''}${p.cand?`<span class="ok">Adaysın</span>`:''}</div></header>`}
let tabChar = function(){const p=me(),acts=charA();const open=acts.filter(a=>!a.lock),closed=acts.filter(a=>a.lock);
 return `<section class="pn"><div class="row"><canvas class="pt" data-s="${p.seed}" style="width:72px;height:72px;flex:none"></canvas><div><h2>${esc(p.name)}</h2><div class="sub">${esc(posName(p))}${p.party?' · '+esc(p.party):''}</div><div class="sub">${Math.floor(p.age)} yaş · ${esc(p.job)} · ${EDU[p.edu]} · ${esc(p.ideo)}</div></div></div>
 <div class="bars">${bar('Tanınırlık',p.fame)}${bar('İtibar',p.rep)}${bar('Hitabet',p.speech)}${bar('Liderlik',p.lead)}${bar('Örgüt',p.org)}${toneBar('Sağlık',p.health)}</div>
 <button class="chip" data-switch="1">Başka karaktere geç</button></section>
 <section class="pn"><h3 class="h3">Bu dönem ne yapacaksın?</h3>${list(open)}</section>
 ${closed.length?`<section class="pn"><h3 class="h3">Henüz açılmadı</h3>${list(closed)}</section>`:''}
 <section class="pn"><h3 class="h3">Kariyer</h3><div class="tl">${p.hist.length?p.hist.slice(-12).map(h=>`<div><i>${h.a}</i><span>${esc(h.t)}</span></div>`).join(''):'<span class="sub">Kariyerin bu dönemde başlıyor.</span>'}</div></section>`}
let tabRegion = function(){const p=me(),r=G.rs[G.sel],c=G.cs[r.c],mineR=r.id===p.r,lead=leads(p),own=lead&&lead.id===c.id;
 const gov=P(r.gov),may=P(r.mayor);let body='';
 if(mineR&&p.pos==='vali')body+=`<section class="pn"><h3 class="h3">Bölge vergisi</h3><div class="chips">${[1,2,3].map(v=>`<button class="chip ${r.tax===v?'on':''}" data-rt="${v}">${TAXN[v]}</button>`).join('')}</div><p class="sub">Yüksek vergi bütçeni büyütür, sadakati düşürür.</p></section>`;
 if(mineR&&(p.pos==='vali'||p.pos==='belediye'))body+=`<section class="pn"><h3 class="h3">Yetkilerin</h3>${list(regionA())}</section>`;
 if(own)body+=`<section class="pn"><h3 class="h3">Devlet kararları</h3>${list(sheetA().filter(a=>a.id.endsWith(':'+r.id)&&a.id.startsWith('r:')))}</section>`;
 const mv=moveA();if(mv.length)body+=`<section class="pn">${list(mv)}</section>`;
 return `<section class="pn"><div class="toprow"><h2>${esc(r.n)}</h2><span class="sub">${esc(c.n)}</span></div>
 <div class="sub">${r.pop.toFixed(1)} milyon nüfus · ${AUTON[r.auto]} · Vergi ${TAXN[r.tax].toLowerCase()}</div>
 <div class="bars">${toneBar('Zenginlik',r.wealth)}${toneBar('Altyapı',r.infra)}${toneBar('Eğitim',r.edu)}${toneBar('Sadakat',r.loyal)}${toneBar('Merkezle ilişki',r.cen)}${bar('Desteğin',r.sup,'var(--wax)')}</div>
 <div class="sub">Bölge bütçesi: <b>${r0(r.bud)}</b> · Yönetici: ${esc(gov.id===p.id?'Sen':gov.name)} · Belediye: ${esc(may.id===p.id?'Sen':may.name)}</div></section>${body}`}
function paths(p: Person,c: Country){const n=natSup(p),a=[];
 if(natElect(c)){a.push(['Seçim kazan','Parti kur, tanınırlığını 40 yap, genel seçime aday ol.',p.party&&p.fame>=40]);
  a.push(['Koalisyona gir','Genel seçimde oyların %36 üzerini alırsan teklif gelebilir.',p.pos==='bakan']);
  a.push(['Parlamento desteği','Ülke desteğin 40, yönetimin desteği 45 altı olmalı.',p.party&&n>=40&&c.appr<45]);}
 else a.push(['Rejimi zorla','Bu ülkede genel seçim yok. Yol kriz veya devrimden geçiyor.',false]);
 a.push(['İstifa ve devir','İstikrar 22 altına düşerse hükûmet sana teklif edilebilir.',c.stab<22&&(p.party||p.pos==='muhalefet')]);
 a.push(['Devrim veya askerî müdahale','Örgüt 60 ve tanınırlık 50 ya da general olmak gerekir.',p.pos==='general'||(p.org>=60&&p.fame>=50)]);
 a.push(['Bağımsızlık','Bölge yöneticisi ol, özerklik kazan, kendi devletini kur.',p.pos==='vali']);
 return `<div class="acts">${a.map(x=>`<div class="path"><i class="mk ${x[2]?'ok':''}"></i><div><b>${x[0]}</b><em>${x[1]}</em></div></div>`).join('')}</div>`}
let tabState = function(){const p=me(),m=leads(p),c=m||cOf(p),L=P(c.leader);
 const wars=G.wars.filter(w=>w.a===c.id||w.b===c.id).map(w=>G.cs[w.a===c.id?w.b:w.a].n);
 const head=`<section class="pn"><div class="row"><canvas class="pt" data-s="${L.seed}" style="width:60px;height:60px;flex:none"></canvas><div><h2>${esc(full(c))}</h2><div class="sub">${esc(ltitle(c))}: ${esc(L.id===p.id?'Sen':L.name)}</div><div class="sub">${natElect(c)?`Genel seçime ${nextIn(c,8,0)} dönem`:'Genel seçim yok'}${wars.length?` · <span class="warn">Savaş: ${esc(wars.join(', '))}</span>`:''}</div></div></div>
 <div class="bars">${toneBar('Ekonomi',c.econ)}${toneBar('İstikrar',c.stab)}${toneBar('Halk desteği',c.appr)}${bar('Ordu',c.army)}</div><div class="sub">Hazine: <b>${r0(c.T)}</b> · Bölge: ${crs(c).length}</div></section>`;
 if(!m)return head+`<section class="pn"><h3 class="h3">İktidara giden yollar</h3>${paths(p,c)}</section>`;
 const mins=keysOf(MINN).map(k=>{const n=P(c.min[k]);return `<button class="act" data-min="${k}"><b>${MINN[k]}<i class="tag" style="font-style:normal">Yetenek ${r0(n.lead)}</i></b><span>${esc(n.name)}</span></button>`}).join('');
 const dip=alive().filter(o=>o.id!==c.id).map(o=>`<button class="act" data-dip="${o.id}"><b>${esc(o.n)}<i class="tag" style="font-style:normal">İlişki ${r0(c.rel[o.id]||0)}</i></b><span>${REGN[o.reg]} · Ordu ${r0(o.army)}${atWar(c.id,o.id)?' · Savaştasın':c.allies.includes(o.id)?' · Müttefik':''}</span></button>`).join('');
 return head+`<section class="pn"><h3 class="h3">Vergi politikası</h3><div class="chips">${[1,2,3].map(v=>`<button class="chip ${c.tax===v?'on':''}" data-st="${v}">${TAXN[v]}</button>`).join('')}</div></section>
 <section class="pn"><h3 class="h3">Devlet politikası</h3>${list(stateA())}<button class="act" data-rg="1"><b>Rejimi değiştir<i class="tag" style="font-style:normal">Devrim</i></b><span>Şu an: ${REGN[c.reg]}. İstikrar 20 düşer.</span></button></section>
 <section class="pn"><h3 class="h3">Bakanlar</h3><div class="acts">${mins}</div></section>
 <section class="pn"><h3 class="h3">Diplomasi</h3><div class="acts">${dip}</div></section>`}
let tabWorld = function(){const r=G.rs[G.sel],c=G.cs[r.c];const lab=alive().map(k=>{const rs=crs(k);if(!rs.length)return'';const x=rs.reduce((s,a)=>s+a.x,0)/rs.length,y=rs.reduce((s,a)=>s+a.y,0)/rs.length;return `<span class="lab" style="left:${x/W*100}%;top:${y/H*100}%">${esc(k.n)}</span>`}).join('');
 const ms=[['ulke','Ülkeler'],['sad','Sadakat'],['zen','Zenginlik'],['des','Desteğin']];
 return `<div class="chips">${ms.map(m=>`<button class="chip ${G.mapMode===m[0]?'on':''}" data-mm="${m[0]}">${m[1]}</button>`).join('')}</div>
 <p class="sub">AVRUPA · Türkiye dahil · Natural Earth 1:50m sınır verisi. Küçük ülkeleri listeden seçebilirsin.</p><label class="sub">Ülke seç <select id="country-jump">${alive().map(k=>`<option value="${k.cap}" ${c.id===k.id?'selected':''}>${esc(k.n)}</option>`).join('')}</select></label><div class="map-controls"><button class="chip" data-zoom="1">Yakınlaştır / Uzaklaştır</button><span class="mobile-help">Hedefe dokun → aşağıdan emir seç</span></div><div class="mapbox"><canvas id="map" width="${W}" height="${H}" aria-label="Türkiye dahil Avrupa haritası; ülke seçimi için aşağıdaki listeyi kullanabilirsiniz"></canvas><span class="lab" style="left:${r.x/W*100}%;top:${r.y/H*100}%">${esc(c.n)}</span></div>
 <section class="pn"><div class="toprow"><h2>${esc(r.n)}</h2><button class="chip" data-tab="bolge">Bölgeyi aç</button></div><div class="sub">${esc(full(c))} · ${esc(ltitle(c))}: ${esc(P(c.leader).id===me().id?'Sen':P(c.leader).name)}</div>
 <div class="bars">${toneBar('Ekonomi',c.econ)}${toneBar('İstikrar',c.stab)}${toneBar('Halk desteği',c.appr)}${bar('Ordu',c.army)}</div></section>
 <section class="pn operation"><h3 class="h3">Seçili bölgeye emir ver</h3><p class="sub">${leads(me())?`Ayaklanma riski: %${r0(unrestRisk(c))} · Gizli olaylar: ${(G.discoveries||[]).length}/3`:'Harita emirleri için devlet başkanı olmalısın.'}</p>${list(mapActions())}${(G.operations||[]).length?`<p class="sub">${G.operations.length} emir bekliyor. Sonuçlar için dönemi bitir.</p>`:''}</section><section class="pn"><h3 class="h3">Son gelişmeler</h3><div class="log">${G.log.slice(0,4).map(l=>`<div><i>${l.d}</i><span>${esc(l.t)}</span></div>`).join('')}</div></section>`}
const tabLog=()=>`<section class="pn"><h2>Tarih</h2><div class="log">${G.log.map(l=>`<div><i>${l.d}</i><span>${esc(l.t)}</span></div>`).join('')}</div></section>`;
let modal = function(){const s=ui.sheet,q=G.q[0];
 if(s){const p=me(),c=leads(p);let h='';
  if(s.t==='operation')return operationModal(s);
  if(s.t==='dip'){const o=G.cs[Number(s.id)];h=`<div class="kick">Diplomasi</div><h2>${esc(full(o))}</h2><div class="sub">Lider: ${esc(P(o.leader).name)} · İlişki ${r0(c.rel[o.id]||0)}</div>${list(sheetA().filter(a=>a.id.startsWith('d:')&&a.id.endsWith(':'+o.id)))}`}
  if(s.t==='min'){h=`<div class="kick">${MINN[s.k]} Bakanlığı</div><h2>Kimi atayacaksın?</h2>${`<div class="acts">`+ui.cand.map((n,i)=>{const a=sheetA().find(x=>x.id===`mn:${s.k}:${i}`);a.title=n.name;a.desc=`Yetenek ${n.lead}`;return actBtn(a)}).join('')+`</div>`}`}
  if(s.t==='rg'){h=`<div class="kick">Devrim</div><h2>Yeni yönetim biçimi</h2>${list(sheetA().filter(a=>a.id.startsWith('reg:')))}`}
  return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true">${h}<button class="back" data-close="1">Vazgeç</button></div></div>`}
 if(!q)return'';
 if(q.id==='death'){const p=P(q.pid);return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true"><div class="kick">${dateStr()}</div><h2>${esc(p.name)} öldü</h2><p>${Math.floor(p.age)} yaşında aramızdan ayrıldı. Tarihî etkisi: <b>${r0(p.legacy)}</b> puan.</p><div class="tl">${p.hist.slice(-8).map(h=>`<div><i>${h.a}</i><span>${esc(h.t)}</span></div>`).join('')}</div><div class="acts"><button class="big prime" data-switch="1"><b>Yeni karakterle devam et</b><span>Dünya, kaldığı yerden yaşamaya devam eder.</span></button></div></div></div>`}
 if(q.id==='info'){const b=q.bars;return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true">${eventScene(q.secret)}<div class="kick">${esc(q.k)}</div><h2>${esc(q.title)}</h2>${b?vs(b):''}<p>${esc(q.text)}</p><div class="acts"><button class="big prime" data-q="ok"><b>Devam</b></button></div></div></div>`}
 if(q.id==='uprising')return uprisingModal(q);
 const e=EV[q.id],p=me();return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true">${eventScene()}<div class="kick">${esc(e.k)}</div><h2>${esc(e.t)}</h2>${q.bars?vs(q.bars):''}<p>${esc(e.x(p))}</p><div class="acts">${e.c.map((c,i)=>`<button class="big" data-q="${i}"><b>${esc(c.t)}</b><span>${esc(c.n)}</span></button>`).join('')}</div></div></div>`}
const vs=(b: VoteBars)=>`<div class="vs" aria-label="Sen yüzde ${r0(b.you)}"><i style="width:${b.you}%;background:var(--wax)"></i><i style="width:${b.riv}%;background:var(--line)"></i></div><div class="toprow sub"><span>Sen %${r0(b.you)}</span><span>Rakip %${r0(b.riv)}</span></div>`;
let pickQ = function(a: string){const q=G.q[0];if(!q)return;TOAST=[];if(q.id==='uprising'){resolveUprising(q,+a);G.q.shift();showToast();save();render();return}if(a!=='ok'){EV[q.id].c[+a].f(me())}G.q.shift();showToast();save();render()}
/* ---------- başlangıç ekranları ---------- */
function vTitle(){const has=!!load();return `<div class="title band"><canvas class="seal" style="width:120px;height:120px"></canvas><div><h1>Ya Yönet<br>Ya Devret</h1><p class="entitle">RULE OR ABDICATE · AVRUPA</p><button class="chip" data-sound="1" aria-pressed="${soundOn}">Ses: ${soundOn?'Açık':'Kapalı'}</button></div><p class="lede">Bir ülkenin mührünü kim tutuyorsa dünya onun. Devletin başına geç ya da sıradan bir yurttaş olarak doğup o mührü kendin kazan.</p>
 <div class="acts">${has?`<button class="big prime" data-v="cont"><b>Kaldığın yerden devam et</b><span>Kayıtlı oyununu aç.</span></button>`:''}
 <button class="big" data-v="lead"><b>Devlet Başkanı modu</b><span>Bir ülkenin başında başla. Vergileri, bakanları, savaş ve barışı sen belirle.</span></button>
 <button class="big" data-v="kar"><b>Karakter modu</b><span>Vatandaş, general veya muhalefet lideri olarak başla. İktidara kendi yolunla yürü.</span></button></div>
 <button class="chip ${installPrompt?'available':''}" id="install-app">Telefona yükle</button><p class="mobile-help">Telefonda tarayıcı menüsünden “Ana ekrana ekle”yi seç. iPhone: Paylaş → Ana Ekrana Ekle. Çevrimdışı kullanım ilk çevrimiçi açılıştan sonra hazır olur.</p><p class="sub">Coğrafya gerçek sınır verisine dayanır; bölge ayrımları, kişiler, partiler ve olaylar oyun kurgusudur. Kayıt bu tarayıcıda saklanır. Eski Avrupa kaydın yeni sürüme aktarılır; yedeğini ayarlardan indirebilirsin.</p></div>`}
function vKar(){return `<div class="title band"><button class="back" data-v="title">Geri</button><h2 style="font-size:30px">Hayata nasıl başlayacaksın?</h2><div class="acts">
 <button class="big prime" data-v="zero"><b>Sıfırdan başla</b><span>25 yaşında, siyasi gücü olmayan bir yurttaş.</span></button>
 <button class="big" data-v="make"><b>Kendi karakterini yarat</b><span>Yaşını, mesleğini, görüşünü ve doğduğun yeri seç.</span></button>
 <button class="big" data-v="exist"><b>Mevcut biri ol</b><span>Dünyadaki general, belediye başkanı, muhalefet lideri veya başbakanlardan birini seç.</span></button></div></div>`}
function vLead(){return `<div class="title band"><button class="back" data-v="${G&&G.pid!=null?'game':'title'}">Geri</button><h2 style="font-size:30px">Hangi ülkeyi yöneteceksin?</h2><div class="acts">${alive().map(c=>`<button class="big" data-lead="${c.id}"><b>${esc(full(c))}</b><span>Hazine ${r0(c.T)} · İstikrar ${r0(c.stab)} · Halk desteği ${r0(c.appr)} · ${crs(c).length} bölge</span></button>`).join('')}</div></div>`}
function vMake(){const f=ui.cnew,cs=alive(),cid=f.c!=null&&G.cs[f.c]&&G.cs[f.c].alive?f.c:cs[0].id;const rs=G.rs.filter(r=>r.c===cid);const rid=rs.some(r=>r.id===+f.r)?+f.r:rs[0].id;f.c=cid;f.r=rid;
 const opt=(a: (string|number)[][],v: string|number)=>a.map(x=>`<option value="${esc(x[0])}" ${String(x[0])===String(v)?'selected':''}>${esc(x[1])}</option>`).join('');
 return `<div class="title band"><button class="back" data-v="${G.pid!=null&&G.ps[G.pid].alive?'game':'kar'}">Geri</button><h2 style="font-size:30px">Yeni karakter</h2><div class="form">
 <label class="wide">Adın<input id="f-name" value="${esc(f.name||'')}" maxlength="28" placeholder="Ad ve soyad"></label>
 <label>Yaş<input id="f-age" type="number" min="18" max="70" value="${f.age||25}"></label>
 <label>Eğitim<select id="f-edu">${opt(EDU.map((e,i)=>[i,e]),f.edu??1)}</select></label>
 <label>Meslek<select id="f-job">${opt(Object.keys(JOBS).map(j=>[j,j]),f.job||'Öğretmen')}</select></label>
 <label>Siyasi görüş<select id="f-ideo">${opt(Object.keys(IDEO).map(j=>[j,j]),f.ideo||'Sosyal demokrat')}</select></label>
 <label>Ülke<select id="f-c">${opt(cs.map(c=>[c.id,c.n+' ('+REGN[c.reg]+')']),cid)}</select></label>
 <label>Bölge<select id="f-r">${opt(rs.map(r=>[r.id,r.n]),rid)}</select></label></div>
 <button class="big prime" data-create="1"><b>Hayata başla</b><span>Başlangıçta yalnızca kendi çevrende etkilisin.</span></button></div>`}
function vExist(){const rows:[number,string,Country][]=[];alive().forEach(c=>{rows.push([c.leader,ltitle(c),c]);rows.push([c.opp,natElect(c)?'Muhalefet lideri':'Yasadışı parti lideri',c]);rows.push([c.gen,'General',c]);const r=crs(c)[0];if(r){rows.push([r.gov,'Bölge yöneticisi: '+r.n,c]);rows.push([r.mayor,'Belediye başkanı: '+r.n,c])}});
 const dead=G.pid!=null&&!me().alive;
 return `<div class="title band"><button class="back" data-v="${dead?'make':G.pid!=null?'game':'kar'}">${dead?'Yeni karakter yarat':'Geri'}</button>${G.pid!=null?`<button class="big" data-v="make"><b>Yeni karakter yarat</b><span>İstediğin ülkede sıfırdan başla.</span></button>`:''}<h2 style="font-size:30px">Kim olacaksın?</h2><div class="acts">${rows.filter(r=>P(r[0]).alive&&r[0]!==G.pid).map(r=>`<button class="big" data-be="${r[0]}"><div class="row"><canvas class="pt" data-s="${P(r[0]).seed}" style="width:44px;height:44px;flex:none"></canvas><div><b style="display:block">${esc(P(r[0]).name)}</b><span>${esc(r[1])} · ${esc(r[2].n)} · ${Math.floor(P(r[0]).age)} yaş</span></div></div></button>`).join('')}</div></div>`}
function bePerson(id:number,how?:string){if(G.pid!=null&&me().alive)say(`Hikâye ${me().name} kişisinden ${P(id).name} kişisine geçti.`);G.pid=id;const p=me();seedSup(p);G.sel=p.r;G.ap=p.pos==='lider'?3:2;G.q=G.q.filter(q=>q.id!=='death');G.tab=p.pos==='lider'?'devlet':'karakter';ui.view='game';if(!p.hist.length)hist(p,how||`${posName(p)} olarak hikâyesi başladı`);save();render()}
let startCitizen = function(o: Partial<Person>){if(!G)newGame();const r=pick(G.rs);const p=mkP(Object.assign({r:r.id,age:25,edu:1,job:pick(Object.keys(JOBS)),speech:rint(15,30),lead:rint(15,30),rep:30,fame:2,org:0,money:12,health:90,pos:'vatandas'},o));bePerson(p.id,'Sıradan bir yurttaş olarak hayata başladı')}
/* ---------- ana render ---------- */
let render:RenderFunction=function(){presentEvent();const app=document.getElementById('app'),main=app.querySelector('main'),sc=main?main.scrollTop:0;
 if(ui.view==='title')app.innerHTML=vTitle();
 else if(ui.view==='kar')app.innerHTML=vKar();
 else if(ui.view==='lead')app.innerHTML=vLead();
 else if(ui.view==='make')app.innerHTML=vMake();
 else if(ui.view==='exist')app.innerHTML=vExist();
 else{const tabs=[['karakter','Karakter'],['dunya','Dünya'],['bolge','Bölge'],['devlet',leads(me())?'Devlet':'İktidar'],['tarih','Gazete']];
  const body={karakter:tabChar,dunya:tabWorld,bolge:tabRegion,devlet:tabState,tarih:pressArchive}[G.tab]();
  const left=G.ap>0&&!me().jail?`${G.ap} eylem kaldı · Dönemi bitir`:'Dönemi bitir';
  app.innerHTML=`${header()}<main class="band ${G.tab==='dunya'?'world-screen':''}">${body}</main><div class="bot"><div class="endrow band"><button class="end" id="end">${left}</button></div><nav class="band" aria-label="Sekmeler">${tabs.map(t=>`<button class="${G.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</nav></div>${modal()}${ui.flash?`<div id="stamp"><div>${ui.flash}</div></div>`:''}`;
  if(ui.flash){ui.flash=null;setTimeout(()=>{const s=document.getElementById('stamp');if(s)s.remove()},650)}
  const m=app.querySelector('main');if(m&&render.tab===G.tab)m.scrollTop=sc;render.tab=G.tab;
  if(typeof setupFixedMap==='function')setupFixedMap();drawMap(byId<HTMLCanvasElement>('map'));}
 app.querySelectorAll<HTMLCanvasElement>('canvas.pt').forEach(c=>portrait(c,+c.dataset.s));
 const s=app.querySelector<HTMLCanvasElement>('canvas.seal');if(s)sealCanvas(s);}
function readForm(){const f=ui.cnew,g=(id:string)=>byId<HTMLInputElement | HTMLSelectElement>(id);if(!g('f-name'))return;f.name=g('f-name').value;f.age=g('f-age').value;f.edu=+g('f-edu').value;f.job=g('f-job').value;f.ideo=g('f-ideo').value;f.c=+g('f-c').value;f.r=+g('f-r').value}
document.addEventListener('change',e=>{if(eventElement(e).id==='f-c'||eventElement(e).id==='f-r'){readForm();render()}});
document.addEventListener('click',e=>{if(soundOn)unlockAudio();const b=eventElement(e).closest('button');if(!b)return;const d=b.dataset;
 if(eventElement(e).id==='map')return;
 if(ui.view==='game'&&(G.q.length||ui.sheet)&&!b.closest('.modal'))return;
 if(b.disabled)return;
 if(b.id==='end'){endTurn();return}
 if(d.sound){soundOn=!soundOn;localStorage.setItem('muhur-sound',String(soundOn));if(soundOn)sfx('secret');render();return}
 if(d.tab&&isGameTab(d.tab)){G.tab=d.tab;if(d.tab==='bolge'&&!b.closest('.pn'))G.sel=G.sel;render();const m=document.querySelector('main');if(m)m.scrollTop=0;return}
 if(d.a){doAct(d.a);return}
 if(d.q!=null){pickQ(d.q);return}
 if(d.mm&&isMapMode(d.mm)){G.mapMode=d.mm;render();return}
 if(d.rt){const r=G.rs[me().r];r.tax=+d.rt;save();render();return}
 if(d.st){leads(me()).tax=+d.st;save();render();return}
 if(d.dip){ui.sheet={t:'dip',id:+d.dip};render();return}
 if(d.min&&isMinisterKey(d.min)){ui.cand=[0,1,2].map(()=>({name:pick(FN)+' '+pick(LN),lead:rint(25,85),seed:rint(1,99999)}));ui.sheet={t:'min',k:d.min};render();return}
 if(d.rg){ui.sheet={t:'rg'};render();return}
 if(d.close){ui.sheet=null;render();return}
 if(d.switch){ui.view='exist';render();return}
 if(d.lead){bePerson(G.cs[+d.lead].leader,'Devletin başında hikâyesi başladı');return}
 if(d.be){bePerson(+d.be);return}
 if(d.create){readForm();const f=ui.cnew,age=cl(+f.age||25,18,70);const p=mkP({name:(f.name||'').trim()||pick(FN)+' '+pick(LN),age,edu:f.edu,job:f.job,ideo:f.ideo,r:f.r,speech:20+f.edu*4,lead:20+f.edu*4,rep:30,fame:Math.floor((age-25)/6)+2,org:0,money:10+f.edu*3+Math.max(0,age-25),health:cl(100-(age-25)/2,50,95),pos:'vatandas'});bePerson(p.id,'Yeni bir hayata başladı');return}
 if(d.v==='title'){ui.view='title';render();return}
 if(d.v==='game'){ui.view='game';render();return}
 if(d.v==='cont'){G=load();ui.view='game';render();return}
 if(d.v==='lead'){newGame();ui.view='lead';render();return}
 if(d.v==='kar'){ui.view='kar';render();return}
 if(d.v==='zero'){newGame();startCitizen({name:pick(FN)+' '+pick(LN)});return}
 if(d.v==='make'){if(!G||(G.pid==null))newGame();ui.view='make';ui.cnew={};render();return}
 if(d.v==='exist'){newGame();ui.view='exist';render();return}
});
document.addEventListener('click',e=>{if(eventElement(e).id!=='map'||!G)return;const b=eventElement(e).getBoundingClientRect(),x=Math.floor((e.clientX-b.left)/b.width*W),y=Math.floor((e.clientY-b.top)/b.height*H);let g=grid[y*W+x];if(g<0){let bd=1e9;G.rs.forEach(r=>{const dd=Math.hypot(r.x-x,r.y-y);if(dd<bd&&dd<9){bd=dd;g=r.id}})}if(g>=0){G.sel=g;render()}});
const boot=()=>render();
window.claude?.hot?.snapshot?.(()=>({g:G,view:ui.view}));
const start=(d: {g?:GameState;view?:string})=>{if(d&&d.g){G=d.g;ui.view=d.view||'game'}boot()};

document.addEventListener('change',e=>{if(eventElement(e).id==='country-jump'){G.sel=+eventElement<HTMLInputElement | HTMLSelectElement>(e).value;ui.mapCountry=G.rs[G.sel].c;render()}});
