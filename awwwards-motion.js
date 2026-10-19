'use strict';
(()=>{
 const page=document.documentElement;
 const device=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const allowed=()=>page.dataset.reducedMotion!=='true'&&!device.matches&&page.dataset.input!=='keyboard'&&!document.hidden;
 const animations=new Set();
 const animate=(element,frames,duration=620,delay=0)=>{
  if(!element||!allowed()||!element.animate)return;
  const animation=element.animate(frames,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  animations.add(animation);animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
 };
 const buttons=[];
 function makeSetting(parent){
  if(!parent)return;const button=document.createElement('button');button.type='button';button.className='motion-setting';
  button.addEventListener('click',()=>{
   const paused=page.dataset.reducedMotion!=='true';
   try{localStorage.setItem('portfolio-motion-paused',String(paused));}catch{}
   document.dispatchEvent(new CustomEvent('portfolio-motion-change',{detail:{paused}}));
  });parent.append(button);buttons.push(button);
 }
 // Motion preference lives in the footer to keep the introduction focused.
 const footer=document.querySelector('footer');
 if(footer){const settings=document.createElement('div');settings.className='motion-settings';footer.append(settings);makeSetting(settings);}
 function settings(){for(const button of buttons){const off=page.dataset.reducedMotion==='true';button.textContent=device.matches?'Reduced motion enabled':off?'Enable motion':'Pause motion';button.setAttribute('aria-pressed',String(off));button.setAttribute('aria-label',device.matches?'Reduced motion enabled by your device':off?'Enable portfolio motion':'Pause portfolio motion');button.disabled=device.matches;}}
 settings();
 // All final content exists in ordinary HTML; cancelled or unsupported effects reveal it immediately.
 const name=document.querySelector('.semi-intro h1');
 if(name&&!document.body.classList.contains('minimal-hero')){
  for(const line of name.children){const inner=document.createElement('span');inner.className='name-motion-line';while(line.firstChild)inner.append(line.firstChild);line.append(inner);}
  if(!location.hash&&scrollY<20){[...name.querySelectorAll('.name-motion-line')].forEach((line,i)=>animate(line,[{transform:'translateY(105%) rotate(2deg)'},{transform:'translateY(0) rotate(0)'}],650,i*80));}
 }
 const seen=new WeakSet();
 const targets=[...document.querySelectorAll('.work-card-art,.work-carousel-heading h2,.play-invitation h2,.about-v6 .section-lead h2,.case-figure,.case-section,.contact-title')];
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting||seen.has(entry.target))continue;seen.add(entry.target);observer.unobserve(entry.target);
   if(!allowed()||entry.target.closest('#work')&&document.querySelector('.horizontal-story'))continue;
   const el=entry.target;
   if(el.matches('.work-card-art,.case-figure'))animate(el,[{clipPath:'inset(8% 0 14% 0 round 16px)',opacity:.6},{clipPath:'inset(0% 0 0% 0 round 16px)',opacity:1}]);
   else animate(el,[{transform:'translateY(22px)',opacity:.45},{transform:'translateY(0)',opacity:1}],500);
  }
 },{threshold:.12});
 targets.forEach(el=>observer.observe(el));
 const art=[...document.querySelectorAll('.work-card-art')];let frame=0;
 function paint(){frame=0;const on=allowed()&&fine.matches;for(const el of art){let drift=0;if(on){const rect=el.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight)drift=Math.max(-12,Math.min(12,((innerHeight/2-rect.top-rect.height/2)/innerHeight)*24));}el.style.setProperty('--art-drift',drift.toFixed(2)+'px');}}
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);fine.addEventListener('change',schedule);
 // Move only the arrow artwork, never the link hit area.
 const links=[...document.querySelectorAll('.work-card>a,.journey-link')];
 function resetArrows(){links.forEach(link=>{link.style.removeProperty('--arrow-x');link.style.removeProperty('--arrow-y');});}
 for(const link of links){link.addEventListener('pointermove',event=>{if(!allowed()||!fine.matches||event.pointerType!=='mouse')return;const r=link.getBoundingClientRect();link.style.setProperty('--arrow-x',`${((event.clientX-r.left)/r.width-.5)*10}px`);link.style.setProperty('--arrow-y',`${((event.clientY-r.top)/r.height-.5)*10}px`);},{passive:true});link.addEventListener('pointerleave',()=>{link.style.removeProperty('--arrow-x');link.style.removeProperty('--arrow-y');});}
 function stop(){animations.forEach(a=>a.cancel());animations.clear();resetArrows();schedule();}
 document.addEventListener('motionpreference',()=>{settings();if(!allowed())stop();else schedule();});
 document.addEventListener('keydown',stop);document.addEventListener('pointerdown',schedule,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
 addEventListener('pagehide',stop);addEventListener('pageshow',schedule);
 // Skip native page transitions for keyboard and paused-motion navigation too.
 addEventListener('pageswap',event=>{if(!allowed())event.viewTransition?.skipTransition();});
 addEventListener('pagereveal',event=>{if(!allowed())event.viewTransition?.skipTransition();});
 schedule();
})();
