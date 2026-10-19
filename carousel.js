'use strict';
(()=>{
 const section=document.querySelector('.work-carousel');if(!section)return;
 const cards=[...section.querySelectorAll('.work-card')],dots=[...section.querySelectorAll('.work-dot')],deck=section.querySelector('.work-deck');
 let current=0;
 function show(index){
  current=(index+cards.length)%cards.length;
  cards.forEach((card,i)=>{
   const offset=(i-current+cards.length)%cards.length;
   card.dataset.position=offset===0?'active':offset===1?'next':offset===cards.length-1?'previous':'hidden';
   card.inert=offset!==0;card.setAttribute('aria-hidden',String(offset!==0));
  });
  dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===current)));
  section.querySelector('.work-position').textContent=`${String(current+1).padStart(2,'0')} / 04 · ${cards[current].querySelector('h3').textContent}`;
 }
 section.querySelector('.work-prev').addEventListener('click',()=>show(current-1));
 section.querySelector('.work-next').addEventListener('click',()=>show(current+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
 deck.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
 let start=null,suppressClick=false;
 deck.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')start={x:event.clientX,y:event.clientY};});
 deck.addEventListener('pointerup',event=>{if(!start)return;const x=event.clientX-start.x,y=event.clientY-start.y;start=null;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.3){suppressClick=true;show(current+(x<0?1:-1));setTimeout(()=>{suppressClick=false;},0);}});
 deck.addEventListener('pointercancel',()=>{start=null;});
 deck.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
 show(0);section.querySelectorAll('button').forEach(button=>{button.disabled=false;});section.dataset.ready='true';
})();
