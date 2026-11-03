import { test,expect } from '@playwright/test';

const errors=new WeakMap();
test.beforeEach(async({page})=>{
  const found=[];errors.set(page,found);page.on('pageerror',e=>found.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:/Devlet Başkanı modu/}).click();
  await page.getByRole('button',{name:/Türkiye Cumhuriyeti/}).click();
  await page.getByRole('button',{name:'Öğreticiyi kapat',exact:true}).click();
  await page.evaluate(()=>{
    const c=cOf(me());c.T=300;c.appr=40;c.stab=60;c.electionDue=100;
    me().age=30;me().health=100;G.wars=[];G.discoveries=['cat','radio','tea'];
    for(const country of G.cs)for(const key of Object.keys(country.rel))country.rel[key]=50;
    for(const r of crs(c)){r.edu=40;r.infra=40;r.wealth=50;r.sup=20;r.unemployment=15;}
    updEcon(c);G.periodBaseline={c:c.id,turn:G.turn,metrics:countryMetrics(c)};G.periodEffects=[];
    assassinationRisk=()=>0;unrestRisk=()=>0;drawEvent=()=>{};storyStep=()=>{};
    render();
  });
});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));

async function launch(page,kind='education'){
  await page.locator(`[data-a="${kind==='education'?'s:edu':'s:inf'}"]`).click();
  await page.getByRole('button',{name:'Programı başlat · 40 hazine',exact:true}).click();
}

test('commitment is explained before spending and has no immediate education gain',async({page})=>{
  await page.locator('[data-a="s:edu"]').click();
  await expect(page.getByRole('dialog')).toContainText('Toplam bütçe: 58 hazine');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();
  expect(await page.evaluate(()=>({treasury:cOf(me()).T,ap:G.ap,projects:G.policyProjects.length}))).toEqual({treasury:300,ap:3,projects:0});
  await launch(page);
  const s=await page.evaluate(()=>({treasury:cOf(me()).T,ap:G.ap,education:crs(cOf(me()))[0].edu,project:G.policyProjects[0],effects:G.periodEffects}));
  expect(s.treasury).toBe(260);expect(s.ap).toBe(2);expect(s.education).toBe(40);
  expect(s.project.progress).toBe(0);expect(s.project.paid).toBe(40);
  expect(s.effects.find(e=>e.label==='Eğitim seferberliği').changes.treasury).toBe(-40);
  await expect(page.locator('[data-a="s:edu"]')).toHaveAttribute('aria-disabled','true');
});

test('education pays and progresses once per turn, with employment benefit on completion',async({page})=>{
  await launch(page);
  const result=await page.evaluate(()=>{
    const states=[];
    for(let turn=1;turn<=3;turn++){
      G.turn=turn;policyProjectStep();policyProjectStep();
      const r=crs(cOf(me()))[0];states.push({edu:r.edu,jobs:r.unemployment,wealth:r.wealth,treasury:cOf(me()).T,progress:G.policyProjects[0].progress});
    }
    return {states,project:G.policyProjects[0]};
  });
  expect(result.states).toEqual([
    {edu:42,jobs:15,wealth:50,treasury:254,progress:1},
    {edu:44,jobs:15,wealth:50,treasury:248,progress:2},
    {edu:46,jobs:13,wealth:51,treasury:242,progress:3},
  ]);
  expect(result.project.status).toBe('completed');expect(result.project.paid).toBe(58);
});

test('infrastructure completes after two funded turns and then stops charging',async({page})=>{
  await launch(page,'infrastructure');
  const s=await page.evaluate(()=>{
    for(let turn=1;turn<=4;turn++){G.turn=turn;policyProjectStep();}
    const c=cOf(me()),r=crs(c)[0];return {infra:r.infra,wealth:r.wealth,econ:c.econ,treasury:c.T,project:G.policyProjects[0]};
  });
  expect(s.infra).toBe(46);expect(s.wealth).toBe(52);expect(s.econ).toBeCloseTo(52);
  expect(s.treasury).toBe(244);expect(s.project.paid).toBe(56);expect(s.project.status).toBe('completed');
});

test('insufficient funds pause progress, then resume without charging twice',async({page})=>{
  await launch(page,'infrastructure');
  const states=await page.evaluate(()=>{
    const c=cOf(me());G.turn=1;c.T=0;policyProjectStep();
    const paused={status:G.policyProjects[0].status,progress:G.policyProjects[0].progress,treasury:c.T};
    G.turn=2;c.T=10;policyProjectStep();policyProjectStep();
    const resumed={status:G.policyProjects[0].status,progress:G.policyProjects[0].progress,treasury:c.T};
    return {paused,resumed};
  });
  expect(states).toEqual({paused:{status:'paused',progress:0,treasury:0},resumed:{status:'active',progress:1,treasury:2}});
});

test('cancelling keeps spent money and stops future payments',async({page})=>{
  await launch(page);
  await page.locator('.policy-projects>summary').click();
  await page.getByRole('button',{name:'Programı durdur',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('40 hazine iade edilmez');
  await page.getByRole('dialog').getByRole('button',{name:'Programı durdur',exact:true}).click();
  const s=await page.evaluate(()=>{G.turn=1;policyProjectStep();return {status:G.policyProjects[0].status,treasury:cOf(me()).T,edu:crs(cOf(me()))[0].edu};});
  expect(s).toEqual({status:'cancelled',treasury:260,edu:40});
});

test('a paused program has a direct warning that opens its funding timeline',async({page})=>{
  await launch(page);
  await page.evaluate(()=>{cOf(me()).T=0;G.turn=1;policyProjectStep();render();});
  await page.getByRole('button',{name:/Program ödenek bekliyor/}).click();
  await expect(page.locator('.policy-projects')).toHaveAttribute('open','');
  await expect(page.locator('.policy-projects>summary')).toBeInViewport();
  await expect(page.locator('.policy-projects')).toContainText('Ödenek bekliyor');
});

test('a saved project resumes from the same paid installment after reload',async({page})=>{
  await launch(page);
  await page.evaluate(()=>{G.turn=1;policyProjectStep();save();flushGameSave();});
  await page.reload();await page.getByRole('button',{name:/Kaldığın yerden devam et/}).click();
  const s=await page.evaluate(()=>{
    policyProjectStep();const before={progress:G.policyProjects[0].progress,treasury:cOf(me()).T};
    G.turn=2;policyProjectStep();return {before,after:{progress:G.policyProjects[0].progress,treasury:cOf(me()).T}};
  });
  expect(s).toEqual({before:{progress:1,treasury:254},after:{progress:2,treasury:248}});
});

test('investment obligations continue after a change of government',async({page})=>{
  await launch(page);
  const s=await page.evaluate(()=>{
    const c=cOf(me());c.leader=c.opp;me().pos='muhalefet';G.turn=1;policyProjectStep();
    return {progress:G.policyProjects[0].progress,treasury:c.T};
  });
  expect(s).toEqual({progress:1,treasury:254});
});

test('active commitments keep daily decisions within small and landscape screens',async({page})=>{
  await launch(page);await launch(page,'infrastructure');
  for(const [width,height] of [[320,568],[360,640],[390,844],[844,390]]){
    await page.setViewportSize({width,height});
    const layout=await page.evaluate(()=>({daily:document.querySelector('.daily-decisions').getBoundingClientRect().toJSON(),main:document.querySelector('main').getBoundingClientRect().toJSON(),body:document.body.scrollWidth}));
    expect(layout.daily.bottom).toBeLessThanOrEqual(layout.main.bottom);
    expect(layout.body).toBe(width);
  }
});

test('newspaper includes immediate decisions, tax and war effects exactly once',async({page})=>{
  await page.evaluate(()=>{G.wars=[{a:cOf(me()).id,b:G.cs.find(c=>c.id!==cOf(me()).id).id,front:0,t:0}];});
  await page.locator('[data-a="s:wel"]').click();
  await page.locator('[data-st="3"]').click();
  await page.locator('#end').click();
  const s=await page.evaluate(()=>({edition:G.news[0],total:effectTotal(G.news[0].causes),pending:G.periodEffects}));
  expect(s.edition.baseline.appr).toBe(40);
  const social=s.edition.causes.filter(e=>e.label==='Sosyal destek paketi');
  expect(social).toHaveLength(1);expect(social[0].changes).toEqual({appr:9,treasury:-30});
  expect(s.edition.causes.find(e=>e.label==='Vergi politikasının etkisi').changes.appr).toBeCloseTo(-1.65);
  expect(s.edition.causes.find(e=>e.label==='Savaş yorgunluğu').changes.appr).toBeCloseTo(-1.05);
  for(const key of ['econ','stab','appr','treasury'])expect(s.total[key]).toBeCloseTo(s.edition.metrics[key]-s.edition.baseline[key],8);
  expect(s.pending).toEqual([]);
});

test('a completed newspaper does not repeat last period decisions in the next edition',async({page})=>{
  await page.locator('[data-a="s:wel"]').click();await page.locator('#end').click();
  const first=await page.evaluate(()=>JSON.stringify(G.news[0].causes));
  await page.locator('#end').click();
  expect(await page.evaluate(()=>G.news[0].causes.some(e=>e.label==='Sosyal destek paketi'))).toBe(false);
  expect(await page.evaluate(()=>JSON.stringify(G.news[1].causes))).toBe(first);
});

test('support caps are reflected as actual gains and do not break the explanation total',async({page})=>{
  await page.evaluate(()=>{const c=cOf(me());c.appr=98;G.periodBaseline.metrics.appr=98;render();});
  await page.locator('[data-a="s:wel"]').click();await page.locator('#end').click();
  const s=await page.evaluate(()=>({edition:G.news[0],total:effectTotal(G.news[0].causes)}));
  expect(s.edition.causes.find(e=>e.label==='Sosyal destek paketi').changes.appr).toBe(2);
  expect(s.total.appr).toBeCloseTo(s.edition.delta.appr,8);
});

test('both programs progress through normal end-turn UI and appear in the newspaper',async({page})=>{
  await launch(page);await launch(page,'infrastructure');
  for(let i=0;i<3;i++)await page.locator('#end').click();
  const projects=await page.evaluate(()=>G.policyProjects);
  expect(projects.every(p=>p.status==='completed')).toBe(true);
  expect(projects.map(p=>p.paid)).toEqual([58,56]);
  await expect(page.locator('.policy-projects>summary')).toContainText('Arşiv');
  await page.getByRole('button',{name:'Gazete',exact:true}).click();
  await page.getByRole('button',{name:/Son sayıyı aç/}).click();
  await expect(page.locator('.paper-explanation')).toContainText('Ne değişti, neden?');
  await expect(page.locator('.paper-explanation')).toContainText('Eğitim seferberliği · 3/3 tamamlandı');
  await expect(page.locator('.paper-explanation')).toContainText('işsizlik −2');
});

test('event choices that change support are explained like normal policy decisions',async({page})=>{
  await page.evaluate(()=>{G.q.push({id:'e_kriz'});render();});
  await page.getByRole('button',{name:/Kemer sık/}).click();
  await page.locator('#end').click();
  const causes=await page.evaluate(()=>G.news[0].causes);
  expect(causes.find(e=>e.label==='Kemer sık').changes).toEqual({appr:-8,treasury:25});
});

test('invalid project payments and duplicated active commitments are rejected',async({page})=>{
  await launch(page);
  const failures=await page.evaluate(()=>{
    const results=[];
    for(const kind of ['payment','duplicate','progress']){
      const s=JSON.parse(JSON.stringify(G));
      if(kind==='payment')s.policyProjects[0].paid=-1;
      if(kind==='duplicate')s.policyProjects.push({...s.policyProjects[0],id:s.policyProjects[0].id.replace(/-1$/,'-2')});
      if(kind==='progress')s.policyProjects[0].progress=99;
      try{validateState(s);results.push(false);}catch{results.push(true);}
    }
    return results;
  });
  expect(failures).toEqual([true,true,true]);
});

test('older newspaper entries without explanations remain readable',async({page})=>{
  await page.locator('#end').click();
  const s=await page.evaluate(()=>{
    const edition=JSON.parse(JSON.stringify(G.news[0]));delete edition.causes;delete edition.baseline;delete edition.delta.treasury;
    return newspaperHTML(edition);
  });
  expect(s).toContain('ÜLKENİN SESİ');expect(s).not.toContain('paper-explanation');
});
