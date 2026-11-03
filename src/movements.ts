/** Fictional regional-control mechanic; regular government/war rules still apply. */
function hydrateMovements(state:GameState):GameState {
 state.armedMovements ??=[];
 state.controlCampaigns ??=[];
 return state;
}
const movementHydrate=hydrate;
hydrate=function(state:GameState):GameState { return hydrateMovements(movementHydrate(state)); };
function ownMovement():ArmedMovement|undefined {
 hydrateMovements(G);
 return G.armedMovements.find(m=>m.active&&m.founder===G.pid);
}
function movementEligibility():string|null {
 const p=me();
 if(!p.alive)return 'Bu karakter hayatta değil.';
 if(p.jail)return 'Hapisteyken hareket kurulamaz.';
 if(leads(p))return 'Devlet başkanısın; mevcut ordunla bölgesel harekât yapabilirsin.';
 if(ownMovement())return 'Zaten etkin bir hareketin var.';
 if(p.org<20)return 'En az 20 örgüt gücü gerekli.';
 if(p.fame<10)return 'En az 10 tanınırlık gerekli.';
 if(p.money<15)return 'Kuruluş için 15 kişisel para gerekli.';
 if(G.ap<1)return '1 eylem gerekli.';
 return null;
}
function movementPanel():string {
 const m=ownMovement();
 return `<section class="pn own-movement"><h3 class="h3">Silahlı hareket</h3>${m?`<h2>${esc(m.name)}</h2><div class="party-stats"><span>Güç ${r0(m.strength)}</span><span>Destek ${r0(m.support)}</span><span>${m.controlled.length} bölge</span></div><p class="sub">Haritada hedef bölgeyi seçip Emirler penceresinden kontrol mücadelesi başlat. Her bölge ayrı değerlendirilir; yönetimin karşı hamleleri ve yerel sadakat sonucu etkiler.</p>${m.country!=null?`<p class="sub">Bölgesel yönetim: ${esc(G.cs[m.country].n)}</p>`:''}`:`<p class="sub">Karakter modunda kurulabilir. 20 örgüt, 10 tanınırlık, 15 kişisel para ve 1 eylem gerekir. Başlangıç bölgesinden başlayarak komşu bölgelerde yönetim mücadelesi yürütülür.</p><button class="act" data-movement-open="1"><b>Silahlı hareket kur</b><span>${movementEligibility()||'Kuruluş koşulları sağlandı.'}</span></button>`}</section>`;
}
function movementForm():string {
 const why=movementEligibility();
 return dialog('Silahlı hareket kur',`<p>Hareketin adını sen belirle. Kuruluş tek başına hiçbir bölgeyi ele geçirmez.</p><label class="file-label">Hareket adı<input id="movement-name" maxlength="40" placeholder="Hareketin adı"></label><p class="sub">15 kişisel para ve 1 eylem. Devam eden kontrol mücadeleleri oyun dönemlerinde ilerler.</p>${why?`<p class="warn">${why}</p>`:''}${ui.partyError?`<p class="warn" role="alert">${esc(ui.partyError)}</p>`:''}`,`<button class="big prime" data-movement-found="1" ${why?'disabled':''}><b>Hareketi kur</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>`,'war');
}
function foundMovement():void {
 if(movementEligibility())return;
 const name=safeDisplayText(byId<HTMLInputElement>('movement-name').value.trim().replace(/\s+/g,' '));
 if(name.length<3||name.length>40){ui.partyError='Ad 3–40 karakter olmalı.';render();return;}
 if(G.armedMovements.some(m=>m.active&&m.name.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'))){ui.partyError='Bu adla etkin bir hareket var.';render();return;}
 const p=me();p.money-=15;G.ap--;p.pos='hareket';
 G.armedMovements.push({id:`movement-${p.id}-${G.turn}`,founder:p.id,name,home:cOf(p).id,baseRegion:p.r,strength:cl(p.org+20,25,80),support:cl(p.rep,15,80),controlled:[],country:null,active:true,started:G.turn});
 hist(p,name+' hareketini kurdu');recordDecision('movement','Yeni hareket kuruldu',cOf(p).id,name);say(`${name}, ${G.rs[p.r].n} bölgesinde ortaya çıktı.`);ui.partyError=null;ui.sheet=null;save();render();
}
function controlEligibility(m:ArmedMovement,r:Region):string|null {
 if(!m.active||!G.ps[m.founder]?.alive)return 'Hareket etkin değil.';
 if(m.controlled.includes(r.id)||m.country!=null&&r.c===m.country)return 'Bu bölge zaten yönetiminde.';
 if(G.controlCampaigns.some(o=>o.movement===m.id))return 'Önce devam eden bölge mücadelesini tamamla.';
 if(m.strength<15)return 'Hareket gücü en az 15 olmalı.';
 if(!m.controlled.length){if(r.c!==m.home||r.id!==m.baseRegion&&!adj(G.rs[m.baseRegion],r))return 'İlk hedef başlangıç bölgen veya onun komşusu olmalı.';}
 else if(!m.controlled.some(id=>adj(G.rs[id],r)))return 'Yönettiğin bir bölgeyle kara sınırı gerekli.';
 return null;
}
const movementActions=mapActions;
mapActions=function():Action[] {
 const m=ownMovement();if(!m)return movementActions();
 const r=G.rs[G.sel],out:Action[]=[];
 if(m.country!=null&&r.c===m.country)out.push(...movementActions());
 else out.push(A('movement:control','Bölgenin yönetimini ele geçir',`3–6 dönemlik kontrol mücadelesi. Yerel sadakat ${r0(r.loyal)}, yönetim gücü ${r0(G.cs[r.c].army)}.`,{cost:10,lock:controlEligibility(m,r),run(){}}));
 out.push(A('movement:restore','Hareketi toparla','Güç +8, destek +3. 8 kişisel para ve 1 eylem.',{cost:8,lock:m.strength>=95?'Güç yeterli düzeyde.':null,run(){}}));
 return out;
};
const movementAct=doAct;
doAct=function(id:string):void {
 if(!id.startsWith('movement:')){movementAct(id);return;}
 const m=ownMovement(),action=mapActions().find(a=>a.id===id);if(!m||!action||can(action)||G.q.length)return;
 if(id==='movement:control'){ui.sheet={t:'controlCampaign',r:G.sel,cost:10};render();return;}
 me().money-=8;G.ap--;m.strength=cl(m.strength+8);m.support=cl(m.support+3);if(m.country!=null)G.cs[m.country].army=cl(G.cs[m.country].army+6);save();render();
};
function confirmControl():void {
 const m=ownMovement(),r=G.rs[ui.sheet?.r];
 if(!m||!r||controlEligibility(m,r)||me().money<10||G.ap<1||me().jail)return;
 me().money-=10;G.ap--;G.controlCampaigns.push({movement:m.id,r:r.id,originalOwner:r.c,age:0,progress:0});
 recordDecision('control','Bölgesel kontrol mücadelesi başladı',cOf(me()).id,r.n);say(`${m.name}, ${r.n} yönetimine karşı mücadele başlattı.`);ui.sheet=null;save();render();
}
function takeMovementRegion(m:ArmedMovement,r:Region):void {
 const previous=G.cs[r.c],oldCap=previous.cap,founder=G.ps[m.founder];
 let government:Country;
 if(m.country==null){government=makeCountry(r,founder.id,previous.id);government.n=m.name;government.reg='cun';government.army=m.strength;m.country=government.id;founder.pos='lider';founder.r=r.id;
  const remaining=crs(previous);if(remaining.length&&oldCap===r.id){previous.cap=remaining[0].id;for(const id of [previous.leader,previous.gen,previous.opp,...Object.values(previous.min),...(previous.vice!=null?[previous.vice]:[])])if(P(id).r===r.id)P(id).r=previous.cap;}
  if(!remaining.length){previous.alive=false;G.wars=G.wars.filter(w=>w.a!==previous.id&&w.b!==previous.id);}updEcon(previous);
 }else{government=G.cs[m.country];capture(r,government);}
 r.loyal=30;r.resistance=45;r.occupation=6;m.controlled=crs(government).map(a=>a.id);previous.stab=cl(previous.stab-8);
 if(previous.alive)declareWar(previous,government);
 notify(government,'Bölgesel yönetim değişti',`${r.n}, ${m.name} yönetimine geçti. Diğer bölgeler ayrı mücadele gerektirir; yerel direniş ve karşı hamleler devam edebilir.`,'war');
}
let controlStep = function():void {
 hydrateMovements(G);
 for(const m of G.armedMovements){if(!G.ps[m.founder]?.alive)m.active=false;if(m.country==null)m.home=G.rs[m.baseRegion].c;if(m.country!=null){m.controlled=crs(G.cs[m.country]).map(r=>r.id);if(!G.cs[m.country].alive)m.active=false;}}
 G.controlCampaigns=G.controlCampaigns.filter(o=>{
  const m=G.armedMovements.find(a=>a.id===o.movement),r=G.rs[o.r];
  if(!m?.active)return false;if(r.c!==o.originalOwner||m.country!=null&&!m.controlled.some(id=>adj(G.rs[id],r))){notify(G.cs[m.country??m.home],'Kontrol mücadelesi durdu',`${r.n}: yönetim veya bağlantı koşulları değişti.`,'war');return false;}
  o.age++;const government=G.cs[r.c],power=m.country==null?m.strength:Math.min(m.strength,G.cs[m.country].army);
  if(power<8){say(`${m.name}: ${r.n} mücadelesi güç kaybıyla durdu.`);return false;}
  o.lastRoll=rnd(-3,3);o.progress=cl(o.progress+cl(assessControl(m,r).base+o.lastRoll,8,36));m.strength=cl(m.strength-1.5);if(m.country!=null)G.cs[m.country].army=cl(G.cs[m.country].army-1);
  if(o.progress>=100){takeMovementRegion(m,r);return false;}
  if(o.age>=6){say(`${m.name}, ${r.n} yönetimini ele geçiremedi.`);if(m.founder===G.pid)G.q.push({id:'info',k:'Bölge mücadelesi',title:'Yönetim değişmedi',text:`${r.n} yönetimi kontrolünü korudu. Harcanan kaynak geri gelmez; yeni karar öncesinde hareketini toparlayabilirsin.`,scene:'war'});return false;}
  return true;
 });
}
const movementOperations=operationsStep;operationsStep=function():void {movementOperations();controlStep();};
const movementChar=tabChar;tabChar=()=>movementPanel()+movementChar();
const movementModal=modal;modal=function():string {
 if(ui.sheet?.t==='movementForm')return movementForm();
 if(ui.sheet?.t==='controlCampaign')return dialog('Bölgenin yönetimi',`<p>Hedef: ${esc(G.rs[ui.sheet.r].n)}. Mücadele 3–6 dönem sürer ve başarı garanti değildir.</p><p>10 kişisel para ve 1 eylem harcanır. İlk bölge kazanılırsa ayrı bir bölgesel yönetim kurulur.</p>`,'<button class="big prime" data-control-confirm="1"><b>Mücadeleyi başlat</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>','war');
 return movementModal();
};
const movementOrders=ordersPanel;ordersPanel=function():string {
 let html=movementOrders();if(G.controlCampaigns.length&&!G.operations.length)html='';
 return html+G.controlCampaigns.map(o=>`<div class="order-row"><b>${esc(G.rs[o.r].n)} · Kontrol mücadelesi</b><span>%${r0(o.progress)} · ${o.age}/6 dönem</span><div class="meter"><i style="width:${o.progress}%"></i></div></div>`).join('');
};
const movementWorld=tabWorld;tabWorld=function():string {return movementWorld().replace(`${G.operations.length} emir · Gelişmeler`,`${G.operations.length+G.controlCampaigns.length} emir · Gelişmeler`);};
document.addEventListener('click',e=>{
 const button=eventElement(e).closest<HTMLButtonElement>('[data-movement-open],[data-movement-found],[data-control-confirm]');if(!button||button.disabled||document.querySelector('.modalbg')&&!button.closest('.modal'))return;e.preventDefault();e.stopImmediatePropagation();
 if(button.dataset.movementOpen){ui.partyError=null;ui.sheet={t:'movementForm'};render();}if(button.dataset.movementFound)foundMovement();if(button.dataset.controlConfirm)confirmControl();
},true);
document.addEventListener('input',e=>{if(eventElement(e).id==='movement-name'){const input=eventElement<HTMLInputElement>(e);input.value=safeDisplayText(input.value);}});
const movementValidate=validateState;validateState=function(state:GameState):GameState {
 movementValidate(state);const region=(id:number)=>Number.isInteger(id)&&id>=0&&id<state.rs.length,person=(id:number)=>Number.isInteger(id)&&id>=0&&id<state.ps.length;
 if(state.armedMovements!=null&&(!Array.isArray(state.armedMovements)||state.armedMovements.length>100||!state.armedMovements.every(m=>typeof m.id==='string'&&typeof m.name==='string'&&m.name.length<=40&&person(m.founder)&&region(m.baseRegion)&&Number.isInteger(m.home)&&m.home>=0&&m.home<state.cs.length&&Number.isFinite(m.strength)&&m.strength>=0&&m.strength<=100&&Number.isFinite(m.support)&&m.support>=0&&m.support<=100&&Array.isArray(m.controlled)&&m.controlled.every(region)&&(m.country==null||Number.isInteger(m.country)&&m.country>=0&&m.country<state.cs.length)&&typeof m.active==='boolean')))throw Error('Hareket kaydı bozuk.');
 if(state.controlCampaigns!=null&&(!Array.isArray(state.controlCampaigns)||state.controlCampaigns.length>100||!state.controlCampaigns.every(o=>state.armedMovements?.some(m=>m.id===o.movement)&&region(o.r)&&Number.isInteger(o.originalOwner)&&o.originalOwner>=0&&o.originalOwner<state.cs.length&&Number.isFinite(o.age)&&o.age>=0&&Number.isFinite(o.progress)&&o.progress>=0&&o.progress<=100)))throw Error('Bölge mücadelesi kaydı bozuk.');
 return state;
};
const movementLiveMap=drawLifeMap;
drawLifeMap=function(canvas:HTMLCanvasElement,time:number=0):void {
 movementLiveMap(canvas,time);if(!canvas||!G||!liveMapOn)return;
 const ctx=canvas.getContext('2d'),motion=!matchMedia('(prefers-reduced-motion:reduce)').matches;
 for(const order of G.controlCampaigns||[]){const m=G.armedMovements.find(a=>a.id===order.movement);if(!m)continue;const source=G.rs[m.controlled[0]??m.baseRegion],target=G.rs[order.r],a=worldToMap(source.x,source.y),b=worldToMap(target.x,target.y);ctx.save();ctx.strokeStyle='#d5a7e7';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.lineDashOffset=motion?-time/130:0;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(b.x,b.y,9+(motion?Math.sin(time/300)*2:0),0,Math.PI*2);ctx.stroke();ctx.restore();}
};
