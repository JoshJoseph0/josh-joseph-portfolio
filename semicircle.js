'use strict';
(()=>{
 const intro=document.querySelector('.semi-intro'),scene=document.querySelector('.semi-scene'),orb=document.querySelector('.semi-orb'),copy=document.querySelector('.semi-copy'),note=document.querySelector('.semi-scroll-note');if(!intro||!orb)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let w=0,h=0,r=0,start=0,range=1,frame=0,progress=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const smooth=n=>n*n*(3-2*n);
 function paint(){
  frame=0;progress=(document.documentElement.dataset.reducedMotion==='true'||reduced.matches||matchMedia('(max-height: 600px)').matches)?0:clamp((scrollY-start)/range);
  const p=smooth(progress),angle=90*smooth(clamp(progress/.8));
  const radius=r+(Math.hypot(w/2,h)*1.08-r)*p;
  const x=w-w*.5*p,y=h*.47+(h+2-h*.47)*p;
  orb.style.transform=`translate3d(${x-r}px,${y-r}px,0) rotate(${angle}deg) scale(${radius/r})`;
  const fade=1-smooth(clamp((progress-.1)/.55));
  copy.style.opacity=String(fade);copy.style.transform=`translateY(${-18*(1-fade)}px)`;
  if(note)note.style.opacity=String(fade);
  intro.dataset.reveal=progress===0?'hero':progress===1?'projects':'turning';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 function measure(){
  const header=document.querySelector('.header').getBoundingClientRect().height;
  w=document.documentElement.clientWidth;h=Math.max(300,innerHeight-header);r=Math.min(w*.5,h*.75);
  intro.style.setProperty('--semi-screen',`${h}px`);intro.style.setProperty('--semi-diameter',`${r*2}px`);
  start=intro.getBoundingClientRect().top+scrollY-header;
  range=Math.max(1,intro.offsetHeight-h);schedule();
 }
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure);addEventListener('pageshow',measure);
 reduced.addEventListener('change',measure);document.addEventListener('motionpreference',measure);document.fonts.ready.then(measure);
 scene.addEventListener('focusin',event=>{if(progress>.4&&event.target.closest('a'))scrollTo({top:start,behavior:'instant'});});
 new ResizeObserver(measure).observe(document.querySelector('.header'));measure();
})();

