/* Multi-period investment commitments and measured newspaper explanations. */
const POLICY_PROGRAMS:Record<PolicyKind,{title:string;action:string;duration:number;upfront:number;upkeep:number;benefit:string}>={
 education:{title:'Eğitim seferberliği',action:'s:edu',duration:3,upfront:40,upkeep:6,benefit:'Eğitim +6 · İşsizlik −2'},
 infrastructure:{title:'Altyapı programı',action:'s:inf',duration:2,upfront:40,upkeep:8,benefit:'Altyapı +6 · Zenginlik +2'}
};
const METRIC_NAMES:Record<keyof CountryMetrics,string>={econ:'Ekonomi',stab:'İstikrar',appr:'Yönetim desteği',treasury:'Hazine'};
function countryMetrics(c:Country):CountryMetrics{return {econ:c.econ,stab:c.stab,appr:c.appr,treasury:c.T};}
function metricDifference(after:CountryMetrics,before:CountryMetrics):CountryMetrics{return {econ:after.econ-before.econ,stab:after.stab-before.stab,appr:after.appr-before.appr,treasury:after.treasury-before.treasury};}
function ensurePeriodState(s:GameState):GameState {
 s.policyProjects ??=[];s.policySequence ??=0;s.periodEffects ??=[];
 const p=s.ps[s.pid],c=p?s.cs[s.rs[p.r]?.c]:null;
 if(c&&(!s.periodBaseline||s.periodBaseline.c!==c.id)){
  const edition=s.news?.find(n=>n.c===c.id&&n.turn===s.turn);
  s.periodBaseline={c:c.id,turn:s.turn,metrics:edition?{...edition.metrics}:countryMetrics(c)};s.periodEffects=[];
 }
 return s;
}
const investmentHydrate=hydrate;hydrate=(s:GameState)=>ensurePeriodState(investmentHydrate(s));
function recordPeriodEffect(c:number,label:string,changes:Partial<CountryMetrics>,origin:PeriodEffect['origin']='world',detail?:string):void {
 if(!G||G.pid==null)return;ensurePeriodState(G);if(G.periodBaseline?.c!==c)return;
 const meaningful:Partial<CountryMetrics>={};
 for(const key of keysOf(METRIC_NAMES))if(Math.abs(changes[key]||0)>1e-7)meaningful[key]=changes[key];
 if(!Object.keys(meaningful).length)return;
 G.periodEffects.push({label:label.slice(0,160),changes:meaningful,origin,...(detail?{detail:detail.slice(0,240)}:{})});
 if(G.periodEffects.length>200){
  const first=G.periodEffects.shift(),next=G.periodEffects[0];
  for(const key of keysOf(METRIC_NAMES))next.changes[key]=(next.changes[key]||0)+(first.changes[key]||0);
  next.label='Önceki dönem içi değişimler';next.origin='world';delete next.detail;
 }
}
function effectTotal(effects:PeriodEffect[]):CountryMetrics {
 const total:CountryMetrics={econ:0,stab:0,appr:0,treasury:0};
 for(const effect of effects)for(const key of keysOf(total))total[key]+=effect.changes[key]||0;
 return total;
}
function measurePeriodPhase(label:string,run:()=>void):void {
 ensurePeriodState(G);const c=cOf(me()),before=countryMetrics(c),start=G.periodEffects.length;
 run();
 const actual=metricDifference(countryMetrics(c),before),explained=effectTotal(G.periodEffects.slice(start));
 recordPeriodEffect(c.id,label,metricDifference(actual,explained));
}
// A save closes the decision transaction after its mutations, before persistence.
interface PendingDecision {game:GameState;pid:number;c:Country;before:CountryMetrics;turn:number;label:string}
let pendingDecision:PendingDecision=null;
function finishDecisionEffect():boolean {
 const pending=pendingDecision;pendingDecision=null;if(!pending)return false;
 const {game,pid,c,before,turn,label}=pending;
 if(G!==game||G.pid!==pid||G.turn!==turn||cOf(me()).id!==c.id)return false;
 const changes=metricDifference(countryMetrics(c),before);
 if(!Object.values(changes).some(v=>Math.abs(v)>1e-7))return false;
 recordPeriodEffect(c.id,label,changes,'decision');return true;
}
const consequenceSave=save;save=function(){finishDecisionEffect();consequenceSave();};
const consequenceEndTurn=endTurn;endTurn=function(){if(finishDecisionEffect())consequenceSave();consequenceEndTurn();};
window.addEventListener('click',e=>{
 if(finishDecisionEffect())consequenceSave();
 const button=e.target instanceof Element?e.target.closest<HTMLButtonElement>('button'):null;
 if(!button||button.id==='end'||ui.view!=='game'||!G||G.pid==null)return;
 ensurePeriodState(G);const game=G,pid=G.pid,c=cOf(me()),before=countryMetrics(c),turn=G.turn;
 let label=button.querySelector('b')?.firstChild?.textContent?.trim()||button.textContent?.trim()||'Karar';
 if(button.dataset.meet)label='Karakter görüşmesi';
 if(button.dataset.confirmPolicy)label=POLICY_PROGRAMS[button.dataset.confirmPolicy as PolicyKind]?.title||label;
 const decision:PendingDecision={game,pid,c,before,turn,label};pendingDecision=decision;
 setTimeout(()=>{if(pendingDecision===decision&&finishDecisionEffect())consequenceSave();},0);
},true);

function activePolicy(p:PolicyProject):boolean{return p.status==='active'||p.status==='paused';}
function policyProjectLock(c:Country,kind:PolicyKind):string|null {
 ensurePeriodState(G);
 const running=G.policyProjects.find(p=>p.c===c.id&&p.kind===kind&&activePolicy(p));
 if(running)return running.status==='paused'?'Ödenek bekliyor':'Program sürüyor';
 const key=kind==='education'?'edu':'infra';
 if(crs(c).every(r=>r[key]>=100))return 'Bütün bölgeler en yüksek seviyede.';
 return null;
}
function policyProjectAction(c:Country,kind:PolicyKind):Action {
 const def=POLICY_PROGRAMS[kind];
 return A(def.action,def.title,`${def.duration} dönem · ${kind==='education'?'Eğitim +6':'Altyapı +6'}`,{cost3:def.upfront,tag:`${def.upfront} + ${def.upkeep}×${def.duration} hazine`,lock:policyProjectLock(c,kind),run(){
  ensurePeriodState(G);c.T-=def.upfront;G.policyProjects.push({id:`policy-${c.id}-${kind}-${G.turn}-${++G.policySequence}`,c:c.id,kind,started:G.turn,lastTurn:G.turn,progress:0,paid:def.upfront,status:'active'});
  const inactive=G.policyProjects.filter(p=>!activePolicy(p));
  if(inactive.length>100){const remove=new Set(inactive.slice(0,inactive.length-100).map(p=>p.id));G.policyProjects=G.policyProjects.filter(p=>!remove.has(p.id));}
  T(`${def.title} başladı; ilk sonuç gelecek dönem.`);
 }});
}
function policyProjectStep():void {
 ensurePeriodState(G);
 for(const p of G.policyProjects){
  if(!activePolicy(p)||p.lastTurn>=G.turn)continue;
  const c=G.cs[p.c],def=POLICY_PROGRAMS[p.kind];p.lastTurn=G.turn;
  if(!c?.alive||!crs(c).length){p.status='cancelled';continue;}
  if(c.T<def.upkeep){p.status='paused';continue;}
  const before=countryMetrics(c);c.T-=def.upkeep;p.paid+=def.upkeep;p.progress++;p.status='active';
  for(const r of crs(c)){
   if(p.kind==='education')r.edu=cl(r.edu+2);else r.infra=cl(r.infra+3);
   if(p.progress===def.duration){if(p.kind==='education'){r.unemployment=cl(r.unemployment-2,2,40);r.wealth=cl(r.wealth+1);}else r.wealth=cl(r.wealth+2);}
  }
  updEcon(c);if(p.progress===def.duration)p.status='completed';
  const detail=p.kind==='education'?`Bu dönem eğitim +2.${p.status==='completed'?' Program tamamlandı: işsizlik −2, zenginlik +1.':''}`:`Bu dönem altyapı +3.${p.status==='completed'?' Program tamamlandı: zenginlik +2.':''}`;
  recordPeriodEffect(c.id,`${def.title} · ${p.progress}/${def.duration}${p.status==='completed'?' tamamlandı':''}`,metricDifference(countryMetrics(c),before),'project',detail);
  if(c.id===cOf(me()).id)addReport(c.id,'policy',`${def.title}: ${p.progress}/${def.duration}`,p.status==='completed'?`${def.benefit}. Toplam ${p.paid} hazine harcandı.`:`Bu dönem ${def.upkeep} hazine ödendi. ${def.duration-p.progress} ödeme dönemi kaldı.`,[], 'Yalnızca ödeneği karşılanan dönemlerde ilerler. Gösterge sınırına ulaşmış bölgelerde kazanç daha düşük olabilir.');
 }
}
const investmentWorld=worldStep;worldStep=function(){measurePeriodPhase('Diğer ekonomik, toplumsal ve güvenlik gelişmeleri',investmentWorld);policyProjectStep();};
const investmentOperations=operationsStep;operationsStep=function(){measurePeriodPhase('Harekâtlar ve dış politika',investmentOperations);};
const investmentUnrest=unrestStep;unrestStep=function(){measurePeriodPhase('Yerel gelişmeler ve beklenmedik olaylar',investmentUnrest);};

const investmentDoAct=doAct;doAct=function(id:string):void {
 const kind=keysOf(POLICY_PROGRAMS).find(k=>POLICY_PROGRAMS[k].action===id),c=leads(me());
 if(!kind||!c){investmentDoAct(id);return;}
 const action=stateA().find(a=>a.id===id);if(!action||can(action)||G.q.length||ui.sheet)return;
 ui.sheet={t:'policyStart',id:kind};render();
};
function policyProjectsPanel():string {
 ensurePeriodState(G);const c=cOf(me()),projects=G.policyProjects.filter(p=>p.c===c.id).slice(-8).reverse();if(!projects.length)return '';
 const key='devlet:policy-projects';
 return `<details class="pn advanced-panel policy-projects" data-advanced="${key}" ${advancedOpen.has(key)?'open':''}><summary>Yatırım takvimi · ${projects.some(activePolicy)?projects.filter(activePolicy).length+' sürüyor':'Arşiv'}</summary>${projects.map(p=>{const d=POLICY_PROGRAMS[p.kind];return `<section class="policy-project"><div class="toprow"><b>${d.title}</b><span>${p.progress}/${d.duration}</span></div><div class="meter"><i style="width:${p.progress/d.duration*100}%"></i></div><p class="sub">${p.status==='paused'?'Ödenek bekliyor':p.status==='completed'?'Tamamlandı':p.status==='cancelled'?'Durduruldu':'Sürüyor'} · Harcanan ${p.paid} hazine${activePolicy(p)?` · Kalan yükümlülük ${(d.duration-p.progress)*d.upkeep} hazine`:''}</p>${activePolicy(p)&&c.leader===G.pid?`<button class="chip" data-policy-cancel="${p.id}">Programı durdur</button>`:''}</section>`;}).join('')}</details>`;
}
const investmentState=tabState;tabState=()=>investmentState()+policyProjectsPanel();
const investmentModal=modal;modal=function():string {
 if(ui.sheet?.t==='policyStart'){
  const kind=ui.sheet.id as PolicyKind,d=POLICY_PROGRAMS[kind];if(!d)return investmentModal();
  return dialog(d.title,`<p>Şimdi ${d.upfront} hazine ve 1 eylem; sonraki ${d.duration} dönemde dönem başına ${d.upkeep} hazine.</p><p><b>Toplam bütçe: ${d.upfront+d.duration*d.upkeep} hazine.</b></p><p>${kind==='education'?'Her finanse edilen dönemde eğitim +2. Üçüncü ödemenin sonunda işsizlik −2 ve zenginlik +1.':'Her finanse edilen dönemde altyapı +3. İkinci ödemenin sonunda zenginlik +2.'}</p><p class="sub">Ödenek yoksa program bekler; ödeme yapmadan ilerlemez. Yatırım takviminden durdurabilirsin. Harcanan para iade edilmez. Göstergeler üst sınırlarına tabidir.</p>`,`<button class="big prime" data-confirm-policy="${kind}"><b>Programı başlat · ${d.upfront} hazine</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>`);
 }
 if(ui.sheet?.t==='policyCancel'){
  const p=G.policyProjects.find(p=>p.id===ui.sheet.id);if(!p)return investmentModal();
  return dialog('Programı durdur',`<p>${POLICY_PROGRAMS[p.kind].title} için harcanan ${p.paid} hazine iade edilmez. Yeni dönemlik ödeme yapılmaz; kazanılmış etkiler korunur.</p>`,`<button class="big" data-confirm-policy-cancel="${p.id}"><b>Programı durdur</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>`);
 }
 return investmentModal();
};
document.addEventListener('click',e=>{
 const b=eventElement(e).closest<HTMLButtonElement>('[data-confirm-policy],[data-policy-cancel],[data-confirm-policy-cancel]');
 if(!b||b.disabled||document.querySelector('.modalbg')&&!b.closest('.modal'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(b.dataset.confirmPolicy){const kind=b.dataset.confirmPolicy as PolicyKind;if(ui.sheet?.t!=='policyStart'||ui.sheet.id!==kind||!POLICY_PROGRAMS[kind])return;investmentDoAct(POLICY_PROGRAMS[kind].action);return;}
 const id=b.dataset.policyCancel||b.dataset.confirmPolicyCancel,p=G.policyProjects.find(p=>p.id===id);
 if(!p||!activePolicy(p)||G.cs[p.c].leader!==G.pid)return;
 if(b.dataset.policyCancel){ui.sheet={t:'policyCancel',id};render();return;}
 if(ui.sheet?.t!=='policyCancel'||ui.sheet.id!==id)return;
 p.status='cancelled';recordDecision('policy',`${POLICY_PROGRAMS[p.kind].title} durduruldu`,p.c);ui.sheet=null;save();render();
},true);

const explainedNewspaper=newspaperStep;newspaperStep=function(before:{econ:number;stab:number;appr:number}){
 ensurePeriodState(G);const c=cOf(me()),baseline={...G.periodBaseline.metrics},actual=metricDifference(countryMetrics(c),baseline);
 recordPeriodEffect(c.id,'Dönem içindeki diğer gelişmeler',metricDifference(actual,effectTotal(G.periodEffects)));
 const causes=G.periodEffects.map(e=>({...e,changes:{...e.changes}}));
 const edition=explainedNewspaper(baseline);edition.baseline=baseline;edition.causes=causes;edition.delta.treasury=actual.treasury;
 G.periodEffects=[];G.periodBaseline={c:c.id,turn:G.turn,metrics:countryMetrics(c)};return edition;
};
function causeRows(causes:PeriodEffect[]):string {
 const signed=(v:number)=>`${v>0?'+':''}${v.toFixed(1)}`;
 return causes.map(e=>`<div class="paper-cause"><b>${esc(e.label)}</b><span>${keysOf(METRIC_NAMES).filter(k=>Math.abs(e.changes[k]||0)>=.05).map(k=>`${METRIC_NAMES[k]} ${signed(e.changes[k])}`).join(' · ')||'Yuvarlandığında 0,0 puan'}</span>${e.detail?`<span>${esc(e.detail)}</span>`:''}</div>`).join('');
}
const explainedPaper=newspaperHTML;newspaperHTML=function(edition:NewsEdition):string {
 let html=explainedPaper(edition);if(!edition.causes)return html;
 const effects=edition.causes.filter(e=>Object.values(e.changes).some(v=>Math.abs(v)>=.05));
 const notable=[...effects.filter(e=>e.origin==='decision'||e.origin==='project'),...effects.filter(e=>e.origin!=='decision'&&e.origin!=='project')];
 const causes=`<section class="paper-explanation"><h3>Ne değişti, neden?</h3><p class="paper-caption">Dönem içindeki kararlar ve dönem sonu gelişmeleri birlikte hesaplanır. Destek, ekonomi ve istikrar değerleri puandır; hazine para birimidir. Değerler yuvarlanır.</p><p><b>Yönetim desteği ${edition.baseline.appr.toFixed(1)} → ${edition.metrics.appr.toFixed(1)}</b></p>${causeRows(notable.slice(0,4))}${notable.length>4?`<details><summary>Tüm nedenler · ${notable.length}</summary>${causeRows(notable.slice(4))}</details>`:''}</section>`;
 return html.replace('<figure class="paper-photo">',causes+'<figure class="paper-photo">');
};

const investmentValidation=validateState;validateState=function(s:GameState):GameState {
 investmentValidation(s);const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v),integer=(v:unknown)=>finite(v)&&Number.isInteger(v),cid=(v:unknown)=>integer(v)&&(v as number)>=0&&!!s.cs[v as number];
 const metrics=(v:CountryMetrics)=>v&&keysOf(METRIC_NAMES).every(k=>finite(v[k]));
 const effects=(v:PeriodEffect[])=>Array.isArray(v)&&v.length<=200&&v.every(e=>e&&typeof e.label==='string'&&e.label.length<=160&&(e.origin==null||['decision','project','world'].includes(e.origin))&&(e.detail==null||typeof e.detail==='string'&&e.detail.length<=240)&&e.changes&&Object.entries(e.changes).every(([k,n])=>Object.hasOwn(METRIC_NAMES,k)&&finite(n)&&Math.abs(n)<1e7));
 if(s.policySequence!=null&&(!integer(s.policySequence)||s.policySequence<0))throw Error('Yatırım sırası bozuk.');
 if(s.policyProjects!=null){
  if(!Array.isArray(s.policyProjects)||s.policyProjects.length>1000)throw Error('Yatırım takvimi bozuk.');
  const ids=new Set<string>(),active=new Set<string>();
  for(const p of s.policyProjects){
   const d=POLICY_PROGRAMS[p?.kind],key=`${p?.c}:${p?.kind}`;
   if(!d||!/^policy-\d+-(education|infrastructure)-\d+-\d+$/.test(p.id)||ids.has(p.id)||!cid(p.c)||!integer(p.started)||p.started<0||p.started>s.turn||!integer(p.lastTurn)||p.lastTurn<p.started||p.lastTurn>s.turn||!integer(p.progress)||p.progress<0||p.progress>d.duration||!['active','paused','completed','cancelled'].includes(p.status)||p.paid!==d.upfront+p.progress*d.upkeep||p.status==='completed'&&p.progress!==d.duration||activePolicy(p)&&p.progress>=d.duration||activePolicy(p)&&active.has(key))throw Error('Yatırım programı bozuk.');
   ids.add(p.id);if(activePolicy(p))active.add(key);
  }
 }
 if(s.periodBaseline&&(!cid(s.periodBaseline.c)||!integer(s.periodBaseline.turn)||s.periodBaseline.turn<0||s.periodBaseline.turn>s.turn||!metrics(s.periodBaseline.metrics)))throw Error('Dönem başlangıcı bozuk.');
 if(s.periodEffects!=null&&!effects(s.periodEffects))throw Error('Karar etkileri bozuk.');
 for(const n of s.news||[])if(n.causes!=null&&(!effects(n.causes)||!metrics(n.baseline)||!finite(n.delta.treasury)))throw Error('Gazete nedenleri bozuk.');
 return s;
};
