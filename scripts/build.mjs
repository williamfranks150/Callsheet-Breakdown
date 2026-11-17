import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const privateDir=process.env.CALLSHEET_PRIVATE_DIR || path.join(root,'.private');
const values=JSON.parse(fs.readFileSync(path.join(privateDir,'values.json'),'utf8'));
const bootstrap=JSON.parse(fs.readFileSync(path.join(privateDir,'bootstrap.json'),'utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let html=fs.readFileSync(path.join(root,'src/index.template.html'),'utf8');
html=html.replace(/\{\{(v\d+)\}\}/g,(_,key)=>{if(!(key in values))throw Error('Missing private content: '+key);return escape(values[key]);});
html=html.replace('__BOOTSTRAP_JSON__',JSON.stringify(bootstrap).replaceAll('<','\\u003c'));
const baseStyle='<link rel="stylesheet" href="/app/base.css">';
html=html.replace(baseStyle,'').replace('</title>','</title>'+baseStyle);
// Optional public-code origin. Production data requests remain same-origin.
if(process.env.CALLSHEET_CODE_BASE){
  const origin=new URL(process.env.CALLSHEET_CODE_BASE);
  if(origin.protocol!=='https:')throw Error('Code origin must use HTTPS');
  const prefix=origin.href.replace(/\/$/,'');
  html=html.replace(/(src|href)="\/app\//g,(_,attr)=>attr+'="'+prefix+'/');
}
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.cpSync(path.join(root,'app'),path.join(root,'dist/app'),{recursive:true});
const assets=path.join(privateDir,'assets');
if(fs.existsSync(assets))fs.cpSync(assets,path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
console.log('Built private application. Do not publish dist to public hosting.');
