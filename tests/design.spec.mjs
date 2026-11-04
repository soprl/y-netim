import { test, expect } from '@playwright/test';
test('presentation preferences persist without creating or changing a game',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Oyun ayarları',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Görünüm ve erişilebilirlik'})).toBeVisible();
 await page.getByRole('switch',{name:/Yüksek kontrast/}).click();
 await page.getByLabel('Yazı boyutu',{exact:true}).selectOption('large');
 await page.getByRole('switch',{name:/Hareketi azalt/}).click();
 await page.reload();
 await expect(page.locator('html')).toHaveClass(/desk-contrast/);
 await expect(page.locator('html')).toHaveClass(/desk-still/);
 await expect(page.locator('html')).toHaveAttribute('data-text','large');
 await page.getByRole('button',{name:'Oyun ayarları',exact:true}).click();
 await expect(page.getByRole('switch',{name:/Hareketi azalt/})).toHaveAttribute('aria-checked','true');
 await expect(page.getByRole('switch',{name:/Canlı harita/})).toHaveAttribute('aria-checked','false');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('desktop and mobile title fit the viewport',async({page})=>{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.getByRole('button',{name:/Devlet Başkanı modu/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('dossiers animate only on opening and reduced motion settles cinematics immediately',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Oyun ayarları',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Oyun ayarları',exact:true})).toBeVisible();
 await page.getByRole('switch',{name:'Yüksek kontrast',exact:true}).click();
 await expect(page.getByRole('switch',{name:'Yüksek kontrast',exact:true})).toHaveAttribute('aria-checked','true');
 await page.getByRole('switch',{name:'Hareketi azalt',exact:true}).click();
 await page.locator('[data-cinema-demo="saved"]').first().click();
 await expect(page.locator('.cinema-card')).toHaveClass(/settled/);
 await expect(page.getByRole('button',{name:'Önizlemeyi kapat',exact:true})).toBeEnabled();
 await expect(page.locator('.cinema-card')).toHaveAttribute('data-motion-complete','true');
 await page.getByRole('button',{name:'Önizlemeyi kapat',exact:true}).click();
 await expect(page.locator('.cinema-card')).toHaveCount(0);
});
test('system reduced motion suppresses entrance effects and cinematic waiting',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.desk-enter')).toHaveCount(0);
 await page.getByRole('button',{name:'Oyun ayarları',exact:true}).click();
 await expect(page.locator('.desk-dialog-enter')).toHaveCount(0);
 await page.locator('[data-cinema-demo="saved"]').first().click();
 await expect(page.locator('.cinema-card')).toHaveClass(/settled/);
 await expect(page.getByRole('button',{name:'Önizlemeyi kapat',exact:true})).toBeEnabled();
});
