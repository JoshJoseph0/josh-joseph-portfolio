'use strict';
(()=>{
 const root=document.documentElement,cards=[...document.querySelectorAll('#work .work-card')].filter(card=>card.querySelector('a')&&card.querySelector('.peek-toggle')&&card.querySelector('.project-peek-note'));
 if(!cards.length)return;
 const fine=matchMedia('(hover:hover) and (pointer:fine)'),states=new Map();
 function paint(card){const state=states.get(card);const visible=state.hover||state.focus||state.open;card.classList.toggle('is-peeking',visible);card.querySelector('.project-peek-note').setAttribute('aria-hidden',String(!visible));state.button.setAttribute('aria-expanded',String(state.open));state.button.textContent=state.open?'Close peek':'Peek inside';}
 function reset(){for(const card of cards){const state=states.get(card);state.hover=false;state.focus=false;state.open=false;paint(card);}}
 for(const card of cards){
  const link=card.querySelector('a'),button=card.querySelector('.peek-toggle');if(!link||!button)continue;
  const state={hover:false,focus:false,open:false,button};states.set(card,state);
  link.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&fine.matches){state.hover=true;paint(card);}});
  link.addEventListener('pointerleave',()=>{state.hover=false;paint(card);});
  link.addEventListener('focus',()=>{state.focus=link.matches(':focus-visible');paint(card);});
  link.addEventListener('blur',()=>{state.focus=false;paint(card);});
  button.addEventListener('click',()=>{const next=!state.open;for(const other of cards){states.get(other).open=false;paint(other);}state.open=next;paint(card);});
 }
 root.classList.add('project-peek-ready');
 document.addEventListener('keydown',event=>{if(event.key==='Escape')reset();});
 addEventListener('blur',reset);addEventListener('pagehide',reset);addEventListener('pageshow',reset);
 fine.addEventListener('change',reset);
})();
