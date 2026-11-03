/** Explain actual model outcomes, reduce repetitive strategies, and expose character bonds. */
const TRAITS:Record<TraitId,{name:string;effect:string}>={
 loyal:{name:'Sadık',effect:'Zor dönemlerde güvenini daha yavaş kaybeder.'},
 ambitious:{name:'Hırslı',effect:'Baskıcı yönetimde güveni daha hızlı aşınır.'},
 pragmatic:{name:'Pragmatik',effect:'Ekonomik iyileşmeye olumlu tepki verir.'},
 cautious:{name:'Temkinli',effect:'Savaş ve sert müdahale konusunda çekincelidir.'},
 charismatic:{name:'Karizmatik',effect:'Seçim kampanyasının ağırlığına küçük bir katkı sağlar.'},
 idealistic:{name:'İlkeli',effect:'Baskı arttığında yönetime güveni azalır.'},
 stubborn:{name:'İnatçı',effect:'Görüşmelerde güven kazanımı daha sınırlıdır.'},
 mediator:{name:'Arabulucu',effect:'Görüşmelerde daha fazla güven kazanır.'}
};
function ensurePersonality(p:Person):void {
 if(!p.traits){const keys=keysOf(TRAITS),a=Math.floor(h2(p.seed,31)*keys.length),b=(a+1+Math.floor(h2(p.seed,37)*(keys.length-1)))%keys.length;p.traits=[keys[a],keys[b]];}
 p.bond ??={trust:40+Math.round(h2(p.seed,43)*25),respect:40+Math.round(h2(p.seed,47)*25),tension:10};
}
function polishState(s:GameState):GameState {s.decisionReports ??=[];s.actionUsage ??={};s.reportSequence ??=0;s.ps.forEach(ensurePersonality);return s;}
const polishHydrate=hydrate;hydrate=(s:GameState)=>polishState(polishHydrate(s));
const polishPerson=mkP;mkP=(opts:Partial<Person>={})=>{const p=polishPerson(opts);ensurePersonality(p);return p;};
function addReport(c:number,category:string,title:string,summary:string,factors:DecisionFactor[],hint:string):DecisionReport {
 polishState(G);const report:DecisionReport={id:`report-${G.turn}-${++G.reportSequence}`,turn:G.turn,c,category,title,summary,factors,hint};G.decisionReports.unshift(report);G.decisionReports=G.decisionReports.slice(0,40);return report;
}
function attachReport(report:DecisionReport,start:number):void {for(const q of G.q.slice(start))if(q.id==='info')q.reportId=report.id;}
function assessBattle(o:Operation):BattleAssessment {
 const c=G.cs[o.c],r=G.rs[o.r],t=G.cs[r.c],fronts=Math.max(1,(G.operations||[]).filter(x=>x.c===c.id&&['conquest','amphibious'].includes(x.kind)).length+((G.operations||[]).includes(o)?0:1));
 const spread=1/(1+.3*(fronts-1)),naval=o.kind==='amphibious'?.72:1,army=c.army*naval,allies=Math.min(3,c.allies.filter(id=>G.cs[id]?.alive).length)*3,patron=t.patron!=null&&G.cs[t.patron]?.alive?G.cs[t.patron].army*.15:0;
 const attack=army*spread+allies,defense=t.army+r.fort*.55+patron,burden=crs(c).filter(a=>a.occupation>0).length;
 return {attack,defense,fronts,base:25+(attack-defense)*.38,supply:(o.kind==='amphibious'?6:4)+Math.floor(burden/3),factors:[
 {label:'Temel ilerleme',value:'Her dönemin başlangıç katkısı',impact:25},{label:'Saldıran ordu',value:`${r0(c.army)} güç${naval<1?' · çıkarma katsayısı 0,72':''}`,impact:army*.38},
 {label:'Cephe paylaşımı',value:`${fronts} etkin cephe`,impact:(army*spread-army)*.38},{label:'Müttefik desteği',value:'En çok 3 etkin müttefik hesaba katılır',impact:allies*.38},
 {label:'Savunan ordu',value:`${r0(t.army)} güç`,impact:-t.army*.38},{label:'Tahkimat',value:`${r0(r.fort)} seviye`,impact:-r.fort*.55*.38},{label:'Himaye desteği',value:`${r0(patron)} ek savunma`,impact:-patron*.38}]};
}
const reportBattle=battleStep;
battleStep=function(o:Operation):boolean {
 const a=assessBattle(o),before=o.progress||0,oldOwner=G.rs[o.r].c,queued=G.q.length,c=G.cs[o.c],supplyMissing=c.T<a.supply||c.army<8,continued=reportBattle(o),r=G.rs[o.r];
 if(c.leader===G.pid||cOf(me()).id===c.id){const gain=(o.progress||0)-before,won=r.c===c.id&&oldOwner!==c.id,report=addReport(c.id,'war',won?'Bölge neden kazanıldı?':continued?'Harekâtın dönem raporu':'Harekât neden durdu?',supplyMissing?'İkmal bütçesi veya ordu gücü yetersiz.':gain<=0?'Yönetim, sınır veya barış koşulları değişti.':`Bu dönem +${gain.toFixed(1)} ilerleme. Toplam %${r0(o.progress||0)}. ${won?'Hedef tamamlandı.':continued?'Mücadele sürüyor.':'Altı dönemlik süre içinde hedef tamamlanamadı.'}`,[...a.factors,{label:'Dönem belirsizliği',value:'Tek zar; her dönem −8 ile +8 arasında',impact:gain>0?o.lastRoll||0:0},{label:'İkmal bedeli',value:`Bu dönem ${a.supply} hazine gerekir`,impact:0}], 'İlerleme dönem başına 8–48 ile sınırlıdır; toplam 100 olduğunda bölge kazanılır. Tahkimat, çok cephe ve işgal yükünü hesaba kat.');o.lastReport=report.id;attachReport(report,queued);}
 return continued;
};
let assessControl = function(m:ArmedMovement,r:Region):ControlAssessment {const power=m.country==null?m.strength:Math.min(m.strength,G.cs[m.country].army),c=G.cs[r.c];return {power,base:24+(power+m.support*.4-c.army*.45-r.loyal*.25-r.fort*.2)/5,factors:[{label:'Temel ilerleme',value:'Bölgesel mücadele',impact:24},{label:'Hareket gücü',value:power.toFixed(1),impact:power/5},{label:'Hareket desteği',value:m.support.toFixed(1),impact:m.support*.4/5},{label:'Yönetimin ordusu',value:c.army.toFixed(1),impact:-c.army*.45/5},{label:'Yerel sadakat',value:r.loyal.toFixed(1),impact:-r.loyal*.25/5},{label:'Tahkimat',value:r.fort.toFixed(1),impact:-r.fort*.2/5}]};}
const reportControl=controlStep;controlStep=function():void {
 const pending=(G.controlCampaigns||[]).map(o=>({o,before:o.progress,owner:G.rs[o.r].c,m:G.armedMovements.find(m=>m.id===o.movement)})).filter(x=>x.m?.founder===G.pid),analyses=pending.map(x=>assessControl(x.m,G.rs[x.o.r])),queued=G.q.length;reportControl();
 pending.forEach((x,i)=>{const r=G.rs[x.o.r],gain=x.o.progress-x.before,won=r.c!==x.owner&&r.c===x.m.country,report=addReport(x.m.country??x.m.home,'control',won?'Bölgesel kontrol kazanıldı':'Kontrol mücadelesinin nedenleri',`Bu dönem +${gain.toFixed(1)}, toplam %${r0(x.o.progress)} ilerleme. ${won?'Yalnızca hedef bölge yönetim değiştirdi.':G.controlCampaigns.includes(x.o)?'Mücadele sürüyor.':'Mücadele sona erdi.'}`,[...analyses[i].factors,{label:'Dönem belirsizliği',value:'−3 ile +3 arasında',impact:gain>0?x.o.lastRoll||0:0}],'Her bölge ayrı değerlendirilir. İlerleme 8–36 arasında sınırlanır; güç veya bağlantı kaybı mücadeleyi durdurabilir.');x.o.lastReport=report.id;attachReport(report,queued);});
};
function rollOperation(o:Operation,chancePercent:number):boolean {o.chancePercent=chancePercent;o.chanceRoll=rnd(0,100);return o.chanceRoll<chancePercent;}
function notifyOperation(o:Operation,c:Country,title:string,text:string,scene:string='event'):void {
 const start=G.q.length;notify(c,title,text,scene);if(c.id!==cOf(me()).id&&c.leader!==G.pid)return;
 const factors:DecisionFactor[]=o.chancePercent!=null?[{label:'Başarı eşiği',value:`%${o.chancePercent}`,impact:0},{label:'Çekilen değer',value:`${o.chanceRoll.toFixed(1)} / 100`,impact:0}]:[];if(o.costPaid!=null)factors.push({label:'Ödenen başlangıç bedeli',value:`${o.costPaid} hazine ve 1 eylem`,impact:0});
 const report=addReport(c.id,'policy',title,text,factors,o.chancePercent!=null?'Çekilen değer başarı eşiğinden küçükse girişim başarılıdır. Olasılık garanti değildir; yeniden değerlendirmek için ilişkileri ve şartları iyileştirebilirsin.':'Sonuçtaki gösterge değişimleri uygulanmıştır. Bir sonraki dönem bütçe ve toplumsal etkileri gazeteden takip edebilirsin.');o.lastReport=report.id;attachReport(report,start);
}
function usageCount(key:string):number {const item=G.actionUsage?.[key];return item?.turn===G.turn?item.count:0;}
function campaignGain(c:Country,action:string):number {polishState(G);const key=`campaign-${G.pid}`,count=usageCount(key);G.actionUsage[key]={turn:G.turn,count:count+1};return (action==='rally'?10:7)*Math.pow(.5,Math.min(3,count));}
const balancedActions=mapActions;mapActions=function():Action[]{const out=balancedActions(),c=leads(me()),r=G.rs[G.sel];for(const a of out){
 if(['op:conquest','op:amphibious'].includes(a.id)&&c&&(G.operations||[]).filter(o=>o.c===c.id&&['conquest','amphibious'].includes(o.kind)).length>=2)a.lock='Aynı anda en fazla 2 askerî cephe yönetebilirsin.';
 if(a.id==='op:relief'&&r.lastSupportTurn!=null&&G.turn-r.lastSupportTurn<2)a.lock='Bu bölgede yeni destek paketi için 2 dönem aralık gerekli.';
 if(a.id==='op:garrison'&&r.lastReconcileTurn!=null&&G.turn-r.lastReconcileTurn<2)a.lock='Uzlaşmanın etkisini görmek için 2 dönem aralık gerekli.';
 }return out;};
const balancedConfirm=confirmOperation;confirmOperation=function():void {const sheet=ui.sheet?{...ui.sheet}:null,before=G.ap;balancedConfirm();if(sheet&&G.ap<before){if(sheet.kind==='relief')G.rs[sheet.r].lastSupportTurn=G.turn;if(sheet.kind==='garrison')G.rs[sheet.r].lastReconcileTurn=G.turn;save();}};
const explainedElection=runElection;runElection=function(c:Country):void {
 const forecast=voteForecast(c),campaign=c.parties.map(p=>p.campaign);explainedElection(c);if(c.id!==cOf(me()).id)return;
 const winner=c.lastElection.parties.reduce((a,b)=>a.seats>b.seats?a:b),report=addReport(c.id,'election','Seçim neden böyle sonuçlandı?',`${winner.name}: ${winner.seats} sandalye. ${winner.seats>=51?'Tek başına çoğunluk.':'Hükûmet için koalisyon veya azınlık yönetimi gerekir.'}`,c.lastElection.parties.map((p,i)=>({label:p.name,value:i>=forecast.length?`Bölgesel bağımsız seçim · ${p.seats} sandalye`:`Tahmin %${forecast[i].toFixed(1)} → sonuç %${p.share.toFixed(1)} · kampanya ${campaign[i].toFixed(1)}`,impact:i<forecast.length?p.share-forecast[i]:0})),'Tahmin; iktidarın yönetim desteği, eğitim, örgütlenme, hitabet ve kampanyadan oluşur. Her partiye −4…+4 belirsizlik eklenir, oylar yeniden %100’e oranlanır. Sandalyeler en büyük kalan yöntemiyle dağıtılır.');
 const night=G.q.find(q=>q.id==='electionNight'&&q.c===c.id);if(night)night.reportId=report.id;
};
function reportLink(id:string,label='Sonucun nedenleri'):string{return `<button class="chip" data-report="${esc(id)}">${esc(label)}</button>`;}
const explainedBoard=electionBoard;electionBoard=function(q:QueuedEvent,fraction:number):string{return explainedBoard(q,fraction)+(fraction>=1&&q.reportId?reportLink(q.reportId):'');};
function contacts():Person[]{const c=cOf(me());return [...new Set([c.leader,c.vice,...Object.values(c.min),c.opp])].map(id=>P(id)).filter(p=>p&&p.alive&&p.id!==G.pid);}
function cohesion():number {const c=leads(me());if(!c)return 50;const cabinet=[...new Set([c.vice,...Object.values(c.min)])].map(id=>P(id)).filter(p=>p?.alive&&p.id!==G.pid);return cabinet.reduce((a,p)=>a+p.bond.trust,0)/(cabinet.length||1);}
function meetingLock(p:Person):string {return G.ap<1?'1 eylem gerekli':p.lastMeeting!=null&&G.turn-p.lastMeeting<2?'Yeni görüşme için 2 dönem bekle':(leads(me())?leads(me()).T:me().money)<(leads(me())?8:5)?'Görüşme bütçesi yetersiz':'';}
function meetingGain(p:Person):number{return 8+(p.traits.includes('mediator')?3:0)-(p.traits.includes('stubborn')?2:0)+(p.bond.respect>=65?2:0)-(p.bond.tension>=60?2:0);}
function meetCharacter(id:number):void {const p=contacts().find(p=>p.id===id);if(!p||meetingLock(p))return;const c=leads(me());if(c)c.T-=8;else me().money-=5;G.ap--;p.lastMeeting=G.turn;p.bond.trust=cl(p.bond.trust+meetingGain(p));p.bond.respect=cl(p.bond.respect+4);p.bond.tension=cl(p.bond.tension-4);save();render();}
const relationshipSocial=socialStep;socialStep=function():void {
 const c=cOf(me()),econ=c.econ;relationshipSocial();polishState(G);
 if(c.leader!==G.pid)return;
 for(const p of contacts()){
 let delta=c.repression>35?-1:0;if(inWar(c)&&p.traits.includes('cautious'))delta-=1.5;if(c.repression>35&&p.traits.includes('idealistic'))delta-=2;if(c.repression>35&&p.traits.includes('ambitious'))delta-=1;
 if(c.econ>econ&&p.traits.includes('pragmatic'))delta+=1;if(c.repression<15&&!inWar(c))delta+=.5;if(delta<0&&p.traits.includes('loyal'))delta*=.5;
 p.bond.trust=cl(p.bond.trust+delta);p.bond.tension=cl(p.bond.tension-delta*.5);
 }
 const score=cohesion(),change=score>=65?.7:score<35?-.8:0;c.stab=cl(c.stab+change);
 if(change)addReport(c.id,'cabinet','Kabine uyumunun etkisi',`Ortalama güven ${score.toFixed(1)}. İstikrar ${change>0?'+':''}${change.toFixed(1)} değişti.`,[], 'Görüşmeler güveni artırır; savaş ve baskıya verilen tepkiler kişiliğe göre değişir.');
};
function priorities():PriorityItem[]{const c=cOf(me()),leader=leads(me()),items:PriorityItem[]=[];
 if(G.unrest.some(u=>G.rs[u.r].c===c.id))items.push({level:'urgent',title:'Bölgelerde huzursuzluk',detail:'Yerel talepleri ve müdahale seçeneklerini incele.',target:'dunya'});
 if(leader&&c.T<20)items.push({level:'urgent',title:'Hazine daralıyor',detail:'Yeni emirlerden önce gelir ve giderleri gözden geçir.',target:'budget'});
 if(leader&&G.policyProjects?.some(p=>p.c===c.id&&p.status==='paused'))items.push({level:'urgent',title:'Program ödenek bekliyor',detail:'Yatırım takviminden kalan ödemeyi ve ilerlemeyi incele.',target:'investments'});
 if(c.electionDue-G.turn<=2)items.push({level:'important',title:'Seçim yaklaşıyor',detail:`${Math.max(0,c.electionDue-G.turn)} dönem kaldı. Örgütlenme ve kampanyayı birlikte değerlendir.`,target:'elections'});
 if(leader&&cohesion()<45)items.push({level:'important',title:'Kabine güven istiyor',detail:'Düşük güven istikrarı zayıflatabilir.',target:'contacts'});
 if(G.operations.some(o=>o.c===c.id))items.push({level:'info',title:'Emirler sürüyor',detail:'İlerleme ve ikmal raporlarını incele.',target:'orders'});
 if(leader&&G.policyProjects?.some(p=>p.c===c.id&&(p.status==='active'||p.status==='paused')))items.push({level:'info',title:'Yatırımlar sürüyor',detail:'Programların ilerlemesini ve kalan bütçesini izle.',target:'investments'});
 if(!items.length)items.push({level:'info',title:leader?'Yönetimi sağlamlaştır':'Siyasi tabanını büyüt',detail:leader?'Bütçe, yönetim desteği ve karakter ilişkilerini birlikte gözet.':'Örgütlenme, itibar ve parti çalışmaları farklı yollar açar.',target:leader?'devlet':'karakter'});
 return items.slice(0,3);
}
function supportSummary():string {
 const c=cOf(me());
 return `<button class="support-summary" data-support-info="1" aria-label="Kişisel destek ve yönetim desteğini açıkla"><span>Kişisel destek <b>%${r0(natSup(me()))}</b></span><span>Yönetim desteği <b>%${r0(c.appr)}</b></span><i aria-hidden="true">ⓘ</i></button>`;
}
function priorityPanel():string{return `<section class="pn priorities"><h3 class="h3">Şimdi önemli</h3>${priorities().map(p=>`<button class="priority-item priority-${p.level}" data-priority="${p.target}"><b>${esc(p.title)}</b><span>${esc(p.detail)}</span></button>`).join('')}<div class="chips"><button class="chip" data-contacts="1">Karakter bağları</button><button class="chip" data-reports="1">Karar defteri</button></div></section>`;}
const priorityChar=tabChar;tabChar=()=>priorityPanel()+priorityChar();
const priorityState=tabState;tabState=()=>priorityPanel()+priorityState();
const explainedOrders=ordersPanel;ordersPanel=()=>explainedOrders()+`<h3>Karar defteri</h3>${(G.decisionReports||[]).slice(0,8).map(r=>`<p>${reportLink(r.id,r.title)}</p>`).join('')}`;
const polishModal=modal;modal=function():string {
 const s=ui.sheet;
 if(s?.t==='supportInfo')return dialog('İki farklı destek',`<h3>Kişisel destek · %${r0(natSup(me()))}</h3><p>Ülke genelinde senin siyasi tabanını gösterir. Bölgelerdeki kişisel desteğin nüfusa göre ağırlıklı ortalamasıdır.</p><h3>Yönetim desteği · %${r0(cOf(me()).appr)}</h3><p>Halkın mevcut ülke yönetiminden memnuniyetidir. Ekonomi, vergiler, istikrar ve yönetim kararları bu değeri etkiler.</p><p class="sub">Sosyal destek paketi önce yönetim desteğini artırır. Başkan olduğunda kişisel desteğin dönemler ilerledikçe bu değere yaklaşır. Seçim anketi ayrıca kampanya ve aday özelliklerini de hesaba katar; bu iki değerin toplamı değildir.</p>`,'<button class="big" data-close="1"><b>Geri dön</b></button>');
 if(s?.t==='decisionReport'){const r=G.decisionReports.find(r=>r.id===s.id);return dialog('Kararın nedenleri',r?`<h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><div class="decision-factors">${r.factors.map(f=>`<div><b>${esc(f.label)}${f.impact?` <em>${f.impact>0?'+':''}${f.impact.toFixed(1)}</em>`:''}</b><span>${esc(f.value)}</span></div>`).join('')}</div><p class="sub">${esc(r.hint)}</p>`:'Rapor arşivden kaldırılmış.','<button class="big" data-close="1"><b>Geri dön</b></button>');}
 if(s?.t==='contacts')return dialog('Karakter bağları',`<p class="sub">Saygı 65 ve üzerindeyse görüşme +2 ek güven getirir; gerilim 60 ve üzerindeyse kazanım 2 azalır. Kabine güveni 65 üzerinde istikrara +0,7; 35 altında −0,8 katkı verir. Görüşme: 1 eylem ve ${leads(me())?'8 hazine':'5 kişisel para'}.</p>${contacts().map(p=>`<section class="contact-card"><h3>${esc(p.name)} ${p.id===cOf(me()).opp?'· Rakip':'· Yönetim'}</h3><p>${p.traits.map(t=>`<b title="${esc(TRAITS[t].effect)}">${TRAITS[t].name}</b>`).join(' · ')}</p>${p.traits.map(t=>`<p class="sub">${esc(TRAITS[t].effect)}</p>`).join('')}<p>Güven ${r0(p.bond.trust)} · Saygı ${r0(p.bond.respect)} · Gerilim ${r0(p.bond.tension)}</p><button class="chip" data-meet="${p.id}" ${meetingLock(p)?'disabled':''}>${esc(meetingLock(p)||`Görüşme yap · +${meetingGain(p)} güven`)}</button></section>`).join('')}`,'<button class="big" data-close="1"><b>Geri dön</b></button>');
 if(s?.t==='reports')return dialog('Karar defteri',(G.decisionReports||[]).map(r=>`<p>${reportLink(r.id,r.title)} <small>${esc(dateStr(r.turn))}</small></p>`).join('')||'<p>İlk sonuç raporu dönem tamamlandığında burada görünür.</p>','<button class="big" data-close="1"><b>Geri dön</b></button>');
 let html=polishModal();const q=G.q[0];if(!s&&q?.id==='info'&&q.reportId)html=html.replace('<div class="acts">',`<div class="acts">${reportLink(q.reportId)}`);return html;
};
document.addEventListener('click',e=>{const b=eventElement(e).closest<HTMLButtonElement>('[data-report],[data-reports],[data-contacts],[data-meet],[data-priority],[data-support-info]');if(!b||b.disabled||document.querySelector('.modalbg')&&!b.closest('.modal'))return;e.preventDefault();e.stopImmediatePropagation();const d=b.dataset;if(d.supportInfo)ui.sheet={t:'supportInfo'};else if(d.report)ui.sheet={t:'decisionReport',id:d.report};else if(d.reports)ui.sheet={t:'reports'};else if(d.contacts)ui.sheet={t:'contacts'};else if(d.meet){meetCharacter(+d.meet);return;}else if(d.priority){followPriority(d.priority);return;}render();},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&['decisionReport','reports','contacts','supportInfo'].includes(ui.sheet?.t)){e.preventDefault();e.stopImmediatePropagation();ui.sheet=null;render();}},true);
const personalityForecast=voteForecast;voteForecast=function(c:Country):number[]{const shares=personalityForecast(c).map((v,i)=>v+(P(c.parties[i].candidate).traits?.includes('charismatic')?1.5:0)),sum=shares.reduce((a,b)=>a+b,0);return shares.map(v=>v/sum*100);};
const previewOperation=operationModal;operationModal=function(s:Sheet):string {let html=previewOperation(s);const c=leads(me());if(c&&['conquest','amphibious'].includes(s.kind)){const a=assessBattle({kind:s.kind,r:s.r,c:c.id,from:c.cap,target:G.rs[s.r].c,turn:G.turn}),low=cl(a.base-8,8,48),high=cl(a.base+8,8,48);html=html.replace('<div class="acts">',`<p class="decision-preview">Beklenen dönem ilerlemesi: %${low.toFixed(1)}–${high.toFixed(1)}. İkmal: ${a.supply} hazine/dönem. Ordu ve tahkimat değiştikçe bu aralık da değişir. Eşzamanlı cepheler ordu gücünü paylaşır.</p><div class="acts">`);}return html;};
const polishedValidation=validateState;validateState=function(s:GameState):GameState {
 polishedValidation(s);const finite=(x:unknown)=>typeof x==='number'&&Number.isFinite(x),bounded=(x:unknown)=>finite(x)&&(x as number)>=0&&(x as number)<=100;
 if(s.lastBondEvent!=null&&!finite(s.lastBondEvent))throw Error('Karakter gündemi tarihi bozuk.');
 for(const p of s.ps){if(p.traits!=null&&(!Array.isArray(p.traits)||p.traits.length>2||!p.traits.every(t=>Object.hasOwn(TRAITS,t))))throw Error('Karakter kişiliği bozuk.');if(p.bond!=null&&(!p.bond||![p.bond.trust,p.bond.respect,p.bond.tension].every(bounded)))throw Error('Karakter ilişkisi bozuk.');if(p.lastMeeting!=null&&!finite(p.lastMeeting))throw Error('Görüşme tarihi bozuk.');}
 if(s.decisionReports!=null&&(!Array.isArray(s.decisionReports)||s.decisionReports.length>40))throw Error('Karar defteri bozuk.');
 for(const r of s.decisionReports||[]){if(!r||typeof r.id!=='string'||!/^report-\d+-\d+$/.test(r.id)||!finite(r.turn)||!Number.isInteger(r.c)||!s.cs[r.c]||![r.title,r.summary,r.hint,r.category].every(v=>typeof v==='string')||!Array.isArray(r.factors)||r.factors.length>30||!r.factors.every(f=>f&&typeof f.label==='string'&&typeof f.value==='string'&&finite(f.impact)))throw Error('Sonuç raporu bozuk.');}
 if(s.reportSequence!=null&&(!Number.isInteger(s.reportSequence)||s.reportSequence<0))throw Error('Rapor sırası bozuk.');
 if(s.actionUsage!=null&&(typeof s.actionUsage!=='object'||Array.isArray(s.actionUsage)||Object.values(s.actionUsage).some(v=>!v||!Number.isInteger(v.turn)||!Number.isInteger(v.count)||v.count<0)))throw Error('Karar sayacı bozuk.');
 for(const r of s.rs)for(const v of [r.lastSupportTurn,r.lastReconcileTurn])if(v!=null&&!finite(v))throw Error('Bölgesel karar tarihi bozuk.');return s;
};
// Secondary management stays available without competing with urgent decisions.
const advancedOpen=new Set<string>();
function followPriority(target:string):void {
 if(['contacts','orders'].includes(target)){ui.sheet={t:target};render();return;}
 const panels:Record<string,string>={budget:'Kamu bütçesi',elections:'Meclis ve seçimler',investments:'policy-projects'};
 const title=panels[target];
 if(title){
  G.tab='devlet';const key=`devlet:${title}`;advancedOpen.add(key);render();
  const panel=[...document.querySelectorAll<HTMLElement>('details[data-advanced]')].find(d=>d.dataset.advanced===key);
  panel?.scrollIntoView({block:'start'});return;
 }
 if(isGameTab(target))G.tab=target;
 render();const main=document.querySelector('main');if(main)main.scrollTop=0;
}
function simplifyPanels(html:string):string {
 const template=document.createElement('template');template.innerHTML=html;
 const daily=template.content.querySelector('.daily-decisions');
 if(daily)template.content.prepend(daily);
 for(const section of template.content.querySelectorAll('section.pn')){
  if(section.matches('.daily-decisions,.priorities'))continue;
  const heading=section.querySelector('h3,h2');if(!heading)continue;
  const title=heading.textContent,key=`${G.tab}:${title}`,details=document.createElement('details');
  details.className='pn advanced-panel';details.dataset.advanced=key;details.open=advancedOpen.has(key);
  const summary=document.createElement('summary');summary.textContent=title;heading.remove();details.append(summary);
  while(section.firstChild)details.append(section.firstChild);
  section.replaceWith(details);
 }
 return template.innerHTML;
}
const simplifiedState=tabState;tabState=()=>simplifyPanels(simplifiedState());
const simplifiedChar=tabChar;tabChar=()=>simplifyPanels(simplifiedChar());
document.addEventListener('toggle',e=>{const d=e.target;if(d instanceof HTMLDetailsElement&&d.dataset.advanced){if(d.open)advancedOpen.add(d.dataset.advanced);else advancedOpen.delete(d.dataset.advanced);}},true);
const explainedCampaignPanel=politicsPanel;politicsPanel=function():string {const count=usageCount(`campaign-${G.pid}`),scale=Math.pow(.5,Math.min(3,count));return appendPoliticsNote(explainedCampaignPanel(),`<p class="sub">Bu dönem ${count} kampanya yapıldı. Sıradaki miting +${(10*scale).toFixed(1)}, tartışma +${(7*scale).toFixed(1)} kampanya getirir (üst sınır 40). Aynı dönemde tekrarda getiri yarıya iner; bedel değişmez. Karizmatik adayın tahminine normalleştirmeden önce +1,5 puan eklenir.</p>`);};
const agendaSocial=socialStep;socialStep=function():void {agendaSocial();const c=leads(me()),people=contacts();if(!c||!people.length||G.q.length||G.turn<4||G.turn-(G.lastBondEvent??0)<4)return;const p=people[Math.floor(G.turn/4)%people.length];G.lastBondEvent=G.turn;G.q.push({id:'bondChoice',pid:p.id,c:c.id});};
function agendaText(p:Person):string {return p.traits.includes('idealistic')?'Daha açık ve denetlenebilir yönetim için kamuoyu önünde destek istiyor.':p.traits.includes('cautious')?'Gerginlikler karşısında daha temkinli bir yönetim ve bir değerlendirme toplantısı istiyor.':p.traits.includes('ambitious')?'Yönetim kararlarında daha görünür bir rol ve söz hakkı istiyor.':'Ekonomik önceliklerin birlikte değerlendirilmesini istiyor.';}
const agendaModal=modal;modal=function():string {const q=G.q[0];if(!ui.sheet&&q?.id==='bondChoice'){const p=P(q.pid),c=G.cs[q.c];if(!p.alive||c.leader!==G.pid)return dialog('Görüşme gündemden düştü','<p>Görev veya yaşam koşulları değiştiği için bu görüşme gerçekleşmedi. Kaynak harcanmaz.</p>','<button class="big" data-bond-choice="cancel"><b>Devam</b></button>');return dialog('Siyasetin insan tarafı',`<h3>${esc(p.name)}</h3><p>${p.traits.map(t=>TRAITS[t].name).join(' · ')}</p><p>${agendaText(p)}</p><p class="sub">Güven ${r0(p.bond.trust)} · Saygı ${r0(p.bond.respect)}</p>`,`<button class="big" data-bond-choice="listen" ${c.T<6||G.ap<1?'disabled':''}><b>Birlikte değerlendir</b><span>6 hazine, 1 eylem · güven +8, istikrar +1</span></button><button class="big" data-bond-choice="endorse"><b>Kamuoyu önünde destekle</b><span>Güven +3, saygı +5 · yönetim desteği −2</span></button><button class="big" data-bond-choice="decline"><b>Öncelikler farklı</b><span>Yönetim desteği +1 · güven −6, gerilim +3</span></button>`);}return agendaModal();};
document.addEventListener('click',e=>{const b=eventElement(e).closest<HTMLButtonElement>('[data-bond-choice]');if(!b||b.disabled)return;const q=G.q[0];if(q?.id!=='bondChoice'||ui.sheet)return;e.preventDefault();e.stopImmediatePropagation();const p=P(q.pid),c=G.cs[q.c],choice=b.dataset.bondChoice;if(!p.alive||c.leader!==G.pid){G.q.shift();save();render();return;}if(choice==='listen'){if(c.T<6||G.ap<1)return;c.T-=6;G.ap--;p.bond.trust=cl(p.bond.trust+8);c.stab=cl(c.stab+1);}else if(choice==='endorse'){p.bond.trust=cl(p.bond.trust+3);p.bond.respect=cl(p.bond.respect+5);c.appr=cl(c.appr-2);}else{c.appr=cl(c.appr+1);p.bond.trust=cl(p.bond.trust-6);p.bond.tension=cl(p.bond.tension+3);}G.q.shift();addReport(c.id,'relationship',`${p.name} ile görüşme`,choice==='listen'?'Değerlendirme görüşmesi: −6 hazine, −1 eylem, +8 güven ve +1 istikrar.':choice==='endorse'?'Kamusal destek: +3 güven, +5 saygı, −2 yönetim desteği.':'Farklı öncelikler: +1 yönetim desteği, −6 güven, +3 gerilim.',[], 'Güven ve gerilim kalıcıdır. Karakterin kişiliği sonraki dönemlerde kararlarına verdiği tepkiyi değiştirir.');save();render();},true);
const agendaValidation=validateState;validateState=function(s:GameState):GameState {agendaValidation(s);for(const q of s.q)if(q.id==='bondChoice'&&(!Number.isInteger(q.pid)||!s.ps[q.pid]||!Number.isInteger(q.c)||!s.cs[q.c]))throw Error('Karakter gündemi bozuk.');return s;};

