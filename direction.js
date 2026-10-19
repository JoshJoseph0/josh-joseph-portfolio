'use strict';
// One ordered gesture for the name. The rest of the opening stays still.
const signature=document.querySelector('.hero-v6 h1');
if(signature){
 const allowed=()=>!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.input!=='keyboard';
 let playing=false;
 const introduce=()=>{
  if(!allowed()||playing)return;playing=true;
  const words=[...signature.children];
  const animations=words.map((word,index)=>word.animate([
   {transform:'translateY(48px) skewY(-4deg)'},
   {transform:'translateY(-5px) skewY(.4deg)',offset:.72},
   {transform:'translateY(0) skewY(0)'}
  ],{duration:760,delay:index*100,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
  Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{playing=false;});
 };
 document.fonts.ready.then(introduce);
 signature.addEventListener('pointerenter',introduce);
}
