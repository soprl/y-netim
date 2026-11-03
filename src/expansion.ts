'use strict';
/* Ya Yönet Ya Devret 2.0 — strateji ve mobil sistemler. */
const VERSION='2.5.0';
const LEGACY_DEF=JSON.parse(JSON.stringify(DEF));
const LEGACY_GRID=grid.slice(), REGION_LAYOUT:RegionLayout[]=[], OLD_TO_NEW:number[]=[];
// More strategic districts, without changing any international coastline/border.
(function expandDistricts(){
 const pixels=Array.from({length:CENT.length},()=>[] as number[]);
 for(let i=0;i<LEGACY_GRID.length;i++)if(LEGACY_GRID[i]>=0)pixels[LEGACY_GRID[i]].push(i);
 let old=0;
 DEF.forEach((country,home)=>{
  const rows:[string,number,number][]=[];
  country.rs.forEach(row=>{
   const id=old++,pts=pixels[id],count=pts.length>9000?3:pts.length>1800?2:1;
   const seeds=[{x:row[1],y:row[2]}];
   for(let k=1;k<count;k++){
    let best=-1,score=-1;
    for(let j=0;j<pts.length;j+=3){const i=pts[j],x=i%W,y=Math.floor(i/W);let d=Infinity;for(const seed of seeds){const distance=(seed.x-x)**2+(seed.y-y)**2;if(distance<d)d=distance;}if(d>score){score=d;best=i}}
    seeds.push({x:best%W,y:Math.floor(best/W)});
   }
   OLD_TO_NEW[id]=REGION_LAYOUT.length;
   const ids=seeds.map((s,k)=>{const index=REGION_LAYOUT.length,n=k?row[0]+' · '+(k===1?'Çevre':'Uç bölge'):row[0];REGION_LAYOUT.push({old:id,home,x:s.x,y:s.y,n,parts:count,primary:k===0});rows.push([n,s.x,s.y]);return index});
   for(const i of pts){const x=i%W,y=Math.floor(i/W);let best=0,d=Infinity;for(let k=0;k<seeds.length;k++){const s=seeds[k],n=(x-s.x)**2+(y-s.y)**2;if(n<d){d=n;best=k}}grid[i]=ids[best]}
  });country.rs=rows;
 });
 BORDERS.clear();
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,a=grid[i];if(a<0)continue;let b;if(x+1<W&&(b=grid[i+1])>=0&&b!==a)BORDERS.add(Math.min(a,b)+':'+Math.max(a,b));if(y+1<H&&(b=grid[i+W])>=0&&b!==a)BORDERS.add(Math.min(a,b)+':'+Math.max(a,b));}
})();
const COASTAL=new Set();
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,r=grid[i];if(r>=0&&[i-1,i+1,i-W,i+W].some(j=>grid[j]<0))COASTAL.add(r)}
let hydrate = function(s:GameState):GameState{
 s.operations ||= [];s.unrest ||= [];s.discoveries ||= [];s.movements ||= [];s.electionHistory ||= [];
 s.cs.forEach(c=>{c.inflation ??= 6;c.repression ??= 12;c.navy ??= 35;c.patron ??= null;c.coalition ||= [];c.parties ||= [];c.tension ??= 0;});
 s.rs.forEach(r=>{r.unemployment ??= cl(24-r.wealth*.22,3,35);r.grievance ??= cl((100-r.loyal)*.4);r.fort ??= 15;r.resistance ??= 0;r.occupation ??= 0;r.policyTurn ??= -10;});
 return s;
}
let migrateState = function(s:GameState):GameState{
 if(!s||!Array.isArray(s.cs)||!Array.isArray(s.rs)||!Array.isArray(s.ps))throw Error('Kayıt yapısı tanınmadı.');
 if(s.v===2){
  const old=s.rs;s.rs=REGION_LAYOUT.map((d,id)=>({...old[d.old],id,n:d.n,x:d.x,y:d.y,pop:old[d.old].pop/d.parts,bud:old[d.old].bud/d.parts}));
  const map=(id: number)=>OLD_TO_NEW[id];
  s.ps.forEach(p=>p.r=map(p.r));s.cs.forEach(c=>c.cap=map(c.cap));s.sel=map(s.sel);
  s.q.forEach(q=>{if(q.r!=null)q.r=map(q.r)});
  (s.operations||[]).forEach(o=>{o.r=map(o.r);o.from=map(o.from)});(s.unrest||[]).forEach(u=>u.r=map(u.r));
  s.v=3;
 }
 if(s.v!==3||s.rs.length!==REGION_LAYOUT.length)throw Error('Bu kayıt farklı bir oyun sürümüne ait.');
 return hydrate(s);
}
const baseNewGame=newGame;
newGame=function(){baseNewGame();G.v=3;hydrate(G);G.rs.forEach((r,i)=>{r.pop/=REGION_LAYOUT[i].parts;r.bud/=REGION_LAYOUT[i].parts});G.cs.forEach(initParties);G.version=VERSION;};
const baseMakeCountry=makeCountry;
makeCountry=function(r: Region,leader: number,parent: number){const c=baseMakeCountry(r,leader,parent);hydrate(G);initParties(c);c.navy=COASTAL.has(r.id)?20:0;return c;};
function notify(c: Country,title: string,text: string,scene: string='event'){
 say(`${c.n}: ${title}. ${text}`);
 if(me()&&(c.id===cOf(me()).id||c.leader===G.pid))G.q.push({id:'info',k:scene==='war'?'Harekât raporu':scene==='vote'?'Seçim kurulu':'Gelişme',title,text,scene});
}
function initiative(c: Country){return c.leader===G.pid}
function costAction(c: Country,cost: number){if(G.ap<1||c.T<cost||G.q.length||ui.sheet)return false;c.T-=cost;G.ap--;return true}
function newStats(c: Country){const rs=crs(c),avg=(k: "unemployment"|"grievance"|"loyal")=>rs.reduce((s,r)=>s+r[k],0)/(rs.length||1);return {jobs:avg('unemployment'),grievance:avg('grievance'),loyal:avg('loyal')}}
function riskFactors(c: Country){const s=newStats(c);return [{n:'İstikrarsızlık',v:Math.max(0,55-c.stab)*.65},{n:'İşsizlik',v:Math.max(0,s.jobs-10)*.9},{n:'Hayat pahalılığı',v:Math.max(0,c.inflation-5)*1.1},{n:'Baskı',v:c.repression*.18},{n:'Yerel talepler',v:s.grievance*.25},{n:'Borç ve savaş',v:(c.T<0?10:0)+(inWar(c)?8:0)}]}
unrestRisk=(c: Country)=>cl(5+riskFactors(c).reduce((s,f)=>s+f.v,0),5,90);
let socialStep = function(){
 alive().forEach(c=>{const rs=crs(c),income=rs.reduce((s,r)=>s+r.pop*r.wealth*.035,0);
  // Normalized costs let small and large states remain viable. Debt has a brake, not a reset.
  c.T=cl(c.T+(c.T<0?Math.min(4,-c.T*.05):0)-Math.max(0,c.T-500)*.015,-300,2500);
  c.inflation=cl(c.inflation+(c.T<0?.7:-.35)+(inWar(c)?.3:0),1,45);
  c.repression=cl(c.repression-.5);c.navy=cl(c.navy+(c.T>0?.15:-.3));
  rs.forEach(r=>{r.unemployment=cl(r.unemployment+(24-r.wealth*.28-r.unemployment)*.08+(inWar(c)?.2:0),2,40);r.grievance=cl(r.grievance+(55-r.loyal)*.025+(c.inflation-8)*.025+(r.unemployment-12)*.04-r.auto*.2);r.fort=cl(r.fort-.15);
   if(r.occupation>0){r.occupation--;r.resistance=cl(r.resistance-2+(r.loyal<35?3:0));r.wealth=cl(r.wealth-r.resistance*.02);if(r.resistance>60&&!G.unrest.some(u=>u.r===r.id)&&chance(25))startUprising(c,r,true)}else r.resistance=cl(r.resistance-2);
  });
  if(!initiative(c)&&inWar(c)&&c.T>25&&chance(35)){const r=pick(rs);c.T-=8;r.fort=cl(r.fort+6);}
  if(!initiative(c)&&c.T>45&&c.stab<45){c.T-=12;c.stab=cl(c.stab+3);c.inflation=cl(c.inflation-1);rs.forEach(r=>r.grievance=cl(r.grievance-2));}
  initParties(c);c.parties.forEach(p=>p.campaign=Math.max(0,p.campaign-1));
 });
}
const oldStartUprising=startUprising;
startUprising=function(c: Country,r: Region,forced: boolean=false){oldStartUprising(c,r,forced);const u=G.unrest.find(u=>u.r===r.id);if(u)u.reason=riskFactors(c).sort((a,b)=>b.v-a.v)[0].n;};
unrestStep=function(){
 G.unrest=G.unrest.filter(u=>{if(u.power<=0)return false;const r=G.rs[u.r],c=G.cs[r.c];u.age++;u.power=cl(u.power+(r.grievance-35)*.09+(c.repression-15)*.04-4);r.wealth=cl(r.wealth-1.5);c.stab=cl(c.stab-1);if(u.age>=6||u.power<=0){say(`${r.n}: protestolar sona erdi.`);return false}return true});
 const c=cOf(me());if(!G.unrest.some(u=>G.rs[u.r].c===c.id)&&chance(unrestRisk(c)))startUprising(c,pick(crs(c)));
 const others=alive().filter(k=>k.id!==c.id&&!G.unrest.some(u=>G.rs[u.r].c===k.id));if(others.length){const k=pick(others);if(chance(unrestRisk(k)))startUprising(k,pick(crs(k)))}
 if(!G.q.length&&chance(7)){const secrets=[['cat','Mührün gerçek sahibi','Saray kedisi gündemi mama talebiyle değiştirdi.'],['radio','Gece yarısı frekansı','Eski bir dayanışma ağı radyodan yeniden ses verdi.'],['tea','Çay diplomasisi','Paylaşılan bir bardak çay, zirvenin havasını değiştirdi.']].filter(s=>!G.discoveries.includes(s[0]));if(secrets.length){const s=pick(secrets);G.discoveries.push(s[0]);c.appr=cl(c.appr+3);G.q.push({id:'info',k:`Gizli olay · ${G.discoveries.length}/3`,title:s[1],text:s[2]+' Halk desteği +3.',secret:true});say('Gizli olay: '+s[1])}}
};
const baseUprisingModal=uprisingModal;
uprisingModal=(q: QueuedEvent)=>baseUprisingModal(q).replace('<p>İyi göstergeler',`<p class="cause">Öne çıkan neden: ${esc(G.unrest.find(u=>u.r===q.r)?.reason||'Yerel talepler')}. İşsizlik %${r0(G.rs[q.r].unemployment)}, hayat pahalılığı %${r0(G.cs[G.rs[q.r].c].inflation)}.</p><p>İyi göstergeler`);
const baseResolveUprising=resolveUprising;
resolveUprising=function(q,i){const r=G.rs[q.r],c=G.cs[r.c],leader=c.leader===G.pid;
 if(leader&&i<2&&c.T<(i===0?12:25))return false;
 if(!leader&&i===0&&me().money<5)return false;
 baseResolveUprising(q,i);if(leader){if(i===0){r.grievance=cl(r.grievance-15);c.repression=cl(c.repression-3)}if(i===1){r.unemployment=cl(r.unemployment-5);r.grievance=cl(r.grievance-10)}if(i===2){c.repression=cl(c.repression+15);r.grievance=cl(r.grievance+12)}}return true;
};

/* Çok dönemli harekâtlar, yerel savunma ve bağımsızlık takvimi. */
const OP_NAMES={conquest:'Kara harekâtı',amphibious:'Denizden çıkarma',destabilize:'Orayı karıştır',election:'Seçim çağrısı',independence:'Bağımsızlık hareketini destekle',alliance:'İttifak öner',protectorate:'Himaye anlaşması öner',fort:'Savunmayı güçlendir',relief:'İstihdam ve destek paketi',garrison:'İşgal bölgesini uzlaştır'};
function seaRoute(c: Country,r: Region){return COASTAL.has(r.id)&&crs(c).some(a=>COASTAL.has(a.id)&&Math.hypot(a.x-r.x,a.y-r.y)<260)}
mapActions=function(){const c=leads(me());if(!c)return[];const r=G.rs[G.sel],t=G.cs[r.c],own=c.id===t.id,busy=G.operations.some(o=>o.r===r.id),moving=G.movements.some(m=>m.r===r.id),lock=busy?'Bu bölgede bekleyen emrin var':null;
 const add=(kind:OperationKind,desc:string,cost:number,why:string=null)=>A('op:'+kind,OP_NAMES[kind],desc,{cost3:cost,lock:lock||why,run(){ui.sheet={t:'operation',kind,r:r.id,cost};}});
 const independenceLock=moving?'Bağımsızlık süreci zaten devam ediyor':crs(t).length<2||t.cap===r.id?'Başkent veya son bölge ayrılamaz':r.loyal>60?'Sadakat 60 veya altına inmeli':null;
 if(own)return [add('fort','Tahkimat +20. Saldırı ilerlemesini yavaşlatır.',15,r.fort>=95?'Savunma en üst düzeyde':null),add('relief','İşsizlik −5, talepler −12, sadakat +6; pahalılık −1.',20),add('garrison','Direniş −25, sadakat +10. Baskı yerine yerel uzlaşma.',18,r.resistance<=0?'Bölgede işgal direnişi yok':null),add('independence','Örgütlenme → protesto → referandum → bağımsızlık; yaklaşık 6 dönem.',20,independenceLock)];
 const border=crs(c).some(a=>adj(a,r)),friendly=c.allies.includes(t.id)||t.patron===c.id;
 return [add('conquest',`3–6 dönemlik ilerleme. Tahkimat ${r0(r.fort)}, savunma ordusu ${r0(t.army)}. Her dönem ikmal gideri vardır.`,30,friendly?'İttifak veya himaye altındaki devlete saldıramazsın':!border?'Bölgeyle kara sınırın olmalı':c.army<20?'En az 20 ordu gerekli':null),
 add('amphibious','Kıyıdan kıyıya çıkarma; donanma en az 30. Kara harekâtına göre daha zor ve pahalı.',45,friendly?'Dost devlete saldıramazsın':!seaRoute(c,r)?'Hedef kıyı olmalı ve 260 harita birimi içinde bir limanın bulunmalı':c.navy<30||c.army<25?'En az 30 donanma ve 25 ordu gerekli':null),
 add('destabilize','%65 olasılıkla yerel talepler artar ve protestolar başlar. Başarısızlık diplomasiye zarar verir.',18),add('election','Seçim çağrısı kabul edilirse 2 dönem kampanya, adaylar ve oy sayımı başlar.',15),add('independence','Ayrılıkçı örgütlenmeye destek. Referandum sonucu halka bağlıdır; otomatik toprak kazandırmaz.',25,independenceLock),
 add('alliance','İlişki 20 ve üzerindeyse %75 kabul şansı. Ortak savunma ve diplomatik yakınlık.',12,c.allies.includes(t.id)?'Zaten müttefiksin':(c.rel[t.id]||0)<20?'İlişki en az 20 olmalı':null),add('protectorate','Zayıf bir devlete koruma ve ekonomik destek öner. Egemenliği ve harita rengi korunur; savaşta destek ve hazine katkısı sağlar.',25,t.patron!=null?'Bu devlet zaten himaye altında':(c.rel[t.id]||0)<10?'İlişki en az 10 olmalı':t.army>=c.army||crs(t).length>crs(c).length?'Hedefin ordusu ve bölge sayısı senden büyük olmamalı':null)];
};
operationModal=function(s: Sheet){const battle=['conquest','amphibious'].includes(s.kind),r=G.rs[s.r];return `<div class="modalbg"><div class="modal band" role="dialog" aria-modal="true" aria-label="Emir onayı">${sceneHTML(battle?'war':s.kind==='election'?'vote':'diplomacy')}<div class="kick">${esc(r.n)} · EMİR ONAYI</div><h2>${OP_NAMES[s.kind]}</h2><p>${battle?'Harekât birkaç dönem sürer. Savunma, ikmal, ordular ve direnç sonucu etkiler. Savaş ilan edilir.':s.kind==='independence'?'Örgütlenme, protestolar ve referandum aşamaları izlenir. Bağımsızlığın ardından ittifak, himaye veya yeni bir fetih kararı verebilirsin.':'Emir bir sonraki dönemde değerlendirilir.'}</p><p>${s.cost} hazine ve 1 eylem. İptalde kaynak harcanmaz.</p><div class="acts"><button class="big prime" data-confirm-op="1"><b>Emri ver · ${s.cost} hazine</b></button><button class="big" data-close="1"><b>Vazgeç</b></button></div></div></div>`;};
confirmOperation=function(){const s=ui.sheet,c=leads(me());if(!s||s.t!=='operation'||!c)return;const a=mapActions().find(a=>a.id==='op:'+s.kind);if(!a||can(a)||G.q.length)return;
 const r=G.rs[s.r];c.T-=s.cost;G.ap--;const from=crs(c).filter(a=>s.kind!=='amphibious'||COASTAL.has(a.id)).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0]||G.rs[c.cap];
 G.operations.push({kind:s.kind,r:r.id,from:from.id,c:c.id,target:r.c,turn:G.turn,age:0,progress:0,costPaid:s.cost});if(['conquest','amphibious'].includes(s.kind))declareWar(c,G.cs[r.c]);say(`${r.n}: ${OP_NAMES[s.kind]} emri verildi.`);ui.sheet=null;sfx(['conquest','amphibious'].includes(s.kind)?'war':'event');save();render();};
const baseCapture=capture;
capture=function(r: Region,to: Country){baseCapture(r,to);r.resistance=55;r.occupation=8;r.fort=cl(r.fort*.5);r.grievance=cl(r.grievance+20);};
let battleStep = function(o: Operation){const r=G.rs[o.r],c=G.cs[o.c],t=G.cs[r.c];o.age=(o.age||0)+1;
 if(!c.alive||r.c!==o.target||!atWar(c.id,t.id)||(!crs(c).some(a=>adj(a,r))&&o.kind!=='amphibious')){notify(c,'Harekât durdu',`${r.n}: yönetim, sınır veya barış koşulları değişti.`,'war');return false}
 const assessment=assessBattle(o),supply=assessment.supply;if(c.T<supply||c.army<8){notify(c,'İkmal kesildi',`${r.n} harekâtı durduruldu. Ordu veya hazine yetersiz.`,'war');return false}c.T-=supply;
 const defense=assessment.defense;
 o.lastRoll=rnd(-8,8);const progress=cl(assessment.base+o.lastRoll,8,48);o.progress=cl((o.progress||0)+progress);c.army=cl(c.army-rnd(1.5,3.5));t.army=cl(t.army-rnd(1,3));r.fort=cl(r.fort-3);if(o.kind==='amphibious')c.navy=cl(c.navy-1.5);
 if(o.progress>=100){capture(r,c);notify(c,'Bölge ele geçirildi',`${r.n} yönetimine katıldı. Sekiz dönem işgal geçişi ve yerel direniş var.`,'war');return false}
 if(o.age>=6){notify(c,'Harekât püskürtüldü',`${r.n}: savunma aşılamadı. İlerleme %${r0(o.progress)}. Yeni karar vermeden orduyu toparla.`,'war');return false}
 if(initiative(c)&&o.age===1)notify(c,'Harekât başladı',`${r.n}: ilerleme %${r0(o.progress)}; savunma ${r0(defense)}. Sonraki dönem devam edecek.`,'war');return true;
}
function beginMovement(r: Region,sponsor: number){if(G.movements.some(m=>m.r===r.id)||r.id===G.cs[r.c].cap||crs(G.cs[r.c]).length<2)return false;G.movements.push({r:r.id,parent:r.c,sponsor,age:0,phase:'Örgütlenme',support:cl(60-r.loyal*.45+r.grievance*.3,15,85),votes:null});r.grievance=cl(r.grievance+5);return true}
function movementStep(){G.movements=G.movements.filter(m=>{const r=G.rs[m.r],parent=G.cs[m.parent],sponsor=G.cs[m.sponsor];if(r.c!==m.parent||r.id===parent.cap||crs(parent).length<2){notify(sponsor,'Bağımsızlık süreci kapandı',`${r.n}: idarî koşullar değişti.`);return false}m.age++;
 m.support=cl(m.support+(r.grievance-35)*.05+(45-r.loyal)*.04,10,90);
 if(m.age===2){m.phase='Protestolar';startUprising(parent,r,true);notify(sponsor,'Ayrılıkçı protestolar',`${r.n}: örgütlenme meydanlara taşındı. Destek %${r0(m.support)}.`)}
 if(m.age===4){m.phase='Referandum';m.votes=cl(m.support+rnd(-10,10),5,95);notify(sponsor,'Referandum sandıkları açıldı',`${r.n}: bağımsızlık %${r0(m.votes)}, birlik %${r0(100-m.votes)}. Sonuç iki dönem içinde uygulanacak.`,'vote')}
 if(m.age>=6){if(m.votes>50){const nc=makeCountry(r,mkP({r:r.id,pos:'lider'}).id,parent.id);nc.independentTurn=G.turn;nc.rel[sponsor.id]=sponsor.id===parent.id?10:30;sponsor.rel[nc.id]=nc.rel[sponsor.id];parent.stab=cl(parent.stab-8);updEcon(parent);notify(sponsor,'Bağımsızlık ilan edildi',`${nc.n} ayrı bir devlet oldu. Ülke listesinden seçerek ittifak, himaye veya uygun koşullarda fetih kararı verebilirsin.`,'diplomacy')}else{r.loyal=cl(r.loyal+8);r.grievance=cl(r.grievance-10);notify(sponsor,'Birlik kararı çıktı',`${r.n} halkı bağımsızlığı reddetti.`,'vote')}return false}return true});}
operationsStep=function(){const pending=G.operations;G.operations=[];
 for(const o of pending){const r=G.rs[o.r],c=G.cs[o.c];if(!r||!c?.alive)continue;const t=G.cs[r.c];if(r.c!==o.target){notifyOperation(o,c,'Emir iptal edildi',`${r.n} yönetimi değişti.`);continue}
 if(['conquest','amphibious'].includes(o.kind)){if(battleStep(o))G.operations.push(o);continue}
 if(o.kind==='destabilize'){if(rollOperation(o,65)){r.grievance=cl(r.grievance+18);r.loyal=cl(r.loyal-12);startUprising(t,r,true);notifyOperation(o,c,'Protestolar yayıldı',`${r.n} bölgesinde yerel talepler yükseldi.`)}else{c.rel[t.id]=t.rel[c.id]=cl((c.rel[t.id]||0)-25,-100,100);notifyOperation(o,c,'Operasyon açığa çıktı','İlişkiler 25 puan düştü.')}}
 if(o.kind==='election'){if(rollOperation(o,(c.rel[t.id]||0)>=10?70:25)){t.reg='cum';initParties(t);t.electionDue=G.turn+2;notifyOperation(o,c,'Seçim çağrısı kabul edildi',`${t.n}: iki dönemlik kampanya başladı.`,'vote')}else notifyOperation(o,c,'Seçim çağrısı reddedildi',`${t.n} çağrıyı kabul etmedi.`,'vote')}
 if(o.kind==='independence'){if(beginMovement(r,c.id))notifyOperation(o,c,'Bağımsızlık hareketi örgütleniyor',`${r.n}: süreç yaklaşık altı dönem sürecek.`);else notifyOperation(o,c,'Süreç başlatılamadı','Başkent, son bölge veya mevcut süreç nedeniyle koşullar değişti.')}
 if(o.kind==='fort'){r.fort=cl(r.fort+20);notifyOperation(o,c,'Savunma güçlendi',`${r.n}: tahkimat ${r0(r.fort)}.`,'war')}
 if(o.kind==='relief'){r.unemployment=cl(r.unemployment-5);r.grievance=cl(r.grievance-12);r.loyal=cl(r.loyal+6);t.inflation=cl(t.inflation-1);notifyOperation(o,c,'Destek paketi uygulandı',`${r.n}: istihdam ve yerel güven arttı.`)}
 if(o.kind==='garrison'){r.resistance=cl(r.resistance-25);r.loyal=cl(r.loyal+10);r.grievance=cl(r.grievance-8);notifyOperation(o,c,'Yerel uzlaşma sağlandı',`${r.n}: direniş 25 puan azaldı.`)}
 if(['alliance','protectorate'].includes(o.kind)){const valid=c.id!==t.id&&!atWar(c.id,t.id)&&(c.rel[t.id]||0)>=(o.kind==='alliance'?20:10)&&(o.kind!=='protectorate'||t.patron==null&&t.army<c.army);if(valid&&rollOperation(o,o.kind==='alliance'?75:60)){if(!c.allies.includes(t.id))c.allies.push(t.id);if(!t.allies.includes(c.id))t.allies.push(c.id);if(o.kind==='protectorate')t.patron=c.id;notifyOperation(o,c,'Anlaşma kabul edildi',`${t.n} ile ${o.kind==='alliance'?'ittifak':'himaye'} anlaşması kuruldu. Egemenliği korunuyor.`,'diplomacy')}else notifyOperation(o,c,'Teklif reddedildi',`${t.n} anlaşmayı kabul etmedi.`,'diplomacy')}
 }
 movementStep();warAndAIStep();
};
function warAndAIStep(){
 G.wars=G.wars.filter(w=>G.cs[w.a]?.alive&&G.cs[w.b]?.alive);G.wars.forEach(w=>{w.t=(w.t||0)+1;const a=G.cs[w.a],b=G.cs[w.b];if(w.t>10&&!initiative(a)&&!initiative(b)&&chance(30)){peace(a.id,b.id);say(`${a.n} ve ${b.n}: yıpranma nedeniyle ateşkes.`)}
  if(G.turn%3||G.operations.filter(o=>['conquest','amphibious'].includes(o.kind)).length>=5)return;
  const c=a.army>b.army?a:b,t=c===a?b:a;if(initiative(c)||c.T<35||c.army<25||G.operations.some(o=>o.c===c.id))return;
  const targets=crs(t).filter(r=>crs(c).some(s=>adj(s,r)));if(!targets.length)return;const r=pick(targets),from=crs(c).find(s=>adj(s,r));c.T-=30;G.operations.push({kind:'conquest',r:r.id,from:from.id,c:c.id,target:t.id,turn:G.turn,age:0,progress:0});say(`${c.n}, ${r.n} yönüne harekât başlattı.`);
 });
 alive().forEach(c=>{if(c.patron!=null){const p=G.cs[c.patron];if(!p?.alive)c.patron=null;else{const amount=Math.min(3,Math.max(0,c.T)*.015);c.T-=amount;p.T+=amount}}});
}

/* Adaylar, kampanyalar, oy oranları ve koalisyonlar. */
let initParties = function(c:Country){
 if(!c.parties?.length){c.parties=[{name:'Birlik ve Kalkınma',candidate:c.leader,color:'#e9b84d',campaign:0},{name:'Demokratik Emek',candidate:c.opp,color:'#e27181',campaign:0},{name:'Yeşil Gelecek',candidate:null,color:'#71c69d',campaign:0}];c.incumbentParty=0;}
 c.parties.forEach((p,i)=>{if(p.candidate==null||!G.ps[p.candidate]?.alive)p.candidate=mkP({r:c.cap,pos:'parti',party:p.name,fame:45,org:40}).id;p.campaign ??=0;p.share ??=i===0?45:i===1?35:20;p.seats ??=0;});
 if(!c.parties.some(p=>p.candidate===c.leader)){c.parties[c.incumbentParty||0].candidate=c.leader;}
 c.electionDue ??= G.turn+nextIn(c,8,0);
}
function playerParty(c: Country){let i=c.parties.findIndex(p=>p.candidate===G.pid);if(i<0&&cOf(me()).id===c.id&&me().cand==='ulusal'){c.parties.push({name:me().party||'Yurttaş Hareketi',candidate:G.pid,color:'#8ea6ff',campaign:0,share:10,seats:0});i=c.parties.length-1;}return i;}
let voteForecast = function(c: Country){initParties(c);playerParty(c);const rs=crs(c),education=rs.reduce((s,r)=>s+r.edu,0)/(rs.length||1);
 const weights=c.parties.map((p,i)=>{const candidate=P(p.candidate);return Math.max(2,(i===c.incumbentParty?c.appr*.8:(100-c.appr)*.33+12)+(i===2?education*.1:0)+p.campaign*.8+candidate.org*.12+candidate.speech*.08+(p.candidate===G.pid?natSup(me(),c)*.18:0));});const sum=weights.reduce((a,b)=>a+b,0);return weights.map(w=>w/sum*100);
}
function allocateSeats(shares: number[]){const seats=shares.map(Math.floor);let remaining=100-seats.reduce((a,b)=>a+b,0);const order=shares.map((s,i)=>({i,frac:s-Math.floor(s)})).sort((a,b)=>b.frac-a.frac);for(let k=0;k<remaining;k++)seats[order[k%order.length].i]++;return seats;}
function installGovernment(c: Country,indices: number[]){const winner=c.parties[indices[0]],p=P(winner.candidate),old=P(c.leader);if(old&&old.id!==p.id){old.pos=old.party?'muhalefet':'eski';if(old.id===G.pid)hist(old,'Genel seçimde görevi bıraktı');}
 if(p.id===G.pid&&c.leader!==G.pid)becomeLeader(p,c,'seçim ve koalisyon');else{c.leader=p.id;p.pos='lider';p.r=c.cap;}c.incumbentParty=indices[0];c.coalition=indices;c.pendingCoalition=null;c.stab=cl(c.stab+5);c.appr=cl(c.appr+3);
 const opp=c.parties.find((p,i)=>!indices.includes(i));if(opp){c.opp=opp.candidate;if(P(c.opp).id!==c.leader)P(c.opp).pos='muhalefet';}
 const pi=playerParty(c);if(pi>=0&&pi!==indices[0]&&indices.includes(pi))me().pos='bakan';
 say(`${c.n}: ${indices.map(i=>c.parties[i].name).join(' + ')} hükûmeti kuruldu.`);
}
let runElection = function(c: Country){const forecast=voteForecast(c),raw=forecast.map(x=>Math.max(1,x+rnd(-4,4))),sum=raw.reduce((a,b)=>a+b,0),shares=raw.map(x=>x/sum*100),seats=allocateSeats(shares);
 c.parties.forEach((p,i)=>{p.share=shares[i];p.seats=seats[i];p.campaign=0;});c.lastElection={turn:G.turn,parties:c.parties.map(p=>({name:p.name,share:p.share,seats:p.seats,candidate:p.candidate}))};G.electionHistory.unshift({c:c.id,...c.lastElection});G.electionHistory=G.electionHistory.slice(0,80);c.electionDue=G.turn+8;
 const order=c.parties.map((p,i)=>i).sort((a,b)=>seats[b]-seats[a]),top=order[0],pi=playerParty(c);if(pi>=0)me().cand=null;
 if(seats[top]>=51)installGovernment(c,[top]);
 else if(c.parties[top].candidate===G.pid){c.pendingCoalition={top,deadline:G.turn+2};notify(c,'Koalisyon görüşmeleri',`Hiçbir parti 51 sandalyeye ulaşamadı. Devlet ekranından iki dönem içinde ortak seç; aksi hâlde azınlık hükûmeti kurulur.`,'vote')}
 else{const partner=order.slice(1).find(i=>seats[top]+seats[i]>=51);if(partner!=null&&c.parties[partner].candidate===G.pid){c.pendingCoalition={top,deadline:G.turn+2,offer:partner};G.q.push({id:'coalitionOffer',c:c.id,top,partner});}else installGovernment(c,partner!=null?[top,partner]:[top]);}
 const results=c.parties.map(p=>`${p.name}: %${p.share.toFixed(1)} (${p.seats} sandalye)`).join(' · ');notify(c,'Genel seçim sonuçları',results,'vote');sfx('event');
}
elections=function(){const p=me(),pc=cOf(p);alive().forEach(c=>{initParties(c);playerParty(c);
 if(natElect(c)&&G.turn>=c.electionDue)runElection(c);
 if(c.pendingCoalition&&G.turn>=c.pendingCoalition.deadline){installGovernment(c,[c.pendingCoalition.top]);c.stab=cl(c.stab-8);notify(c,'Azınlık hükûmeti','Koalisyon süresi doldu; istikrar 8 puan düştü.','vote')}
 if(c.id===pc.id){const r=G.rs[p.r];if(locElect(c)&&(G.turn+c.off)%6===3){if(r.mayor===p.id)playerVote('belediye',c,true);else if(p.cand==='belediye')playerVote('belediye',c,false)}if(natElect(c)&&(G.turn+c.off)%8===4){if(r.gov===p.id)playerVote('vali',c,true);else if(p.cand==='vali')playerVote('vali',c,false)}}
 if(!initiative(c)&&G.turn%2===0&&c.T>25){const i=pick(c.parties.map((_,i)=>i));c.parties[i].campaign=cl(c.parties[i].campaign+5,0,30);c.T-=3;}
 });};
let politicsAction = function(action: string,index: number){const c=leads(me())||cOf(me());initParties(c);const pi=playerParty(c);
 if(action==='coalition'){const pending=c.pendingCoalition;if(!pending||c.parties[pending.top].candidate!==G.pid||index===pending.top||c.parties[pending.top].seats+c.parties[index].seats<51)return;installGovernment(c,[pending.top,index]);sfx('event');save();render();return}
 const leader=initiative(c),cost=leader?15:8;if(pi<0||G.ap<1||(leader?c.T:me().money)<cost||G.q.length||ui.sheet)return;
 if(leader)c.T-=cost;else me().money-=cost;G.ap--;const party=c.parties[pi];if(action==='rally'){party.campaign=cl(party.campaign+10,0,40);me().org=cl(me().org+2);}else{party.campaign=cl(party.campaign+7,0,40);me().speech=cl(me().speech+3);}say(`${party.name}: ${action==='rally'?'kampanya mitingi':'aday tartışması'} düzenlendi.`);save();render();}
let politicsPanel = function(){const c=leads(me())||cOf(me());initParties(c);const forecast=voteForecast(c),pi=playerParty(c),pending=c.pendingCoalition;
 return `<section class="pn"><h3 class="h3">Kamu bütçesi</h3><p class="sub">Son dönem gelir ${r0(c.lastBudget?.income||0)} · Bakım ${r0(c.lastBudget?.maintenance||0)} · Net ${r0(c.lastBudget?.balance||0)}. Harekât, yardım, koruma ve kampanya giderleri ayrıca düşer.</p></section><section class="pn politics"><div class="toprow"><h3 class="h3">Meclis ve seçimler</h3><span class="tag">${natElect(c)?Math.max(0,c.electionDue-G.turn)+' dönem kaldı':'Seçim yok'}</span></div><p class="sub">Anketler tahmindir; kampanya ve ülkenin durumu sonucu değiştirir.</p>${c.parties.map((p,i)=>`<div class="party-row"><div class="toprow"><b>${esc(p.name)}</b><b>%${forecast[i].toFixed(1)}</b></div><div class="meter"><i style="width:${forecast[i]}%;background:${p.color}"></i></div><span class="sub">Aday: ${esc(P(p.candidate).name)} · Son seçim ${p.seats} sandalye · Kampanya ${r0(p.campaign)}</span></div>`).join('')}${pi>=0?`<div class="chips"><button class="chip" data-politic="rally">Miting · ${initiative(c)?'15 hazine':'8 para'}</button><button class="chip" data-politic="debate">Aday tartışması · ${initiative(c)?'15 hazine':'8 para'}</button></div>`:'<p class="sub">Kampanya için ulusal adaylığını ilan et.</p>'}${pending&&c.parties[pending.top].candidate===G.pid?`<h3 class="h3">Koalisyon ortağını seç</h3>${c.parties.map((p,i)=>i!==pending.top&&p.seats+c.parties[pending.top].seats>=51?`<button class="act" data-politic="coalition" data-party="${i}"><b>${esc(p.name)}</b><span>Birlikte ${p.seats+c.parties[pending.top].seats} sandalye. Hükûmeti kur.</span></button>`:'').join('')}`:''}${c.lastElection?`<p class="sub">Son sonuç: ${c.lastElection.parties.map(p=>`${esc(p.name)} %${p.share.toFixed(1)}`).join(' · ')}</p>`:''}${c.coalition.length?`<p class="sub">Hükûmet: ${c.coalition.map(i=>esc(c.parties[i]?.name||'')).join(' + ')}</p>`:''}</section>`;
}

/* Başkanlık güvenliği, yardımcılar ve görev devri; grafik şiddet içermez. */
function ensureCabinet(){if(!G)return;G.cs.forEach(c=>{c.security ??=40;c.tension ??=0;if(c.alive&&!G.ps[c.vice]?.alive)c.vice=mkP({r:c.cap,pos:'bakanNPC',party:'Başkan yardımcısı',lead:55,fame:40}).id;});}
let assassinationRisk = function(c: Country,role: string){const pressure=Math.max(0,45-c.stab)*.025+c.repression*.008+(inWar(c)?.35:0),protection=(100-c.security)/100;return role==='president'?cl((.12+pressure*.18)*protection,.025,.6):cl((1.8+pressure)*protection,.35,5);}
function succession(c: Country,victim: Person){const next=P(c.vice);victim.alive=false;victim.pos='eski';if(victim.id===G.pid){die(victim);const temporary=P(c.leader);if(temporary&&temporary.id!==next.id)temporary.pos='eski';}
 c.leader=next.id;next.pos='lider';next.r=c.cap;c.vice=null;ensureCabinet();c.stab=cl(c.stab-12);say(`${c.n}: ${victim.name} hayatını kaybetti. Başkan yardımcısı ${next.name} görevi devraldı.`);}
let assassinationStep = function(){ensureCabinet();const home=cOf(me()),foreign=alive().filter(c=>c.id!==home.id),targets=[home,...(foreign.length?[pick(foreign)]:[])];targets.forEach(c=>{
 c.security=cl(c.security-.4);if(c.T>0)c.T-=c.security*.012;
 const role=chance(assassinationRisk(c,'president'))?'president':chance(assassinationRisk(c,'deputy'))?'deputy':null;if(!role)return;
 const victim=role==='president'?P(c.leader):pick([P(c.vice),...Object.values(c.min).map(P)].filter(p=>p?.alive));if(!victim)return;const saved=chance(role==='president'?90:65);
 if(saved){c.stab=cl(c.stab-3);c.security=cl(c.security+5);notify(c,'Suikast girişimi engellendi',`${victim.name} güvenli bir yere alındı. ${role==='president'?'Başkanlık':'Yardımcılar ve bakanlar'} için koruma planını gözden geçirebilirsin.`,'security');}
 else if(role==='president'){succession(c,victim);if(victim.id!==G.pid)notify(c,'Başkanlıkta görev devri',`${victim.name} saldırıda hayatını kaybetti. Anayasal halef görevi devraldı.`,'security');}
 else{victim.alive=false;victim.pos='eski';if(victim.id===c.vice)c.vice=null;for(const k of keysOf(c.min))if(c.min[k]===victim.id)c.min[k]=mkP({r:c.cap,pos:'bakanNPC'}).id;ensureCabinet();c.stab=cl(c.stab-6);notify(c,'Yönetimde kayıp',`${victim.name} saldırıda hayatını kaybetti. Yerine yeni bir görevli atandı.`,'security');}
 });}

/* Kayıt doğrulaması, eski sürüm geçişi ve dışa/içe aktarma. */
let validateState = function(s:GameState):GameState{
 if(!s||![2,3].includes(s.v)||!Array.isArray(s.cs)||!Array.isArray(s.rs)||!Array.isArray(s.ps)||s.cs.length>200||s.ps.length>30000||s.rs.length>500||s.cs.length<1)throw Error('Geçersiz oyun kaydı.');
 const valid=(v: unknown,n: number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<n,num=(v: unknown)=>typeof v==='number'&&Number.isFinite(v);
 const scan=(value: unknown,depth: number=0)=>{if(depth>25)throw Error('Kayıt çok derin.');if(typeof value==='number'&&!num(value))throw Error('Geçersiz sayı.');if(typeof value==='string'&&value.length>10000)throw Error('Kayıt metni çok uzun.');if(value&&typeof value==='object')for(const k of Object.keys(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Güvensiz kayıt alanı.');scan((value as Record<string,unknown>)[k],depth+1)}};scan(s);
 if(!valid(s.pid,s.ps.length)||!valid(s.sel,s.rs.length)||!num(s.turn)||s.turn<0||!Number.isInteger(s.turn)||!num(s.ap)||s.ap<0||s.ap>3)throw Error('Oyuncu veya dönem bilgisi bozuk.');
 s.cs.forEach((c,i)=>{if(c.id!==i||!valid(c.leader,s.ps.length)||!valid(c.cap,s.rs.length)||!num(c.T)||!num(c.army)||!num(c.econ)||!Array.isArray(c.allies)||!Array.isArray(c.trade)||!c.min||typeof c.n!=='string'||!/^#[0-9a-f]{6}$/i.test(c.col)||!Object.hasOwn(REGN,c.reg))throw Error('Ülke bilgisi bozuk.');for(const id of [c.gen,c.opp,...Object.values(c.min),...c.allies,...c.trade,...(c.vice!=null?[c.vice]:[])])if(!valid(id,s.ps.length))throw Error('Görevli bilgisi bozuk.');});
 for(const c of s.cs)for(const id of [...c.allies,...c.trade])if(!valid(id,s.cs.length))throw Error('Diplomasi kaydı bozuk.');
 s.rs.forEach((r,i)=>{if(r.id!==i||!valid(r.c,s.cs.length)||!num(r.x)||!num(r.y)||!num(r.pop)||r.pop<=0||!valid(r.gov,s.ps.length)||!valid(r.mayor,s.ps.length)||typeof r.n!=='string')throw Error('Bölge bilgisi bozuk.');for(const k of (['wealth','infra','edu','loyal','sup','bud','adm','cen','tax','auto'] as const))if(!num(r[k]))throw Error('Bölge göstergesi eksik.');});
 s.ps.forEach((p,i)=>{if(p.id!==i||!valid(p.r,s.rs.length)||typeof p.name!=='string'||p.name.length>160||!Array.isArray(p.hist)||!p.cool||!num(p.age)||!num(p.health)||!num(p.seed)||!Array.isArray(p.hist)||!Object.values(p.cool).every(num))throw Error('Karakter bilgisi bozuk.');for(const h of p.hist)if(!num(h.a)||typeof h.t!=='string')throw Error('Karakter geçmişi bozuk.');});
 if(!Array.isArray(s.q)||s.q.length>200||!Array.isArray(s.log)||!Array.isArray(s.wars)||!['karakter','dunya','bolge','devlet','tarih'].includes(s.tab)||!['ulke','sad','zen','des'].includes(s.mapMode))throw Error('Oyun ekranı bilgisi bozuk.');
 for(const l of s.log)if(typeof l.t!=='string'||typeof l.d!=='string'||! /^(Bahar|Güz) [0-9]+$/.test(l.d))throw Error('Tarih kaydı bozuk.');
 for(const q of s.q){if(!['info','death','uprising','coalitionOffer','assassination','electionNight','storyChoice','bondChoice',...Object.keys(EV)].includes(q.id)||q.r!=null&&!valid(q.r,s.rs.length)||q.pid!=null&&!valid(q.pid,s.ps.length))throw Error('Olay kaydı tanınmadı.');if(q.id==='assassination'&&(!valid(q.victim,s.ps.length)||typeof q.uid!=='string'||typeof q.name!=='string'||q.name.length>160||!num(q.seed)||typeof q.country!=='string'||!['Başkan','Başkan yardımcısı','Bakan'].includes(q.role)||typeof q.saved!=='boolean'))throw Error('Suikast sahnesi bozuk.');if(q.bars&&(!num(q.bars.you)||!num(q.bars.riv)))throw Error('Oy oranı bozuk.');if(q.scene&&!['war','vote','security','secret','diplomacy','event'].includes(q.scene))throw Error('Olay sahnesi bozuk.');if(q.id==='coalitionOffer'&&(!valid(q.c,s.cs.length)||!valid(q.top,s.cs[q.c].parties.length)||!valid(q.partner,s.cs[q.c].parties.length)))throw Error('Koalisyon teklifi bozuk.');}
 for(const w of s.wars)if(!valid(w.a,s.cs.length)||!valid(w.b,s.cs.length)||w.a===w.b)throw Error('Savaş kaydı bozuk.');
 for(const o of s.operations||[])if(!OP_NAMES[o.kind]||!valid(o.r,s.rs.length)||!valid(o.from,s.rs.length)||!valid(o.c,s.cs.length)||!valid(o.target,s.cs.length))throw Error('Emir kaydı bozuk.');
 for(const u of s.unrest||[])if(!valid(u.r,s.rs.length)||!num(u.power))throw Error('Ayaklanma kaydı bozuk.');
 for(const c of s.cs){if(c.parties!=null&&(!Array.isArray(c.parties)||c.parties.length>12))throw Error('Parti kaydı bozuk.');for(const p of c.parties||[])if(typeof p.name!=='string'||!valid(p.candidate,s.ps.length)||!num(p.campaign)||!num(p.share)||!num(p.seats)||!/^#[0-9a-f]{6}$/i.test(p.color))throw Error('Aday veya parti kaydı bozuk.');if(c.lastElection&&(!Array.isArray(c.lastElection.parties)||!c.lastElection.parties.every(p=>typeof p.name==='string'&&num(p.share)&&num(p.seats))))throw Error('Seçim sonucu bozuk.');if(c.pendingCoalition&&(!valid(c.pendingCoalition.top,c.parties.length)||!num(c.pendingCoalition.deadline)))throw Error('Koalisyon kaydı bozuk.');}
 for(const m of s.movements||[])if(!valid(m.r,s.rs.length)||!valid(m.parent,s.cs.length)||!valid(m.sponsor,s.cs.length)||!num(m.age)||!num(m.support))throw Error('Bağımsızlık kaydı bozuk.');
 return s;
}
function checksum(s: string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16);}
let gameSavePending=false,lastGameSave='',gameSaveWrites=0;
function flushGameSave(){if(!gameSavePending||!G||G.pid==null)return;gameSavePending=false;const previousError=ui.saveError;try{G.version=VERSION;if(typeof sanitizeGameNames==='function')sanitizeGameNames(G);const serialized=JSON.stringify(G);if(serialized!==lastGameSave||localStorage.getItem(SAVE)!==serialized){localStorage.setItem(SAVE,serialized);lastGameSave=serialized;gameSaveWrites++;}ui.saveError=null;}catch(e){ui.saveError='Cihaz kaydı yazılamadı. Ayarlardan yedek indir.';}if(!!previousError!==!!ui.saveError&&ui.view==='game')render();}
save=function(){if(!G||G.pid==null)return;G.version=VERSION;if(!gameSavePending){gameSavePending=true;queueMicrotask(flushGameSave);}};
window.addEventListener('pagehide',flushGameSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushGameSave();});
window.addEventListener('storage',e=>{if(e.key===SAVE)lastGameSave='';});
load=function(){flushGameSave();try{const raw=localStorage.getItem(SAVE);if(!raw)return null;const s=validateState(JSON.parse(raw));if(s.v===2&&!localStorage.getItem(SAVE+'-backup-v2'))localStorage.setItem(SAVE+'-backup-v2',raw);ui.loadError=null;return migrateState(s);}catch(e){ui.loadError='Kayıt açılamadı: '+errorMessage(e);return null;}};
function exportSave(){if(!G||G.pid==null)return;save();const body=JSON.stringify(G),data=JSON.stringify({format:'ya-yonet-save',version:VERSION,checksum:checksum(body),state:G});const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`ya-yonet-${G.turn}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);ui.notice='Yedek dosyası indirildi.';render();}
function parseImport(text: string){if(text.length>5_000_000)throw Error('Kayıt dosyası 5 MB sınırını aşıyor.');const envelope=JSON.parse(text),s=envelope.format==='ya-yonet-save'?envelope.state:envelope;if(envelope.format==='ya-yonet-save'&&checksum(JSON.stringify(s))!==envelope.checksum)throw Error('Dosya bütünlüğü doğrulanamadı.');return migrateState(validateState(s));}
function confirmImport(){if(!ui.pendingImport)return;const next=ui.pendingImport;try{const current=localStorage.getItem(SAVE);if(current)localStorage.setItem(SAVE+'-before-import',current);localStorage.setItem(SAVE,JSON.stringify(next));}catch(e){ui.importError='Cihazda kayıt için yeterli alan yok. Mevcut oyun değiştirilmedi.';render();return}G=next;ui.pendingImport=null;ui.sheet=null;ui.view='game';ensureCabinet();ui.notice='Yedek geri yüklendi.';render();}
const TUTORIAL=[['Avrupa masası','Harita ekrana sabit sığar. Bir bölgeye dokun veya ülke ve bölge listesinden seç.'],['Emir ve savunma','Emirler düğmesinden fetih, çıkarma, seçim veya yerel destek seç. Emirler hazine ve eylem harcar; savaş birkaç dönem sürer.'],['Halkın gündemi','Bölge raporunda işsizlik, pahalılık ve talepleri izle. Görüşme ve istihdam desteği krizi hafifletir; baskı yeni riskler doğurur.'],['Sandık ve bağımsızlık','Devlet ekranında kampanya yap, oy oranlarını izle ve ortak seç. Bağımsızlık hareketleri örgütlenme ve referandumdan geçer.'],['Kaydın sende','Ayarlar düğmesinden yedek indir veya geri yükle. Güncelleme bildirimi geldiğinde önce kaydet; ardından yeni sürüme geç.']];
function dialog(title: string,body: string,buttons: string='',scene: string='event'){return `<div class="modalbg"><section class="modal band" role="dialog" aria-modal="true" aria-label="${esc(title)}">${sceneHTML(scene)}<h2>${esc(title)}</h2>${body}<div class="acts">${buttons}</div></section></div>`;}
let settingsModal = function(){return dialog('Oyun ayarları',`<p>Sürüm ${VERSION} · Mobil Avrupa</p>${ui.saveError?`<p class="warn">${esc(ui.saveError)}</p>`:''}<p class="sub">Kayıt bu cihazda tutulur. Yedek dosyasını başka telefonda da kullanabilirsin.</p>${ui.importError?`<p class="warn" role="alert">${esc(ui.importError)}</p>`:''}<label class="file-label">Yedek dosyası seç<input type="file" id="import-save" accept=".json,application/json"></label><p class="sub">Başkanın suikast girişimi riski çok düşük; yardımcılarınki daha yüksektir. Güvenlik bütçesini Devlet ekranından yönet.</p>`,`${G?.pid!=null?'<button class="big" data-export="1"><b>Kaydı dışa aktar</b></button>':''}<button class="big" data-help="1"><b>Nasıl oynanır?</b></button><button class="big" data-check-update="1"><b>Güncelleme kontrolü</b></button>${ui.updateReady?'<button class="big prime" data-apply-update="1"><b>Kaydet ve yeni sürüme geç</b></button>':''}<button class="big" data-close="1"><b>Oyuna dön</b></button>`);}
function sceneHTML(kind: string='event'){const icon={war:'➜',vote:'▣',diplomacy:'⚑',security:'◈',secret:'✦',event:'◆'}[kind]||'◆';return `<div class="scene scene-${kind}" aria-hidden="true"><span>${icon}</span><i></i><span>${icon}</span></div>`;}

/* Ekrana sığan sabit harita; ayrıntılar oyun içi pencerelerdedir. */
function regionReport(r: Region){const c=G.cs[r.c],movement=G.movements.find(m=>m.r===r.id),u=G.unrest.find(u=>u.r===r.id);return `<p class="sub">${esc(c.n)} · ${esc(r.n)}</p><div class="report-grid">${toneBar('İşsizlik',r.unemployment)}${toneBar('Hayat pahalılığı',c.inflation)}${toneBar('Yerel talepler',r.grievance)}${toneBar('Sadakat',r.loyal)}${bar('Tahkimat',r.fort)}${bar('İşgal direnişi',r.resistance)}</div><h3 class="h3">Ayaklanma riski · %${r0(unrestRisk(c))}</h3><p class="sub">İyi durumda da %5 taban risk vardır.</p>${riskFactors(c).map(f=>`<div class="toprow sub"><span>${f.n}</span><b>+${f.v.toFixed(1)}</b></div>`).join('')}${u?`<p class="warn">Protestolar sürüyor · Güç ${r0(u.power)} · ${esc(u.reason||'Yerel talepler')}</p>`:''}${movement?`<div class="timeline"><b>${movement.phase}</b><p>Örgütlenme → Protestolar → Referandum → Sonuç</p><p>${movement.age}/6 dönem · Destek %${r0(movement.support)}${movement.votes!=null?' · Evet %'+r0(movement.votes):''}</p></div>`:''}${r.occupation?`<p class="sub">İşgal geçişi: ${r.occupation} dönem. Yerel uzlaşma direnişi azaltır.</p>`:''}${c.patron!=null?`<p class="sub">Himaye: ${esc(G.cs[c.patron]?.n||'')}</p>`:''}`;}
let ordersPanel = function(){return G.operations.length?G.operations.map(o=>`<div class="order-row"><b>${esc(G.rs[o.r].n)} · ${OP_NAMES[o.kind]}</b><span>${['conquest','amphibious'].includes(o.kind)?`%${r0(o.progress||0)} ilerleme · ${o.age||0}/6 dönem`:'Sonraki dönemde değerlendirilir'}</span>${['conquest','amphibious'].includes(o.kind)?`<div class="meter"><i style="width:${o.progress||0}%"></i></div>`:''}</div>`).join(''):'<p class="sub">Bekleyen emir yok.</p>';}
tabWorld=function(){const r=G.rs[G.sel],c=G.cs[r.c],regions=crs(c);return `<div class="world-layout"><div class="world-selectors"><label>Ülke<select id="country-jump">${alive().map(c=>`<option value="${c.cap}" ${r.c===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}</select></label><label>Bölge<select id="region-jump">${regions.map(a=>`<option value="${a.id}" ${a.id===r.id?'selected':''}>${esc(a.n)}</option>`).join('')}</select></label><label class="mode-picker">Harita<select id="map-mode">${[['ulke','Ülke'],['sad','Sadakat'],['zen','Ekonomi'],['des','Destek']].map(([id,n])=>`<option value="${id}" ${G.mapMode===id?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="mapbox fixed-map"><div class="map-stage"><canvas id="map" width="${W}" height="${H}" aria-label="Avrupa haritası; bir bölgeye dokun veya üstteki listelerden seç"></canvas></div></div><section class="target-card"><div><b>${esc(r.n)}</b><span>${esc(c.n)} · İstikrar ${r0(c.stab)} · Risk %${r0(unrestRisk(c))}</span></div><div class="target-actions"><button class="chip" data-panel="report">Rapor</button><button class="chip prime" data-panel="commands">Emirler</button></div></section><button class="orders-summary" data-panel="orders">${G.operations.length} emir · ${G.movements.length} bağımsızlık süreci <span>Gelişmeleri aç ›</span></button></div>`;};
const baseTabState=tabState;
tabState=function(){const c=leads(me())||cOf(me());ensureCabinet();return politicsPanel()+`<section class="pn"><h3 class="h3">Başkanlık güvenliği</h3><p>Başkan: ${esc(P(c.leader).name)}<br>Yardımcı: ${esc(P(c.vice).name)}</p><p class="sub">Dönem başına girişim riski: başkan %${assassinationRisk(c,'president').toFixed(2)} · yardımcılar %${assassinationRisk(c,'deputy').toFixed(2)}. Girişim her zaman kayıp doğurmaz.</p>${bar('Koruma düzeyi',c.security)}${initiative(c)?'<button class="act" data-security="1"><b>Koruma planını güçlendir · 15 hazine</b><span>Güvenlik +20. 1 eylem; dönemlik koruma gideri güvenliğe bağlıdır.</span></button>':''}</section>`+baseTabState();};
const baseTabRegion=tabRegion;
tabRegion=()=>`<section class="pn">${regionReport(G.rs[G.sel])}</section>`+baseTabRegion();
const baseModal=modal;
modal=function(){const s=ui.sheet,q=G.q[0];
 if(s?.t==='settings')return settingsModal();
 if(s?.t==='commands')return dialog(G.rs[G.sel].n+' · Emirler',`${list(mapActions())}${!leads(me())?'<p>Emir vermek için devlet başkanı olmalısın.</p>':''}`,'<button class="big" data-close="1"><b>Haritaya dön</b></button>','war');
 if(s?.t==='report')return dialog('Bölge raporu',regionReport(G.rs[G.sel]),'<button class="big" data-close="1"><b>Haritaya dön</b></button>');
 if(s?.t==='orders')return dialog('Gelişmeler',ordersPanel()+G.movements.map(m=>`<div class="timeline"><b>${esc(G.rs[m.r].n)}</b><p>${m.phase} · ${m.age}/6 dönem · Destek %${r0(m.support)}</p></div>`).join(''),'<button class="big" data-close="1"><b>Haritaya dön</b></button>','diplomacy');
 if(!s&&q?.id==='coalitionOffer'){const c=G.cs[q.c];return dialog('Koalisyon teklifi',`<p>${esc(c.parties[q.top].name)}, ${esc(c.parties[q.partner].name)} ile ortak hükûmet kurmak istiyor. Kabul edersen koalisyon ortağı olarak devam edersin.</p>`,'<button class="big" data-coalition="yes"><b>Kabul et</b></button><button class="big" data-coalition="no"><b>Reddet</b></button>','vote');}
 if(!s&&q?.id==='info')return dialog(q.title,`<div class="kick">${esc(q.k)}</div>${q.bars?vs(q.bars):''}<p>${esc(q.text)}</p>`,'<button class="big prime" data-q="ok"><b>Devam</b></button>',q.secret?'secret':q.scene||'event');
 return baseModal();
};
const baseRender=render;
render=function(){
 if(G){hydrate(G);ensureCabinet();if(typeof migrateNames==='function')migrateNames();}
 baseRender();const app=document.getElementById('app');
 const settingsButton='<button class="settings-btn" data-settings="1" aria-label="Oyun ayarları">☷</button>';
 if(ui.view==='game'){
  app.querySelector('.toprow')?.insertAdjacentHTML('beforeend',settingsButton);const main=app.querySelector('main');if(G.tab==='dunya')main?.classList.add('world-screen');
  if(ui.saveError)app.querySelector('.who')?.insertAdjacentHTML('afterend',`<p class="save-warning" role="alert">${esc(ui.saveError)}</p>`);
  if(!localStorage.getItem('muhur-tutorial-v2')&&ui.tutorial==null&&!G.q.length&&!ui.sheet)ui.tutorial=0;
 }else app.insertAdjacentHTML('beforeend',`<div class="title-tools"><span>v${VERSION}</span>${settingsButton}</div>`);
 if(ui.loadError&&ui.view==='title')app.querySelector('.title')?.insertAdjacentHTML('beforeend',`<p class="warn">${esc(ui.loadError)}</p>`);
 if(ui.view!=='game'&&ui.sheet?.t==='settings')app.insertAdjacentHTML('beforeend',settingsModal());
 if(ui.tutorial!=null){const [title,text]=TUTORIAL[ui.tutorial];app.insertAdjacentHTML('beforeend',dialog(`${ui.tutorial+1}/${TUTORIAL.length} · ${title}`,`<p>${text}</p>`,`<button class="big prime" data-tutorial-next="1"><b>${ui.tutorial===TUTORIAL.length-1?'Oyuna başla':'Sonraki'}</b></button><button class="big" data-tutorial-skip="1"><b>Öğreticiyi kapat</b></button>`));}
 if(ui.pendingImport)app.insertAdjacentHTML('beforeend',dialog('Kaydı geri yükle',`<p>${esc(ui.pendingImport.ps[ui.pendingImport.pid].name)} · ${ui.pendingImport.turn}. dönem.</p><p>Mevcut kaydın bir kopyası cihazda saklanacak. Bu yedekle devam etmek istiyor musun?</p>${ui.importError?`<p class="warn">${esc(ui.importError)}</p>`:''}`,'<button class="big prime" data-import-confirm="1"><b>Yedeği yükle</b></button><button class="big" data-import-cancel="1"><b>Vazgeç</b></button>'));
 if(ui.updateReady)app.insertAdjacentHTML('beforeend','<button class="update-banner" data-apply-update="1">Yeni sürüm hazır · Kaydet ve güncelle</button>');
 if(ui.notice){const t=document.getElementById('toast');t.textContent=ui.notice;t.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.hidden=true,2800);ui.notice=null;}
 setupFixedMap();const modalEl=app.querySelector<HTMLElement>('.modalbg:last-of-type .modal');if(modalEl){modalEl.setAttribute('tabindex','-1');modalEl.focus({preventScroll:true});}
};
let mapObserver:ResizeObserver,mapObservedBox:Element=null;
function setupFixedMap(){const box=document.querySelector('.fixed-map'),stage=box?.querySelector<HTMLElement>('.map-stage');if(box===mapObservedBox)return;mapObserver?.disconnect();mapObservedBox=box;if(!box||!stage)return;const fit=()=>{const width=Math.min(box.clientWidth,box.clientHeight*W/H);stage.style.width=width+'px';stage.style.height=width*H/W+'px';};fit();mapObserver=new ResizeObserver(fit);mapObserver.observe(box);}
// Only taps select a region. A touch scroll or accidental drag does not change the target.
let mapPointer:{x:number;y:number;id:number}=null;
document.addEventListener('pointerdown',e=>{if(eventElement(e).id==='map'&&!G.q.length&&!ui.sheet)mapPointer={x:e.clientX,y:e.clientY,id:e.pointerId};},true);
document.addEventListener('pointerup',e=>{if(eventElement(e).id!=='map'||!mapPointer||e.pointerId!==mapPointer.id)return;const tap=Math.hypot(e.clientX-mapPointer.x,e.clientY-mapPointer.y)<10;mapPointer=null;if(!tap)return;const b=eventElement(e).getBoundingClientRect(),point=mapToWorld((e.clientX-b.left)/b.width*W,(e.clientY-b.top)/b.height*H),x=Math.floor(point.x),y=Math.floor(point.y);if(x<0||x>=W||y<0||y>=H)return;let id=grid[y*W+x];if(id<0){const near=G.rs.map(r=>({id:r.id,d:Math.hypot(r.x-x,r.y-y)})).sort((a,b)=>a.d-b.d)[0];if(near&&near.d<9)id=near.id;}if(id>=0){G.sel=id;ui.mapCountry=G.rs[id].c;render();}},true);
document.addEventListener('pointercancel',()=>mapPointer=null,true);
document.addEventListener('click',e=>{if(eventElement(e).id==='map'){e.stopImmediatePropagation();e.preventDefault();}},true);
document.addEventListener('change',e=>{if(eventElement(e).id==='region-jump'){G.sel=+eventElement<HTMLInputElement | HTMLSelectElement>(e).value;render();}if(eventElement(e).id==='map-mode'&&isMapMode(eventElement<HTMLSelectElement>(e).value)){G.mapMode=eventElement<HTMLSelectElement>(e).value as MapMode;save();render();}});

/* Uygulama kontrolleri ve güvenli güncelleme. */
const baseWorldStep=worldStep;
worldStep=function(){baseWorldStep();socialStep();if(me().alive)assassinationStep();};
const baseEndTurn=endTurn;
endTurn=function(){if(ui.tutorial!=null||ui.pendingImport||!me().alive)return;baseEndTurn();};
const basePickQ=pickQ;
pickQ=function(a: string){const q=G.q[0];if(q?.id==='uprising'){if(resolveUprising(q,+a)===false)return;G.q.shift();showToast();save();render();return}basePickQ(a);};
// Keep the original early-election action connected to the visible election calendar.
const baseDoAct=doAct;
doAct=function(id: string){if(id==='s:early'){const c=leads(me());if(c&&G.ap>0&&G.turn>=4){c.electionDue=G.turn+1;G.ap--;say(`${c.n}: gelecek dönem erken seçim yapılacak.`);save();render();}return;}baseDoAct(id);};
function handleControls(e: MouseEvent){const b=eventElement(e).closest('button');if(!b||b.disabled)return;const d=b.dataset,custom=['settings','panel','politic','security','export','help','tutorialNext','tutorialSkip','importConfirm','importCancel','checkUpdate','applyUpdate','coalition','min'].some(k=>k in d);if(!custom)return;
 if(document.querySelector('.modalbg')&&!b.closest('.modal')&&!('applyUpdate' in d))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(d.settings){ui.sheet={t:'settings'};ui.importError=null;render();}
 if(d.panel){ui.sheet={t:d.panel};render();}
 if(d.politic)politicsAction(d.politic,+d.party);
 if(d.security){const c=leads(me());if(c&&costAction(c,15)){c.security=cl(c.security+20);save();render();}}
 if(d.export)exportSave();
 if(d.help){ui.sheet=null;ui.tutorial=0;render();}
 if(d.tutorialNext||d.tutorialSkip){if(d.tutorialSkip||ui.tutorial>=TUTORIAL.length-1){localStorage.setItem('muhur-tutorial-v2','done');ui.tutorial=null;}else ui.tutorial++;render();}
 if(d.importConfirm)confirmImport();
 if(d.importCancel){ui.pendingImport=null;ui.importError=null;render();}
 if(d.checkUpdate)checkUpdate();
 if(d.applyUpdate)applyUpdate();
 if(d.min&&isMinisterKey(d.min)){ui.cand=[0,1,2].map(()=>({name:regionalName(G.rs[me().r].id),lead:rint(25,85),seed:rint(1,99999)}));ui.sheet={t:'min',k:d.min};render();}
 if(d.coalition){const q=G.q[0];if(q?.id!=='coalitionOffer')return;const c=G.cs[q.c];if(d.coalition==='yes')installGovernment(c,[q.top,q.partner]);else{const alternative=c.parties.map((_,i)=>i).find(i=>i!==q.top&&i!==q.partner&&c.parties[i].seats+c.parties[q.top].seats>=51);installGovernment(c,alternative==null?[q.top]:[q.top,alternative]);}G.q.shift();save();render();}
}
document.addEventListener('click',handleControls,true);
document.addEventListener('change',async e=>{if(eventElement(e).id!=='import-save')return;const file=eventElement<HTMLInputElement>(e).files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('Dosya çok büyük.');ui.pendingImport=parseImport(await file.text());ui.importError=null;}catch(err){ui.importError=errorMessage(err);ui.pendingImport=null;}render();});
document.addEventListener('keydown',e=>{const modal=document.querySelector<HTMLElement>('.modalbg:last-of-type .modal');if(!modal)return;if(e.key==='Escape'&&ui.sheet&&!ui.pendingImport&&ui.tutorial==null){ui.sheet=null;render();return;}if(e.key==='Tab'){const nodes=[...modal.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]')];if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===modal)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
let appRegistration:ServiceWorkerRegistration=null;
function markWaiting(){if(appRegistration?.waiting&&navigator.serviceWorker.controller){ui.updateReady=true;render();}}
async function checkUpdate(){if(!appRegistration){ui.notice='Güncellemeler HTTPS üzerinden yayınlanan oyunda kullanılabilir.';render();return;}try{await appRegistration.update();markWaiting();ui.notice=ui.updateReady?'Yeni sürüm hazır.':'Güncelleme kontrol edildi. Yeni sürüm varsa bildirim görünecek.';}catch(e){ui.notice='Güncelleme kontrolü için internet bağlantını kontrol et.';}render();}
function applyUpdate(){if(!appRegistration?.waiting){checkUpdate();return;}save();flushGameSave();if(ui.saveError){ui.notice='Önce kayıt yedeğini indir; cihaz kaydı yazılamadı.';render();return;}ui.applyingUpdate=true;appRegistration.waiting.postMessage({type:'SKIP_WAITING'});}
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(ui.applyingUpdate)location.reload();});
 window.addEventListener('load',async()=>{try{appRegistration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});markWaiting();appRegistration.addEventListener('updatefound',()=>{const worker=appRegistration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){ui.updateReady=true;render();}});});}catch(e){ui.notice='Çevrimdışı dosyalar hazırlanamadı; internet bağlantısıyla oynayabilirsin.';render();}});
}
