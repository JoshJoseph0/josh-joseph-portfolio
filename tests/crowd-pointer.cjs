// Run with: node tests/crowd-pointer.cjs
const assert=require('node:assert/strict');
const {CrowdWorld}=require('../crowd-world.js');
const advance=(world,steps)=>{for(let i=0;i<steps;i++)world.advance(1/60);};
const distance=(person,point)=>Math.hypot(person.x-point.x,person.y-point.y);

const world=new CrowdWorld(1000,650);
const pointer={x:760,y:310};
world.pointer=pointer;
advance(world,60);
const followers=world.people.filter(person=>person.followingPointer);
assert(followers.length>=3,'Nearby walkers should notice the pointer.');
const before=followers.reduce((sum,person)=>sum+distance(person,pointer),0);
advance(world,420);
const after=followers.reduce((sum,person)=>sum+distance(person,pointer),0);
assert(after<before-40,'Walkers should approach rather than flee the pointer.');
assert(world.people.every(person=>person.speed<=person.cruise*1.15+.001),'Attraction should preserve a walking pace.');

world.pointer={x:900,y:310};
advance(world,90);
assert(world.people.some(person=>person.followingPointer&&person.pointerTargetX===900),'Moving the pointer should refresh nearby destinations.');
const lifted=world.people.find(person=>person.followingPointer);
world.lift(lifted);
const position={x:lifted.x,y:lifted.y};
advance(world,60);
assert.equal(lifted.x,position.x,'A picked-up person must not follow the pointer.');
assert.equal(lifted.y,position.y);
world.returnPerson(lifted);
world.pointer=null;
advance(world,1);
assert(world.people.every(person=>!person.followingPointer),'Leaving the scene should release every destination.');

const obstacle={x:400,y:180,w:220,h:230};
const blocked=new CrowdWorld(1000,650,{obstacles:[obstacle]});
blocked.pointer={x:520,y:280};
for(let i=0;i<600;i++){
 blocked.advance(1/60);
 assert(blocked.people.every(person=>blocked.free(person,0)),'Attraction must not walk through protected text or controls.');
}
assert(blocked.people.filter(person=>person.followingPointer).every(person=>blocked.free(person.goal,16)),'Destinations must keep clear of obstacles.');
console.log('Crowd pointer checks passed.');
