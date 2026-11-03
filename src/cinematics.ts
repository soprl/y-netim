'use strict';
/* Yerel çizimler ve sentezlenmiş seslerle suikast olay sahneleri. */
function queueAssassination(c: Country,victim: Person,role: string,saved: boolean){
 const label=role==='president'?'Başkan':victim.id===c.vice?'Başkan yardımcısı':'Bakan';
 return {id:'assassination',uid:`attack-${G.turn}-${victim.id}-${G.cinemaSequence=(G.cinemaSequence||0)+1}`,victim:victim.id,name:victim.name,seed:victim.seed,country:c.n,role:label,saved};
}
function applyAssassination(c: Country,victim: Person,role: string,saved: boolean){
 const card=queueAssassination(c,victim,role,saved);
 if(saved){c.stab=cl(c.stab-3);c.security=cl(c.security+5);notify(c,'Suikast girişimi engellendi',`${victim.name} güvenli bir yere alındı. Koruma planını Devlet ekranından gözden geçirebilirsin.`,'security');}
 else if(role==='president'){succession(c,victim);if(victim.id!==G.pid)notify(c,'Başkanlıkta görev devri',`${victim.name} saldırıda hayatını kaybetti. Anayasal halef görevi devraldı.`,'security');}
 else{if(victim.id===G.pid)die(victim);else{victim.alive=false;victim.pos='eski';}if(victim.id===c.vice)c.vice=null;for(const k of keysOf(c.min))if(c.min[k]===victim.id)c.min[k]=mkP({r:c.cap,pos:'bakanNPC'}).id;ensureCabinet();c.stab=cl(c.stab-6);notify(c,'Yönetimde kayıp',`${victim.name} saldırıda hayatını kaybetti. Yerine yeni bir görevli atandı.`,'security');}
 // Prepend after succession: even a player's death is preceded by this scene.
 G.q.unshift(card);
}
assassinationStep=function(){ensureCabinet();const home=cOf(me()),foreign=alive().filter(c=>c.id!==home.id),targets=[home,...(foreign.length?[pick(foreign)]:[])];
 for(const c of targets){c.security=cl(c.security-.4);if(c.T>0)c.T-=c.security*.012;const role=chance(assassinationRisk(c,'president'))?'president':chance(assassinationRisk(c,'deputy'))?'deputy':null;if(!role)continue;
 const victim=role==='president'?P(c.leader):pick([P(c.vice),...Object.values(c.min).map(P)].filter(p=>p?.alive));if(victim)applyAssassination(c,victim,role,chance(role==='president'?90:65));
 if(!me().alive)break;
 }
};
function actorSVG(seed: number){const h=(n: number)=>h2(seed*.137,n*1.7),skin=['#f1c9a5','#d9a273','#b57b4f','#8a5a3a'][Math.floor(h(1)*4)],hair=['#302a2e','#674c3e','#b89354','#9a9ba6'][Math.floor(h(2)*4)],coat=['#385067','#62505d','#455d54'][Math.floor(h(3)*3)];
 return `<svg viewBox="0 0 180 270" class="actor-svg" aria-hidden="true"><ellipse cx="90" cy="256" rx="52" ry="8" fill="#030b15" opacity=".7"/><g class="actor-body"><path d="M64 170h24v77H60zM92 170h25l5 77H94z" fill="#1c2537"/><path d="M58 241h31v14H51v-6zM93 241h30l9 8v6H93z" fill="#101725"/><path d="M56 88 33 105l-10 63 15 5 16-51M123 88l23 17 11 63-16 5-17-51" fill="${coat}"/><rect x="24" y="164" width="15" height="22" rx="5" fill="${skin}"/><rect x="141" y="164" width="15" height="22" rx="5" fill="${skin}"/><path d="M58 87h65l8 91H49z" fill="${coat}"/><path d="m73 88 17 9 17-9-10 68H82z" fill="#e4e7dd"/><path d="m87 98 7 1 4 35-8 9-8-9z" fill="#bc6b5b"/><path d="m64 88 16 44-18-12 7-12-12-5M115 88l-15 44 18-12-7-12 12-5" fill="#243545"/><rect x="76" y="71" width="28" height="25" rx="4" fill="${skin}"/><rect x="61" y="24" width="58" height="61" rx="17" fill="${skin}"/><path d="M59 48V30q3-23 31-23t31 23v17l-13-15-29 3-13 17z" fill="${hair}"/><path d="M72 52h9M99 52h9" stroke="#493e39" stroke-width="3"/><circle cx="78" cy="57" r="2.6" fill="#202632"/><circle cx="102" cy="57" r="2.6" fill="#202632"/><path d="m89 57-3 11h7M82 75h16" stroke="#805c4b" stroke-width="2" fill="none"/></g></svg>`;
}
let cinemaClock:{uid:string;start:number;shot:boolean;done:boolean}=null,cinemaShotTimer:number=null,cinemaDoneTimer:number=null;
function currentCinema(){return ui.cinemaPreview||(ui.view==='game'&&G?.q[0]?.id==='assassination'?G.q[0]:null);}
function cinemaState(q: QueuedEvent){const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;if(cinemaClock?.uid!==q.uid)cinemaClock={uid:q.uid,start:performance.now(),shot:false,done:reduced};if(reduced)cinemaClock.done=true;return cinemaClock;}
function assassinationModal(q: QueuedEvent){const state=cinemaState(q),elapsed=performance.now()-state.start,ready=state.done||elapsed>=2800;
 return `<div class="modalbg cinema-backdrop" style="--elapsed:-${elapsed}ms"><section tabindex="-1" class="modal cinema-card ${q.saved?'survived':'fallen'} ${ready?'settled':''}" style="--elapsed:-${elapsed}ms" role="dialog" aria-modal="true" aria-label="Suikast olay sahnesi"><header class="cinema-top"><span class="cinema-kicker">${q.demo?'ANİMASYON ÖNİZLEMESİ':'SON DAKİKA · '+esc(q.country)}</span><span class="cinema-date">${G?dateStr():'OLAY SAHNESİ'}</span></header><div class="cinema-stage" aria-hidden="true"><div class="night-moon"></div><div class="night-buildings"></div><div class="night-fog"></div><div class="target-silhouette">${actorSVG(q.seed)}</div><div class="shot-trail"></div><div class="impact-ring"></div>${q.saved?'<div class="protection-shield">◇</div>':'<div class="fall-shadow"></div>'}<div class="cinema-frame"></div></div><div class="cinema-dossier"><canvas class="cinema-avatar" width="14" height="14" data-cinema-seed="${q.seed}"></canvas><div><p>${esc(q.role)}</p><h2>${esc(q.name)}</h2></div></div><div class="cinema-outcome" aria-live="polite"><span class="outcome-tag">${q.saved?'KORUMA DEVREYE GİRDİ':'YÖNETİMDE KAYIP'}</span><h3>${q.saved?'Saldırıdan kurtuldu':'Hayatını kaybetti'}</h3><p>${q.saved?'Koruma ekibi hedef kişiyi güvenli bir yere götürdü.':'Resmî görev devri ve yeni atamalar işleme alındı.'}</p></div><footer class="cinema-actions"><button class="chip cinema-skip" data-cinema-skip="1">Animasyonu geç</button><button class="big prime" data-cinema-continue="1" ${ready?'':'disabled'}><b>${q.demo?'Önizlemeyi kapat':'Devam'}</b></button>${q.demo?`<button class="chip cinema-other" data-cinema-demo="${q.saved?'fatal':'saved'}">${q.saved?'Diğer sonucu izle':'Kurtulma sahnesini izle'}</button><p class="sub">Bu bir önizleme; karakterler ve kayıt etkilenmez.</p>`:''}</footer></section></div>`;
}
function shotSound(){if(!soundOn)return;unlockAudio();if(!audioCtx||audioCtx.state!=='running')return;
 const count=Math.ceil(audioCtx.sampleRate*.16),buffer=audioCtx.createBuffer(1,count,audioCtx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<count;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/count,3);
 const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=1000;gain.gain.value=matchMedia('(prefers-reduced-motion:reduce)').matches?.035:.11;noise.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);noise.start();noise.stop(audioCtx.currentTime+.17);
 const tone=audioCtx.createOscillator(),envelope=audioCtx.createGain(),now=audioCtx.currentTime;tone.frequency.setValueAtTime(95,now);tone.frequency.exponentialRampToValueAtTime(42,now+.18);envelope.gain.setValueAtTime(.07,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.2);tone.connect(envelope);envelope.connect(audioCtx.destination);tone.start();tone.stop(now+.22);
}
function settleCinema(){const q=currentCinema();if(!q)return;cinemaState(q).done=true;clearTimeout(cinemaShotTimer);clearTimeout(cinemaDoneTimer);render();}
function closeCinema(){const q=currentCinema();if(!q||!cinemaState(q).done&&performance.now()-cinemaClock.start<2800)return;clearTimeout(cinemaShotTimer);clearTimeout(cinemaDoneTimer);
 if(ui.cinemaPreview)ui.cinemaPreview=null;else{G.q.shift();save();}cinemaClock=null;render();}
function mountCinema(){clearTimeout(cinemaShotTimer);clearTimeout(cinemaDoneTimer);const q=currentCinema();if(!q){cinemaClock=null;return;}const state=cinemaState(q),elapsed=performance.now()-state.start;
 document.querySelectorAll<HTMLCanvasElement>('[data-cinema-seed]').forEach(cv=>portrait(cv,+cv.dataset.cinemaSeed));
 if(state.done)return;
 if(!state.shot){cinemaShotTimer=setTimeout(()=>{if(currentCinema()?.uid===q.uid){state.shot=true;shotSound();}},Math.max(0,850-elapsed));}
 cinemaDoneTimer=setTimeout(()=>{if(currentCinema()?.uid===q.uid){state.done=true;render();}},Math.max(0,2800-elapsed));
}
const cinematicBaseModal=modal;
modal=function(){const q=G.q[0];if(!ui.sheet&&q?.id==='assassination')return assassinationModal(q);return cinematicBaseModal();};
const cinematicBaseRender=render;
render=function(){cinematicBaseRender();if(ui.cinemaPreview)document.getElementById('app').insertAdjacentHTML('beforeend',assassinationModal(ui.cinemaPreview));mountCinema();const el=document.querySelector<HTMLElement>('.cinema-card');if(el)el.focus({preventScroll:true});};
const cinematicBasePresent=presentEvent;
presentEvent=function(){if(G?.q[0]?.id==='assassination')return;cinematicBasePresent();};
const cinematicBasePick=pickQ;
pickQ=function(a: string){if(G.q[0]?.id==='assassination'){closeCinema();return;}cinematicBasePick(a);};
const cinematicBaseSettings=settingsModal;
settingsModal=function(){return cinematicBaseSettings().replace('<button class="big" data-help=', '<button class="big" data-cinema-demo="saved"><b>Suikast animasyonunu önizle</b><span>Karakterler ve kayıt etkilenmez.</span></button><button class="big" data-help=');};
document.addEventListener('click',e=>{const b=eventElement(e).closest<HTMLButtonElement>('[data-cinema-skip],[data-cinema-continue],[data-cinema-demo]');if(!b||b.disabled)return;if(soundOn)unlockAudio();e.preventDefault();e.stopImmediatePropagation();if(b.dataset.cinemaSkip)settleCinema();else if(b.dataset.cinemaContinue)closeCinema();else{const victim=G?.pid!=null?P(G.cs[G.rs[me().r].c].vice):null;ui.cinemaPreview={id:'assassination',uid:'preview-'+performance.now(),name:victim?.name||'Deniz Yılmaz',seed:victim?.seed||1234,role:'Başkan yardımcısı',country:G?.pid!=null?cOf(me()).n:'Önizleme',saved:b.dataset.cinemaDemo==='saved',demo:true};cinemaClock=null;render();}},true);
document.addEventListener('keydown',e=>{if(currentCinema()&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(cinemaState(currentCinema()).done)closeCinema();else settleCinema();}},true);
