'use strict';
(() => {
 const canvas=document.querySelector('#field');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx){document.querySelector('#sketch-status').textContent='The interactive sketch is unavailable in this browser. The case studies are still available above.';return;}
 const spread=document.querySelector('#spread'),value=document.querySelector('#spread-value'),status=document.querySelector('#sketch-status'),motion=document.querySelector('#motion');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let pattern='wave',seed=1,running=false,time=0,request=0,width=600,height=360,visible=true,last=0;
 function rand(n){const a=Math.sin(n*127.1+seed*311.7)*43758.5453;return a-Math.floor(a);}
 function render(){ctx.clearRect(0,0,width,height);const amount=Number(spread.value)/100;const cols=Math.max(18,Math.floor(width/13)),rows=22;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
 let px=(x+.5)*width/cols,py=(y+.5)*height/rows;const index=y*cols+x;
 if(pattern==='wave'){py+=Math.sin(x*.21+time+seed)*amount*48;px+=Math.cos(y*.3+time*.6)*amount*16;}
 if(pattern==='orbit'){const angle=index*2.39996+time*.2+seed;const r=Math.sqrt(index/(cols*rows))*(height*.43);px=width/2+Math.cos(angle)*r*(1+amount*1.8);py=height/2+Math.sin(angle)*r;}
 if(pattern==='scatter'){px=px*(1-amount)+rand(index+1)*width*amount;py=py*(1-amount)+rand(index+940)*height*amount+Math.sin(index+time)*amount*4;}
 ctx.fillStyle=index%19===0?'#ff7a50':'#e8e8dd';ctx.beginPath();ctx.arc(px,py,index%19===0?3.4:1.5+amount,0,Math.PI*2);ctx.fill();
 }}
 function announce(){status.textContent=`${pattern.charAt(0).toUpperCase()+pattern.slice(1)} pattern · spread ${spread.value} · motion ${running?'playing':'paused'}.`;}
 function frame(stamp){request=0;if(!running||!visible||document.hidden)return;time+=last?Math.min((stamp-last)/1000,.05):0;last=stamp;render();request=requestAnimationFrame(frame);}
 function sync(){cancelAnimationFrame(request);request=0;last=0;if(running&&visible&&!document.hidden)request=requestAnimationFrame(frame);}
 function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
 new ResizeObserver(resize).observe(canvas);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
 document.addEventListener('visibilitychange',sync);
 spread.addEventListener('input',()=>{value.value=spread.value;render();});spread.addEventListener('change',announce);
 document.querySelectorAll('[data-pattern]').forEach(button=>button.addEventListener('click',()=>{pattern=button.dataset.pattern;document.querySelectorAll('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();announce();}));
 document.querySelector('#shuffle').addEventListener('click',()=>{seed++;render();announce();status.textContent+=` Arrangement ${seed}.`;});
 motion.addEventListener('click',()=>{running=!running;motion.setAttribute('aria-pressed',String(running));motion.textContent=running?'Pause motion Ⅱ':'Play motion ▶';announce();sync();});
 reduced.addEventListener('change',()=>{if(reduced.matches){running=false;motion.setAttribute('aria-pressed','false');motion.textContent='Play motion ▶';announce();sync();}});
 resize();
})();

(() => {
 const canvas=document.querySelector('#type-play');if(!canvas)return;
 const ctx=canvas.getContext('2d'),source=document.createElement('canvas');if(!ctx)return;
 source.width=300;source.height=300;const pen=source.getContext('2d');if(!pen)return;
 const button=document.querySelector('#scatter-type'),status=document.querySelector('#type-status');
 let points=[],scattered=false,width=300,height=300,pointer=null;
 function setup(){pen.clearRect(0,0,300,300);pen.fillStyle='#000';pen.textAlign='center';pen.font='700 141px Space, sans-serif';pen.fillText('PL',150,139);pen.fillText('AY',150,258);const pixels=pen.getImageData(0,0,300,300).data;points=[];for(let y=20;y<285;y+=7)for(let x=10;x<290;x+=7)if(pixels[(y*300+x)*4+3]>120)points.push({x,y});draw();}
 function draw(){ctx.clearRect(0,0,width,height);const scale=Math.min(width/300,height/300),ox=(width-300*scale)/2,oy=(height-300*scale)/2;ctx.fillStyle='#20211f';points.forEach((point,i)=>{let x=scattered?((i*73.77)%280)+10:point.x,y=scattered?((i*47.23)%265)+20:point.y;if(pointer&&!scattered){const dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy);if(dist<72){const force=(72-dist)*.8;x+=dx/(dist||1)*force;y+=dy/(dist||1)*force;}}ctx.fillRect(ox+x*scale,oy+y*scale,4.8*scale,4.8*scale);});}
 function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
 button.addEventListener('click',()=>{scattered=!scattered;pointer=null;button.setAttribute('aria-pressed',String(scattered));button.textContent=scattered?'Rebuild type ↻':'Scatter type ↗';status.textContent=scattered?'Letters scattered. Use Rebuild type to restore PLAY.':'Letters rebuilt: PLAY.';draw();});
 canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const rect=canvas.getBoundingClientRect(),scale=Math.min(width/300,height/300);pointer={x:(event.clientX-rect.left-(width-300*scale)/2)/scale,y:(event.clientY-rect.top-(height-300*scale)/2)/scale};draw();});
 canvas.addEventListener('pointerleave',()=>{pointer=null;draw();});
 new ResizeObserver(resize).observe(canvas);document.fonts.ready.then(setup);resize();
})();
