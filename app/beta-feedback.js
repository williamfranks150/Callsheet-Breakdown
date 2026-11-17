(() => {
  const form=document.getElementById('beta-feedback-form');if(!form)return;
  const key='callsheet-feedback-draft-v1',status=document.getElementById('feedback-status');
  const fields=['type','page','summary','steps','expected','actual'];
  const values=()=>Object.fromEntries(fields.map(k=>[k,form.elements.namedItem(k).value.trim()]));
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const k of fields)if(typeof saved[k]==='string')form.elements.namedItem(k).value=saved[k];}catch{}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(values()));status.textContent='Draft saved on this device.';}catch{status.textContent='Draft storage unavailable. Copy your notes before leaving.';}};
  form.addEventListener('input',save);
  function report(){const v=values();return ['Callsheet Breakdown — Beta feedback','Build: '+(window.CALLSHEET_BOOTSTRAP.build||'127')+' · '+location.origin,'Type: '+v.type,'Page: '+v.page,'Summary: '+v.summary,'','Steps to reproduce:',v.steps||'Not supplied','','Expected:',v.expected||'Not supplied','','What happened:',v.actual||'Not supplied','','Device / browser:',navigator.userAgent].join('\n');}
  const preview=document.getElementById('feedback-preview');
  const review=()=>{preview.value=report();preview.hidden=false;};
  document.getElementById('feedback-review').addEventListener('click',review);
  document.getElementById('feedback-copy').addEventListener('click',async()=>{review();try{await navigator.clipboard.writeText(preview.value);status.textContent='Report copied. Paste it into your message to Bill.';}catch{preview.focus();preview.select();status.textContent='Select and copy the report above.';}});
  document.getElementById('feedback-download').addEventListener('click',()=>{review();const url=URL.createObjectURL(new Blob([preview.value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='callsheet-feedback-'+new Date().toISOString().slice(0,10)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Report downloaded. Send the file to Bill.';});
  form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;review();const address=window.CALLSHEET_BOOTSTRAP.feedbackEmail;if(!address){status.textContent='Copy the report and send it to the person who provided the app.';return;}location.href='mailto:'+encodeURIComponent(address)+'?'+new URLSearchParams({subject:'Callsheet Breakdown beta: '+values().summary,body:preview.value}).toString().replaceAll('+','%20');status.textContent='Email draft requested—not sent. Review it in your email app; attach screenshots there. If no draft opens, use Copy report.';});
})();
