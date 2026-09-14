(() => {
  const body=document.body,story=document.getElementById('story'),header=document.getElementById('header');
  const scenes=[...document.querySelectorAll('.scene')];
  const nav=document.getElementById('navigation'),toggle=document.querySelector('.menu-toggle');
  const media=matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  const progress=document.querySelector('.reading-progress span');
  let raf=0,current=0,goal=0;
  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  function setMenu(open){toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);toggle.querySelector('span').textContent=open?'−':'+';}
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);toggle.blur();}});
  function render(){
    current+=(goal-current)*.16;if(Math.abs(goal-current)<.0003)current=goal;
    let selected=0;
    scenes.forEach((scene,i)=>{
      const local=current-i;
      const opacity=i===0?1:clamp(local/.2+1);
      const showing=i===0||opacity>0;
      scene.classList.toggle('active',showing);
      scene.style.opacity=String(opacity);
      scene.style.clipPath=i===0?'none':`inset(${(1-opacity)*100}% 0 0 0)`;
      const img=scene.querySelector('.scene-image');
      img.style.transform=`scale(${1.02+clamp(local,0,1)*.07}) translateY(${-clamp(local,0,1)*1.5}%)`;
      if(current>=i-.1)selected=i;
    });
    scenes.forEach((scene,i)=>{scene.inert=i!==selected;scene.setAttribute('aria-hidden',String(i!==selected));});
    header.classList.toggle('light',selected===2);header.classList.toggle('solid',selected===1);
    document.querySelectorAll('nav a').forEach(a=>{const idx=a.hash==='#visit'?2:a.hash==='#stop'?0:1;if(idx===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    progress.style.width=`${clamp(current/2.7)*100}%`;
    raf=current!==goal?requestAnimationFrame(render):0;
  }
  function update(){if(!media.matches)return;goal=clamp((scrollY-story.offsetTop)/Math.max(1,story.offsetHeight-innerHeight))*2.7;if(!raf)raf=requestAnimationFrame(render);}
  function configure(){
    body.classList.toggle('motion',media.matches);if(raf)cancelAnimationFrame(raf);raf=0;
    scenes.forEach(s=>{s.removeAttribute('style');s.classList.remove('active');s.inert=false;s.removeAttribute('aria-hidden');s.querySelector('.scene-image').removeAttribute('style');});
    header.classList.remove('light','solid');current=goal=0;if(media.matches)update();
  }
  function goTo(hash){
    if(!document.querySelector(hash))return;
    if(media.matches){const idx=hash==='#visit'?2:hash==='#stop'||hash==='#main'?0:1;const target=story.offsetTop+(idx/2.7)*(story.offsetHeight-innerHeight);scrollTo({top:target,behavior:'smooth'});}
    else document.querySelector(hash).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setMenu(false);history.replaceState(null,'',a.hash);goTo(a.hash);}));
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);media.addEventListener('change',configure);configure();
  if(location.hash)requestAnimationFrame(()=>goTo(location.hash));
})();
