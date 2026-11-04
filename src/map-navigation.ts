/* Gestures are scoped to the map viewport; other screens keep normal scrolling. */
interface MapCamera {scale:number;x:number;y:number}
let mapCamera:MapCamera={scale:1,x:0,y:0},cameraGame:GameState=null,cameraCountry:number=null;
function clampMapCamera(camera:MapCamera,width:number,height:number,baseWidth:number,baseHeight:number):MapCamera {
 const scale=cl(camera.scale,1,5),maxX=Math.max(0,(baseWidth*scale-width)/2),maxY=Math.max(0,(baseHeight*scale-height)/2);
 return {scale,x:cl(camera.x,-maxX,maxX),y:cl(camera.y,-maxY,maxY)};
}
function zoomMapCamera(camera:MapCamera,scale:number,anchor:Point):MapCamera {
 const next=cl(scale,1,5),ratio=next/camera.scale;
 return {scale:next,x:anchor.x-(anchor.x-camera.x)*ratio,y:anchor.y-(anchor.y-camera.y)*ratio};
}
function selectMapPoint(canvas:HTMLCanvasElement,clientX:number,clientY:number):void {
 const rect=canvas.getBoundingClientRect(),p=mapToWorld((clientX-rect.left)/rect.width*W,(clientY-rect.top)/rect.height*H),x=Math.floor(p.x),y=Math.floor(p.y);
 if(x<0||x>=W||y<0||y>=H)return;
 let id=grid[y*W+x];
 if(id<0){const near=G.rs.map(r=>({id:r.id,d:Math.hypot(r.x-x,r.y-y)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<9)id=near.id;}
 if(id>=0){G.sel=id;ui.mapCountry=G.rs[id].c;render();}
}
let navigationObserver:ResizeObserver=null;
function mountMapNavigation():void {
 navigationObserver?.disconnect();
 const box=document.querySelector<HTMLElement>('.fixed-map'),stage=box?.querySelector<HTMLElement>('.map-stage'),canvas=box?.querySelector<HTMLCanvasElement>('#map');
 if(!box||!stage||!canvas)return;
 if(cameraGame!==G||cameraCountry!==(ui.mapCountry??null)){mapCamera={scale:1,x:0,y:0};cameraGame=G;cameraCountry=ui.mapCountry??null;}
 const apply=()=>{mapCamera=clampMapCamera(mapCamera,box.clientWidth,box.clientHeight,stage.offsetWidth,stage.offsetHeight);stage.style.transform=`translate(${mapCamera.x}px,${mapCamera.y}px) scale(${mapCamera.scale})`;box.dataset.mapScale=mapCamera.scale.toFixed(2);};
 apply();canvas.tabIndex=0;canvas.setAttribute('aria-label','Harita: sürükleyerek gezin, iki parmak veya tekerlekle yakınlaştırın. Klavyede oklar, artı, eksi ve sıfır.');
 canvas.addEventListener('keydown',e=>{if(G.q.length||ui.sheet)return;const moves:Record<string,Point>={ArrowLeft:{x:40,y:0},ArrowRight:{x:-40,y:0},ArrowUp:{x:0,y:40},ArrowDown:{x:0,y:-40}};if(moves[e.key]){mapCamera.x+=moves[e.key].x;mapCamera.y+=moves[e.key].y;}else if(['+','=','-','0'].includes(e.key))mapCamera=e.key==='0'?{scale:1,x:0,y:0}:zoomMapCamera(mapCamera,mapCamera.scale*(e.key==='-'?1/1.4:1.4),{x:0,y:0});else return;e.preventDefault();apply();});
 const controls=document.createElement('div');controls.className='map-navigation';controls.setAttribute('role','group');controls.setAttribute('aria-label','Harita görünümü');
 controls.innerHTML='<button type="button" data-map-camera="in" aria-label="Haritayı yakınlaştır">+</button><button type="button" data-map-camera="out" aria-label="Haritayı uzaklaştır">−</button><button type="button" data-map-camera="reset" aria-label="Harita görünümünü sıfırla">↺</button>';
 box.append(controls);
 controls.addEventListener('click',e=>{const button=eventElement(e).closest<HTMLButtonElement>('[data-map-camera]');if(!button||G.q.length||ui.sheet)return;e.preventDefault();e.stopPropagation();stage.classList.add('map-camera-ease');mapCamera=button.dataset.mapCamera==='reset'?{scale:1,x:0,y:0}:zoomMapCamera(mapCamera,mapCamera.scale*(button.dataset.mapCamera==='in'?1.4:1/1.4),{x:0,y:0});apply();});
 const point=(x:number,y:number)=>{const r=box.getBoundingClientRect();return {x:x-r.left-box.clientWidth/2,y:y-r.top-box.clientHeight/2};};
 box.addEventListener('wheel',e=>{if(G.q.length||ui.sheet||controls.contains(e.target as Node))return;e.preventDefault();stage.classList.remove('map-camera-ease');const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?box.clientHeight:1);mapCamera=zoomMapCamera(mapCamera,mapCamera.scale*Math.exp(-cl(delta,-200,200)*.005),point(e.clientX,e.clientY));apply();},{passive:false});
 const pointers=new Map<number,Point>();let origin:Point=null,last:Point=null,distance=0,dragged=false;
 const baseline=()=>{const p=[...pointers.values()];last=p.length===2?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}:p[0];distance=p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;};
 box.addEventListener('pointerdown',e=>{if(e.button!==0||G.q.length||ui.sheet||eventElement(e).closest('button'))return;if(pointers.size>=2)return;e.preventDefault();stage.classList.remove('map-camera-ease');box.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){origin={x:e.clientX,y:e.clientY};dragged=false;}else dragged=true;baseline();box.classList.add('map-dragging');});
 box.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const previous=last,previousDistance=distance;baseline();
  if(pointers.size===2){mapCamera=zoomMapCamera(mapCamera,mapCamera.scale*(distance/Math.max(1,previousDistance)),point(previous.x,previous.y));mapCamera.x+=last.x-previous.x;mapCamera.y+=last.y-previous.y;}
  else{if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>8)dragged=true;if(dragged){mapCamera.x+=last.x-previous.x;mapCamera.y+=last.y-previous.y;}}
  apply();
 });
 const finish=(e:PointerEvent,cancelled:boolean)=>{if(!pointers.has(e.pointerId))return;const tap=!cancelled&&!dragged&&pointers.size===1&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<=8;pointers.delete(e.pointerId);if(box.hasPointerCapture(e.pointerId))box.releasePointerCapture(e.pointerId);if(!pointers.size)box.classList.remove('map-dragging');else{dragged=true;baseline();}if(tap)selectMapPoint(canvas,e.clientX,e.clientY);};
 box.addEventListener('pointerup',e=>finish(e,false));box.addEventListener('pointercancel',e=>finish(e,true));box.addEventListener('lostpointercapture',e=>finish(e,true));
 const observer=navigationObserver=new ResizeObserver(()=>{if(!box.isConnected){observer.disconnect();return;}apply();});observer.observe(box);
}
const navigationRender=render;render=function(){navigationRender();mountMapNavigation();};
