'use strict';
(()=>{
 const stage=document.querySelector('.shape-stage'),landing=document.querySelector('.shape-landing'),hero=document.querySelector('#intro');
 if(!stage||!landing||!hero)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const starts=[...stage.querySelectorAll('.shape-slot')],ends=[...landing.querySelectorAll('.shape-slot')];
 const layer=document.createElement('div');layer.className='shape-flight';layer.hidden=true;layer.setAttribute('aria-hidden','true');
 const pieces=starts.map(slot=>{const node=slot.querySelector('.shape-form').cloneNode(true);layer.append(node);return node;});document.body.append(layer);
 let geometry=[],range=1,frame=0;
 function paint(){
  frame=0;if(reduced.matches){layer.hidden=true;root.classList.remove('shape-motion-ready');return;}
  layer.hidden=false;root.classList.add('shape-motion-ready');
  let q=Math.min(1,Math.max(0,scrollY/range));
  if(root.dataset.input==='keyboard')q=scrollY>10?1:0;
  const fall=q*q;
  geometry.forEach((g,i)=>{
   const x=g.sx+(g.ex-g.sx)*q;
   const y=g.sy+(g.ey-g.sy)*fall;
   const size=g.sw;
   pieces[i].style.transform=`translate3d(${x}px,${y}px,0) scale(${size/100})`;
   pieces[i].style.setProperty('--r',`${g.sr}deg`);
  });
  layer.dataset.position=q===0?'hero':q===1?'footer':'falling';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 function measure(){
  const startRects=starts.map(slot=>slot.getBoundingClientRect());
  startRects.forEach((rect,i)=>{ends[i].style.width=`${rect.width}px`;});
  geometry=starts.map((slot,i)=>{
   const a=startRects[i],b=ends[i].getBoundingClientRect();
   return {sx:a.left+scrollX,sy:a.top+scrollY,sw:a.width,ex:b.left+scrollX,ey:b.top+scrollY,ew:b.width,sr:parseFloat(getComputedStyle(slot).getPropertyValue('--r'))||0};
  });
  range=Math.max(200,hero.getBoundingClientRect().height*.75);schedule();
 }
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure);addEventListener('load',measure);addEventListener('pageshow',measure);
 reduced.addEventListener('change',measure);document.fonts.ready.then(measure);
 document.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',measure,{once:true});});
 new ResizeObserver(measure).observe(stage);measure();
})();
