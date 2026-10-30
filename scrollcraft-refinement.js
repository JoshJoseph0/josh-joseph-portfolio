'use strict';
(()=>{
 const header=document.querySelector('.header');
 if(!header)return;
 const thread=document.createElement('span');
 thread.className='reading-thread';thread.setAttribute('aria-hidden','true');header.append(thread);
 let frame=0;
 function paint(){
  frame=0;
  const limit=document.documentElement.scrollHeight-innerHeight;
  thread.style.transform=`scaleX(${limit>0?Math.min(1,Math.max(0,scrollY/limit)):0})`;
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule);addEventListener('pageshow',schedule);
 new ResizeObserver(schedule).observe(document.body);
 schedule();
})();
