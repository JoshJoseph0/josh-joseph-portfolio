'use strict';
(()=>{
 const section=document.querySelector('.work-carousel');if(!section)return;
 const cards=[...section.querySelectorAll('.work-card')],dots=[...section.querySelectorAll('.work-dot')],deck=section.querySelector('.work-deck');
 const canvas=document.createElement('canvas');canvas.className='work-pixels';canvas.setAttribute('aria-hidden','true');deck.append(canvas);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,frame=0,arrival=null;
 function settle(){cancelAnimationFrame(frame);frame=0;arrival?.cancel();arrival=null;deck.dataset.transition='idle';if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height);}
 function select(index){
  current=(index+cards.length)%cards.length;
  cards.forEach((card,i)=>{card.dataset.position=i===current?'active':'hidden';card.inert=i!==current;card.setAttribute('aria-hidden',String(i!==current));});
  dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===current)));
  section.querySelector('.work-position').textContent=`${String(current+1).padStart(2,'0')} / 04 · ${cards[current].querySelector('h3').textContent}`;
 }
 // Transient snapshot of the real local artwork and type. Accessible HTML
 // remains the source of truth, even when canvas or animation is unavailable.
 function capture(card){
  const bounds=card.getBoundingClientRect(),surface=document.createElement('canvas');
  surface.width=Math.ceil(bounds.width);surface.height=Math.ceil(bounds.height);
  const paint=surface.getContext('2d');if(!paint)return null;
  const draw=node=>{
   if(node.nodeType===Node.TEXT_NODE){
    if(!node.textContent.trim())return;
    const style=getComputedStyle(node.parentElement),range=document.createRange();
    paint.fillStyle=style.color;paint.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;paint.textBaseline='alphabetic';
    for(let i=0;i<node.length;i++){
     range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
     if(r.width&&r.height)paint.fillText(node.textContent[i],r.left-bounds.left,r.top-bounds.top+(r.height-parseFloat(style.fontSize))/2+parseFloat(style.fontSize)*.81);
    }return;
   }
   if(node.nodeType!==Node.ELEMENT_NODE)return;
   const style=getComputedStyle(node),r=node.getBoundingClientRect(),x=r.left-bounds.left,y=r.top-bounds.top;
   if(style.display==='none'||style.visibility==='hidden')return;
   paint.save();paint.beginPath();paint.rect(x,y,r.width,r.height);paint.clip();
   if(style.backgroundColor!=='rgba(0, 0, 0, 0)'){paint.fillStyle=style.backgroundColor;paint.fillRect(x,y,r.width,r.height);}
   if(node.tagName==='IMG'&&node.complete&&node.naturalWidth){
    const ratio=style.objectFit==='cover'?Math.max(r.width/node.naturalWidth,r.height/node.naturalHeight):Math.min(r.width/node.naturalWidth,r.height/node.naturalHeight);
    const w=node.naturalWidth*ratio,h=node.naturalHeight*ratio;
    paint.drawImage(node,x+(r.width-w)/2,y+(r.height-h)/2,w,h);
   }else{
    [...node.childNodes].sort((a,b)=>(a.nodeType===1?parseInt(getComputedStyle(a).zIndex)||0:0)-(b.nodeType===1?parseInt(getComputedStyle(b).zIndex)||0:0)).forEach(draw);
   }
   paint.restore();
  };
  paint.fillStyle='#f2f0e7';paint.fillRect(0,0,surface.width,surface.height);draw(card);return surface;
 }
 function show(index,direction=1){
  const target=(index+cards.length)%cards.length;if(target===current)return;
  const instant=reduced.matches||document.body.classList.contains('no-motion')||document.documentElement.dataset.input==='keyboard';
  // Latest request wins. Rapid navigation never builds a queue of effects.
  const interrupted=!!frame;settle();
  let image=null;
  if(!instant&&!interrupted&&ctx){try{image=capture(cards[current]);}catch{image=null;}}
  select(target);if(!image)return;
  const w=image.width,h=image.height,dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const step=Math.max(9,Math.ceil(Math.sqrt(w*h/2400))),pieces=[];
  for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
   const seed=Math.sin(x*12.9898+y*78.233)*43758.5453,noise=seed-Math.floor(seed);
   pieces.push({x,y,w:Math.min(step,w-x),h:Math.min(step,h-y),noise,delay:(direction>0?x/w:1-x/w)*.32+noise*.09});
  }
  deck.dataset.transition='wind';deck.dataset.particles=String(pieces.length);
  arrival=cards[current].animate([{transform:`translateX(${direction*65}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:850,delay:180,easing:'cubic-bezier(.18,.8,.2,1)',fill:'backwards'});
  const start=performance.now();
  function tick(now){
   const time=(now-start)/1000;ctx.clearRect(0,0,w,h);
   for(const p of pieces){
    const age=Math.max(0,time-p.delay),progress=Math.min(1,age/.95),ease=progress*progress;
    if(progress>=1)continue;
    const dx=direction*ease*(w*.9+350+p.noise*350),dy=-ease*(100+p.noise*190)+Math.sin(age*9+p.y*.025)*age*34;
    const shrink=1-progress*.68;ctx.globalAlpha=1-Math.pow(progress,2.3);
    ctx.save();ctx.translate(p.x+p.w/2+dx,p.y+p.h/2+dy);ctx.rotate(direction*progress*(p.noise-.5)*2);
    ctx.drawImage(image,p.x,p.y,p.w,p.h,-p.w*shrink/2,-p.h*shrink/2,p.w*shrink+.35,p.h*shrink+.35);ctx.restore();
   }
   ctx.globalAlpha=1;if(time<1.38)frame=requestAnimationFrame(tick);else settle();
  }
  tick(start);frame=requestAnimationFrame(tick);
 }
 section.querySelector('.work-prev').addEventListener('click',()=>show(current-1,-1));
 section.querySelector('.work-next').addEventListener('click',()=>show(current+1,1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i,i<current?-1:1)));
 deck.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1),event.key==='ArrowRight'?1:-1);}});
 let start=null,suppressClick=false;
 deck.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')start={x:event.clientX,y:event.clientY};});
 deck.addEventListener('pointerup',event=>{if(!start)return;const x=event.clientX-start.x,y=event.clientY-start.y;start=null;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.3){suppressClick=true;show(current+(x<0?1:-1),x<0?1:-1);setTimeout(()=>{suppressClick=false;},0);}});
 deck.addEventListener('pointercancel',()=>{start=null;});
 deck.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
 addEventListener('resize',settle);addEventListener('pagehide',settle);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 document.addEventListener('keydown',settle);reduced.addEventListener('change',settle);
 select(0);section.querySelectorAll('button').forEach(button=>{button.disabled=false;});section.dataset.ready='true';
})();
