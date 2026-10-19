'use strict';
(()=>{
 const header=document.querySelector('.header');
 if(header)new ResizeObserver(()=>document.documentElement.style.setProperty('--header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`)).observe(header);
 const footer=document.querySelector('footer#contact');
 if(footer){
  const tools=document.createElement('div');tools.className='contact-tools';
  const copy=document.createElement('button');copy.className='copy-email';copy.type='button';copy.textContent='Copy email address';
  const status=document.createElement('p');status.setAttribute('role','status');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('JoshJoseph10@outlook.com');status.textContent='Email address copied.';}catch{status.textContent='Select the email address below and copy it, or use the email link.';}});
  tools.append(copy,status);footer.querySelector('.footer-bottom').before(tools);
 }
})();
