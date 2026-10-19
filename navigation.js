'use strict';
(()=>{
 const home=location.pathname.endsWith('/index.html')||location.pathname.endsWith('/');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.input==='keyboard';
 let pending=null,leaving=false;
 async function changePage(destination){
  pending=destination.href;if(leaving)return;leaving=true;
  if(!reduced()){
   try{await document.body.animate([{opacity:1},{opacity:.35}],{duration:120,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished;}catch{}
  }
  location.assign(pending);
 }
 function travel(target){
  target.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
  // Move the reading/keyboard destination without interrupting the scroll.
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download')||link.classList.contains('skip'))return;
  const destination=new URL(link.href,location.href);
  if(destination.origin!==location.origin)return;
  if(!destination.hash){if(destination.pathname!==location.pathname&&destination.pathname.endsWith('.html')){event.preventDefault();changePage(destination);}return;}
  let id;try{id=decodeURIComponent(destination.hash.slice(1));}catch{return;}
  if(destination.pathname===location.pathname){
   const target=document.getElementById(id);if(!target)return;
   event.preventDefault();
   if(location.hash!==destination.hash)history.pushState(null,'',destination.hash);
   travel(target);
  }else if(destination.pathname.endsWith('/index.html')){
   // Arrive at the home page first, then travel to the requested section.
   try{sessionStorage.setItem('portfolio-section',JSON.stringify({id,time:Date.now()}));}catch{return;}
   event.preventDefault();destination.hash='';changePage(destination);
  }
 });
 if(home){
  try{
   const stored=JSON.parse(sessionStorage.getItem('portfolio-section')||'null');
   sessionStorage.removeItem('portfolio-section');
   if(stored&&Date.now()-stored.time<10000){
    const target=document.getElementById(stored.id);
    if(target){document.fonts.ready.then(()=>{history.replaceState(null,'','#'+stored.id);travel(target);});}
   }
  }catch{}
 }
})();
