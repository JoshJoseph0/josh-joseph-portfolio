/* Optional, local interaction: the portfolio links always retain priority. */
'use strict';
window.installPortfolioPickup=({getWorld,canvas,draw,reduced})=>{
 const overlay=document.createElement('canvas');overlay.className='crowd-cursor';overlay.setAttribute('aria-hidden','true');document.body.append(overlay);
 const ctx=overlay.getContext('2d'),hint=document.createElement('span'),status=document.createElement('span'),control=document.createElement('button'),cancelButton=document.createElement('button');
 hint.className='crowd-hint';hint.setAttribute('aria-hidden','true');status.className='crowd-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 control.className='crowd-move';control.type='button';control.textContent='Move a person';control.setAttribute('aria-label','Move a person');
 const help=document.createElement('span');help.id='crowd-move-help';help.className='crowd-status';help.textContent='Pick up a person with a click or drag. Click or release to place them. With a keyboard, use arrow keys to move, Enter to place, and Escape to cancel.';control.setAttribute('aria-describedby',help.id);
 cancelButton.type='button';cancelButton.className='crowd-move crowd-cancel';cancelButton.textContent='Cancel';cancelButton.setAttribute('aria-label','Cancel moving person');cancelButton.hidden=true;
 document.body.append(hint,status,control,cancelButton,help);
 let held=null,hover=null,mouse=null,armed=null,frame=0,last=0,swallowUntil=0,swallowX=0,swallowY=0,ratio=1;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const textMask=document.createElement('canvas');textMask.width=textMask.height=1;const mask=textMask.getContext('2d',{willReadFrequently:true});
 const live=()=>document.documentElement.dataset.heroMotionActive!=='false';
 const blocked=el=>el?.closest('a,button,input,select,textarea,summary,.work-card,.header');
 function size(){ratio=Math.min(devicePixelRatio||1,2);overlay.width=Math.round(innerWidth*ratio);overlay.height=Math.round(innerHeight*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
 function say(text){status.textContent=text;}
 function label(text,x,y){if(hint.textContent!==text)hint.textContent=text;hint.style.left=clamp(x+20,12,Math.max(12,innerWidth-232))+'px';hint.style.top=clamp(y+18,88,innerHeight-70)+'px';hint.hidden=!text;}
 function point(p){const w=getWorld(),r=canvas.getBoundingClientRect(),q=w.sample(p);return {x:q.x+r.left,y:q.y+r.top};}
 function coversText(x,y){
  for(const el of document.querySelectorAll('.name-flight>span,.selected-word')){
   const r=el.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
   const style=getComputedStyle(el),scale=r.height/(el.offsetHeight||r.height),fs=parseFloat(style.fontSize)*scale;
   mask.clearRect(0,0,1,1);mask.font=`${style.fontWeight} ${fs}px ${style.fontFamily}`;mask.letterSpacing=(parseFloat(style.letterSpacing)||0)*scale+'px';mask.textBaseline='alphabetic';
   const m=mask.measureText(el.textContent),ascent=m.fontBoundingBoxAscent||fs*.9,descent=m.fontBoundingBoxDescent||fs*.2,line=(parseFloat(style.lineHeight)||fs*1.2)*scale;
   mask.fillText(el.textContent,r.left-x,r.top-y+(line-ascent-descent)/2+ascent);
   if(mask.getImageData(0,0,1,1).data[3]>40)return true;
  }
  return false;
 }
 function swallow(e){swallowUntil=performance.now()+750;swallowX=e.clientX;swallowY=e.clientY;}
 function find(x,y,target){
  const w=getWorld();if(!w||!live()||blocked(target))return null;
  let best=null,distance=Infinity;
  for(const p of w.visible()){
   const q=point(p),dx=(x-q.x)/15,dy=(y-q.y+18*p.scale)/25,d=dx*dx+dy*dy;
   if(q.y<82||q.y>innerHeight-5||q.x<8||q.x>innerWidth-8)continue;
   if(d<1&&d<distance){best=p;distance=d;}
  }
  return best&&!coversText(x,y)?best:null;
 }
 function destination(){
  if(!held)return null;const w=getWorld(),r=canvas.getBoundingClientRect(),x=held.px,y=held.py+58*held.p.scale;
  if(x<16||x>innerWidth-16||y<90||y>innerHeight-18||blocked(document.elementFromPoint(x,y)))return null;
  return w.placement(held.p,{x:x-r.left+w.cameraX,y:y-r.top},24);
 }
 function begin(p,x,y,keyboard=false,touch=false){
  const w=getWorld(),fromSit=p.sitBlend||0;if(!w||!w.lift(p))return;
  const q=point(p);held={p,px:x,py:y,startX:x,startY:y,moved:false,keyboard,touch,fromSit,age:0,placing:false,spring:new PortfolioCarry.CarrySpring(q.x,q.y-(36-15*fromSit)*p.scale),landing:null};
  hover=null;document.body.classList.remove('crowd-hover');document.body.classList.add('crowd-carrying');control.textContent='Place person';control.setAttribute('aria-label','Place person');
  say('Person picked up. '+(keyboard?'Arrow keys move. Enter places. Escape cancels.':'Click to place, or press Escape to return them.'));draw();wake();
 }
 function finish(text){
  canvas.dataset.pickupResult=text;held=null;last=0;document.body.classList.remove('crowd-carrying');control.textContent='Move a person';control.setAttribute('aria-label','Move a person');say(text);hint.hidden=true;draw();
 }
 function cancel(text='Returned safely.'){
  armed=null;if(!held)return;const w=getWorld();w?.returnPerson(held.p);finish(text);
 }
 function drop(){
  if(!held||held.landing)return;const d=destination();
  if(!d){say('Choose an open spot, or press Escape to return them.');held.placing=false;return;}
  held.landing={point:d,time:0,x:held.spring.x,y:held.spring.y,angle:held.spring.angle};say('Placing person.');wake();
 }
 function stroke(points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
 function floating(p,x,y,angle,scale,knee=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(p.scale*scale,p.scale*scale);
  const flutter=reduced()?0:Math.sin((held?.spring.clock||0)*5+p.id)*Math.min(1,Math.abs(angle)*3+.12),loose=angle*5;
  stroke([[-1.7,21],[-2.5-loose,28-knee],[-3-loose+flutter,36-knee]],p.pants,2.6);
  stroke([[1.7,21],[3-loose*.6,28-knee],[4-loose-flutter,35-knee]],p.pants,2.6);
  stroke([[-3-loose+flutter,36-knee],[-1-loose+flutter,36-knee]],'#202721',1.8);stroke([[4-loose-flutter,35-knee],[6-loose-flutter,35-knee]],'#202721',1.8);
  stroke([[-3,11],[-5,18],[-5-loose*.5,25]],p.shirt,2.3);stroke([[-5-loose*.5,25],[-5-loose*.5,27]],p.skin,1.6);
  ctx.fillStyle=p.shirt;ctx.beginPath();ctx.moveTo(-3.4,10);ctx.quadraticCurveTo(0,8,3.4,10);ctx.lineTo(3,22);ctx.lineTo(-3,22);ctx.closePath();ctx.fill();
  stroke([[3,11],[5,18],[5-loose*.5,25]],p.shirt,2.3);stroke([[5-loose*.5,25],[5-loose*.5,27]],p.skin,1.6);
  stroke([[0,7],[0,10]],p.skin,1.8);ctx.fillStyle=p.skin;ctx.beginPath();ctx.ellipse(0,5,2.2,2.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#252a24';ctx.beginPath();ctx.ellipse(-.3,3.7,2.3,1.9,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function paint(){
  ctx.clearRect(0,0,innerWidth,innerHeight);cancelButton.hidden=!held;control.hidden=!live()||(!held&&document.documentElement.dataset.projectLayout!=='overview'&&Number(document.documentElement.dataset.heroCameraX||0)>(getWorld()?.width||innerWidth)*.46);
  const hb=document.querySelector('.work-carousel-heading').getBoundingClientRect().bottom;
  const overview=document.documentElement.dataset.projectLayout==='overview';
  let mobileTop=overview?hb+8:hb-54;
  if(overview&&hb<82)mobileTop=(document.querySelector('.project-section-note')?.getBoundingClientRect().top||innerHeight)+10;
  if(innerWidth<=900&&overview&&(mobileTop<82||mobileTop>innerHeight-50)&&!held)control.hidden=true;
  const top=innerWidth<=900&&mobileTop>=82&&mobileTop<innerHeight-50?mobileTop+'px':'';
  control.style.top=top;control.style.bottom=top?'auto':'';cancelButton.style.top=top;cancelButton.style.bottom=top?'auto':'';
  if(held){
   const p=held.p,d=held.landing?.point||destination(),r=canvas.getBoundingClientRect(),w=getWorld();
   const gx=d?d.x-w.cameraX+r.left:held.px,gy=d?d.y+r.top:held.py+58*p.scale;
   const valid=!!d;ctx.save();ctx.strokeStyle=valid?'#242a2580':'#242a2545';ctx.lineWidth=1;ctx.setLineDash(valid?[]:[2,3]);ctx.beginPath();ctx.ellipse(gx,gy,13,4,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='#242a2518';ctx.beginPath();ctx.ellipse(gx-2,gy,10,3,0,0,Math.PI*2);ctx.fill();
   if(!valid){stroke([[gx-2,gy-2],[gx+2,gy+2]],'#242a2570',1);stroke([[gx+2,gy-2],[gx-2,gy+2]],'#242a2570',1);}ctx.restore();
   const t=held.landing?clamp(held.landing.time/.26,0,1):0;
   floating(p,held.spring.x,held.spring.y,held.spring.angle,1.12-t*.12,(t>.75?Math.sin((t-.75)*Math.PI*4)*1.2:0)+held.fromSit*(1-clamp(held.age/.22,0,1))*8);
   label(held.landing?'':held.keyboard?'Arrow keys · Enter to place · Esc to cancel':held.touch?(valid?'Tap to place · Cancel to return':'Find an open spot · Cancel to return'):valid?'Click to place · Esc to cancel':'Find an open spot · Esc to cancel',held.px,held.py);
   canvas.dataset.pickupState=held.landing?'landing':'held';canvas.dataset.heldX=held.spring.x.toFixed(1);canvas.dataset.heldY=held.spring.y.toFixed(1);canvas.dataset.heldPerson=String(p.id);canvas.dataset.sway=held.spring.angle.toFixed(3);
  }else{
   canvas.dataset.pickupState='idle';delete canvas.dataset.heldPerson;
   if(mouse){hover=find(mouse.x,mouse.y,document.elementFromPoint(mouse.x,mouse.y));document.body.classList.toggle('crowd-hover',!!hover);label(hover?'Pick up':'',mouse.x,mouse.y);}
   if(hover){const q=point(hover);ctx.strokeStyle='#242a2580';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(q.x,q.y+2,9,3,0,0,Math.PI*2);ctx.stroke();}
  }
 }
 function tick(stamp){
  frame=0;if(!held)return;const dt=last?Math.min((stamp-last)/1000,.05):1/60;last=stamp;
  if(!live()||document.hidden){cancel();return;}
  held.age+=dt;const s=held.spring;
  if(held.landing){
   const l=held.landing;l.time+=reduced()?.3:dt;const t=clamp(l.time/.26,0,1),ease=t*t*(3-2*t),r=canvas.getBoundingClientRect(),w=getWorld();
   s.x=l.x+(l.point.x-w.cameraX+r.left-l.x)*ease;s.y=l.y+(l.point.y+r.top-36*held.p.scale-l.y)*ease;s.angle=l.angle*(1-ease);
   if(t>=1){const spot=w.placement(held.p,l.point,36);if(spot&&w.place(held.p,spot))finish('Placed. They will find their own way.');else cancel('Returned to an open spot.');return;}
  }else{s.aim(held.px,held.py-14*held.p.scale);s.advance(dt,reduced()||held.keyboard);}
  paint();frame=requestAnimationFrame(tick);
 }
 function wake(){if(!frame){last=0;frame=requestAnimationFrame(tick);}}
 document.addEventListener('pointermove',e=>{
  if(held){held.px=e.clientX;held.py=e.clientY;held.keyboard=false;if(Math.hypot(e.clientX-held.startX,e.clientY-held.startY)>5)held.moved=true;return;}
  if(armed&&Math.hypot(e.clientX-armed.x,e.clientY-armed.y)>8)armed=null;
  if(e.pointerType==='touch')return;mouse={x:e.clientX,y:e.clientY};hover=find(e.clientX,e.clientY,e.target);document.body.classList.toggle('crowd-hover',!!hover);label(hover?'Pick up': '',e.clientX,e.clientY);paint();
 },{passive:true});
 document.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||(e.target===control||e.target===cancelButton))return;
  if(held){if(held.landing)return;held.placing=true;held.startX=e.clientX;held.startY=e.clientY;held.moved=false;held.px=e.clientX;held.py=e.clientY;swallow(e);e.preventDefault();return;}
  const p=find(e.clientX,e.clientY,e.target);if(!p)return;
  if(e.pointerType==='touch'){armed={p,x:e.clientX,y:e.clientY};return;}
  e.preventDefault();swallow(e);begin(p,e.clientX,e.clientY);try{document.documentElement.setPointerCapture(e.pointerId);}catch{}
 },true);
 document.addEventListener('pointerup',e=>{
  if(armed){const a=armed;armed=null;if(Math.hypot(e.clientX-a.x,e.clientY-a.y)<8){begin(a.p,e.clientX,e.clientY,false,true);swallow(e);}return;}
  if(!held||held.landing||(e.target===control||e.target===cancelButton))return;
  swallow(e);if(held.placing||held.moved)drop();
 },true);
 document.addEventListener('click',e=>{if(e.target!==control&&e.target!==cancelButton&&performance.now()<swallowUntil&&Math.hypot(e.clientX-swallowX,e.clientY-swallowY)<8){e.preventDefault();e.stopImmediatePropagation();swallowUntil=0;}},true);
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget){if(held&&e.pointerType==='mouse'){cancel();return;}if(held)return;mouse=hover=null;document.body.classList.remove('crowd-hover');hint.hidden=true;paint();}});
 document.addEventListener('pointercancel',()=>cancel());
 document.addEventListener('keydown',e=>{
  if(!held)return;
  if(e.target===cancelButton&&(e.key==='Enter'||e.key===' ')){e.preventDefault();cancel();return;}
  if(e.key==='Tab'){cancel();return;}
  if(e.key==='Escape'){e.preventDefault();cancel();return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();drop();return;}
  const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},m=moves[e.key];if(!m||held.landing)return;
  e.preventDefault();held.keyboard=true;held.px=clamp(held.px+m[0]*(e.shiftKey?32:16),20,innerWidth-20);held.py=clamp(held.py+m[1]*(e.shiftKey?32:16),90,innerHeight-85);wake();
 },true);
 control.addEventListener('click',e=>{
  if(held){drop();return;}const w=getWorld();if(!w)return;
  const candidates=w.visible().map(p=>({p,q:point(p)})).filter(({q})=>q.x>25&&q.x<innerWidth-25&&q.y>130&&q.y<innerHeight-85&&!blocked(document.elementFromPoint(q.x,q.y))&&!blocked(document.elementFromPoint(q.x,q.y-18))&&!coversText(q.x,q.y-18)).sort((a,b)=>Math.hypot(a.q.x-innerWidth*.65,a.q.y-innerHeight*.5)-Math.hypot(b.q.x-innerWidth*.65,b.q.y-innerHeight*.5));
  if(candidates.length){const {p,q}=candidates[0];begin(p,q.x,q.y-58*p.scale,e.detail===0,e.pointerType==='touch');}
 });
 cancelButton.addEventListener('click',()=>cancel());
 addEventListener('blur',()=>cancel());addEventListener('pagehide',()=>cancel());addEventListener('resize',()=>{cancel();size();paint();});
 document.addEventListener('motionpreference',()=>{cancel();paint();});
 document.addEventListener('herovisibility',()=>{if(!live())cancel();paint();});
 size();hint.hidden=true;
 return {paint,cancel};
};
