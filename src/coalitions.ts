/* Coalition bargaining, withdrawal, and fictional party closure decisions. */
const COALITION_PACKAGES=[
 {title:'Sınırlı ortaklık',program:'education',cost:10,ministries:1,desc:'1 bakanlık · 10 hazine eğitim ödeneği · bölgelerde eğitim +1'},
 {title:'Geniş ortaklık',program:'social',cost:20,ministries:2,desc:'2 bakanlık · 20 hazine sosyal program · yönetim desteği +3, istikrar +3'},
 {title:'Güvenlik uzlaşması',program:'security',cost:15,ministries:2,desc:'2 bakanlık · 15 hazine savunma programı · ordu +2, istikrar +1'}
] as const;
function coalitionPlayerIndex(c:Country):number {return ownParty(c)?.index??-1;}
function coalitionNegotiationLock(c:Country,top:number,partner:number):string|null {
 const mine=coalitionPlayerIndex(c),offer=G.q[0],pending=c.pendingCoalition;
 if(!me().alive||me().jail||!c.alive||!natElect(c))return 'Bu durumda koalisyon görüşmesi yapılamaz.';
 if(!Number.isInteger(top)||!Number.isInteger(partner)||top===partner||!c.parties[top]||!c.parties[partner]||c.parties[top].closed||c.parties[partner].closed||![top,partner].includes(mine))return 'Geçerli bir koalisyon tarafı olmalısın.';
 if(!pending||pending.top!==top||G.turn>pending.deadline)return 'Hükümet kurma görüşmelerinin süresi doldu.';
 if(offer&&!(offer.id==='coalitionOffer'&&offer.c===c.id&&offer.top===top&&offer.partner===partner))return 'Önce mevcut olayı tamamla.';
 if(c.parties[top].seats+c.parties[partner].seats<51)return 'İki partinin toplamı en az 51 sandalye olmalı.';
 return G.ap<1?'1 eylem gerekli.':null;
}
function coalitionRequiredMinistries(c:Country,top:number,partner:number):number {return c.parties[partner].seats/(c.parties[top].seats+c.parties[partner].seats)>=.4?2:1;}
function openCoalitionNegotiation(top:number,partner:number):void {const c=cOf(me()),why=coalitionNegotiationLock(c,top,partner);if(why){ui.notice=why;render();return;}ui.sheet={t:'coalitionNegotiation',top,partner};render();}
function negotiateCoalition(top:number,partner:number,packageIndex:number):boolean {
 const c=cOf(me()),def=COALITION_PACKAGES[packageIndex],why=coalitionNegotiationLock(c,top,partner);
 if(why||!Number.isInteger(packageIndex)||!def||ui.sheet?.t!=='coalitionNegotiation'||ui.sheet.top!==top||ui.sheet.partner!==partner)return false;
 if(def.ministries<coalitionRequiredMinistries(c,top,partner)){ui.notice='Ortak daha fazla bakanlık istiyor. Daha geniş bir teklif sunabilirsin.';render();return false;}
 if(c.T<def.cost){ui.notice=`Program için ${def.cost} hazine gerekli.`;render();return false;}
 const mine=coalitionPlayerIndex(c);c.T-=def.cost;G.ap--;installGovernment(c,[top,partner]);
 const keys:MinisterKey[]=['eko','ici','sav','dis'],assigned=keys.slice(0,def.ministries),partnerParty=c.parties[partner];
 assigned.forEach((key,i)=>{const person=i===0?P(partnerParty.candidate):mkP({r:c.cap,pos:'bakanNPC',party:partnerParty.name,lead:55});c.min[key]=person.id;if(person.id!==c.leader)person.pos=person.id===G.pid?'bakan':'bakanNPC';person.party=partnerParty.name;});
 if(mine===partner&&G.pid!==c.leader)me().pos='bakan';
 if(def.program==='education')crs(c).forEach(r=>r.edu=cl(r.edu+1));
 if(def.program==='social'){c.appr=cl(c.appr+3);c.stab=cl(c.stab+3);}
 if(def.program==='security'){c.army=cl(c.army+2);c.stab=cl(c.stab+1);}
 c.coalitionDeal={top,partner,program:def.program,ministries:assigned,cost:def.cost,turn:G.turn};
 if(G.q[0]?.id==='coalitionOffer')G.q.shift();ui.sheet=null;
 recordDecision('coalition','Pazarlıkla koalisyon kuruldu',c.id,`${c.parties[top].name} + ${partnerParty.name}: ${def.title}, ${def.ministries} bakanlık, ${def.cost} program ödeneği.`);save();render();return true;
}
const bargainingPoliticsAction=politicsAction;politicsAction=function(action:string,index:number){if(action==='coalition'){const c=cOf(me());if(c.pendingCoalition)openCoalitionNegotiation(c.pendingCoalition.top,index);return;}bargainingPoliticsAction(action,index);};
function coalitionExitLock(c:Country):string|null {const mine=coalitionPlayerIndex(c);if(!me().alive||me().jail)return 'Bu durumda ortaklıktan ayrılamazsın.';if(mine<0||c.coalition.length<2||!c.coalition.includes(mine))return 'Koalisyon ortağı olmalısın.';if(G.q.length)return 'Önce mevcut olayı tamamla.';return G.ap<1?'1 eylem gerekli.':null;}
function withdrawCoalition():void {
 const c=cOf(me());if(coalitionExitLock(c)||ui.sheet?.t!=='coalitionExit')return;const mine=coalitionPlayerIndex(c),party=c.parties[mine],remaining=c.coalition.filter(i=>i!==mine&&!c.parties[i].closed),wasLeader=c.leader===G.pid;
 for(const key of keysOf(MINN))if(P(c.min[key]).party===party.name)c.min[key]=mkP({r:c.cap,pos:'bakanNPC'}).id;
 if(wasLeader)installGovernment(c,remaining);else{c.coalition=remaining;me().pos='muhalefet';c.opp=G.pid;}
 delete c.coalitionDeal;c.stab=cl(c.stab-8);G.ap--;const seats=remaining.reduce((sum,i)=>sum+c.parties[i].seats,0);
 if(seats<51){c.electionDue=Math.min(c.electionDue,G.turn+2);say(`${c.n}: koalisyon çoğunluğu kayboldu; iki dönem içinde erken seçim yapılacak.`);}
 hist(me(),`${party.name} koalisyondan çekildi`);recordDecision('coalition','Koalisyondan çekildi',c.id,`${party.name} hükümetten ayrıldı. Kalan hükümet ${seats} sandalye; istikrar −8.${seats<51?' Erken seçim takvimi başladı.':''}`);ui.sheet=null;save();render();
}
function partyClosureLock(c:Country,index:number):string|null {
 const p=me(),party=c.parties[index],mine=coalitionPlayerIndex(c);if(!Number.isInteger(index)||!party||party.closed)return 'Bu parti zaten kapalı veya bulunamadı.';
 if(!p.alive||p.jail||G.q.length)return 'Bu durumda parti kapatılamaz.';if(mine!==index&&c.leader!==p.id)return 'Yalnızca kendi partini feshedebilirsin; diğer partiler için iktidarda olmalısın.';
 if(c.parties.filter(p=>!p.closed).length<2)return 'Ülkedeki son açık parti kapatılamaz.';
 if(c.coalition.includes(index)||c.parties[index].candidate===c.leader)return 'Önce bu partinin hükümetteki görevini bitir.';
 return G.ap<1?'1 eylem gerekli.':mine!==index&&c.T<25?'25 hazine gerekli.':null;
}
function closePoliticalParty(index:number):void {
 const c=cOf(me());if(partyClosureLock(c,index)||ui.sheet?.t!=='partyClosure'||ui.sheet.id!==index)return;const party=c.parties[index],own=coalitionPlayerIndex(c)===index;
 if(!own){c.T-=25;c.repression=cl(c.repression+12);c.stab=cl(c.stab-8);c.appr=cl(c.appr-5);}
 G.ap--;party.closed=own?'dissolved':'banned';party.closedTurn=G.turn;party.members=0;party.funds=0;party.campaign=0;party.lastFinance={dues:0,upkeep:0};
 for(const p of G.ps)if(cOf(p).id===c.id&&p.party===party.name){p.party=null;if(['parti','muhalefet','uye','hareket'].includes(p.pos))p.pos='vatandas';}
 if(P(c.opp)?.id===party.candidate){const alternative=c.parties.find(p=>!p.closed&&p.candidate!==c.leader);if(alternative){c.opp=alternative.candidate;P(c.opp).pos='muhalefet';}}
 recordDecision('party',own?'Parti feshedildi':'Siyasi parti kapatıldı',c.id,`${party.name}. Mevcut ${party.seats} vekilin sandalyesi korunur; parti gelecek seçime ve kampanyalara katılmaz.`);ui.sheet=null;save();render();
}
function coalitionManagementPanel():string {
 const c=cOf(me()),mine=coalitionPlayerIndex(c),deal=c.coalitionDeal,exit=coalitionExitLock(c),managed=mine>=0||c.leader===G.pid;
 return `${c.coalition.includes(mine)&&c.coalition.length>1?`<section class="pn"><h3 class="h3">Koalisyon ortaklığın</h3><p>${c.coalition.map(i=>esc(c.parties[i].name)).join(' + ')}</p>${deal?`<p class="sub">Program: ${esc(deal.program)} · ${deal.ministries.length} bakanlık · ${deal.cost} program ödeneği</p>`:''}<button class="act" data-coalition-exit="1" ${exit?'disabled':''}><b>Koalisyondan çekil</b><span>${exit||'1 eylem · İstikrar −8. Çoğunluk kaybolursa 2 dönem içinde erken seçim.'}</span></button></section>`:''}${managed?`<section class="pn"><h3 class="h3">Parti kapatma ve fesih</h3><p class="sub">Kendi partini feshedebilirsin. İktidardaysan başka partiyi 25 hazine ve 1 eylemle kapatabilirsin: baskı +12, istikrar −8, yönetim desteği −5. Mevcut vekiller kalır; kapalı parti sonraki seçime katılamaz.</p>${c.parties.map((party,index)=>{const why=partyClosureLock(c,index);return `<button class="act" data-party-closure="${index}" ${why?'disabled':''}><b>${esc(party.name)} · ${party.closed?'Kapalı':mine===index?'Partiyi feshet':'Partiyi kapat'}</b><span>${why|| (mine===index?'1 eylem; kişisel veya kamu parası harcanmaz.':'25 hazine ve 1 eylem.')}</span></button>`;}).join('')}</section>`:''}`;
}
const coalitionState=tabState;tabState=()=>coalitionState()+coalitionManagementPanel();
const coalitionCharacter=tabChar;tabChar=()=>coalitionCharacter()+coalitionManagementPanel();
const bargainingModal=modal;modal=function(){const s=ui.sheet,c=G&&G.pid!=null?cOf(me()):null;if(c&&s?.t==='coalitionNegotiation'){const top=s.top,partner=s.partner,why=coalitionNegotiationLock(c,top,partner);return dialog('Hükümet kurma pazarlığı',`<p>${esc(c.parties[top].name)} + ${esc(c.parties[partner].name)} · ${c.parties[top].seats+c.parties[partner].seats} sandalye.</p><p class="sub">Ortak en az ${coalitionRequiredMinistries(c,top,partner)} bakanlık istiyor. Kabul edilen teklif 1 eylem harcar. Reddedilen teklifte kaynak harcanmaz.</p>${why?`<p class="warn">${esc(why)}</p>`:''}${COALITION_PACKAGES.map((p,index)=>`<button class="big" data-coalition-package="${index}" ${why||c.T<p.cost?'disabled':''}><b>${p.title}</b><span>${p.desc}${p.ministries<coalitionRequiredMinistries(c,top,partner)?' · Ortak daha geniş teklif istiyor.':''}</span></button>`).join('')}`,'<button class="big" data-close="1"><b>Görüşmeye ara ver</b></button>','diplomacy');}
 if(c&&s?.t==='coalitionExit')return dialog('Koalisyondan çekil','<p>1 eylem ve istikrar −8. Partinin hükümet ortaklığı ve bakanlıkları sona erer. Kalan hükümet 51 sandalyenin altındaysa iki dönem içinde erken seçim yapılır.</p>','<button class="big prime" data-coalition-exit-confirm="1"><b>Ortaklıktan çekil</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>');
 if(c&&s?.t==='partyClosure'){const index=+s.id,own=coalitionPlayerIndex(c)===index;return dialog(own?'Partiyi feshet':'Siyasi partiyi kapat',`<p>${esc(c.parties[index].name)} seçime katılamaz ve parti kasası kapatılır. Mevcut vekillerin sandalyesi korunur.</p><p>${own?'1 eylem.':'25 hazine, 1 eylem; baskı +12, istikrar −8 ve yönetim desteği −5.'}</p>`,`<button class="big prime" data-party-closure-confirm="${index}"><b>${own?'Partiyi feshet':'Partiyi kapat'}</b></button><button class="big" data-close="1"><b>Vazgeç</b></button>`);}
 return bargainingModal();};
document.addEventListener('click',e=>{const b=eventElement(e).closest<HTMLButtonElement>('[data-coalition-package],[data-coalition-exit],[data-coalition-exit-confirm],[data-party-closure],[data-party-closure-confirm]');if(!b||b.disabled||!G||document.querySelector('.modalbg')&&!b.closest('.modal'))return;e.preventDefault();e.stopImmediatePropagation();
 if(b.dataset.coalitionPackage!=null&&ui.sheet?.t==='coalitionNegotiation')negotiateCoalition(ui.sheet.top,ui.sheet.partner,+b.dataset.coalitionPackage);
 if(b.dataset.coalitionExit&&!coalitionExitLock(cOf(me()))){ui.sheet={t:'coalitionExit'};render();}
 if(b.dataset.coalitionExitConfirm)withdrawCoalition();
 if(b.dataset.partyClosure!=null&&!partyClosureLock(cOf(me()),+b.dataset.partyClosure)){ui.sheet={t:'partyClosure',id:+b.dataset.partyClosure};render();}
 if(b.dataset.partyClosureConfirm!=null)closePoliticalParty(+b.dataset.partyClosureConfirm);
},true);
const coalitionElection=runElection;runElection=function(c:Country){delete c.coalitionDeal;coalitionElection(c);};
const coalitionValidation=validateState;validateState=function(s:GameState):GameState {coalitionValidation(s);for(const c of s.cs){const parties=c.parties||[];if(parties.length&&!parties.some(p=>!p.closed))throw Error('Ülkede açık parti bulunamadı.');for(const p of parties)if(p.closed!=null&&!['banned','dissolved'].includes(p.closed)||p.closedTurn!=null&&(!Number.isInteger(p.closedTurn)||p.closedTurn<0||p.closedTurn>s.turn))throw Error('Kapalı parti kaydı geçersiz.');const deal=c.coalitionDeal;if(deal&&(!Number.isInteger(deal.top)||!Number.isInteger(deal.partner)||deal.top===deal.partner||!parties[deal.top]||!parties[deal.partner]||!['education','social','security'].includes(deal.program)||!Array.isArray(deal.ministries)||deal.ministries.length<1||deal.ministries.length>2||!deal.ministries.every(isMinisterKey)||!Number.isFinite(deal.cost)||deal.cost<0||!Number.isInteger(deal.turn)||deal.turn<0||deal.turn>s.turn))throw Error('Koalisyon anlaşması geçersiz.');}return s;};
