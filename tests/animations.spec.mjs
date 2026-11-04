import {test,expect} from '@playwright/test';

const failures=new WeakMap();
test.beforeEach(async({page})=>{
 const errors=[];failures.set(page,errors);page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'no-preference'});
});
test.afterEach(async({page})=>expect(failures.get(page)).toEqual([]));

async function startGame(page){
 await page.goto('/');
 await page.getByRole('button',{name:/Devlet Başkanı modu/}).click();
 await page.getByRole('button',{name:/Türkiye Cumhuriyeti/}).click();
 await page.getByRole('button',{name:'Öğreticiyi kapat',exact:true}).click();
 await page.evaluate(()=>{save();flushGameSave();});
}
async function openSettings(page){await page.getByRole('button',{name:'Oyun ayarları',exact:true}).click();}
async function identity(page){return page.evaluate(()=>({game:JSON.stringify(G),saved:localStorage.getItem(SAVE)}));}

for(const saved of [true,false])test(`skipping a real ${saved?'survived':'fatal'} scene consumes one event and preserves its resolved state`,async({page})=>{
 await startGame(page);
 const before=await page.evaluate(saved=>{
  const p=me();
  G.q=[{id:'assassination',uid:'test-assassination',name:p.name,seed:p.seed,role:'Cumhurbaşkanı',country:cOf(p).n,saved},{id:'info',k:'Sonraki olay',title:'Sıradaki karar',text:'Olay kuyruğu korunuyor.'}];
  ui.sheet=null;render();
  return JSON.stringify({...G,q:[]});
 },saved);
 await expect(page.locator('[data-cinema-continue]')).toBeDisabled();
 await page.locator('[data-cinema-skip]').click();
 await expect(page.locator('[data-cinema-continue]')).toBeEnabled();
 expect(await page.evaluate(()=>JSON.stringify({...G,q:[]}))).toBe(before);
 await page.locator('[data-cinema-continue]').click();
 await expect(page.getByRole('heading',{name:'Sıradaki karar'})).toBeVisible();
 expect(await page.evaluate(()=>G.q.map(q=>q.id))).toEqual(['info']);
 expect(await page.evaluate(()=>JSON.stringify({...G,q:[]}))).toBe(before);
});

test('both assassination previews leave the game and persisted save unchanged',async({page})=>{
 await startGame(page);const before=await identity(page);
 await openSettings(page);
 await page.locator('[data-cinema-demo="saved"]').first().click();
 await page.locator('[data-cinema-skip]').click();
 await page.locator('.cinema-card [data-cinema-demo="fatal"]').click();
 await page.locator('[data-cinema-skip]').click();
 await page.locator('[data-cinema-continue]').click();
 expect(await identity(page)).toEqual(before);
});

test('election numbers update without replacing party rows and final results stay exact',async({page})=>{
 await startGame(page);const before=await identity(page);
 await openSettings(page);await page.locator('[data-election-preview]').first().click();
 const row=await page.locator('.election-party').first().elementHandle();
 await expect(page.locator('[data-election-close]')).toBeDisabled();
 await page.waitForTimeout(700);
 expect(await row.evaluate(el=>el.isConnected)).toBe(true);
 expect(await row.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
 const expected=await page.evaluate(()=>currentElection().parties.map(p=>({name:p.name,share:p.share,seats:p.seats})));
 await page.locator('[data-election-fast]').click();
 await expect(page.locator('[data-election-close]')).toBeEnabled();
 for(const party of expected){
  const entry=page.locator('.election-party').filter({hasText:party.name});
  await expect(entry).toContainText(party.share.toFixed(1));
  await expect(entry).toContainText(String(party.seats));
 }
 await page.locator('[data-election-close]').click();
 expect(await identity(page)).toEqual(before);
});

test('changing the system motion preference settles an already running cinematic',async({page})=>{
 await page.goto('/');await openSettings(page);
 await page.locator('[data-cinema-demo="saved"]').first().click();
 await expect(page.locator('[data-cinema-continue]')).toBeDisabled();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('[data-cinema-continue]')).toBeEnabled();
 await page.locator('[data-cinema-continue]').click();
 await expect(page.locator('.cinema-card')).toHaveCount(0);
});

test('election visual time pauses while the document is hidden and resumes on return',async({page})=>{
 await startGame(page);await openSettings(page);await page.locator('[data-election-preview]').first().click();
 await page.waitForTimeout(500);
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  document.dispatchEvent(new Event('visibilitychange'));
 });
 const frozen=await page.locator('.election-count').innerText();
 await page.waitForTimeout(500);
 expect(await page.locator('.election-count').innerText()).toBe(frozen);
 await page.evaluate(()=>{
  delete document.hidden;
  document.dispatchEvent(new Event('visibilitychange'));
 });
 await expect.poll(()=>page.locator('.election-count').innerText()).not.toBe(frozen);
 await page.locator('[data-election-fast]').click();await page.locator('[data-election-close]').click();
});
for(const kind of ['event','crisis'])test(`${kind} studio preview replays and skips without changing saved game`,async({page})=>{
 await startGame(page);const before=await identity(page);await openSettings(page);
 await page.locator(`[data-motion-preview="${kind}"]`).click();
 await expect(page.locator('[data-studio-close]')).toBeDisabled();
 await page.locator('[data-studio-skip]').click();
 await expect(page.locator('[data-studio-close]')).toBeEnabled();
 await page.locator('[data-studio-replay]').click();
 await expect(page.locator('[data-studio-close]')).toBeDisabled();
 await page.locator('[data-studio-skip]').click();await page.locator('[data-studio-close]').click();
 expect(await identity(page)).toEqual(before);
});
