/* Persistent crowd simulation. Camera movement is deliberately separate from locomotion. */
(function(scope){
 'use strict';
 const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const deltaAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 const inside=(p,r,pad=0)=>p.x>r.x-pad&&p.x<r.x+r.w+pad&&p.y>r.y-pad&&p.y<r.y+r.h+pad;
 function intersects(a,b,r,pad=7){
  let lo=0,hi=1;
  for(const [key,start,end] of [['x',r.x-pad,r.x+r.w+pad],['y',r.y-pad,r.y+r.h+pad]]){
   const d=b[key]-a[key];
   if(Math.abs(d)<1e-8){if(a[key]<=start||a[key]>=end)return false;}
   else{let t1=(start-a[key])/d,t2=(end-a[key])/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>=hi)return false;}
  }
  return hi>1e-5&&lo<1-1e-5;
 }
 class CrowdWorld{
  constructor(width,height,{seed=137,obstacles=[]}={}){
   this.width=width;this.height=height;this.worldWidth=width*1.65;this.seed=seed;this.clock=0;this.accumulator=0;this.step=1/60;this.cameraX=0;this.obstacles=obstacles;this.people=[];this.pointer=null;this.seen=new Set();this.visibleIDs=new Set();this.exits=new Set();
   const counts=width<701?[12,6]:[28,12],bands=[[.015,.99],[1,1.6]];
   counts.forEach((count,band)=>{for(let i=0;i<count;i++)this.addPerson(bands[band],band);});
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  free(p,pad=8){return p.x>=12&&p.x<=this.worldWidth-12&&p.y>=40&&p.y<=this.height-14&&!this.obstacles.some(r=>inside(p,r,pad));}
  clear(a,b){return !this.obstacles.some(r=>intersects(a,b,r));}
  addPerson(band,bandID){
   const chooseY=()=>48+this.random()*(this.height-70);
   let point={x:band[0]*this.width,y:50};
   for(let n=0;n<250;n++){
    point={x:(band[0]+this.random()*(band[1]-band[0]))*this.width,y:chooseY()};
    if(this.free(point,14)&&this.people.every(p=>Math.hypot(p.x-point.x,p.y-point.y)>26))break;
   }
   const id=this.people.length,scale=(this.width<701?.78:.85)+this.random()*.22,angle=this.random()*TAU;
   const p={id,band:bandID,...point,prevX:point.x,prevY:point.y,homeX:point.x,angle,prevAngle:angle,speed:0,actualSpeed:0,cruise:(18+this.random()*10)*scale,acceleration:22+this.random()*9,scale,cycle:this.random(),prevCycle:0,travel:0,gait:0,idleUntil:0,waveUntil:0,waveCooldown:0,phoneAt:8+this.random()*32,phoneUntil:0,phoneBlend:0,sitAt:10+this.random()*38,sitUntil:0,sitBlend:0,waiting:0,path:[],goal:null,repathAt:0,stuck:0,shirt:['#242e2a','#d36137','#9ca982','#e5dfce','#71864f','#25302f'][id%6],skin:['#bc8d70','#e2b694','#946b53'][id%3],pants:id%5===0?'#414638':'#252b28',hair:id%4};
   if(id%7===3){p.phoneUntil=3+this.random()*4;p.idleUntil=p.phoneUntil;p.phoneAt=p.phoneUntil+18+this.random()*28;}
   if(id%13===6){p.sitUntil=5+this.random()*5;p.sitBlend=1;p.idleUntil=p.sitUntil;p.sitAt=p.sitUntil+24+this.random()*30;p.phoneAt=p.sitUntil+10+this.random()*20;}
   p.prevCycle=p.cycle;this.people.push(p);this.newGoal(p);
   if(!p.sitBlend&&!p.phoneUntil&&p.path.length){p.angle=p.prevAngle=Math.atan2(p.path[0].y-p.y,p.path[0].x-p.x);p.speed=p.actualSpeed=p.cruise*.7;p.gait=.7;}
   return p;
  }
  route(start,goal){
   const covering=this.obstacles.filter(r=>inside(start,r,8));
   if(covering.length){
    const exits=[];
    for(const r of covering)exits.push({x:r.x-18,y:start.y},{x:r.x+r.w+18,y:start.y},{x:start.x,y:r.y-18},{x:start.x,y:r.y+r.h+18});
    exits.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));
    for(const exit of exits){if(!this.free(exit,9)||this.obstacles.some(r=>!covering.includes(r)&&intersects(start,exit,r)))continue;const path=this.route(exit,goal);if(path.length)return [exit,...path];}
    return [];
   }
   if(this.clear(start,goal))return [goal];
   const nodes=[{x:start.x,y:start.y},goal];
   for(const r of this.obstacles)for(const x of [r.x-18,r.x+r.w+18])for(const y of [r.y-18,r.y+r.h+18])if(this.free({x,y},8))nodes.push({x,y});
   const dist=nodes.map(()=>Infinity),previous=[],visited=new Set();dist[0]=0;
   for(let k=0;k<nodes.length;k++){
    let u=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(u<0||dist[i]<dist[u]))u=i;
    if(u<0||dist[u]===Infinity)break;if(u===1){const path=[];for(let i=1;i!==0;i=previous[i])path.push(nodes[i]);return path.reverse();}
    visited.add(u);
    for(let v=0;v<nodes.length;v++){if(visited.has(v)||u===v||!this.clear(nodes[u],nodes[v]))continue;const d=dist[u]+Math.hypot(nodes[v].x-nodes[u].x,nodes[v].y-nodes[u].y);if(d<dist[v]){dist[v]=d;previous[v]=u;}}
   }
   return [];
  }
  newGoal(p){
   for(let n=0;n<24;n++){
    const goal={x:clamp(p.homeX+(this.random()-.5)*this.width*.52,18,this.worldWidth-18),y:48+this.random()*(this.height-70)};
    if(!this.free(goal,12)||Math.hypot(goal.x-p.x,goal.y-p.y)<65)continue;
    const path=this.route(p,goal);if(path.length){p.goal=goal;p.path=path;return;}
   }
   if(this.detour(p))return;
   p.goal=null;p.path=[];p.idleUntil=this.clock+.12;
  }
  detour(p){
   // A blocked walker takes a short, clear route rather than waiting indefinitely.
   const away=this.people.reduce((v,o)=>{if(o===p||o.held)return v;const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<38&&d>0){v.x+=(p.x-o.x)/d;v.y+=(p.y-o.y)/d;}return v;},{x:0,y:0});
   const start=Math.hypot(away.x,away.y)>.1?Math.atan2(away.y,away.x):p.angle;
   for(const distance of [48,84,120])for(let i=0;i<16;i++){
    const a=start+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/8,goal={x:p.x+Math.cos(a)*distance,y:p.y+Math.sin(a)*distance};
    if(this.free(goal,12)&&this.clear(p,goal)&&this.people.every(o=>o===p||o.held||Math.hypot(o.x-goal.x,o.y-goal.y)>20)){p.path=[goal];p.goal=goal;p.repathAt=this.clock+.8;return true;}
   }
   return false;
  }
  canPlace(p,point){return this.free(point,9)&&this.people.every(other=>other===p||other.held||Math.hypot(other.x-point.x,other.y-point.y)>=15);}
  placement(p,point,radius=36){
   if(this.canPlace(p,point))return {...point};
   for(let r=12;r<=radius;r+=12)for(let a=0;a<TAU;a+=Math.PI/6){const q={x:point.x+Math.cos(a)*r,y:point.y+Math.sin(a)*r};if(this.canPlace(p,q))return q;}
   return null;
  }
  lift(p){
   if(!p||p.held)return false;
   p.origin={x:p.x,y:p.y,homeX:p.homeX};p.held=true;p.speed=0;p.actualSpeed=0;p.gait=0;p.phoneBlend=0;p.phoneUntil=0;p.sitBlend=0;p.sitUntil=0;p.sitAt=this.clock+18+this.random()*24;p.waveUntil=0;return true;
  }
  place(p,point){
   if(!p?.held||!this.canPlace(p,point))return false;
   p.x=p.prevX=point.x;p.y=p.prevY=point.y;p.homeX=point.x;p.speed=p.actualSpeed=p.gait=0;p.prevCycle=p.cycle;
   p.held=false;p.origin=null;p.path=[];p.goal=null;p.idleUntil=this.clock+.25;p.phoneAt=this.clock+12+this.random()*28;return true;
  }
  returnPerson(p){
   if(!p?.held)return false;
   const origin=p.origin,point=this.placement(p,origin,180)||this.placement(p,origin,Math.max(this.worldWidth,this.height));
   if(!point)return false;
   const home=origin.homeX;this.place(p,point);p.homeX=home;return true;
  }
  setObstacles(rectangles){this.obstacles=rectangles;}
  advance(delta){
   this.accumulator+=clamp(delta,0,.1);
   while(this.accumulator+1e-10>=this.step){this.update(this.step);this.accumulator-=this.step;}
   this.interpolation=clamp(this.accumulator/this.step,0,1);
  }
  update(dt){
   this.clock+=dt;
   for(const p of this.people){
    p.prevX=p.x;p.prevY=p.y;p.prevAngle=p.angle;p.prevCycle=p.cycle;
    if(p.held)continue;
    // People slow to a stop, check a message, then return to their existing route.
    if(this.clock>=p.phoneAt&&this.clock>=p.sitUntil&&p.sitBlend<.01){p.phoneUntil=this.clock+4+this.random()*5;p.idleUntil=Math.max(p.idleUntil,p.phoneUntil);p.phoneAt=p.phoneUntil+20+this.random()*40;}
    if(this.clock>=p.sitAt&&this.clock>=p.phoneUntil&&this.people.filter(o=>this.clock<o.sitUntil||o.sitBlend>.001).length<Math.max(2,Math.floor(this.people.length*.14))&&this.people.every(o=>o===p||o.held||Math.hypot(o.x-p.x,o.y-p.y)>25)){
     p.sitUntil=this.clock+6+this.random()*7;p.idleUntil=Math.max(p.idleUntil,p.sitUntil);p.sitAt=p.sitUntil+25+this.random()*35;p.phoneAt=Math.max(p.phoneAt,p.sitUntil+8);
    }
    const sitting=this.clock<p.sitUntil;
    const targetSit=sitting&&p.actualSpeed<2?1:0;
    p.sitBlend+=clamp(targetSit-p.sitBlend,-dt/.7,dt/.7);
    const texting=this.clock<p.phoneUntil;
    p.phoneBlend+=((texting&&p.actualSpeed<3?1:0)-p.phoneBlend)*(1-Math.exp(-dt*5));
    const idle=this.clock<p.idleUntil||p.sitBlend>.001;
    if(!idle&&!p.path.length)this.newGoal(p);
    while(p.path.length>1&&this.clear(p,p.path[1]))p.path.shift();
    while(p.path.length>1&&Math.hypot(p.path[0].x-p.x,p.path[0].y-p.y)<15)p.path.shift();
    const next=p.path[0];let targetAngle=p.angle,targetSpeed=0;
    if(next&&!idle){
     const dx=next.x-p.x,dy=next.y-p.y,distance=Math.hypot(dx,dy);
     if(distance<8&&p.path.length===1){p.path=[];p.goal=null;this.newGoal(p);targetSpeed=p.cruise*.65;}
     else{
      let sx=dx/(distance||1),sy=dy/(distance||1),yieldFactor=1;
      // Small anticipatory sidesteps, rather than oscillating repulsion forces.
      for(const other of this.people){
       if(other===p||other.held)continue;const ox=other.x-p.x,oy=other.y-p.y,d=Math.hypot(ox,oy);
       if(d>65||d<.001)continue;
       const ahead=(ox*Math.cos(p.angle)+oy*Math.sin(p.angle))/d;
       if(ahead>0){
        const rvx=Math.cos(other.angle)*other.speed-Math.cos(p.angle)*p.speed,rvy=Math.sin(other.angle)*other.speed-Math.sin(p.angle)*p.speed;
        const t=clamp(-(ox*rvx+oy*rvy)/(rvx*rvx+rvy*rvy||1),0,1.2),future=Math.hypot(ox+rvx*t,oy+rvy*t);
        if(future<22||d<30){const strength=(1-d/65)*1.15;sx-=Math.sin(p.angle)*strength;sy+=Math.cos(p.angle)*strength;if(p.id>other.id&&d<38)yieldFactor=Math.min(yieldFactor,clamp((d-12)/26,.1,1));}
       }
       if(d<22){const pressure=(1-d/22)*2;sx-=ox/d*pressure;sy-=oy/d*pressure;}
      }
      targetAngle=Math.atan2(sy,sx);const error=Math.abs(deltaAngle(p.angle,targetAngle));
      const arrival=p.path.length===1?clamp(distance/40,.12,1):1;
      targetSpeed=p.cruise*Math.max(.2,1-error/Math.PI*.85)*arrival*yieldFactor;
     }
    }
    const maxTurn=1.65*dt;p.angle+=clamp(deltaAngle(p.angle,targetAngle),-maxTurn,maxTurn);
    p.speed+=clamp(targetSpeed-p.speed,-p.acceleration*dt,p.acceleration*dt);
    let dx=Math.cos(p.angle)*p.speed*dt,dy=Math.sin(p.angle)*p.speed*dt;
    const proposed={x:p.x+dx,y:p.y+dy};
    if(!this.free(proposed,9)&&this.free(p,9)){
     const alongX={x:p.x+dx,y:p.y},alongY={x:p.x,y:p.y+dy};
     if(Math.abs(dx)>Math.abs(dy)&&this.free(alongX,9))dy=0;
     else if(this.free(alongY,9))dx=0;
     else if(this.free(alongX,9))dy=0;
     else{dx=0;dy=0;p.speed=Math.max(0,p.speed-p.acceleration*dt*2);}
     if(this.clock>p.repathAt){p.repathAt=this.clock+.5;p.path=p.goal?this.route(p,p.goal):[];}
    }
    // Preserve personal space without snapping either person to a new position.
    for(const other of this.people){if(other===p||other.held)continue;const before=Math.hypot(p.x-other.x,p.y-other.y),after=Math.hypot(p.x+dx-other.x,p.y+dy-other.y),space=9.5*(p.scale+other.scale)*.5;if(after<space&&after<before){dx=0;dy=0;p.speed=Math.max(0,p.speed-p.acceleration*dt);break;}}
    const x=clamp(p.x+dx,12,this.worldWidth-12),y=clamp(p.y+dy,40,this.height-14),distance=Math.hypot(x-p.x,y-p.y);
    p.x=x;p.y=y;p.travel+=distance;p.cycle+=distance/(16*p.scale);p.actualSpeed=distance/dt;
    p.gait+=(clamp(p.actualSpeed/12,0,1)-p.gait)*(1-Math.exp(-dt*7));
    p.stuck=targetSpeed>5&&distance<.015?p.stuck+dt:0;
    if(p.stuck>.7&&this.clock>p.repathAt){if(!this.detour(p))this.newGoal(p);p.repathAt=this.clock+.8;p.stuck=0;}
    p.waiting=!texting&&!sitting&&p.sitBlend<.01&&p.actualSpeed<1.5?p.waiting+dt:0;
    if(p.waiting>1.1){this.detour(p);p.waiting=0;}
    if(!texting&&p.sitBlend<.01&&this.pointer&&p.id%5===0&&this.clock>p.waveCooldown&&Math.hypot(p.x-this.pointer.x,p.y-this.pointer.y)<42){p.waveUntil=this.clock+1.15;p.waveCooldown=this.clock+9;}
   }
  }
  sample(p){
   const f=this.interpolation??0;
   return {x:p.prevX+(p.x-p.prevX)*f-this.cameraX,y:p.prevY+(p.y-p.prevY)*f,angle:p.prevAngle+deltaAngle(p.prevAngle,p.angle)*f,cycle:p.prevCycle+(p.cycle-p.prevCycle)*f};
  }
  visible(){
   const list=this.people.filter(p=>{if(p.held)return false;const q=this.sample(p);return q.x>-24&&q.x<this.width+24&&q.y>20&&q.y<this.height+42;});
   const ids=new Set(list.map(p=>p.id));for(const id of this.visibleIDs)if(!ids.has(id))this.exits.add(id);for(const id of ids)this.seen.add(id);this.visibleIDs=ids;return list;
  }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={CrowdWorld,deltaAngle,intersects};
 else scope.PortfolioCrowd={CrowdWorld,deltaAngle};
})(typeof window==='undefined'?globalThis:window);
