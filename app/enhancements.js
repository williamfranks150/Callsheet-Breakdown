(() => {
  const $ = id => document.getElementById(id);
  function remainingAt(state,now){return state.end===null?state.remaining:Math.max(0,Math.ceil((state.end-now)/1000));}
  fetch('/day-context.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    const select=$('sides-unit');if(!select)return;
    function sides(){
      const unit=data.units.find(x=>x.id===select.value);if(!unit)return;
      $('sides-original').href=unit.sides_pdf;
      const summary=$('sides-summary');summary.replaceChildren();
      const h=document.createElement('h3');h.textContent=unit.name+' · '+unit.pages+' script pages';summary.append(h);
      const ul=document.createElement('ul');ul.className='scene-summary';
      for(const scene of unit.scenes){const li=document.createElement('li'),title=document.createElement('strong'),p=document.createElement('p');title.textContent=scene.number+' · '+scene.location;p.textContent=scene.summary;li.append(title,p);ul.append(li);}
      summary.append(ul);
      $('inline-sides').replaceChildren(...unit.images.map((src,i)=>{const img=document.createElement('img');img.src=src;img.alt=unit.name+' sides page '+(i+1);img.loading='lazy';return img;}));
    }
    select.addEventListener('change',sides);sides();
  }).catch(()=>{if($('sides-summary'))$('sides-summary').textContent='Sides summary did not load. Original PDF remains available.';});
  // Persist a deadline, never a decrementing counter: background suspension
  // cannot make the timer drift. Alerts while locked are not guaranteed.
  const KEY='callsheet-timer-v1';
  let timer={remaining:300,end:null};
  try { const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=86400&&(s.end===null||Number.isFinite(s.end)))timer=s; } catch {}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(timer));}catch{}};
  const trigger=document.createElement('button');trigger.type='button';
  trigger.className='timer-trigger';trigger.setAttribute('aria-label','Open timer');
  trigger.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m0 8V9m6-2 2-2"/></svg><span>Timer</span>';
  document.querySelector('.main-toolbar').append(trigger);
  const weatherTrigger=trigger.cloneNode(true);$('weather').querySelector('h2').before(weatherTrigger);
  const dlg=document.createElement('dialog');dlg.id='timer-dialog';
  dlg.setAttribute('aria-labelledby','timer-heading');
  dlg.innerHTML='<header><h2 id="timer-heading">Timer</h2><button type="button" data-close>Close</button></header><output id="timer-count" aria-label="Time remaining">05:00</output><label>Minutes <input id="timer-minutes" type="number" inputmode="numeric" min="1" max="1440" step="1" value="5"></label><div class="timer-actions"><button type="button" data-start>Start</button><button type="button" data-reset>Reset</button></div><p id="timer-status" role="status"></p><small>Time keeps running with the app closed. Sound while the screen is locked is not guaranteed.</small>';
  document.body.append(dlg);
  let wasRunning=false;
  function seconds(){return remainingAt(timer,Date.now());}
  function paint(){
    const n=seconds(),running=timer.end!==null;
    $('timer-count').textContent=String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
    trigger.querySelector('span').textContent=running?(n?'Timer '+$('timer-count').textContent:'Time’s up'):'Timer';
    weatherTrigger.querySelector('span').textContent=trigger.querySelector('span').textContent;
    dlg.querySelector('[data-start]').textContent=running?'Pause':timer.remaining?'Start':'Start again';
    $('timer-minutes').disabled=running;
    if(running&&n===0){timer={remaining:0,end:null};persist();$('timer-status').textContent='Time’s up';if(wasRunning&&document.visibilityState==='visible'&&navigator.vibrate)navigator.vibrate([200,100,200]);}
    wasRunning=running;
  }
  trigger.addEventListener('click',()=>{paint();dlg.showModal();});
  weatherTrigger.addEventListener('click',()=>{paint();dlg.showModal();});
  dlg.querySelector('[data-close]').addEventListener('click',()=>dlg.close());
  let backdrop=false;
  const outside=e=>{const r=dlg.getBoundingClientRect();return e.target===dlg&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);};
  dlg.addEventListener('pointerdown',e=>{backdrop=outside(e);});
  dlg.addEventListener('click',e=>{if(backdrop&&outside(e))dlg.close();backdrop=false;});
  dlg.querySelector('[data-start]').addEventListener('click',()=>{
    if(timer.end!==null)timer={remaining:seconds(),end:null};
    else {const n=timer.remaining||Math.max(1,Math.min(1440,Number($('timer-minutes').value)||5))*60;timer={remaining:n,end:Date.now()+n*1000};}
    $('timer-status').textContent='';persist();paint();
  });
  $('timer-minutes').addEventListener('change',()=>{timer={remaining:Math.max(1,Math.min(1440,Number($('timer-minutes').value)||5))*60,end:null};persist();paint();});
  dlg.querySelector('[data-reset]').addEventListener('click',()=>{timer={remaining:Math.max(1,Math.min(1440,Number($('timer-minutes').value)||5))*60,end:null};$('timer-status').textContent='';persist();paint();});
  setInterval(paint,500);document.addEventListener('visibilitychange',paint);window.addEventListener('pageshow',paint);paint();
  // Scroll affordances reflect real overflow, including dynamically loaded PDFs.
  const hint=document.createElement('button');hint.type='button';hint.className='scroll-hint';hint.hidden=true;document.body.append(hint);
  let scroller=null;
  function updateScroll(){
    scroller=null;
    if(dlg.open||$('settings-dialog')?.open||$('attachment-view')?.open){if(!hint.hidden)hint.hidden=true;return;}
    const page=document.querySelector('.page:not([hidden])');
    for(const n of [page,page?.querySelector('.page-content')]){
      if(n&&n.clientHeight>0&&n.scrollHeight>n.clientHeight+3&&/auto|scroll/.test(getComputedStyle(n).overflowY)){scroller=n;break;}
    }
    if(!scroller){if(!hint.hidden)hint.hidden=true;return;}
    const more=scroller.scrollTop+scroller.clientHeight<scroller.scrollHeight-4;
    if(hint.hidden)hint.hidden=false;const label=more?'↓ More':'↑ Top';if(hint.textContent!==label)hint.textContent=label;hint.setAttribute('aria-label',more?'Scroll to more content':'Scroll to top');
    hint.dataset.direction=more?'down':'up';
  }
  hint.addEventListener('click',()=>{if(scroller)scroller.scrollTo({top:hint.dataset.direction==='up'?0:scroller.scrollTop+scroller.clientHeight*.7,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
  document.addEventListener('scroll',updateScroll,true);window.addEventListener('resize',updateScroll);
  new MutationObserver(updateScroll).observe(document.body,{attributes:true,attributeFilter:['hidden','open'],childList:true,subtree:true});
  new ResizeObserver(updateScroll).observe(document.querySelector('main'));
  document.addEventListener('load',updateScroll,true);updateScroll();
  // Only verified personal IMDb identities are clickable.
  document.querySelectorAll('#personnel a[href*="imdb.com/"]').forEach(a=>{
    if(!/\/name\/nm\d+/.test(a.href)){const t=document.createElement('span');t.textContent=a.textContent.replace(/\s*↗/,'');a.replaceWith(t);}
  });
})();
