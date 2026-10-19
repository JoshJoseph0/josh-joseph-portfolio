'use strict';
(()=>{
 const header=document.querySelector('.header');if(!header)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const thread=document.createElement('span');thread.className='reading-thread';thread.setAttribute('aria-hidden','true');header.append(thread);
 const chapters=[...document.querySelectorAll('[data-chapter]')];
 const home=!!document.querySelector('.hero-v8');
 let positions=[],limit=1,headerHeight=0,frame=0,active=null;
 function paint(){
  frame=0;
  const y=window.scrollY,progress=Math.min(1,Math.max(0,y/limit));
  thread.style.transform=`scaleX(${progress})`;
  let next=chapters[0];
  for(const item of positions)if(item.top<=y+headerHeight+Math.min(innerHeight*.25,180))next=item.element;
  if(next!==active){
   active?.removeAttribute('data-current-chapter');active=next;active?.setAttribute('data-current-chapter','');
   if(home&&!document.documentElement.classList.contains('horizontal-active'))header.querySelectorAll('a[href*="#"]').forEach(link=>{
    const match=link.hash==='#'+active?.id;
    if(match)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
   });
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 function measure(){
  headerHeight=header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height',`${Math.ceil(headerHeight)}px`);
  positions=chapters.map(element=>({element,top:element.getBoundingClientRect().top+scrollY}));
  limit=Math.max(1,document.documentElement.scrollHeight-innerHeight);schedule();
 }
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure);addEventListener('load',measure);
 document.fonts.ready.then(measure);
 document.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',measure,{once:true});});
 new ResizeObserver(measure).observe(header);
 // Only the short connecting passages enter. Project evidence and headings
 // stay fully visible; no hidden content depends on this enhancement.
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;observer.unobserve(entry.target);
   if(document.documentElement.dataset.reducedMotion==='true'||reduced.matches||document.documentElement.dataset.input==='keyboard')continue;
   entry.target.animate([{opacity:.45,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
 },{threshold:.2});
 document.querySelectorAll('.journey-bridge,.play-onward,.about-onward').forEach(element=>observer.observe(element));
 measure();
})();
