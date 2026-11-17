(() => {
  // Identity verified against IMDb biographies, camera roles and Toronto credits.
  const profiles = {
    'Bill Franks':'nm2692530',
    'Gregor Hagey':'nm0353563',
    'Brad Hruboska':'nm0398662',
    'Ari Magder':'nm3351590'
  };
  const apply = () => {
    const crew=document.getElementById('personnel');if(!crew)return;
    crew.querySelectorAll('a[href*="imdb.com"]').forEach(a=>{
      if(!/^https:\/\/(?:www\.)?imdb\.com\/name\/nm\d+\/?(?:\?.*)?$/.test(a.href))a.replaceWith(document.createTextNode(a.textContent.replace(/\s*↗/,'')));
    });
    crew.querySelectorAll('strong').forEach(name=>{
      const id=profiles[name.textContent.trim()];if(!id||name.querySelector('a'))return;
      const link=document.createElement('a');link.href='https://www.imdb.com/name/'+id+'/';link.target='_blank';link.rel='noopener noreferrer';link.textContent=name.textContent+' ↗';name.replaceChildren(link);
    });
  };
  apply();window.addEventListener('callsheet-date-selected',apply);
})();
