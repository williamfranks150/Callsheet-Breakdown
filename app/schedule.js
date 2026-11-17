(() => {
  const $ = id => document.getElementById(id);
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = key => today.find(x => x.type === key).value;
  const todayKey = [part('year'),part('month'),part('day')].join('-');
  let year=+part('year'), month=+part('month')-1, selected=todayKey, data={};
  const iso = d => d.toISOString().slice(0,10);
  function el(tag,value){const n=document.createElement(tag);n.textContent=value;return n;}
  const isOff = entry => entry.label==='Off' || (entry.label==='Hotel' && entry.production?.some(item=>/company day off/i.test(item)));
  const isConfirmed = entry => ['FINAL','REVISED'].includes(entry.status);
  const isProductionConfirmed = entry => isConfirmed(entry)||entry.booking==='BOOKABLE';
  const borderKind = entry => !entry?'':entry.travel||entry.label==='Travel'?'travel':
    isOff(entry)&&isConfirmed(entry)?'off':!isProductionConfirmed(entry)?'tentative':
    entry.label==='Shoot'||entry.booking==='BOOKABLE'?'confirmed':'';
  function drawDash(target){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','month-dash');svg.setAttribute('aria-hidden','true');
    const rect=document.createElementNS(svg.namespaceURI,'rect');rect.setAttribute('pathLength','100');svg.append(rect);target.append(svg);
  }
  const legend=document.querySelector('#month-schedule .booking-legend');
  legend.replaceChildren(...[
    ['confirmed','Confirmed / bookable'],['tentative','Tentative'],
    ['off','DAY OFF'],['travel','TRAVEL'],['','Unspecified']
  ].map(([kind,label])=>{
    const item=el('span','');const swatch=el('i','');swatch.dataset.border=kind;
    swatch.setAttribute('aria-hidden','true');if(kind==='tentative')drawDash(swatch);
    item.append(swatch,el('span',label));return item;
  }));
  function details(){
    const box=$('month-detail'), entry=data[selected];
    box.replaceChildren();
    if(!selected)return;
    const label=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',dateStyle:'full'}).format(new Date(selected+'T12:00:00Z'));
    const kind=borderKind(entry);
    box.append(el('h3',label+(entry?(kind==='travel'?' · TRAVEL':kind==='off'?' · DAY OFF':isConfirmed(entry)?' · '+entry.status:entry.booking==='BOOKABLE'?' · Production bookable':' · '+entry.status):' · No verified schedule')));
    if(!entry)return;
    const units=entry.units??[];
    for(const unit of units){const p=el('p',[unit.name,unit.block?'Block '+unit.block:null,unit.day?'Day '+unit.day:null].filter(Boolean).join(' · '));box.append(p);if(unit.general_call)box.append(el('p','General crew · '+unit.general_call));}
    if(!units.length)for(const item of entry.production??[])box.append(el('p',item));
    for(const [key,value]of [['Your call',entry.personal_booking==='CONFIRMED'?entry.call:null],['General crew',units.length?null:entry.general_call],['Parking',entry.park],['Tech trucks',entry.trucks]])if(value)box.append(el('p',key+' · '+value));
    if(entry.travel){
      const t=entry.travel;
      for(const [key,value] of [['Departure location',t.origin],['Departure time',t.departure],['Arrival location',t.destination],['Arrival time',t.arrival],['Transportation',t.transport],['Accommodation',t.hotel],['Production instructions',t.instructions]]){
        if(value)box.append(el('p',key+' · '+value));
      }
    }
    if(!entry.travel&&entry.location&&!isOff(entry))box.append(el('p',entry.location));
    if(entry.call_conflict)box.append(el('p',entry.call_conflict));
    const sources=entry.sources??[];
    for(const [name,url] of sources){
      const a=el('a',name+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);
    }
  }
  function render(restoreFocus=false){
    const first=new Date(Date.UTC(year,month,1)), grid=$('month-grid');
    $('month-title').textContent=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'long'}).format(first);
    const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    const prefix=(first.getUTCDay()+6)%7;
    grid.replaceChildren();
    for(let i=0;i<prefix;i++){const n=el('span','');n.setAttribute('aria-hidden','true');grid.append(n);}
    for(let day=1;day<=count;day++){
      const key=iso(new Date(Date.UTC(year,month,day))), entry=data[key];
      const b=el('button','');b.type='button';b.className='month-date';b.dataset.date=key;b.append(el('span',day));
      if(prefix>=4 && day<=7-prefix)b.classList.add('compact-week');
      const border=borderKind(entry), travel=border==='travel';
      const dayType=travel?'TRAVEL':entry&&isOff(entry)?'DAY OFF':entry?.label;
      const destination=travel?(entry.travel?.short||entry.short||entry.travel?.destination):entry?.short;
      b.setAttribute('aria-label',[key,dayType,destination,entry&&isConfirmed(entry)?entry.call:null,entry?.booking==='BOOKABLE'&&!isConfirmed(entry)?'Production bookable':entry?.status,entry?.changed?'updated':''].filter(Boolean).join(' · '));
      b.setAttribute('aria-pressed',String(key===selected));
      if(key===todayKey)b.setAttribute('aria-current','date');
      if(entry){
        const work=entry.label==='Shoot', unit=entry.unit==='splinter';
        const off=isOff(entry);
        b.dataset.kind=travel?'travel':unit?'splinter':work?'work':off?'off':'other';
        b.dataset.border=border;
        if(border==='tentative')drawDash(b);
        b.dataset.status=entry.status;
        if(entry.booking)b.dataset.booking=entry.booking;
        if(entry.changed)b.classList.add('changed');
        const caption=travel?'TRAVEL':work?(entry.short||'TBC'):off?'DAY OFF':entry.label;
        const label=el('small',caption);label.className='month-day-label';b.append(label);
        const meta=travel?destination:work&&entry.call&&isConfirmed(entry)?entry.call:unit?'Splinter':entry.label==='Hotel'?(off?'Hotel':entry.short):'';
        if(meta){const sub=el('small',meta);sub.className='month-day-meta';b.append(sub);}
        const units=entry.units?.map(u=>u.name.replace(' Unit','')+' B'+u.block+' D'+u.day)??(entry.production??[]).map(s=>s.replace('Block ','B').replace(' · Day ',' D')).filter(s=>/B\d/.test(s));
        if(units.length){const unitLabel=el('small',units.join(' / '));unitLabel.className='unit-label';b.append(unitLabel);}
      }
      b.addEventListener('click',()=>{selected=selected===key?'':key;render(true);if(!selected)grid.querySelector('[data-date="'+key+'"]')?.focus();});grid.append(b);
    }
    details();
    if(restoreFocus&&selected)grid.querySelector('[data-date="'+selected+'"]')?.focus();
  }
  function move(n){const next=new Date(Date.UTC(year,month+n,1));year=next.getUTCFullYear();month=next.getUTCMonth();selected='';render();}
  $('month-prev').addEventListener('click',()=>move(-1));
  $('month-next').addEventListener('click',()=>move(1));
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>selectCategory(b.dataset.jump)));
  render();
  fetch('/schedule-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(x=>{data=x;render();}).catch(()=>{$('month-detail').textContent='Schedule data did not load.';});
})();
