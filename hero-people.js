'use strict';
(()=>{
 const scene=document.querySelector('.semi-scene'),canvas=scene?.querySelector('.hero-people'),button=scene?.querySelector('.hero-life-toggle');
 if(!canvas||!button||!window.PortfolioCrowd)return;
 const ctx=canvas.getContext('2d');if(!ctx){button.hidden=true;return;}
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)'),{CrowdWorld}=PortfolioCrowd;
 let world=null,width=0,height=0,ratio=1,frame=0,last=0,visible=true,paused=false,fontsReady=false,measureAt=0,reportAt=0,pointer=null,shadow;
 const motionOff=()=>paused||reduced.matches||root.dataset.reducedMotion==='true'||root.dataset.input==='keyboard';
 const inScene=()=>root.dataset.heroMotionActive!=='false';
 const progress=()=>Math.max(0,Math.min(1,Number(root.dataset.heroSceneProgress||0)));
 function placeCanvas(){const parent=document.querySelector('.horizontal-stage')||scene;if(canvas.parentElement!==parent)parent.append(canvas);}
 function camera(){
  if(!world)return;
  // Scrolling moves the camera through a persistent world. Nobody is faded or reset.
  world.cameraX=reduced.matches||root.dataset.reducedMotion==='true'?0:Math.max(0,Number(root.dataset.heroCameraX||0));
  if(pointer)world.pointer={x:pointer.x+world.cameraX,y:pointer.y};else world.pointer=null;
 }
 function rectangles(){
  const result=[],sr=scene.getBoundingClientRect(),selector=document.querySelector('.name-flight')?'.name-flight>span':'#intro h1>span';
  for(const el of document.querySelectorAll(selector)){
   const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();
   if(r.bottom<=sr.top||r.top>=sr.bottom)continue;
   result.push({x:r.left-sr.left+(world?.cameraX||0)-9,y:r.top-sr.top-5,w:r.width+18,h:r.height+38});
  }
  const r=button.getBoundingClientRect();if(r.width&&r.top<sr.bottom)result.push({x:r.left-sr.left+(world?.cameraX||0)-8,y:r.top-sr.top-4,w:r.width+16,h:r.height+36});
  return result;
 }
 function resize(){
  if(!fontsReady)return;placeCanvas();
  const heading=document.querySelector('.work-carousel-heading'),intro=document.querySelector('#intro');
  const continuation=!root.classList.contains('horizontal-active')&&heading?Math.max(0,document.querySelector('#work').getBoundingClientRect().bottom-intro.getBoundingClientRect().top):0;
  const w=Math.max(1,scene.clientWidth),h=Math.max(1,scene.clientHeight,continuation),changed=!world||w!==width||h!==height;
  canvas.style.height=h+'px';canvas.style.width=w+'px';
  document.querySelector('.horizontal-stage')?.style.setProperty('--intro-ground-height',intro.offsetHeight+'px');
  width=w;height=h;ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  shadow=ctx.createRadialGradient(-3,1,0,-3,1,15);shadow.addColorStop(0,'#40372b22');shadow.addColorStop(1,'#40372b00');
  if(changed){pickup?.cancel();world=new CrowdWorld(width,height,{obstacles:rectangles()});}
  camera();world.setObstacles(rectangles());draw();sync();
 }
 function line(points,color,size){ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
 function foot(cycle,strength){
  const t=((cycle%1)+1)%1;
  if(t<.62)return {offset:(5-10*t/.62)*strength,lift:0};
  const u=(t-.62)/.38,s=u*u*(3-2*u);return {offset:(-5+10*s)*strength,lift:Math.sin(Math.PI*u)*2.5*strength};
 }
 function person(p,q){
  const sit=p.sitBlend||0,easeSit=sit*sit*(3-2*sit),strength=reduced.matches||root.dataset.reducedMotion==='true'?0:p.gait,dx=Math.cos(q.angle),dy=Math.sin(q.angle),breath=motionOff()?0:Math.sin(world.clock*1.7+p.id)*.18*easeSit,bob=(1-Math.cos(q.cycle*Math.PI*4))*.23*strength-15*easeSit+breath;
  const a=foot(q.cycle,strength),b=foot(q.cycle+.5,strength),shoulder=2.5+Math.abs(dy)*.9;
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(p.scale,p.scale);
  ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(-3,1,15,3.5,0,0,Math.PI*2);ctx.fill();
  const feet=[{hip:-1.7,x:-1.7+a.offset*dx,y:a.offset*dy-a.lift,step:a},{hip:1.7,x:1.7+b.offset*dx,y:b.offset*dy-b.lift,step:b}].sort((a,b)=>a.y-b.y);
  for(const f of feet){const side=f.hip<0?-1:1,blend=(a,b)=>a+(b-a)*easeSit,fx=blend(f.x,-side*3.5),fy=blend(f.y,1),kx=blend((f.hip+f.x)*.5+dx*.7,side*8),ky=blend((-16+f.y)*.5-f.step.lift*.2,-2.5);line([[f.hip,-16-bob],[kx,ky],[fx,fy]],p.pants,2.6);line([[fx,fy],[fx+blend(dx*2.1,side*2),fy+dy*.8*(1-easeSit)]],'#202721',1.8);}
  const farSwing=-a.offset*.37,phone=p.phoneBlend;
  const mix=(a,b,c)=>{const v=a+(b-a)*phone;return c===undefined?v:v+(c-v)*easeSit;};
  const phoneY=-24-bob,phoneX=3.7;
  const thumb=Math.sin(world.clock*9+p.id)*.35*phone;
  line([[-shoulder,-27-bob],[mix(-shoulder-1+farSwing*dx,-4,-5),-22-bob],[mix(-shoulder-.2+farSwing*dx,phoneX-1,-7),mix(-17+farSwing*dy,phoneY+1,-2)]],p.shirt,2.2);
  line([[mix(-shoulder-.2+farSwing*dx,phoneX-1,-7),mix(-17+farSwing*dy,phoneY+1,-2)],[mix(-shoulder+farSwing*dx,phoneX-.3,-8),mix(-15.7+farSwing*dy,phoneY+.7,-1)]],p.skin,1.5);
  const lean=dx*p.actualSpeed*.008+easeSit*(.8+(motionOff()?0:Math.sin(world.clock*.65+p.id)*.35));
  ctx.fillStyle=p.shirt;ctx.beginPath();ctx.moveTo(-shoulder+lean,-28-bob);ctx.quadraticCurveTo(lean,-30-bob,shoulder+lean,-28-bob);ctx.lineTo(3,-17-bob);ctx.quadraticCurveTo(0,-15.5-bob,-3,-17-bob);ctx.closePath();ctx.fill();
  line([[2+lean,-26-bob],[2.7,-19-bob]],'#18251b16',.8);
  const wave=phone<.1&&easeSit<.1&&!reduced.matches&&root.dataset.reducedMotion!=='true'&&p.waveUntil>world.clock,nearSwing=-b.offset*.37;
  if(wave){const t=world.clock*10+p.id;line([[shoulder,-27-bob],[shoulder+4,-30-bob],[shoulder+5+Math.sin(t)*1.2,-35-bob]],p.shirt,2.2);line([[shoulder+5+Math.sin(t)*1.2,-35-bob],[shoulder+5.4+Math.sin(t)*1.2,-36.3-bob]],p.skin,1.7);}
  else{line([[shoulder,-27-bob],[mix(shoulder+1+nearSwing*dx,6,5),-22-bob],[mix(shoulder+.2+nearSwing*dx,phoneX+1,7),mix(-17+nearSwing*dy,phoneY+1,-2)]],p.shirt,2.3);line([[mix(shoulder+.2+nearSwing*dx,phoneX+1,7),mix(-17+nearSwing*dy,phoneY+1,-2)],[mix(shoulder+nearSwing*dx,phoneX+.5,8),mix(-15.6+nearSwing*dy,phoneY+thumb,-1)]],p.skin,1.6);}
  if(phone>.02){ctx.save();ctx.globalAlpha=phone;ctx.translate(phoneX,phoneY-.8);ctx.rotate(.15);ctx.fillStyle='#242b2b';ctx.fillRect(-1.8,-2.6,3.6,5.2);ctx.fillStyle='#c1d8cf';ctx.fillRect(-1.2,-2,2.4,3.5);ctx.restore();line([[phoneX+1,phoneY+1],[phoneX+.4,phoneY+thumb]],p.skin,1.1*phone);}
  line([[lean,-31-bob],[lean,-28.5-bob]],p.skin,1.9);
  ctx.fillStyle=p.skin;ctx.beginPath();ctx.ellipse(lean+dx*.45+phone*.9,-33-bob+phone*.8,2.1,2.7,dx*.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#252a24';ctx.beginPath();ctx.ellipse(lean-dx*.25+phone*.7,-34.3-bob+phone*.5,2.2,dy<0?2.45:1.85,0,0,Math.PI*2);ctx.fill();
  if(p.hair===3){ctx.beginPath();ctx.ellipse(lean-dx*2,-33-bob,1.1,1.7,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 function draw(){
  if(!world)return;camera();ctx.clearRect(0,0,width,height);const visiblePeople=world.visible();visiblePeople.map(p=>({p,q:world.sample(p)})).sort((a,b)=>a.q.y-b.q.y).forEach(({p,q})=>person(p,q));
  canvas.dataset.sittingPeople=String(visiblePeople.filter(p=>p.sitBlend>.5).length);canvas.dataset.textingPeople=String(visiblePeople.filter(p=>p.phoneBlend>.5).length);canvas.dataset.visiblePeople=String(visiblePeople.length);canvas.dataset.cameraX=world.cameraX.toFixed(1);canvas.dataset.walkerCount=String(world.people.length);pickup?.paint();
 }
 function report(){
  canvas.dataset.hitTargets=JSON.stringify(world.visible().map(p=>{const q=world.sample(p);return {id:p.id,x:+q.x.toFixed(1),y:+q.y.toFixed(1)};}));
  canvas.dataset.walkSeconds=world.clock.toFixed(1);canvas.dataset.uniqueSeen=String(world.seen.size);canvas.dataset.exits=String(world.exits.size);
  canvas.dataset.sample=JSON.stringify(world.visible().slice(0,4).map(p=>({id:p.id,x:+p.x.toFixed(2),y:+p.y.toFixed(2),cycle:+p.cycle.toFixed(3)})));
 }
 function tick(stamp){
  frame=0;if(!world||motionOff()||!visible||document.hidden||!inScene()){last=0;draw();return;}
  camera();const dt=last?Math.min((stamp-last)/1000,.1):0;last=stamp;
  if(stamp-measureAt>130){world.setObstacles(rectangles());measureAt=stamp;}
  world.advance(dt);draw();if(stamp-reportAt>350){report();reportAt=stamp;}frame=requestAnimationFrame(tick);
 }
 function sync(){
  placeCanvas();cancelAnimationFrame(frame);frame=0;last=0;const off=motionOff();button.disabled=reduced.matches||root.dataset.reducedMotion==='true';button.textContent=button.disabled?'Reduced motion':paused?'Let people walk':'Pause people';button.setAttribute('aria-pressed',String(off));
  canvas.dataset.motionState=off?'paused':visible&&!document.hidden&&inScene()?'walking':'idle';
  draw();if(world&&!off&&visible&&!document.hidden&&inScene())frame=requestAnimationFrame(tick);
 }
 const pickup=window.installPortfolioPickup?.({getWorld:()=>world,canvas,scene,draw,reduced:()=>reduced.matches||root.dataset.reducedMotion==='true'});
 button.addEventListener('click',()=>{paused=!paused;sync();});
 scene.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=scene.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};},{passive:true});scene.addEventListener('pointerleave',()=>{pointer=null;});
 document.addEventListener('heroscenechange',draw);document.addEventListener('herovisibility',sync);
 document.addEventListener('motionpreference',sync);document.addEventListener('visibilitychange',sync);document.addEventListener('keydown',sync);document.addEventListener('pointerdown',sync);reduced.addEventListener('change',sync);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.01}).observe(canvas);
 new ResizeObserver(resize).observe(scene);document.fonts.ready.then(()=>{fontsReady=true;resize();});addEventListener('pagehide',()=>cancelAnimationFrame(frame));addEventListener('pageshow',sync);
})();
