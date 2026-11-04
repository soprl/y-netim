/* A single presentation clock. No state in this file is part of the simulation save. */
type MotionPreference='system'|'full'|'reduced';
interface MotionScene {key:string;duration:number;start:number;settled:boolean;marks:Set<string>}
interface MotionJob {key:string;root:Element;scene:MotionScene;paint:(elapsed:number,progress:number)=>void;interval:number;last:number;enabled?:()=>boolean}
const motionMedia=matchMedia('(prefers-reduced-motion:reduce)');
let motionPreference:MotionPreference='system',motionHiddenAt:number|null=document.hidden?performance.now():null,motionHiddenTime=0,motionFrame:number|null=null;
const motionScenes=new Map<string,MotionScene>(),motionJobs=new Map<string,MotionJob>(),motionAnimations=new Set<Animation>();
function deskReducedMotion():boolean{return motionPreference==='reduced'||motionPreference==='system'&&motionMedia.matches;}
function motionNow():number{return (motionHiddenAt??performance.now())-motionHiddenTime;}
function motionScene(key:string,duration:number):MotionScene {
 let scene=motionScenes.get(key);
 if(!scene){scene={key,duration,start:motionNow(),settled:false,marks:new Set()};motionScenes.set(key,scene);}
 if(deskReducedMotion()&&Number.isFinite(duration))scene.settled=true;
 // Completed, detached scenes are the only entries evicted; an active scene never loses its clock.
 if(motionScenes.size>64)for(const [id,old] of motionScenes){if(id!==key&&!motionJobs.has(id)){motionScenes.delete(id);if(motionScenes.size<=48)break;}}
 return scene;
}
function motionElapsed(scene:MotionScene):number{return scene.settled?scene.duration:Math.min(scene.duration,Math.max(0,motionNow()-scene.start));}
function motionProgress(scene:MotionScene):number{return Number.isFinite(scene.duration)?Math.min(1,motionElapsed(scene)/scene.duration):0;}
function motionEase(value:number):number {const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);}
function motionRange(time:number,start:number,end:number):number{return motionEase((time-start)/(end-start));}
function motionMix(from:number,to:number,progress:number):number{return from+(to-from)*progress;}
function motionStartFrame():void {if(motionFrame==null&&!document.hidden&&motionJobs.size)motionFrame=requestAnimationFrame(motionTick);}
function motionTick():void {
 motionFrame=null;if(document.hidden)return;const now=motionNow();
 for(const [key,job] of motionJobs){
  if(!job.root.isConnected||job.enabled&&!job.enabled()){motionJobs.delete(key);continue;}
  const elapsed=motionElapsed(job.scene),done=Number.isFinite(job.scene.duration)&&elapsed>=job.scene.duration;
  if(now-job.last>=job.interval||done){job.last=now;job.paint(elapsed,Number.isFinite(job.scene.duration)?elapsed/job.scene.duration:0);}
  if(done)motionJobs.delete(key);
 }
 motionStartFrame();
}
function motionMount(key:string,root:Element,duration:number,paint:MotionJob['paint'],interval=32,enabled?:()=>boolean):MotionScene {
 const scene=motionScene(key,duration),elapsed=motionElapsed(scene);paint(elapsed,Number.isFinite(duration)?elapsed/duration:0);
 if(!deskReducedMotion()&&elapsed<duration&&(!enabled||enabled())){motionJobs.set(key,{key,root,scene,paint,interval,last:motionNow(),enabled});motionStartFrame();}
 else motionJobs.delete(key);
 return scene;
}
function motionLoop(key:string,root:Element,paint:(elapsed:number)=>void,interval=60,enabled?:()=>boolean):void {
 motionMount(key,root,Infinity,time=>paint(deskReducedMotion()?0:time),interval,enabled);
}
function motionSettle(key:string):void {const scene=motionScenes.get(key);if(!scene)return;scene.settled=true;const job=motionJobs.get(key);if(job){job.paint(scene.duration,1);motionJobs.delete(key);}}
function motionReplay(key:string):void {const scene=motionScenes.get(key);if(scene){scene.start=motionNow();scene.settled=deskReducedMotion();scene.marks.clear();}}
function motionForget(key:string):void {motionScenes.delete(key);motionJobs.delete(key);}
function motionCancelRender():void {
 motionJobs.clear();if(motionFrame!=null)cancelAnimationFrame(motionFrame);motionFrame=null;
 for(const animation of motionAnimations)animation.cancel();motionAnimations.clear();
}
function motionAnimate(element:Element|null,frames:Keyframe[],options:KeyframeAnimationOptions={}):Animation|null {
 if(!element||!element.isConnected||deskReducedMotion()||document.hidden||typeof element.animate!=='function')return null;
 if(motionAnimations.size>=72){const first=motionAnimations.values().next().value as Animation|undefined;first?.cancel();if(first)motionAnimations.delete(first);}
 const animation=element.animate(frames,{duration:360,easing:'cubic-bezier(.2,.75,.25,1)',...options});motionAnimations.add(animation);
 animation.finished.then(()=>{motionAnimations.delete(animation);animation.cancel();},()=>motionAnimations.delete(animation));return animation;
}
function motionAttr(root:Element,selector:string,name:string,value:string):void {root.querySelector(selector)?.setAttribute(name,value);}
function motionText(root:Element,selector:string,value:string):void {const element=root.querySelector(selector);if(element&&element.textContent!==value)element.textContent=value;}
function motionSetPreference(mode:MotionPreference):void {
 motionPreference=mode;const root=document.documentElement;if(root?.dataset)root.dataset.motion=deskReducedMotion()?'reduced':'full';
 if(root?.classList?.toggle)root.classList.toggle('desk-still',deskReducedMotion());
 if(deskReducedMotion()){for(const scene of motionScenes.values())if(Number.isFinite(scene.duration))scene.settled=true;for(const animation of motionAnimations)animation.finish();}
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(motionHiddenAt==null)motionHiddenAt=performance.now();if(motionFrame!=null)cancelAnimationFrame(motionFrame);motionFrame=null;for(const animation of motionAnimations)animation.pause();}
 else {if(motionHiddenAt!=null){motionHiddenTime+=performance.now()-motionHiddenAt;motionHiddenAt=null;}for(const animation of motionAnimations)if(animation.playState==='paused')animation.play();motionStartFrame();}
 if(document.documentElement?.dataset)document.documentElement.dataset.motionPaused=String(document.hidden);
});
motionMedia.addEventListener('change',()=>{motionSetPreference(motionPreference);if(motionPreference==='system')render();});
