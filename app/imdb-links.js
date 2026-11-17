(() => {
  // Identity verified against IMDb biographies, camera roles and Toronto credits.
  const profiles = {
    'Bill Franks':'nm2692530',
    'Gregor Hagey':'nm0353563',
    'Brad Hruboska':'nm0398662',
    'Ari Magder':'nm3351590',
    'Robert Murdoch':'nm5684507',
    'Austin Grass':'nm7356627',
    'Joseph Perron':'nm9835760',
    'Morning Glory':'nm3684724',
    'Adam Tupper':'nm2115816',
    'Stepan Sivko':'nm1964964',
    'Sarah Beck':'nm9013232',
    'Shakithyan Niranjan':'nm5709105',
    'David Watts':'nm0915129',
    'Chris Noble':'nm4415267',
    'Kyle Church':'nm10427044'
  };
  const apply = () => {
    const crew=document.getElementById('personnel');if(!crew)return;
    crew.querySelectorAll('a[href*="imdb.com"]').forEach(a=>{
      if(!/^https:\/\/(?:www\.)?imdb\.com\/name\/nm\d+\/?(?:\?.*)?$/.test(a.href))a.replaceWith(document.createTextNode(a.textContent.replace(/\s*↗/,'')));
    });
    crew.querySelectorAll('li strong').forEach(name=>{
      if(name.querySelector('a'))return;
      const text=name.textContent.trim(),id=profiles[text];if(!text)return;
      const link=document.createElement('a');
      link.href=id?'https://www.imdb.com/name/'+id+'/':'https://www.imdb.com/find/?'+new URLSearchParams({q:text,s:'nm'});
      const section=name.closest('.crew-group')?.querySelector('h3')?.textContent||'Crew';
      const department=/Camera|Electric|Lighting|Grip/i.test(section)?'Camera and Electrical Department':section;
      link.title=id?'Verified IMDb profile':'Search IMDb names · '+department;
      link.dataset.imdb=id?'profile':'search';link.target='_blank';link.rel='noopener noreferrer';link.textContent=text+' ↗';name.replaceChildren(link);
    });
  };
  apply();window.addEventListener('callsheet-date-selected',apply);
})();
