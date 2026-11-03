import { test, expect } from '@playwright/test';

const runtimeErrors=new WeakMap();
test.beforeEach(async({page})=>{
  const errors=[];runtimeErrors.set(page,errors);
  page.on('pageerror',error=>errors.push(error.message));
});
test.afterEach(async({page})=>expect(runtimeErrors.get(page)).toEqual([]));

async function start(page,mode='state'){
  await page.goto('/');
  if(mode==='state'){
    await page.getByRole('button',{name:/Devlet Başkanı modu/}).click();
    await page.getByRole('button',{name:/Türkiye Cumhuriyeti/}).click();
  }else{
    await page.getByRole('button',{name:/Karakter modu/}).click();
    await page.getByRole('button',{name:/Kendi karakterini yarat/}).click();
    await page.getByLabel('Adın',{exact:true}).fill('Deniz Yılmaz');
    await page.getByRole('button',{name:/Hayata başla/}).click();
  }
  await page.getByRole('button',{name:'Öğreticiyi kapat',exact:true}).click();
}

test('rivals campaign from their own funds without spending player resources',async({page})=>{
  await start(page);
  const result=await page.evaluate(()=>{
    const c=cOf(me());G.turn=2;c.T=100;G.ap=3;
    c.parties.forEach((p,i)=>{p.funds=i===2?7:16;p.campaign=i===0?10:0;});
    campaignAIParties(c);
    return {funds:c.parties.map(p=>p.funds),campaign:c.parties.map(p=>p.campaign),treasury:c.T,ap:G.ap};
  });
  expect(result).toEqual({funds:[16,8,7],campaign:[10,5,0],treasury:100,ap:3});
});

test('AI respects cadence, campaign cap, player ownership and elections being allowed',async({page})=>{
  await start(page);
  const result=await page.evaluate(()=>{
    const c=cOf(me()),p=c.parties[1];p.funds=40;p.campaign=29;
    G.turn=1;campaignAIParties(c);const odd=[p.funds,p.campaign];
    G.turn=2;c.reg='cun';campaignAIParties(c);const prohibited=[p.funds,p.campaign];
    c.reg='cum';p.founder=G.pid;campaignAIParties(c);const owned=[p.funds,p.campaign];
    p.founder=null;campaignAIParties(c);const capped=[p.funds,p.campaign];
    campaignAIParties(c);const alreadyCapped=[p.funds,p.campaign];
    return {odd,prohibited,owned,capped,alreadyCapped};
  });
  expect(result).toEqual({odd:[40,29],prohibited:[40,29],owned:[40,29],capped:[32,30],alreadyCapped:[32,30]});
});

test('NPC party dues replenish party funds across terms',async({page})=>{
  await start(page);
  const result=await page.evaluate(()=>{
    const p=cOf(me()).parties[1];p.userDefined=false;p.funds=0;p.members=4000;p.campaign=0;
    socialStep();
    return {funds:p.funds,dues:p.lastFinance.dues,upkeep:p.lastFinance.upkeep};
  });
  expect(result.funds).toBeGreaterThan(0);
  expect(result.funds).toBeCloseTo(result.dues-result.upkeep);
});

test('ending a turn includes rival campaigning in the actual election report',async({page})=>{
  await start(page);
  await page.evaluate(()=>{
    const c=cOf(me());G.turn=1;c.electionDue=2;me().age=30;me().health=100;assassinationRisk=()=>0;
    c.parties.forEach(p=>{p.funds=32;p.campaign=0;});
    G.q=[];render();
  });
  await page.locator('#end').click();
  const result=await page.evaluate(()=>{
    const c=cOf(me()),report=G.decisionReports.find(r=>r.category==='election');
    return {turn:G.turn,shares:c.lastElection.parties.map(p=>p.share),seats:c.lastElection.parties.map(p=>p.seats),factors:report.factors};
  });
  expect(result.turn).toBe(2);
  expect(result.shares.reduce((a,b)=>a+b,0)).toBeCloseTo(100);
  expect(result.seats.reduce((a,b)=>a+b,0)).toBe(100);
  expect(result.factors[0].value).toContain('kampanya 0.0');
  expect(result.factors.slice(1).every(f=>f.value.includes('kampanya 5.0'))).toBe(true);
});

for(const [width,height] of [[320,568],[360,640],[390,844],[844,390]]){
  test(`world map and personal support layer fit ${width}x${height}`,async({page})=>{
    await page.setViewportSize({width,height});
    await start(page);
    await page.getByRole('button',{name:'Dünya',exact:true}).click();
    await page.locator('#map-mode').selectOption('des');
    await expect(page.locator('#map-mode option:checked')).toHaveText('Kişisel destek');
    await expect(page.locator('[data-zoom]')).toHaveCount(0);
    const layout=await page.evaluate(()=>{
      const main=document.querySelector('main'),map=document.querySelector('#map');
      return {width:document.body.scrollWidth,height:document.body.scrollHeight,
        main:[main.clientHeight,main.scrollHeight],map:map.getBoundingClientRect().toJSON(),
        footer:document.querySelector('.bot').getBoundingClientRect().toJSON(),scale:visualViewport.scale};
    });
    expect(layout.width).toBe(width);expect(layout.height).toBe(height);
    expect(layout.main[0]).toBe(layout.main[1]);
    expect(layout.map.width).toBeGreaterThan(0);
    expect(layout.map.bottom).toBeLessThanOrEqual(layout.footer.top);
    expect(layout.scale).toBe(1);
  });
  for(const mode of ['state','citizen']){
    test(`${mode} daily decisions fit ${width}x${height}`,async({page},testInfo)=>{
      await page.setViewportSize({width,height});
      await start(page,mode);
      const layout=await page.evaluate(()=>{
        const main=document.querySelector('main'),daily=main.querySelector('.daily-decisions');
        return {
          first:main.firstElementChild===daily,
          main:main.getBoundingClientRect().toJSON(),daily:daily.getBoundingClientRect().toJSON(),
          actions:[...daily.querySelectorAll(':scope>.acts>.act')].map(e=>e.getBoundingClientRect().toJSON()),
          bodyWidth:document.body.scrollWidth,bodyHeight:document.body.scrollHeight,
          footer:document.querySelector('.bot').getBoundingClientRect().toJSON(),
        };
      });
      expect(layout.first).toBe(true);
      expect(layout.bodyWidth).toBe(width);
      expect(layout.bodyHeight).toBe(height);
      expect(layout.daily.bottom).toBeLessThanOrEqual(layout.main.bottom);
      expect(layout.actions).toHaveLength(4);
      for(const action of layout.actions){
        expect(action.top).toBeGreaterThanOrEqual(layout.main.top);
        expect(action.bottom).toBeLessThanOrEqual(layout.main.bottom);
        expect(action.left).toBeGreaterThanOrEqual(0);
        expect(action.right).toBeLessThanOrEqual(width);
      }
      expect(layout.footer.bottom).toBeLessThanOrEqual(height);
      await page.screenshot({path:testInfo.outputPath('daily-decisions.png')});
    });
  }
}

test('support labels and policy effects distinguish personal and government support',async({page})=>{
  await start(page);
  await page.evaluate(()=>{const c=cOf(me());c.T=100;c.appr=40;crs(c).forEach(r=>r.sup=20);render();});
  const summary=page.locator('.support-summary');
  await expect(summary).toContainText('Kişisel destek %20');
  await expect(summary).toContainText('Yönetim desteği %40');
  await page.getByRole('button',{name:/Sosyal destek paketi/}).click();
  await expect(summary).toContainText('Kişisel destek %20');
  await expect(summary).toContainText('Yönetim desteği %49');
  await expect(page.locator('.top .stats')).toContainText('Kişisel destek %20');
  await summary.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('nüfusa göre ağırlıklı ortalamasıdır');
  await expect(dialog).toContainText('Yönetim desteği · %49');
  await page.getByRole('button',{name:'Geri dön',exact:true}).click();
  await page.locator('details').filter({has:page.locator('summary',{hasText:'Türkiye Cumhuriyeti'})}).locator('summary').click();
  await expect(page.locator('.bars')).toContainText('Yönetim desteği');
});

test('secondary panels remain open after an action re-renders the screen',async({page})=>{
  await start(page);
  const cabinet=page.locator('details').filter({has:page.locator('summary',{hasText:'Bakanlar'})});
  await cabinet.locator('summary').click();
  await page.getByRole('button',{name:/Sosyal destek paketi/}).click();
  await expect(cabinet).toHaveAttribute('open','');
  await expect(cabinet.locator('[data-min]')).toHaveCount(4);
});

test('campaign explanations stay inside the collapsible election panel',async({page})=>{
  await start(page);
  await expect(page.locator('main>p')).toHaveCount(0);
  const politics=page.locator('details').filter({has:page.locator('summary',{hasText:'Meclis ve seçimler'})});
  await politics.locator('summary').click();
  await expect(politics).toContainText('Bu dönem 0 kampanya');
  await expect(politics).toContainText('Kampanya başlatmak için önce partini adlandırıp programını belirle.');
});

for(const [target,title,warning] of [['elections','Meclis ve seçimler','Seçim yaklaşıyor'],['budget','Kamu bütçesi','Hazine daralıyor']]){
  test(`${target} warning opens the relevant details directly`,async({page})=>{
    await start(page);
    await page.evaluate(target=>{
      const c=cOf(me());c.electionDue=G.turn+(target==='elections'?1:7);
      c.T=target==='budget'?10:100;render();
    },target);
    await page.getByRole('button',{name:new RegExp(warning)}).click();
    const panel=page.locator('details').filter({has:page.locator('summary',{hasText:title})});
    await expect(panel).toHaveAttribute('open','');
    await expect(panel.locator('summary')).toBeInViewport();
  });
}

test('an existing 2.5.0 save retains both support values and rival campaign funding',async({page})=>{
  await page.goto('/');
  // Exercise the older version marker through the normal saved-game loader.
  await start(page);
  const saved=await page.evaluate(()=>{
    const s=JSON.parse(JSON.stringify(G));s.version='2.5.0';
    const c=s.cs[s.rs[s.ps[s.pid].r].c];c.appr=43;
    s.rs.filter(r=>r.c===c.id).forEach(r=>r.sup=27);
    return s;
  });
  await page.evaluate(s=>{localStorage.setItem(SAVE,JSON.stringify(s));},saved);
  await page.reload();
  await page.getByRole('button',{name:/Kaldığın yerden devam et/}).click();
  await expect(page.locator('.support-summary')).toContainText('Kişisel destek %27');
  await expect(page.locator('.support-summary')).toContainText('Yönetim desteği %43');
  expect(await page.evaluate(()=>cOf(me()).parties.every(p=>Number.isFinite(p.funds)))).toBe(true);
});
