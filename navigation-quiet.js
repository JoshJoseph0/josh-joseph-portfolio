"use strict";
(()=>{
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.input==='keyboard'||document.documentElement.classList.contains('horizontal-active')||document.documentElement.dataset.reducedMotion==='true';
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
  let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target)return;
  event.preventDefault();if(location.hash!==url.hash)history.pushState(null,'',url.hash);
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
  target.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
 });
})();
