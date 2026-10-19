'use strict';
(()=>{
 const root=document.documentElement,body=document.body,intro=document.querySelector('#intro'),work=document.querySelector('#work'),header=document.querySelector('.header');
 if(!intro||!work||!header||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger,Flip,SplitText);
 const shell=document.createElement('div'),stage=document.createElement('div');shell.className='horizontal-story';stage.className='horizontal-stage';intro.before(shell);shell.append(stage);stage.append(intro,work);
 const orb=intro.querySelector('.semi-orb'),green=intro.querySelector('.hero-green'),yellow=intro.querySelector('.hero-yellow'),title=work.querySelector('h2'),name=intro.querySelector('h1'),wordmark=header.querySelector('.wordmark');
 const heading=title,headingLines=[...title.querySelectorAll('.project-heading-line')];
 root.dataset.projectLayout='overview';
 const cards=[...work.querySelectorAll('.work-card')],names=['George','Jarvis / Midnight','Creative Web','Six Million'];
 const media=matchMedia('(min-width: 901px) and (min-height: 651px) and (prefers-reduced-motion: no-preference)'),fine=matchMedia('(pointer: fine)');
 const position=document.createElement('div');position.className='story-position';position.setAttribute('aria-hidden','true');position.innerHTML='<span class="story-scroll"><span>↓</span>Scroll to explore</span>';stage.append(position);
 let context,split,timeline,trigger,flight,lenis,tick,enabled=false,keyboard=false,frame=0,mode='none';
 function navigation(){
  const y=scrollY+header.offsetHeight+innerHeight*.25;
  let active='';
  if(enabled&&trigger&&scrollY<=trigger.end)active=timeline.time()>.95?'#work':'';
  else if(document.querySelector('#cv').getBoundingClientRect().top+scrollY<=y)active='#cv';
  else if(document.querySelector('#about').getBoundingClientRect().top+scrollY<=y)active='#about';
  else if(!enabled&&work.getBoundingClientRect().top+scrollY<=y&&document.querySelector('#play').getBoundingClientRect().top+scrollY>y)active='#work';
  for(const a of header.querySelectorAll('a[href*="#"]')){if(a.hash===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
 }
 function surfaces(){
  const hr=header.getBoundingClientRect();
  if(green){const r=green.getBoundingClientRect();header.style.setProperty('--green-mask',`circle(${r.width/2}px at ${r.left+r.width/2-hr.left}px ${r.top+r.height/2-hr.top}px)`);}
  if(enabled&&trigger&&orb&&scrollY>=trigger.start&&intro.getBoundingClientRect().bottom>hr.bottom){const r=orb.getBoundingClientRect();header.style.setProperty('--takeover-mask',`circle(${r.width/2}px at ${r.left+r.width/2-hr.left}px ${r.top+r.height/2-hr.top}px)`);}
  else header.style.removeProperty('--takeover-mask');
 }
 function render(){
  surfaces();navigation();
  body.classList.toggle('name-docked',flight&&timeline?(enabled?timeline.time()>.65:timeline.progress()>.85):scrollY>Math.min(innerHeight*.35,240));
  const phase=enabled&&timeline?Math.min(1,Math.max(0,(timeline.time()-.05)/1.35)):timeline?timeline.progress():Math.min(1,scrollY/Math.max(1,intro.offsetHeight*.9));
  root.dataset.heroSceneProgress=phase.toFixed(5);
  // The crowd shares the orange circle's translation, then follows the gallery floor.
  // Reading the rendered transforms also makes reversing the scroll continuous.
  const cameraX=enabled&&timeline?Math.max(0,-Number(gsap.getProperty(orb,'x')))+Math.max(0,-Number(gsap.getProperty(work,'x'))):0;
  root.dataset.heroCameraX=cameraX.toFixed(3);
  document.dispatchEvent(new Event('heroscenechange'));
  const active=enabled?stage.getBoundingClientRect().bottom>header.offsetHeight&&cameraX<innerWidth*1.7:work.getBoundingClientRect().bottom>header.offsetHeight;
  body.classList.toggle('project-scene-view',enabled?timeline.time()>.65&&active:work.getBoundingClientRect().top<innerHeight*.4&&active);
  if(root.dataset.heroMotionActive!==String(active)){root.dataset.heroMotionActive=String(active);document.dispatchEvent(new Event('herovisibility'));}
  if(!enabled||!timeline)return;
  const t=timeline.time();position.style.opacity=t>=1.15?'1':'0';

 }
 function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;render();});}
 function startSmoothing(){
  if(!window.Lenis||!fine.matches)return;
  lenis=new Lenis({autoRaf:false,lerp:.085,smoothWheel:true,syncTouch:false,wheelMultiplier:.8,anchors:false,stopInertiaOnNavigate:true});
  lenis.on('scroll',ScrollTrigger.update);tick=time=>lenis?.raf(time*1000);gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);root.dataset.scrollEngine='lenis';
 }
 function stopSmoothing(){if(tick)gsap.ticker.remove(tick);tick=null;lenis?.destroy();lenis=null;root.dataset.scrollEngine='native';}
 function jump(y){if(lenis)lenis.scrollTo(y,{immediate:true,force:true});else scrollTo({top:y,behavior:'instant'});ScrollTrigger.update();render();}
 function teardown(){
  stopSmoothing();context?.revert();context=null;split?.revert();split=null;flight?.remove();flight=null;timeline=null;trigger=null;enabled=false;mode='none';
  root.classList.remove('horizontal-active');body.classList.remove('name-flight-active','project-scene-view');header.style.removeProperty('--takeover-mask');header.style.removeProperty('--green-mask');position.style.opacity='0';
  cards.forEach(c=>c.querySelector('.work-card-art').style.removeProperty('--horizontal-drift'));
 }
 function verticalFlight(){
  flight=document.createElement('div');flight.className='name-flight';flight.setAttribute('aria-hidden','true');flight.innerHTML='<span>Josh</span><span>Joseph.</span>';body.append(flight);body.classList.add('name-flight-active');
  let baseX=0,baseY=0;
  const metrics=()=>{const ns=getComputedStyle(name);baseX=name.offsetLeft;baseY=intro.getBoundingClientRect().top+scrollY+name.offsetTop;Object.assign(flight.style,{left:baseX+'px',top:baseY+'px',fontSize:ns.fontSize,lineHeight:ns.lineHeight,width:name.offsetWidth+'px'});flight.children[1].style.marginLeft=getComputedStyle(name.children[1]).marginLeft;};
  metrics();
  context=gsap.context(()=>{
   timeline=gsap.timeline({onUpdate:render,scrollTrigger:{trigger:intro,start:()=>`top top+=${header.offsetHeight}`,end:()=>`+=${Math.min(innerHeight*.65,550)}`,scrub:true,invalidateOnRefresh:true,onRefreshInit:metrics,onRefresh:schedule}});
   timeline.fromTo(flight,{x:0,y:0,rotation:0,scale:1},{x:()=>wordmark.getBoundingClientRect().left-baseX,y:()=>wordmark.getBoundingClientRect().top+3-baseY,scale:()=>parseFloat(getComputedStyle(wordmark).fontSize)/parseFloat(getComputedStyle(name).fontSize),rotation:0,duration:1,ease:'power1.inOut'});trigger=timeline.scrollTrigger;
  },shell);
  ScrollTrigger.refresh();
 }
 const allowed=()=>media.matches&&root.dataset.reducedMotion!=='true'&&!keyboard;
 function setup(){
  const next=allowed(),desired=next?'horizontal':root.dataset.reducedMotion!=='true'&&!keyboard&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'vertical':'static';if(mode===desired){schedule();return;}
  const focused=document.activeElement,within=enabled&&trigger&&scrollY>trigger.start+200&&scrollY<trigger.end;
  teardown();if(!next){if(within)(focused?.closest('.work-card')||work).scrollIntoView({block:'start',behavior:'instant'});if(desired==='vertical'){verticalFlight();startSmoothing();}mode=desired;schedule();return;}
  enabled=true;mode='horizontal';root.classList.add('horizontal-active');
  // Keep the heading intact: one scene movement, with no competing per-letter scrubbing.
  flight=document.createElement('div');flight.className='name-flight';flight.setAttribute('aria-hidden','true');flight.innerHTML='<span>Josh</span><span>Joseph.</span>';body.append(flight);body.classList.add('name-flight-active');
  const metrics=()=>{const ns=getComputedStyle(name);const lineTwo=name.children[1];const offset=getComputedStyle(lineTwo).marginLeft;Object.assign(flight.style,{left:name.offsetLeft+'px',top:header.offsetHeight+name.offsetTop+'px',fontSize:ns.fontSize,lineHeight:ns.lineHeight,width:name.offsetWidth+'px'});flight.children[1].style.marginLeft=offset;};
  metrics();
  context=gsap.context(()=>{
   timeline=gsap.timeline({defaults:{ease:'none'},onUpdate:render,scrollTrigger:{trigger:shell,start:()=>`top top+=${header.offsetHeight}`,end:()=>`+=${innerWidth*.9}`,pin:stage,scrub:true,invalidateOnRefresh:true,anticipatePin:1,onRefreshInit:metrics,onRefresh:schedule,onLeave:schedule,onEnterBack:schedule}});
   timeline.fromTo(flight,{x:0,y:0,rotation:0,scale:1},{x:()=>wordmark.getBoundingClientRect().left-name.offsetLeft,y:()=>wordmark.getBoundingClientRect().top+3-header.offsetHeight-name.offsetTop,scale:()=>parseFloat(getComputedStyle(wordmark).fontSize)/parseFloat(getComputedStyle(name).fontSize),rotation:0,duration:.75,ease:'power2.inOut'},0)
    .to(green,{x:()=>-innerWidth*.45,duration:1.05},0)
    .to(yellow,{x:()=>-innerWidth*.6,y:()=>innerHeight*.15,duration:1.05},0)
    .to(orb,{x:()=>-innerWidth*.43,scale:()=>Math.hypot(innerWidth*.66,Math.max(innerWidth*.27,innerHeight-innerWidth*.27))*1.1/(innerWidth*.5),duration:1.05},.15)
    .to(intro.querySelector('.hero-life-toggle'),{opacity:0,duration:.3},.85)
    .fromTo(work,{x:()=>innerWidth},{x:0,duration:.75},.42)
    .from(headingLines,{yPercent:110,stagger:.07,duration:.5,ease:'power2.out'},.57)
    .from(cards,{'--depth-y':'80px',stagger:.06,duration:.45,ease:'power2.out'},.68)
    // Release the pin after the reveal so the next scroll goes down the page.
    .to({},{duration:.15},1.17);
   trigger=timeline.scrollTrigger;
  },shell);
  startSmoothing();ScrollTrigger.refresh();render();
 }
 function go(hash){
  if(!enabled||!trigger)return false;
  const card=cards.find(c=>'#'+c.id===hash);let y;
  if(hash==='#work'||card){const time=1.32;y=trigger.start+time/timeline.duration()*(trigger.end-trigger.start);}
  else {let target;try{target=document.querySelector(hash);}catch{return false;}if(!target)return false;y=target.getBoundingClientRect().top+scrollY-header.offsetHeight-24;}
  jump(y);return true;
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const u=new URL(a.href,location.href);if(u.pathname===location.pathname&&u.hash&&go(u.hash)){e.preventDefault();e.stopImmediatePropagation();history.pushState(null,'',u.hash);}
 },true);
 addEventListener('hashchange',()=>go(location.hash));addEventListener('popstate',()=>go(location.hash));
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
 new ResizeObserver(()=>{root.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');}).observe(header);
 root.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
 document.addEventListener('keydown',e=>{if(e.key==='Tab'){keyboard=true;setup();}},true);
 document.addEventListener('motionpreference',setup);media.addEventListener('change',setup);
 document.fonts.ready.then(()=>{setup();if(location.hash)go(location.hash);schedule();});
 addEventListener('pageshow',()=>{lenis?.start();lenis?.resize();schedule();});
 // The opening transition keeps normal links and modified clicks intact.
 let opening=null,tween=null,navigationTimer=null;
 function clearOpening(){clearTimeout(navigationTimer);tween?.kill();opening?.remove();opening=null;root.classList.remove('project-is-opening');}
 work.addEventListener('click',e=>{
  const link=e.target.closest('.work-card>a');if(!link||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||keyboard||root.dataset.reducedMotion==='true'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  e.preventDefault();if(opening)return;
  const art=link.querySelector('.work-card-art'),state=Flip.getState(art);opening=document.createElement('div');opening.className='project-opening projects-v17';opening.setAttribute('aria-hidden','true');const clone=art.cloneNode(true);opening.append(clone);body.append(opening);root.classList.add('project-is-opening');
  Object.assign(clone.style,{left:'0px',top:'0px',width:'100vw',height:'100vh',borderRadius:'0px'});
  const navigate=()=>location.assign(link.href);tween=Flip.from(state,{targets:clone,duration:.6,ease:'power3.inOut',absolute:true,scale:true,onComplete:navigate});navigationTimer=setTimeout(navigate,1000);
 });
 for(const card of cards){
  const link=card.querySelector('a'),art=card.querySelector('.work-card-art');
  const reset=()=>gsap.to(art,{'--magnet-x':'0px','--magnet-y':'0px','--rotate-x':'0deg','--rotate-y':'0deg',duration:.4,ease:'power3.out',overwrite:'auto'});
  link.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!fine.matches||root.dataset.reducedMotion==='true'||keyboard)return;const r=link.getBoundingClientRect(),x=gsap.utils.clamp(-.5,.5,(e.clientX-r.left)/r.width-.5),y=gsap.utils.clamp(-.5,.5,(e.clientY-r.top)/r.height-.5);gsap.to(art,{'--magnet-x':x*12+'px','--magnet-y':y*10+'px','--rotate-x':-y*5+'deg','--rotate-y':x*7+'deg',duration:.3,ease:'power3.out',overwrite:'auto'});},{passive:true});
  link.addEventListener('pointerleave',reset);link.addEventListener('blur',reset);
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')clearOpening();});addEventListener('pageshow',clearOpening);addEventListener('pagehide',()=>{clearTimeout(navigationTimer);lenis?.stop();});
})();
