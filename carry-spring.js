/* A bounded, damped pendulum: pointer acceleration creates sway, never a throw. */
(function(scope){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class CarrySpring{
  constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.angle=0;this.spin=0;this.targetX=x;this.targetY=y;this.accumulator=0;this.clock=0;}
  aim(x,y){this.targetX=x;this.targetY=y;}
  advance(dt,still=false){
   if(still){this.x=this.targetX;this.y=this.targetY;this.vx=this.vy=this.angle=this.spin=0;return;}
   this.accumulator+=clamp(dt,0,.1);
   while(this.accumulator+1e-10>=1/120){const h=1/120;this.accumulator-=h;this.clock+=h;
    const ax=clamp((this.targetX-this.x)*260-this.vx*29,-6000,6000),ay=clamp((this.targetY-this.y)*260-this.vy*29,-6000,6000);
    this.vx=clamp(this.vx+ax*h,-1500,1500);this.vy=clamp(this.vy+ay*h,-1500,1500);this.x+=this.vx*h;this.y+=this.vy*h;
    this.spin+=(-55*this.angle-8*this.spin-ax*.0015)*h;this.spin=clamp(this.spin,-3,3);this.angle=clamp(this.angle+this.spin*h,-.42,.42);
   }
  }
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={CarrySpring};else scope.PortfolioCarry={CarrySpring};
})(typeof window==='undefined'?globalThis:window);
