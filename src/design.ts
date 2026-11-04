/* Presentation preferences are independent of simulation saves. */
type DeskPreferences={text:'normal'|'large';contrast:boolean;motion:boolean;texture:boolean};
const deskDefaults:DeskPreferences={text:'normal',contrast:false,motion:false,texture:true};
let deskPrefs:DeskPreferences={...deskDefaults};
try{const value=JSON.parse(localStorage.getItem('muhur-desk')||'{}');deskPrefs={text:value.text==='large'?'large':'normal',contrast:value.contrast===true,motion:value.motion===true,texture:value.texture!==false};}catch{}
function applyDeskPreferences(){const root=document.documentElement;if(!root?.dataset||!root.classList)return;root.dataset.text=deskPrefs.text;root.classList.toggle('desk-contrast',deskPrefs.contrast);root.classList.toggle('desk-plain',!deskPrefs.texture);motionSetPreference(deskPrefs.motion?'reduced':'system');}
applyDeskPreferences();
const deskSettingsPrevious=settingsModal;
settingsModal=function(){
 const toggle=(key:string,title:string,hint:string,on:boolean)=>`<button class="desk-setting" data-desk-toggle="${key}" role="switch" aria-label="${title}" aria-checked="${on}"><span><b>${title}</b><small>${hint}</small></span><i class="desk-switch" aria-hidden="true"></i></button>`;
 const original=deskSettingsPrevious().replace(/<button class="big" data-live-map="1">[\s\S]*?<\/button>/,'').replace(/<button class="big" data-ambience="1">[\s\S]*?<\/button>/,'').replace(/<button class="big" data-cinema-demo="saved">[\s\S]*?<\/button>/,'').replace(/<button class="big" data-election-preview="1">[\s\S]*?<\/button>/,'');
 return original.replace(/<h2>Oyun ayarları<\/h2>/,`<div class="desk-eyebrow">KİŞİSEL YÖNETİM MASAN</div><h2>Oyun ayarları</h2><p class="sub">Deneyimi kendine göre düzenle. Tercihlerin bu cihazda hatırlanır.</p><section class="desk-settings-group"><h3>Görünüm ve erişilebilirlik</h3><label class="desk-setting"><span><b>Yazı boyutu</b><small>Raporları ve kararları daha rahat oku.</small></span><select data-desk-text aria-label="Yazı boyutu"><option value="normal" ${deskPrefs.text==='normal'?'selected':''}>Standart</option><option value="large" ${deskPrefs.text==='large'?'selected':''}>Büyük</option></select></label>${toggle('contrast','Yüksek kontrast','Metin ve sınırları daha belirgin göster.',deskPrefs.contrast)}${toggle('motion','Hareketi azalt','Canlı haritayı durdur; arayüz geçişlerini azalt.',deskPrefs.motion)}${toggle('texture','Atmosfer dokusu','Yönetim masasında ince ışık ve yüzey dokuları.',deskPrefs.texture)}</section><section class="desk-settings-group"><h3>Ses ve dünya</h3>${toggle('sound','Olay sesleri','Kararlarda ve önemli gelişmelerde ses efektleri.',soundOn)}${toggle('ambience','Ülke atmosferi','Seçili ülkeye özgü arka plan melodileri. Sesleri de açar.',ambienceOn)}${toggle('live','Canlı harita','Haritadaki hareketli dünya katmanını göster.',liveMapOn&&!deskPrefs.motion)}<p class="sub">${deskPrefs.motion?'Hareket azaltma açıkken canlı harita durdurulur.':'Canlı haritayı kapatmak pil tüketimini azaltabilir.'}</p></section><section class="desk-settings-group desk-studio"><h3>Animasyon stüdyosu</h3><p class="sub">Sahneleri burada izleyebilirsin. Önizlemeler oyun ilerlemesini ve kaydı değiştirmez.</p><div class="studio-choices"><button class="big" data-cinema-demo="saved"><b>Suikast · Koruma</b></button><button class="big" data-cinema-demo="fatal"><b>Suikast · Görev devri</b></button>${G?.pid!=null?'<button class="big" data-election-preview="1"><b>Seçim gecesi</b></button>':''}<button class="big" data-motion-preview="event"><b>Toplumsal olay</b></button><button class="big" data-motion-preview="crisis"><b>Dünya krizi</b></button></div></section><section class="desk-settings-group"><h3>Kayıt, rehber ve güncellemeler</h3><p class="sub">Oyun ilerlemen otomatik kaydedilir. Cihaz değiştirmeden veya tarayıcı verilerini temizlemeden önce yedek indir.</p></section>`);
};
document.addEventListener('click',e=>{const b=eventElement(e).closest<HTMLButtonElement>('[data-desk-toggle]');if(!b)return;const key=b.dataset.deskToggle;
 if(key==='sound'){soundOn=!soundOn;localStorage.setItem('muhur-sound',String(soundOn));if(soundOn){unlockAudio();sfx('secret');}}
 else if(key==='ambience'){ambienceOn=!ambienceOn;localStorage.setItem('muhur-country-music',String(ambienceOn));if(ambienceOn){soundOn=true;localStorage.setItem('muhur-sound','true');unlockAudio();}}
 else if(key==='live'){if(deskPrefs.motion){deskPrefs.motion=false;}liveMapOn=!liveMapOn;localStorage.setItem('muhur-live-map',String(liveMapOn));}
 else if(key==='contrast'||key==='motion'||key==='texture'){deskPrefs[key]=!deskPrefs[key];if(key==='motion'&&deskPrefs.motion){liveMapOn=false;localStorage.setItem('muhur-live-map','false');}}
 try{localStorage.setItem('muhur-desk',JSON.stringify(deskPrefs));}catch{ui.notice='Görünüm uygulandı; cihaz tercihi saklayamadı.';}applyDeskPreferences();render();
});
document.addEventListener('change',e=>{const el=eventElement<HTMLSelectElement>(e);if(!el.matches('[data-desk-text]'))return;deskPrefs.text=el.value==='large'?'large':'normal';try{localStorage.setItem('muhur-desk',JSON.stringify(deskPrefs));}catch{ui.notice='Yazı boyutu uygulandı; cihaz tercihi saklayamadı.';}applyDeskPreferences();render();});
const deskRender=render;
render=function(){deskRender();const app=document.getElementById('app');app.dataset.screen=ui.view;if(ui.view==='title'){const title=app.querySelector('.title');title?.insertAdjacentHTML('afterbegin','<div class="desk-eyebrow">SİYASİ STRATEJİ · YAŞAYAN BİR DÜNYA</div>');title?.querySelector('.acts')?.insertAdjacentHTML('beforebegin','<div class="desk-manifest"><span>01 <b>Bir ülke seç.</b></span><span>02 <b>Gücünü inşa et.</b></span><span>03 <b>Tarihi değiştir.</b></span></div>');}app.querySelectorAll('nav button').forEach((b,i)=>{b.setAttribute('aria-label',b.textContent||'');b.setAttribute('data-desk-icon',['♙','◎','⚑','♜','⚖','▤'][i]);if(b.classList.contains('on'))b.setAttribute('aria-current','page');});};

/** Share the accessibility preference with canvas and timed story scenes. */
let deskLastScreen='',deskLastDialog='',deskLastTurn:number=null;
let deskLastStats:string[]=[];
const deskAnimatedRender=render;
render=function(){
 deskAnimatedRender();
 const app=document.getElementById('app');
 if(!app?.querySelector)return;
 const screen=`${ui.view}:${ui.view==='game'?G.tab:''}`;
 const dialog=app.querySelector<HTMLElement>('.modalbg:last-of-type .modal');
 const dialogKey=dialog?[dialog.getAttribute('aria-label'),dialog.querySelector('h2')?.textContent,ui.sheet?.t,currentCinema()?.uid,ui.view==='game'?G.q[0]?.uid||G.q[0]?.id:''].join(':'):'';
 const stats=Array.from(app.querySelectorAll<HTMLElement>('.stats b'));
 const turn=ui.view==='game'?G.turn:null;
 const reduced=deskReducedMotion();
 if(!reduced){
  if(screen!==deskLastScreen){
   const container=app.querySelector<HTMLElement>('main')||app.querySelector<HTMLElement>('.title');
   container?.classList.add('desk-enter');
   Array.from(container?.children||[]).slice(0,7).forEach((el,i)=>{if(el instanceof HTMLElement)el.style.setProperty('--desk-order',String(i));});
  }
  // Opening a new dossier animates once; changing an option never replays it.
  if(dialog&&dialogKey!==deskLastDialog&&!dialog.classList.contains('cinema-card'))dialog.classList.add('desk-dialog-enter');
  if(deskLastTurn!=null&&turn!=null&&turn!==deskLastTurn)app.querySelector('.date')?.classList.add('desk-turn-change');
  if(screen===deskLastScreen)stats.forEach((el,i)=>{if(deskLastStats[i]!=null&&deskLastStats[i]!==el.textContent)el.classList.add('desk-stat-change');});
 }
 deskLastScreen=screen;deskLastDialog=dialogKey;deskLastTurn=turn;deskLastStats=stats.map(el=>el.textContent||'');
};

type DeskPreview='event'|'crisis';
let deskPreview:DeskPreview=null;
const deskPreviewDuration=4400;
function deskPreviewHTML(kind:DeskPreview):string {
 const crisis=kind==='crisis';
 const visual=crisis?'<div class="studio-crisis-visual"><svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="studio-sea" x2="0" y2="1"><stop stop-color="#213e4d"/><stop offset="1" stop-color="#101f2b"/></linearGradient></defs><rect width="600" height="240" fill="url(#studio-sea)"/><path d="M0 83 56 60l67 8 51-36 67 31 42-20 76 18 66-23 77 26 98-8v190H0z" fill="#324d50"/><path d="M0 161 87 151l51-42 51 31 74-24 63 22 55-26 88 27 61-26 70 23v104H0z" fill="#1a343e"/><path d="M0 240 81 183l70-5 90-50 89 30 67-23 89 21 114-27v111z" fill="#31474a" stroke="#9b9d7c" stroke-width="3"/><path class="studio-border" d="M263 128 330 158l67-23" fill="none" stroke="#e0ba76" stroke-width="5" stroke-dasharray="7 7"/><circle class="studio-beacon" cx="330" cy="158" r="12" fill="#c87064"/><path d="M330 144v-38m0 3 40 9-40 8" stroke="#edc58a" stroke-width="3" fill="#a64d4c"/></svg></div>':eventScene();
 return `<div class="modalbg studio-backdrop"><section class="modal studio-card" role="dialog" aria-modal="true" aria-label="Animasyon önizlemesi"><div class="kick">ANİMASYON STÜDYOSU · ${crisis?'DÜNYA KRİZİ':'TOPLUMSAL OLAY'}</div><h2>${crisis?'Sınırda kriz':'Meydanda gelişme'}</h2><div class="studio-stage">${visual}<div class="studio-narration" data-studio-line aria-live="polite"></div></div><div class="studio-progress"><i data-studio-progress></i></div><p class="sub">Bu sahne bir önizlemedir; karakterler ve kayıt etkilenmez.</p><div class="studio-actions"><button class="chip" data-studio-skip="1">Animasyonu geç</button><button class="chip" data-studio-replay="1">Yeniden oynat</button><button class="big prime" data-studio-close="1"><b>Önizlemeyi kapat</b></button></div></section></div>`;
}
function mountDeskPreview():void {
 if(!deskPreview)return;
 const card=document.querySelector<HTMLElement>('.studio-card');if(!card)return;
 const kind=deskPreview,key='studio:'+kind,lines=kind==='crisis'?['Sınır bölgesinden ilk haberler geliyor.','Haritada yeni bir gerilim hattı beliriyor.','Diplomasi masası tarafları bekliyor.','Durum raporu tamamlandı.']:['Kent meydanında kalabalık toplanıyor.','Talepler görünür hale geliyor.','Yetkililer gelişmeleri izliyor.','Karar için rapor hazır.'];
 motionMount(key,card,deskPreviewDuration,(time,progress)=>{
  const phase=Math.min(3,Math.floor(progress*4));
  motionText(card,'[data-studio-line]',lines[phase]);
  const bar=card.querySelector<HTMLElement>('[data-studio-progress]');if(bar)bar.style.width=`${progress*100}%`;
  card.style.setProperty('--studio-shift',`${motionMix(0,12,motionRange(time,0,3200))}px`);
  card.classList.toggle('settled',progress>=1);
  const close=card.querySelector<HTMLButtonElement>('[data-studio-close]'),skip=card.querySelector<HTMLButtonElement>('[data-studio-skip]');
  if(close)close.disabled=progress<1;if(skip)skip.disabled=progress>=1;
 },60);
}
const deskStudioRender=render;
render=function(){motionCancelRender();deskStudioRender();if(deskPreview){document.getElementById('app').insertAdjacentHTML('beforeend',deskPreviewHTML(deskPreview));mountDeskPreview();}mountCrisisMotion();mountIllustratedScenes();};
function mountIllustratedScenes():void {const modal=document.querySelector<HTMLElement>('.modalbg:last-of-type .modal');if(!modal)return;const panel=modal.querySelector<HTMLElement>('.scene,.story-cover,.rally-reception');if(!panel)return;const label=modal.getAttribute('aria-label')||modal.querySelector('h2')?.textContent||'scene',key='illustration:'+label+':'+(G?.turn||0),moving=panel.querySelector<SVGElement>('[data-scene-moving],[data-story-moving]');motionMount(key,panel,1450,(time)=>{const enter=motionRange(time,0,780);panel.style.setProperty('--illustration-reveal',String(enter));if(moving)moving.setAttribute('transform',`translate(${motionMix(-18,0,enter)} ${motionMix(8,0,enter)})`);},50);}
function mountCrisisMotion():void {const card=document.querySelector<HTMLElement>('.crisis-card'),id=crisisResult?.id||G?.q[0]?.crisis;if(!card||!id)return;const result=card.classList.contains('crisis-result');motionMount('crisis:'+id+':'+result,card,2000,(time)=>{const map=card.querySelector<HTMLElement>('.crisis-map-wrap'),line=card.querySelector<HTMLElement>('.crisis-timeline'),outcome=card.querySelector<HTMLElement>('.crisis-outcome');if(map){map.style.setProperty('--crisis-reveal',String(motionRange(time,0,1000)));map.style.setProperty('--crisis-halo',String(motionRange(time,350,1300)));}if(line)line.style.opacity=String(motionRange(time,800,1550));if(outcome)outcome.style.opacity=String(motionRange(time,600,1500));},50);}
function closeDeskPreview():void {if(!deskPreview)return;motionForget('studio:'+deskPreview);deskPreview=null;render();}
document.addEventListener('click',e=>{const button=eventElement(e).closest<HTMLButtonElement>('[data-motion-preview],[data-studio-skip],[data-studio-replay],[data-studio-close]');if(!button||button.disabled)return;e.preventDefault();e.stopImmediatePropagation();
 if(button.dataset.motionPreview){if(deskPreview)motionForget('studio:'+deskPreview);deskPreview=button.dataset.motionPreview==='crisis'?'crisis':'event';render();}
 else if(button.dataset.studioSkip)motionSettle('studio:'+deskPreview);
 else if(button.dataset.studioReplay){motionReplay('studio:'+deskPreview);mountDeskPreview();}
 else closeDeskPreview();
},true);
document.addEventListener('keydown',e=>{if(deskPreview&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();const key='studio:'+deskPreview;if(motionProgress(motionScene(key,deskPreviewDuration))<1)motionSettle(key);else closeDeskPreview();}},true);
