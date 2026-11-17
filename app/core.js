// Refresh the published document with a unique URL, including its attachment assets.
const refreshToken=new URL(location.href).searchParams.get('_refresh');
function freshAsset(value){const url=new URL(value,location.href);if(refreshToken)url.searchParams.set('_refresh',refreshToken);return url.href;}
const refreshButton=document.getElementById('refresh-card');
const refreshStatus=document.getElementById('refresh-status');
refreshButton.addEventListener('click',async()=>{
 if(refreshButton.disabled)return;
 refreshButton.disabled=true;refreshButton.setAttribute('aria-busy','true');
 refreshStatus.hidden=false;refreshStatus.textContent='Checking for the latest published card…';fitScreens();
 const next=new URL(location.href);next.searchParams.set('_refresh',Date.now().toString());
 try{
  const response=await fetch(next.href,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Refresh failed');
  const html=await response.text();
  if(!html.includes('id="refresh-card"')||!html.includes('id="itinerary"'))throw Error('Unexpected page');
  location.replace(next.href);
 }catch(error){
  refreshButton.disabled=false;refreshButton.removeAttribute('aria-busy');
  refreshStatus.textContent='Couldn’t refresh. Check your connection and try again.';fitScreens();
 }
});

const viewer=document.getElementById('attachment-view');
const attachmentWorkspace=document.createElement('div');attachmentWorkspace.className='attachment-workspace';
const mapGuide=document.createElement('aside');mapGuide.className='map-area-guide';mapGuide.hidden=true;mapGuide.setAttribute('aria-label','Downsview area guide');
mapGuide.innerHTML=window.CALLSHEET_BOOTSTRAP.guide;
const originalCanvas=document.getElementById('attachment-canvas');originalCanvas.before(attachmentWorkspace);attachmentWorkspace.append(mapGuide,originalCanvas);
function configureMapGuide(key){const show=key==='production-map'&&false;mapGuide.hidden=!show;attachmentWorkspace.classList.toggle('has-area-guide',show);mapGuide.querySelector('details').open=show&&matchMedia('(min-width:700px)').matches;}
let attachmentLink;
function closeAttachment(){viewer.close();document.getElementById('attachment-canvas').replaceChildren();if(attachmentLink)attachmentLink.focus();}
document.getElementById('close-attachment').addEventListener('click',closeAttachment);
viewer.addEventListener('cancel',event=>{event.preventDefault();closeAttachment();});



// Keep page navigation outside each scrollable content area.
document.querySelectorAll('.page').forEach(page=>{const nav=page.querySelector('.nav');if(nav)page.append(nav);});
const attachmentPages=window.CALLSHEET_BOOTSTRAP.attachments;
let currentAttachmentPages=[],attachmentIndex=0;
function renderAttachment(){document.getElementById('attachment-count').textContent=(attachmentIndex+1)+' / '+currentAttachmentPages.length;document.getElementById('attachment-previous').disabled=attachmentIndex===0;document.getElementById('attachment-next').disabled=attachmentIndex>=currentAttachmentPages.length-1;}
function openAttachment(link){const key=new URL(link.href,location.href).pathname.split('/').pop().replace('.pdf','');configureMapGuide(key);document.getElementById('attachment-title').textContent=/map/.test(key)?'Production Map':/sides/.test(key)?'Sides':/call-sheet/.test(key)?'Callsheet Breakdown':'Attachment';document.getElementById('attachment-original').href=freshAsset(link.href);currentAttachmentPages=attachmentPages[key]||[];attachmentIndex=0;if(!currentAttachmentPages.length){const frame=document.createElement('iframe');frame.src=freshAsset(link.href);frame.title=link.textContent.trim()||'PDF document';frame.style.cssText='width:100%;height:100%;border:0;flex:0 0 100%';document.getElementById('attachment-canvas').replaceChildren(frame);document.getElementById('attachment-count').textContent='';document.getElementById('attachment-previous').disabled=true;document.getElementById('attachment-next').disabled=true;return;}const canvas=document.getElementById('attachment-canvas');canvas.replaceChildren(...currentAttachmentPages.map((src,i)=>{const slide=document.createElement('div');slide.className='attachment-slide';const img=document.createElement('img');img.src=freshAsset(src);img.alt='Attachment page '+(i+1);img.draggable=false;slide.append(img);return slide;}));canvas.scrollTop=0;canvas.scrollLeft=0;renderAttachment();}

document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{const target=document.getElementById(link.getAttribute('href').slice(1));const content=target?.querySelector('.page-content');if(content)content.scrollTop=0;}));

const pageStrip=document.querySelector('main');
const swipePages=Array.from(pageStrip.querySelectorAll('.page:not(#weather)'));
function changeCategoryBy(delta){if(document.body.classList.contains('weather-open'))return;const index=swipePages.findIndex(page=>!page.hidden);const next=index+delta;if(next>=0&&next<swipePages.length)selectCategory(swipePages[next].id);}
document.addEventListener('keydown',event=>{if(viewer.open||document.getElementById('settings-dialog').open||!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('input,textarea,select'))return;event.preventDefault();changeCategoryBy(event.key==='ArrowRight'?1:-1);});
pageStrip.style.touchAction='pan-y pinch-zoom';
let categoryTouch=null;
pageStrip.addEventListener('touchstart',event=>{categoryTouch=event.touches.length===1&&!viewer.open&&!document.getElementById('settings-dialog').open&&!event.target.closest('input,textarea,select,button')?{x:event.touches[0].clientX,y:event.touches[0].clientY,time:Date.now()}:null;},{passive:true});
pageStrip.addEventListener('touchmove',event=>{if(event.touches.length!==1){categoryTouch=null;return;}if(categoryTouch&&Math.abs(event.touches[0].clientY-categoryTouch.y)>30&&Math.abs(event.touches[0].clientY-categoryTouch.y)>Math.abs(event.touches[0].clientX-categoryTouch.x))categoryTouch=null;},{passive:true});
pageStrip.addEventListener('touchcancel',()=>{categoryTouch=null;},{passive:true});
pageStrip.addEventListener('touchend',event=>{const start=categoryTouch;categoryTouch=null;if(!start||event.touches.length||!event.changedTouches.length||Date.now()-start.time>900)return;const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;if(Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.4){event.preventDefault();changeCategoryBy(dx<0?1:-1);}},{passive:false});

const attachmentCanvas=document.getElementById('attachment-canvas');
attachmentCanvas.addEventListener('scroll',()=>{if(!attachmentCanvas.clientHeight||!currentAttachmentPages.length)return;attachmentIndex=Math.max(0,Math.min(currentAttachmentPages.length-1,Math.round(attachmentCanvas.scrollTop/attachmentCanvas.clientHeight)));renderAttachment();},{passive:true});
const attachmentNavigation=viewer.querySelector('.attachment-navigation');
for(const [id,label,delta] of [['attachment-previous','↑ Previous',-1],['attachment-next','Next ↓',1]]){const button=document.createElement('button');button.id=id;button.type='button';button.textContent=label;button.addEventListener('click',()=>moveAttachment(delta));if(delta<0)attachmentNavigation.prepend(button);else attachmentNavigation.append(button);}
function moveAttachment(delta){const next=Math.max(0,Math.min(currentAttachmentPages.length-1,attachmentIndex+delta));const slide=attachmentCanvas.children[next];if(slide){attachmentCanvas.scrollTo({top:slide.offsetTop-attachmentCanvas.firstElementChild.offsetTop,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}
document.addEventListener('keydown',event=>{if(!viewer.open||!currentAttachmentPages.length||event.target.closest('.map-area-guide')||!['ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.key))return;event.preventDefault();moveAttachment(['ArrowDown','PageDown'].includes(event.key)?1:-1);});

function toggleAttachmentZoom(slide,x,y){
 const img=slide.querySelector('img');if(!img?.naturalWidth)return;
 if(slide.classList.contains('attachment-zoomed')){slide.classList.remove('attachment-zoomed');img.style.width='';img.style.height='';slide.scrollLeft=0;slide.scrollTop=0;return;}
 const rect=slide.getBoundingClientRect(),fit=Math.min((slide.clientWidth-8)/img.naturalWidth,(slide.clientHeight-8)/img.naturalHeight),width=img.naturalWidth*fit,height=img.naturalHeight*fit;
 const px=Math.max(0,Math.min(1,(x-rect.left-(slide.clientWidth-width)/2)/width)),py=Math.max(0,Math.min(1,(y-rect.top-(slide.clientHeight-height)/2)/height));
 const scale=Math.max(2.5,Math.min(4,slide.clientWidth/width));slide.classList.add('attachment-zoomed');img.style.width=(width*scale)+'px';img.style.height=(height*scale)+'px';slide.scrollLeft=px*width*scale-slide.clientWidth/2;slide.scrollTop=py*height*scale-slide.clientHeight/2;
}
let attachmentTapStart=null,lastAttachmentTap=null,lastAttachmentTouch=0;
attachmentCanvas.addEventListener('touchstart',event=>{attachmentTapStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY,time:Date.now(),slide:event.target.closest('.attachment-slide')}:null;if(event.touches.length!==1)lastAttachmentTap=null;},{passive:true});
attachmentCanvas.addEventListener('touchmove',event=>{if(event.touches.length!==1||!attachmentTapStart)return;const t=event.touches[0];if(Math.hypot(t.clientX-attachmentTapStart.x,t.clientY-attachmentTapStart.y)>12){attachmentTapStart=null;lastAttachmentTap=null;}},{passive:true});
attachmentCanvas.addEventListener('touchcancel',()=>{attachmentTapStart=null;lastAttachmentTap=null;},{passive:true});
attachmentCanvas.addEventListener('touchend',event=>{const start=attachmentTapStart;attachmentTapStart=null;lastAttachmentTouch=Date.now();if(!start?.slide||event.touches.length||Date.now()-start.time>250)return;
 if(lastAttachmentTap&&lastAttachmentTap.slide===start.slide&&Date.now()-lastAttachmentTap.time<350&&Math.hypot(start.x-lastAttachmentTap.x,start.y-lastAttachmentTap.y)<35){toggleAttachmentZoom(start.slide,start.x,start.y);lastAttachmentTap=null;}else lastAttachmentTap={...start,time:Date.now()};
},{passive:true});
attachmentCanvas.addEventListener('dblclick',event=>{if(Date.now()-lastAttachmentTouch<700)return;const slide=event.target.closest('.attachment-slide');if(slide){event.preventDefault();toggleAttachmentZoom(slide,event.clientX,event.clientY);}});

document.querySelectorAll('a[href$=".pdf"]:not(#attachment-original)').forEach(link=>link.addEventListener('click',event=>{
 if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();attachmentLink=link;openAttachment(link);viewer.showModal();
}));

const weatherConfig=window.CALLSHEET_BOOTSTRAP.weather;
const appTabs=Array.from(document.querySelectorAll('.app-tabs a'));
function selectCategory(id){if(id!=='weather'&&!swipePages.some(page=>page.id===id))id='itinerary';document.body.classList.toggle('weather-open',id==='weather');try{sessionStorage.setItem('getup-active-page',id);}catch{}pageStrip.querySelectorAll('.page').forEach(page=>page.hidden=page.id!==id);appTabs.forEach(tab=>{if(tab.hash==='#'+id)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');});fitScreens();}
appTabs.forEach(tab=>tab.addEventListener('click',event=>{event.preventDefault();selectCategory(tab.hash.slice(1));}));
function fitScreens(){document.querySelectorAll('.page:not([hidden]):not(#itinerary):not(#travel):not(#weather):not(#month-schedule):not(#sides):not(#personnel) .page-content').forEach(box=>{box.style.transform='none';box.style.width='100%';const page=box.parentElement;const cs=getComputedStyle(page);const available=page.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);let scale=1;for(let i=0;i<3;i++){const height=box.scrollHeight;if(height*scale<=available+1)break;scale=Math.min(1,available/height);box.style.width=(100/scale)+'%';}box.style.transform='scale('+scale+')';});}
let initialPage='itinerary';try{initialPage=sessionStorage.getItem('getup-active-page')||initialPage;}catch{}selectCategory(initialPage);window.addEventListener('resize',fitScreens);document.fonts.ready.then(fitScreens);



const settingsDialog=document.getElementById('settings-dialog');
const isSettingsBackdrop=(event)=>{
  if(event.target!==settingsDialog)return false;
  const {left,right,top,bottom}=settingsDialog.getBoundingClientRect();
  return event.clientX<left||event.clientX>=right||event.clientY<top||event.clientY>=bottom;
};
let settingsBackdropPress=false;
settingsDialog.addEventListener('pointerdown',event=>{settingsBackdropPress=isSettingsBackdrop(event);});
settingsDialog.addEventListener('pointercancel',()=>{settingsBackdropPress=false;});
settingsDialog.addEventListener('click',event=>{
  const dismiss=settingsBackdropPress&&isSettingsBackdrop(event);
  settingsBackdropPress=false;
  if(dismiss)settingsDialog.close();
});
const settingsAction=document.getElementById('settings-close');
let settingsPanel='menu',settingsOrigin;
settingsDialog.addEventListener('close',()=>document.getElementById('open-settings').setAttribute('aria-expanded','false'));
function showSettingsPanel(name){
  settingsPanel=name;
  document.querySelectorAll('[data-settings-panel]').forEach(p=>p.hidden=p.dataset.settingsPanel!==name);
  document.getElementById('settings-heading').textContent={menu:'Settings',timing:'Timing',privacy:'Privacy',data:'Data & permissions',about:'About & support'}[name];
  settingsAction.textContent=name==='menu'?'Close':'Done';
  settingsAction.setAttribute('aria-label',name==='menu'?'Close settings':'Done, return to Settings');
  document.getElementById('settings-body').scrollTop=0;
}
document.getElementById('open-settings').addEventListener('click',()=>{settingsOrigin=null;showSettingsPanel('menu');settingsDialog.showModal();document.getElementById('open-settings').setAttribute('aria-expanded','true');});
settingsAction.addEventListener('click',()=>{
  if(settingsPanel==='menu'){settingsDialog.close();return;}
  showSettingsPanel('menu');
  settingsOrigin?.focus({preventScroll:true});
});
document.querySelectorAll('[data-settings-go]').forEach(b=>b.addEventListener('click',()=>{settingsOrigin=b;showSettingsPanel(b.dataset.settingsGo);settingsAction.focus({preventScroll:true});}));

