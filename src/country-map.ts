'use strict';
/* Ülkeye dokununca, aynı sabit ekranda ülke/bölge haritası açılır. */
const countryMapBuffer=document.createElement('canvas');countryMapBuffer.width=W;countryMapBuffer.height=H;
let countryBoundsCache:{id:number;signature:string;x0:number;y0:number;sw:number;sh:number}=null;
function countryBounds(id: number){const signature=G.rs.map(r=>r.c).join(',');if(countryBoundsCache?.id===id&&countryBoundsCache.signature===signature)return countryBoundsCache;
 let x0=W,y0=H,x1=-1,y1=-1;const bounds=ensureMapGeometry().bounds;for(const r of crs(G.cs[id])){const b=bounds[r.id];if(b){x0=Math.min(x0,b.x0);x1=Math.max(x1,b.x1);y0=Math.min(y0,b.y0);y1=Math.max(y1,b.y1);}}
 if(x1<0){const r=G.rs[G.cs[id].cap];x0=r.x-8;x1=r.x+8;y0=r.y-8;y1=r.y+8;}
 const pad=12;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
 return countryBoundsCache={id,signature,x0,y0,sw:Math.max(30,x1-x0+1),sh:Math.max(30,y1-y0+1)};
}
function mapToWorld(x: number,y: number){const p=ui.mapProjection;if(ui.mapCountry==null||!p)return {x,y};if(x<p.dx||x>p.dx+p.dw||y<p.dy||y>p.dy+p.dh)return {x:-1,y:-1};return {x:p.sx+(x-p.dx)/p.dw*p.sw,y:p.sy+(y-p.dy)/p.dh*p.sh};}
function worldToMap(x: number,y: number){const p=ui.mapProjection;if(ui.mapCountry==null||!p)return {x,y};return {x:p.dx+(x-p.sx)/p.sw*p.dw,y:p.dy+(y-p.sy)/p.sh*p.dh};}
const countryBaseDraw=drawMap;
drawMap=function(cv: HTMLCanvasElement){countryBaseDraw(cv);if(!cv)return;if(ui.mapCountry==null||!G.cs[ui.mapCountry]?.alive){ui.mapCountry=null;ui.mapProjection=null;return;}
 const id=ui.mapCountry,b=countryBounds(id),scale=Math.min((W-48)/b.sw,(H-120)/b.sh),dw=b.sw*scale,dh=b.sh*scale,dx=(W-dw)/2,dy=(H-dh)/2;
 ui.mapProjection={sx:b.x0,sy:b.y0,sw:b.sw,sh:b.sh,dx,dy,dw,dh};
 const buffer=countryMapBuffer.getContext('2d');buffer.clearRect(0,0,W,H);buffer.drawImage(cv,0,0);const x=cv.getContext('2d');x.fillStyle='#0a1d2a';x.fillRect(0,0,W,H);x.drawImage(countryMapBuffer,b.x0,b.y0,b.sw,b.sh,dx,dy,dw,dh);
 const font=Math.max(18,Math.round(12*W/(cv.getBoundingClientRect().width||368)));x.font=`600 ${font}px system-ui`;x.textAlign='center';x.textBaseline='middle';const used:{x:number;y:number;w:number}[]=[];
 const regions=crs(G.cs[id]).sort((a,b)=>Number(b.id===G.sel)-Number(a.id===G.sel));
 for(const r of regions){const p=worldToMap(r.x,r.y),label=r.n.replace(' · Çevre',' II').replace(' · Uç bölge',' III'),width=x.measureText(label).width+14,height=font+10,lx=cl(p.x,width/2+5,W-width/2-5);let ly=p.y+font;
  for(const step of [0,-1,1,-2,2,-3,3,-4,4,-5,5]){const candidate=cl(p.y+font+step*(height+5),height/2+65,H-height/2-10);if(!used.some(a=>Math.abs(a.x-lx)<(a.w+width)/2+6&&Math.abs(a.y-candidate)<height+4)){ly=candidate;break;}}
  used.push({x:lx,y:ly,w:width});
  if(Math.abs(ly-p.y)>height){x.strokeStyle='#d6e2e980';x.lineWidth=1.5;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(lx,ly);x.stroke();x.fillStyle='#eef2e4';x.beginPath();x.arc(p.x,p.y,3,0,Math.PI*2);x.fill();}
  x.fillStyle=r.id===G.sel?'#e7b54b':'#0b192de8';x.fillRect(lx-width/2,ly-height/2,width,height);x.fillStyle=r.id===G.sel?'#15202b':'#e6edf3';x.fillText(label,lx,ly);
 }
};
const countryBaseTabWorld=tabWorld;
tabWorld=function(){const body=countryBaseTabWorld();const focus=ui.mapCountry!=null&&G.cs[ui.mapCountry]?.alive;return body.replace('<div class="mapbox fixed-map">',`<div class="mapbox fixed-map ${focus?'country-view':''}">${focus?'<button class="map-return" data-map-back="1">‹ Avrupa\'ya dön</button>':''}<span class="map-caption">${focus?esc(G.cs[ui.mapCountry].n)+' · Bölgeler':'AVRUPA'}</span>`);};
document.addEventListener('click',e=>{const button=eventElement(e).closest<HTMLButtonElement>('[data-map-back]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();ui.mapCountry=null;ui.mapProjection=null;render();},true);
