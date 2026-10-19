'use strict';
// Shared input preferences. The same setup is included in standalone demos.
function installMotionPreferences(){
 const page=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=false;try{paused=localStorage.getItem('portfolio-motion-paused')==='true';}catch{}
 const stop=()=>document.getAnimations().forEach(animation=>animation.cancel());
 const sync=()=>{page.dataset.reducedMotion=String(reduced.matches||paused);if(reduced.matches||paused)stop();document.dispatchEvent(new Event('motionpreference'));};
 document.addEventListener('keydown',event=>{
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  page.dataset.input='keyboard';stop();
 },true);
 document.addEventListener('pointerdown',()=>{page.dataset.input='pointer';},true);
 document.addEventListener('portfolio-motion-change',event=>{paused=event.detail.paused;sync();});
 reduced.addEventListener('change',sync);
 sync();
}
installMotionPreferences();
