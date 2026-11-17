(() => {
  const $=id=>document.getElementById(id);
  const weatherLink=document.querySelector('.links a[aria-label="Open Weather"]');
  weatherLink.addEventListener('click',event=>{
    event.preventDefault();
    selectCategory('weather');
    $('weather-back').focus();
  });
  $('weather-back').addEventListener('click',()=>{selectCategory('itinerary');weatherLink.focus();});
  for(const [i,src] of (attachmentPages.sides??[]).entries()){
    const img=document.createElement('img');
    img.src=freshAsset(src);img.alt='Sides, page '+(i+1);img.loading='lazy';
    $('inline-sides').append(img);
  }

  const defaults={prep:60,early:20,parking:15,clearing:15};
  const fields=[
    ['prep','Get ready',180],['early','Early at tech trucks',90],
    ['parking','Parking / shuttle buffer',90],['clearing','Car clearing when needed',60]
  ];
  const storageKey='callsheet-breakdown-timing-v1';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(storageKey))||{};}catch{}
  let settings={};
  for(const [id,,max] of fields){
    const n=saved[id];if(Number.isInteger(n)&&n>=0&&n<=max&&n%5===0)settings[id]=n;
  }
  const timeline=document.querySelector('#itinerary .timeline');
  const note=$('timing-traffic-note');
  const original=timeline.cloneNode(true);
  const controls=new Map();
  let card;
  const fmt=n=>{
    const time=((n%1440)+1440)%1440,h=Math.floor(time/60);
    return (h%12||12)+':'+String(time%60).padStart(2,'0')+(h<12?' AM':' PM')+(n<0?' (prev. day)':'');
  };
  function render(){
    for(const [id,[input,output]] of controls){
      const current={prep:card?.preparation_minutes,parking:card?.parking_shuttle_minutes,clearing:card?.car_clearing_minutes};
      const n=settings[id]??current[id]??defaults[id];
      input.value=n;output.textContent=n+' min';input.setAttribute('aria-valuetext',n+' minutes');
    }
    if(!card)return;
    if(!Object.keys(settings).length&&Number.isFinite(card.traffic?.planning_minutes)){timeline.replaceChildren(...original.cloneNode(true).childNodes);note.hidden=true;return;}
    const [h,m]=card.individual_call.split(':').map(Number),call=h*60+m;
    const truck=call-(settings.early??20);
    const shuttle=settings.parking??card.parking_shuttle_minutes??15;
    const clearing=settings.clearing??card.car_clearing_minutes??0;
    const park=truck-shuttle;
    const duration=card.traffic?.planning_minutes;
    const leave=Number.isFinite(duration)?park-duration:null;
    const origin=original.textContent.includes('Leave hotel')?'Leave hotel':'Leave home';
    const ready=leave===null?null:leave-clearing-(settings.prep??card.preparation_minutes??60);
    const rows=[[ready,'Wake up'],[ready,'Get ready']];
    if(clearing>0)rows.push([leave===null?null:leave-clearing,'Clear / defrost car']);
    rows.push([leave,origin],[park,'Crew park target'],[truck,'Tech trucks'],[call,'Your call']);
    const nodes=rows.flatMap(([time,label])=>{
      const value=document.createElement('b'),name=document.createElement('span');
      value.textContent=time===null?'Pending':fmt(time);name.textContent=label;return [value,name];
    });
    timeline.replaceChildren(...nodes);
    const t=card.traffic?.departure?.match(/T(\d\d):(\d\d)/);
    note.hidden=leave!==null&&t!==undefined&&t!==null&&leave===+t[1]*60+ +t[2];
    note.textContent=leave===null?'Driving estimate pending.':('Adjusted departure uses the saved '+duration+' min driving allowance; traffic has not been checked for this time.');
  }
  function save(){
    try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{}
    render();
  }
  for(const [id,label,max] of fields){
    const box=document.createElement('div'), l=document.createElement('label');
    const input=document.createElement('input'),output=document.createElement('output');
    input.id='timing-'+id;input.type='range';input.min=0;input.max=max;input.step=5;
    l.htmlFor=input.id;l.append(label,output);output.htmlFor=input.id;
    input.addEventListener('input',()=>{settings[id]=Number(input.value);save();});
    box.append(l,input);$('timing-controls').append(box);controls.set(id,[input,output]);
  }
  $('timing-reset').addEventListener('click',()=>{settings={};save();});
  render();
  fetch(freshAsset('/update-status.json'),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    const identity=data.production_identity;
    if(identity?.verified===true && typeof identity.title==='string' &&
      identity.title.trim() && data.shoot_date===weatherConfig.date &&
      /^[a-f0-9]{64}$/.test(identity.call_sheet_sha256) &&
      identity.call_sheet_sha256===data.attachment_hashes?.call_sheet){
      $('production-title').textContent=identity.title.trim();
      document.title='Callsheet Breakdown · '+identity.title.trim();
    }
    if(data.shoot_date!==weatherConfig.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.individual_call))throw Error();
    card=data;
    render();
  }).catch(()=>{$('timing-controls').append('Published timing data unavailable.');});

  const icon=condition=>{
    const c=condition.toLowerCase(),cloud=c.includes('cloud'),sun=c.includes('sun'),night=c.includes('clear'),rain=/rain|shower|drizzle/.test(c),snow=/snow|flurr/.test(c);
    const sky=sun?'<circle cx="16" cy="15" r="6"/><path d="M16 3v3M16 24v3M4 15h3m18 0h3M7 6l2 2m14 14 2 2m0-18-2 2M9 22l-2 2"/>':night?'<path d="M26 21A10 10 0 0 1 13 7a11 11 0 1 0 13 14Z"/>':'';
    const cover=cloud||rain||snow||!sky?'<path d="M8 28h16a5 5 0 1 0-1-10 7 7 0 0 0-13 2 4 4 0 1 0-2 8Z" fill="var(--surface)"/>':'';
    return '<svg class="wx-icon" aria-hidden="true" viewBox="0 0 34 36" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+sky+cover+(rain?'<path d="m12 30-2 4m8-4-2 4m8-4-2 4"/>':snow?'<path d="M12 32h.01m5 2h.01m5-2h.01"/>':'')+'</svg>';
  };
  const hourly=$('workday-hourly');
  const display=(data)=>{
    if(data.date!==weatherConfig.date||!['AccuWeather','Environment Canada'].includes(data.provider)||!Array.isArray(data.hours))throw Error();
    const rows=data.hours.filter(row=>Number.isInteger(row.hour)&&row.hour>=weatherConfig.startHour&&row.hour<=weatherConfig.endHour&&typeof row.condition==='string'&&Number.isFinite(row.c));
    if(!rows.length)throw Error();
    const title=document.createElement('h3');title.textContent='Hourly forecast';
    const source=document.createElement('p');source.className='muted';source.textContent=data.provider+(data.provider==='Environment Canada'?' fallback · AccuWeather hourly unavailable':'')+' · '+data.date+' · '+fmt(rows[0].hour*60)+'–'+fmt(rows.at(-1).hour*60)+(data.wrapConfirmed?'':' coverage · Wrap not confirmed');
    const table=document.createElement('table');table.className='weather-table';
    const header=table.createTHead().insertRow();
    for(const name of ['Time','Sky','°C','Precip.','Wind km/h']){const cell=document.createElement('th');cell.scope='col';cell.textContent=name;header.append(cell);}
    const body=table.createTBody();
    for(const row of rows){
      const tr=body.insertRow();
      for(const [i,value] of [fmt(row.hour*60),row.condition,row.c,Number.isFinite(row.pop)?row.pop+'%':'—',row.wind??'—'].entries()){
        const cell=tr.insertCell();
        if(i===1){cell.innerHTML=icon(value);cell.setAttribute('aria-label',value);cell.title=value;}else cell.textContent=value;
      }
    }
    const wrap=document.createElement('div');wrap.className='weather-table-wrap';wrap.append(table);
    hourly.replaceChildren(title,source,wrap);
  };
  fetch(freshAsset('/workday-weather.json'),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(display)
    .catch(()=>{hourly.textContent='AccuWeather hourly forecast unavailable for this shoot date.';});
})();
