'use strict';
// Small, isolated experiments. The inspector shows this same live implementation.
function move(element,frames,options={}){
 if(document.documentElement.dataset.reducedMotion==='true'||document.documentElement.dataset.input==='keyboard'||document.body.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 element.getAnimations().forEach(animation=>animation.cancel());
 return element.animate(frames,{duration:280,easing:'cubic-bezier(.2,.8,.2,1)',...options});
}
const experiments=[
{id:'push',title:'A button with bounce',kind:'Controls',description:'Press, release, repeat. Squash and stretch give a simple action a physical response.',html:`<button class="pill push-button"><span class="button-face" aria-hidden="true"><i></i><i></i></span><span>Go on.<br>Press it.</span><span aria-hidden="true">↗</span></button><p class="status" role="status">A very pressable button.</p>`,init:root=>{
 let count=0;const button=root.querySelector('button');button.addEventListener('click',()=>{count++;move(button,[{transform:'scale(.82,1.16) rotate(-3deg)'},{transform:'scale(1.12,.88) rotate(2deg)'},{transform:'scale(.98,1.02)'},{transform:'scale(1)'}],{duration:550});root.querySelector('.status').textContent=`${count} ${count===1?'press':'presses'}. Still satisfying.`;});
}},
{id:'send',title:'A little send-off',kind:'Controls',description:'An action turns into a result. A tiny flight gives the state change somewhere to go.',html:`<button class="pill">Send a little hello <span class="plane" aria-hidden="true">➤</span></button><p class="status" role="status">A demo. Nothing gets sent.</p>`,init:root=>{
 let count=0;root.querySelector('button').addEventListener('click',()=>{count++;move(root.querySelector('.plane'),[{transform:'translate(0,0)',opacity:1},{transform:'translate(55px,-45px)',opacity:0},{transform:'translate(-25px,15px)',opacity:0},{transform:'translate(0,0)',opacity:1}],{duration:650});root.querySelector('.status').textContent=`Demo message played ${count} ${count===1?'time':'times'}. No message was sent.`;});
}},
{id:'light',title:'A switch with a mood',kind:'Controls',description:'Clear on/off state, with a light that perks up when you switch it on.',html:`<div class="bulb" aria-hidden="true">☼</div><button class="switch" role="switch" aria-checked="false" aria-label="Desk light"><span></span></button><p class="status" role="status">Lights out.</p>`,init:root=>{
 const button=root.querySelector('button');button.addEventListener('click',()=>{const on=button.getAttribute('aria-checked')!=='true';button.setAttribute('aria-checked',on);root.querySelector('.bulb').classList.toggle('on',on);root.querySelector('.status').textContent=on?'That’s better. Light on.':'Lights out.';});
}},
{id:'reaction',title:'Say it with a face',kind:'Controls',description:'Three reactions, one selected state. Small movement makes the choice feel expressive.',html:`<div class="row" role="group" aria-label="Choose a reaction"><button class="reaction" aria-pressed="false" aria-label="Curious">◉</button><button class="reaction" aria-pressed="false" aria-label="Happy">☺</button><button class="reaction" aria-pressed="false" aria-label="Surprised">◎</button></div><p class="status" role="status">What’s your first reaction?</p>`,init:root=>{
 root.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{root.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===button));root.querySelector('.status').textContent=`${button.getAttribute('aria-label')}. Noted.`;}));
}},
{id:'counter',title:'One more idea',kind:'Controls',description:'A counter with a little momentum. The number changes immediately; the feedback follows.',html:`<output class="big-value" aria-live="polite">0</output><div class="row"><button class="circle-button" aria-label="Remove one idea">−</button><button class="circle-button" aria-label="Add one idea">+</button></div><p class="status">Ideas on the table.</p>`,init:root=>{
 let count=0;const output=root.querySelector('output');root.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>{count=Math.max(0,count+(i?1:-1));output.textContent=count;move(output,[{transform:`translateY(${i?12:-12}px)`,opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:220});}));
}},
{id:'segments',title:'Same brain, different hat',kind:'Controls',description:'Switch between design, code and testing. A compact control with a proper content response.',html:`<div class="segmented" role="group" aria-label="Working mode"><button aria-pressed="true">Design</button><button aria-pressed="false">Code</button><button aria-pressed="false">Test</button></div><div class="result-panel" role="status">How should this feel?</div>`,init:root=>{
 const messages=['How should this feel?','Let’s make it work.','What happens if…?'];root.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>{root.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===button));const panel=root.querySelector('.result-panel');panel.textContent=messages[i];move(panel,[{transform:'translateY(8px)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:240});}));
}},
{id:'hello',title:'An introduction, nicely',kind:'Forms',description:'A small form with an actual empty state, validation and a friendly local response.',html:`<form class="stack" novalidate><label>Your first name<input name="name" autocomplete="off" maxlength="30" placeholder="Try a made-up name"></label><button class="pill" type="submit">Say hello ↗</button></form><p class="status" role="status">Demo only. Your name stays on this page.</p>`,init:root=>{
 const input=root.querySelector('input');root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const name=input.value.trim();input.setAttribute('aria-invalid',!name);root.querySelector('.status').textContent=name?`Hi ${name}. Good to have you here.`:'Enter a first name to try the greeting. A made-up name is fine.';if(!name)input.focus();else move(root.querySelector('button'),[{transform:'rotate(-3deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0)'}]);});
}},
{id:'password',title:'A password with feedback',kind:'Forms',description:'A reveal control and live rule feedback. It checks simple rules, not real-world security.',html:`<label>Demo password<input type="password" autocomplete="off" placeholder="Use a made-up example"></label><div class="row"><button class="pill soft" aria-pressed="false">Show password</button></div><div class="meter" aria-hidden="true"><span></span></div><p class="status" role="status">Try 8+ characters, mixed case, a number and a symbol.</p>`,init:root=>{
 const input=root.querySelector('input'),button=root.querySelector('button');button.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide password':'Show password';button.setAttribute('aria-pressed',show);});input.addEventListener('input',()=>{const tests=[input.value.length>=8,/[a-z]/.test(input.value)&&/[A-Z]/.test(input.value),/\d/.test(input.value),/[^a-zA-Z0-9]/.test(input.value)];const n=tests.filter(Boolean).length;root.querySelector('.meter').style.setProperty('--progress',n/4);root.querySelector('.status').textContent=`${n}/4 demo rules met. ${n===4?'All four checked.':'Keep experimenting.'}`;});
}},
{id:'search',title:'Find something I made',kind:'Forms',description:'Local filtering with a useful no-results state. A search that actually searches.',html:`<label>Search projects<input type="search" placeholder="Try museum, AI or code"></label><div class="search-results"></div><p class="status" role="status">4 projects to explore.</p>`,init:root=>{
 const projects=[['George','museum story family'],['Jarvis / Midnight','AI assistant desktop'],['Creative Web','AI behaviour UX'],['Six Million','Holocaust remembrance code data dots'],['Virgin Money','banking UX AI spending guide'],['Home-Start','charity web website maintenance']];const draw=()=>{const q=root.querySelector('input').value.trim().toLowerCase(),items=projects.filter(p=>p.join(' ').toLowerCase().includes(q));const box=root.querySelector('.search-results');box.replaceChildren();items.forEach(p=>{const item=document.createElement('span');item.textContent=p[0];box.append(item);});root.querySelector('.status').textContent=items.length?`${items.length} ${items.length===1?'match':'matches'}.`:'No projects match. Try “museum”, “AI” or clear your search.';};root.querySelector('input').addEventListener('input',draw);draw();
}},
{id:'mood',title:'How’s the idea feeling?',kind:'Forms',description:'A slider turns a numeric value into a face. Text keeps the meaning clear.',html:`<div class="face" aria-hidden="true">:)</div><label>Idea confidence <input type="range" min="0" max="100" value="65"></label><output class="status" aria-live="polite">65% · Getting somewhere.</output>`,init:root=>{
 const input=root.querySelector('input'),face=root.querySelector('.face'),output=root.querySelector('output');input.addEventListener('input',()=>{const n=+input.value;face.textContent=n<30?':/':n<75?':)':':D';face.style.transform=`rotate(${(n-50)/5}deg)`;face.style.borderRadius=`${30+n/5}%`;output.textContent=`${n}% · ${n<30?'Needs a rethink.':n<75?'Getting somewhere.':'Let’s try it!'}`;});
}},
{id:'checklist',title:'Small steps count',kind:'Forms',description:'A tactile checklist with progress that follows your work, including going backwards.',html:`<div class="stack"><label class="check-row"><input type="checkbox"><span>Make a rough version</span></label><label class="check-row"><input type="checkbox"><span>Try the weird idea</span></label><label class="check-row"><input type="checkbox"><span>Fix what feels wrong</span></label></div><div class="meter" aria-hidden="true"><span></span></div><p class="status" role="status">0 of 3. Start anywhere.</p>`,init:root=>{
 root.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const n=root.querySelectorAll('input:checked').length;root.querySelector('.meter').style.setProperty('--progress',n/3);root.querySelector('.status').textContent=`${n} of 3. ${n===3?'That’s a good day’s making.':'One thing at a time.'}`;}));
}},
{id:'brief',title:'A tiny project brief',kind:'Forms',description:'A two-step form with back navigation and a preview. No account, no submit to a server.',html:`<form class="stack"><div class="brief-one stack"><label>What are we making?<input required maxlength="60" placeholder="A museum experience?"></label><button class="pill" type="submit">Next: the feeling →</button></div><div class="brief-two stack" hidden><label>How should it feel?<select><option>Playful</option><option>Calm</option><option>Bold</option><option>A little strange</option></select></label><div class="row"><button class="pill soft back" type="button">← Back</button><button class="pill" type="submit">Preview brief</button></div></div></form><div class="result-panel" hidden></div><p class="status" role="status">Step 1 of 2 · demo only.</p>`,init:root=>{
 let step=1;const first=root.querySelector('.brief-one'),second=root.querySelector('.brief-two'),status=root.querySelector('.status'),result=root.querySelector('.result-panel');root.querySelector('.back').addEventListener('click',()=>{step=1;first.hidden=false;second.hidden=true;result.hidden=true;status.textContent='Step 1 of 2 · idea kept.';root.querySelector('input').focus();});root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(step===1){step=2;first.hidden=true;second.hidden=false;status.textContent='Step 2 of 2 · choose the feeling.';root.querySelector('select').focus();}else{result.hidden=false;result.textContent=`${root.querySelector('input').value.trim()} — ${root.querySelector('select').value.toLowerCase()}.`;status.textContent='Brief ready. Nothing was sent.';move(result,[{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}]);}});
}},
{id:'colour',title:'Mix something good',kind:'Tools',description:'A little colour lab. Three channels, a live swatch and a usable colour value.',html:`<div class="colour-chip" aria-hidden="true"></div><label>Red<input type="range" min="0" max="255" value="75"></label><label>Green<input type="range" min="0" max="255" value="100"></label><label>Blue<input type="range" min="0" max="255" value="230"></label><output class="status" aria-live="polite">#4B64E6</output>`,init:root=>{
 const inputs=[...root.querySelectorAll('input')];const update=()=>{const hex='#'+inputs.map(i=>(+i.value).toString(16).padStart(2,'0')).join('').toUpperCase();root.querySelector('.colour-chip').style.background=hex;root.querySelector('output').textContent=hex;};inputs.forEach(input=>input.addEventListener('input',update));update();
}},
{id:'type',title:'Make some noise. In type.',kind:'Tools',description:'Live poster lettering. Type a thought, change the scale, make it take up space.',html:`<div class="poster" aria-hidden="true">WHAT IF?</div><label>Your words<input maxlength="22" value="WHAT IF?"></label><label>Letter size<input type="range" min="25" max="75" value="48"></label>`,init:root=>{
 const [words,size]=root.querySelectorAll('input'),poster=root.querySelector('.poster');words.addEventListener('input',()=>{poster.textContent=words.value||'…';});size.addEventListener('input',()=>{poster.style.fontSize=size.value+'px';});
}},
{id:'timer',title:'Ten seconds. One thought.',kind:'Tools',description:'A working focus timer with pause, resume and reset. It only starts when you do.',html:`<div class="progress-ring"><output class="big-value" aria-live="off">10</output></div><div class="row"><button class="pill start">Start</button><button class="pill soft reset">Reset</button></div><p class="status" role="status">Ten seconds of doing one thing.</p>`,init:root=>{
 let remaining=10000,end=0,timer=0;const button=root.querySelector('.start'),output=root.querySelector('output'),status=root.querySelector('.status');const paint=()=>{output.textContent=Math.ceil(remaining/1000);};const pause=()=>{clearInterval(timer);timer=0;button.textContent='Resume';};const tick=()=>{remaining=Math.max(0,end-Date.now());paint();if(!remaining){pause();button.textContent='Again';status.textContent='Done. What did you come up with?';move(root.querySelector('.progress-ring'),[{transform:'scale(.95)'},{transform:'scale(1.05)'},{transform:'scale(1)'}]);}};button.addEventListener('click',()=>{if(timer){remaining=Math.max(0,end-Date.now());pause();status.textContent='Paused. Take your time.';}else{if(!remaining)remaining=10000;end=Date.now()+remaining;timer=setInterval(tick,100);button.textContent='Pause';status.textContent='One thought. Go.';}});root.querySelector('.reset').addEventListener('click',()=>{pause();remaining=10000;paint();button.textContent='Start';status.textContent='Fresh ten seconds.';});document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer){remaining=Math.max(0,end-Date.now());pause();paint();status.textContent='Paused while this page is away.';}});
}},
{id:'ideas',title:'An unlikely combination',kind:'Tools',description:'A random prompt machine built around the kinds of things I work on. Use it as a starting point.',html:`<div class="result-panel" role="status">A museum<br>that listens.</div><button class="pill">Another odd idea ↻</button><p class="status">Two ideas are sometimes better than one.</p>`,init:root=>{
 const things=['A museum','A desktop','A drawing','A map','A story','A button'],verbs=['that listens.','you can rearrange.','that asks a question.','made of tiny dots.','that changes with you.','with a sense of humour.'];let previous='';root.querySelector('button').addEventListener('click',()=>{let next;do{next=things[Math.floor(Math.random()*things.length)]+' '+verbs[Math.floor(Math.random()*verbs.length)];}while(next===previous);previous=next;const panel=root.querySelector('.result-panel');panel.textContent=next;move(panel,[{transform:'rotate(-2deg) translateY(8px)',opacity:.4},{transform:'rotate(0) translateY(0)',opacity:1}]);});
}},
{id:'undo',title:'A second chance',kind:'Tools',description:'Remove something, then undo it. Personality is useful when it makes a mistake feel recoverable.',html:`<div class="task-item"><span>That weird idea</span><button class="remove" aria-label="Remove that weird idea">×</button></div><div class="toast" role="status" hidden><span>Idea parked.</span><button>Undo</button></div><p class="status">Try removing the idea.</p>`,init:root=>{
 const item=root.querySelector('.task-item'),toast=root.querySelector('.toast');root.querySelector('.remove').addEventListener('click',()=>{item.hidden=true;toast.hidden=false;root.querySelector('.status').textContent='Nothing is permanent here.';toast.querySelector('button').focus();move(toast,[{transform:'translateY(15px)',opacity:0},{transform:'translateY(0)',opacity:1}]);});toast.querySelector('button').addEventListener('click',()=>{item.hidden=false;toast.hidden=true;root.querySelector('.status').textContent='Back on the table.';root.querySelector('.remove').focus();});
}},
{id:'order',title:'Put first things first',kind:'Tools',description:'Reorder a small plan. Buttons make the same action available to a keyboard and a touch screen.',html:`<ol class="stack" style="list-style:none;margin:0;padding:0"><li class="task-item"><span>Make it work</span><button aria-label="Move Make it work up">↑</button></li><li class="task-item"><span>Make it clear</span><button aria-label="Move Make it clear up">↑</button></li><li class="task-item"><span>Make it feel good</span><button aria-label="Move Make it feel good up">↑</button></li></ol><p class="status" role="status">What matters first? Move a step up.</p>`,init:root=>{
 const list=root.querySelector('ol');root.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('li'),before=item.previousElementSibling;if(before){const positions=new Map([...list.children].map(row=>[row,row.getBoundingClientRect().top]));list.insertBefore(item,before);for(const row of list.children){const delta=positions.get(row)-row.getBoundingClientRect().top;if(delta)move(row,[{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:240});}button.focus();root.querySelector('.status').textContent=`${item.querySelector('span').textContent} moved up.`;}else root.querySelector('.status').textContent='Already at the top.';}));
}},
{id:'accordion',title:'Open a little thought',kind:'Tools',description:'Native disclosure, with a small reveal. The basics should still feel considered.',html:`<details><summary>Why creative computing?</summary><p>I like moving between how something looks, how it works and what people do with it.</p></details><details><summary>What am I making?</summary><p>Museum stories, desktop tools and ways to explore AI behaviour.</p></details><details><summary>What happens next?</summary><p>Make a version. Try it. Learn what needs changing.</p></details>`,init:root=>{
 root.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)move(details.querySelector('p'),[{transform:'translateY(-6px)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:220});}));
}},
{id:'beat',title:'Four beats of curiosity',kind:'Tools',description:'A four-step music toy. Choose notes, then play. Sound is always your choice.',html:`<div class="sequencer" role="group" aria-label="Four step sequencer"><button aria-label="Step 1" aria-pressed="true">01</button><button aria-label="Step 2" aria-pressed="false">02</button><button aria-label="Step 3" aria-pressed="true">03</button><button aria-label="Step 4" aria-pressed="false">04</button></div><div class="row"><button class="pill play-beat" aria-pressed="false">Play with sound ▶</button></div><p class="status" role="status">Sound off. Choose your steps.</p>`,init:root=>{
 const steps=[...root.querySelectorAll('.sequencer button')],play=root.querySelector('.play-beat'),status=root.querySelector('.status');let audio=null,timer=0,index=0;steps.forEach(button=>button.addEventListener('click',()=>button.setAttribute('aria-pressed',button.getAttribute('aria-pressed')!=='true')));const stop=()=>{clearInterval(timer);timer=0;steps.forEach(b=>b.classList.remove('beat'));play.textContent='Play with sound ▶';play.setAttribute('aria-pressed','false');status.textContent='Sound off. Choose your steps.';};const tick=()=>{steps.forEach(b=>b.classList.remove('beat'));const step=steps[index];step.classList.add('beat');if(step.getAttribute('aria-pressed')==='true'){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=[261.63,329.63,392,523.25][index];gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.12,audio.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.25);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.27);move(step,[{transform:'scale(.9)'},{transform:'scale(1)'}],{duration:250});}index=(index+1)%4;};play.addEventListener('click',async()=>{if(timer){stop();return;}try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();await audio.resume();play.textContent='Stop sound ■';play.setAttribute('aria-pressed','true');status.textContent='Playing. Change the steps as it goes.';tick();timer=setInterval(tick,360);}catch{status.textContent='Sound could not start. Try Play with sound again or use another browser.';}});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});document.addEventListener('labfilter',stop);
}}
];
experiments.push(...extraExperiments);
const grid=document.querySelector('.lab-grid');
for(const [index,example] of experiments.entries()){
 const card=document.createElement('article');card.className='lab-card';card.dataset.kind=example.kind;card.id=example.id;card.setAttribute("aria-label",example.title);
 card.innerHTML=`<div class="lab-stage"><div class="demo">${example.html}</div></div><div class="lab-info"><h2>${example.title}</h2><button type="button" class="source-button" data-source="${example.id}" aria-label="View code for ${example.title}">View code ↗</button><p>${example.description}</p><a class="experiment-link" href="#${example.id}" aria-label="Link to ${example.title}">Link to experiment ↗</a></div>`;
 grid.append(card);example.init(card.querySelector('.demo'));
}
const motionButton=document.querySelector('.lab-motion');
let motionOff=false;
function syncMotion(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const globalPaused=document.documentElement.dataset.reducedMotion==='true';
 const off=motionOff||reduced||globalPaused;
 document.body.classList.toggle('no-motion',off);
 if(off)document.getAnimations().forEach(animation=>animation.cancel());
 motionButton.textContent=reduced?'Reduced motion enabled':globalPaused?'Portfolio motion paused':off?'Enable motion':'Pause motion';
 motionButton.setAttribute('aria-label',reduced?'Reduced motion enabled by your device':globalPaused?'Portfolio motion paused. Enable motion in the footer.':off?'Enable experiment motion':'Pause experiment motion');
 motionButton.setAttribute('aria-pressed',String(!off));
 motionButton.disabled=reduced||globalPaused;
}
motionButton.addEventListener('click',()=>{motionOff=!motionOff;syncMotion();});
document.addEventListener('motionpreference',syncMotion);syncMotion();
const search=document.querySelector('#experiment-search');
const initialParams=new URLSearchParams(location.search);
let selectedKind=['All','Controls','Forms','Tools'].includes(initialParams.get('category'))?initialParams.get('category'):'All';
search.value=initialParams.get('q')||'';
document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===selectedKind)));
function filterExperiments(){
 document.dispatchEvent(new Event('labfilter'));
 const query=search.value.trim().toLocaleLowerCase();
 const terms=query.split(/\s+/).filter(Boolean);
 let count=0;
 for(const card of grid.children){
  const example=experiments.find(item=>item.id===card.id);
  const keywords={colour:'color rgb palette',beat:'music audio sound sequencer',push:'button bounce',hello:'form name greeting',type:'typography letters poster',mood:'slider range confidence'};
  const content=`${example.title} ${example.kind} ${example.description} ${keywords[example.id]||''}`.toLocaleLowerCase();
  const visible=(selectedKind==='All'||card.dataset.kind===selectedKind)&&terms.every(term=>content.includes(term));
  card.hidden=!visible;if(visible)count++;
 }
 document.querySelector('.lab-count').textContent=`${count} of ${experiments.length} experiments`;
 document.querySelector('.lab-search-status').textContent=count===experiments.length?`Showing all ${experiments.length} experiments.`:`Showing ${count} of ${experiments.length} experiments${query?' matching “'+search.value.trim()+'”':''}.`;
 document.querySelector('.lab-empty').hidden=count!==0;
 const url=new URL(location.href);
 if(query)url.searchParams.set('q',search.value.trim());else url.searchParams.delete('q');
 if(selectedKind!=='All')url.searchParams.set('category',selectedKind);else url.searchParams.delete('category');
 history.replaceState(null,'',url);
 document.querySelector('.clear-experiments').disabled=!search.value;
}
search.addEventListener('input',filterExperiments);
document.querySelector('.reset-experiments').addEventListener('click',()=>{
 search.value='';selectedKind='All';
 document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter==='All')));
 filterExperiments();search.focus();
});
document.querySelector('.clear-experiments').addEventListener('click',()=>{search.value='';filterExperiments();search.focus();});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 selectedKind=button.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 filterExperiments();
}));
filterExperiments();
addEventListener('pageshow',()=>{filterExperiments();});
if(location.hash){try{const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target&&!target.hidden)requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant'}));}catch{}}
const dialog=document.querySelector('.code-dialog'),code=dialog.querySelector('code'),codeStatus=dialog.querySelector('[role=status]');let selected=null,language='HTML';
const sharedCSS=JSON.parse(document.querySelector('#lab-style-source').textContent);
const jsFor=example=>`${installMotionPreferences.toString()}\ninstallMotionPreferences();\n${move.toString()}\n(${example.init.toString()})(document.querySelector('.demo'));`;
const cssFor=()=>`/* Shared playground styles, including reduced-motion support. */\n${sharedCSS}`;
function showCode(){code.textContent=language==='HTML'?`<div class="demo">\n${selected.html}\n</div>`:language==='CSS'?cssFor():jsFor(selected);dialog.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.language===language));codeStatus.textContent='';}
document.querySelectorAll('[data-source]').forEach(button=>button.addEventListener('click',()=>{selected=experiments.find(e=>e.id===button.dataset.source);language='HTML';dialog.querySelector('h2').textContent=selected.title;showCode();dialog.showModal();move(dialog,[{opacity:0,transform:'translateY(30px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:380});}));
let closing=false;
async function closeCode(){
 if(closing)return;closing=true;
 const animation=move(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(4px)'}],{duration:140,easing:'cubic-bezier(.4,0,1,1)'});
 try{if(animation)await animation.finished;}catch{}finally{dialog.close();closing=false;}
}
dialog.addEventListener('cancel',event=>{event.preventDefault();closeCode();});
dialog.querySelector('.close-code').addEventListener('click',closeCode);dialog.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language;showCode();}));
dialog.querySelector('.copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.textContent);codeStatus.textContent=`${language} code copied.`;}catch{codeStatus.textContent='Copy was unavailable. Select the code and use Ctrl+C (Windows) or Command+C (Mac).';}});
dialog.querySelector('.download-code').addEventListener('click',()=>{const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${selected.title}</title><style>body{font-family:Arial,sans-serif;background:#dce7fc;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}*{box-sizing:border-box}${cssFor()}</style><body><main class="demo">${selected.html}</main><script>${jsFor(selected)}<\/script></body></html>`;const url=URL.createObjectURL(new Blob([html],{type:'text/html'})),link=document.createElement('a');link.href=url;link.download=selected.id+'-experiment.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);codeStatus.textContent='Working demo download started. Open the HTML file in your browser to try it.';});
