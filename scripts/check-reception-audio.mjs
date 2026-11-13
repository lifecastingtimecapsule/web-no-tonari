// 2026-11-13: Verify every static sample has a saved MP3; this check never uses a voice API.
import {readFileSync,statSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../src/data/reception-samples.json',import.meta.url),'utf8'));
const audioCatalog=JSON.parse(readFileSync(new URL('../src/data/reception-audio.json',import.meta.url),'utf8'));
let count=0;
for(const industry of catalog){for(let index=0;index<industry.scenarios.length;index++){
 if(!audioCatalog.available.includes(industry.id+'-'+(index+1)))continue;
 const filename=new URL('../public/audio/reception/'+industry.id+'-'+(index+1)+'.mp3',import.meta.url);
 const bytes=readFileSync(filename);const size=statSync(filename).size;
 if(size<20000||size>5*1024*1024)throw Error('Unexpected audio size: '+filename.pathname);
 if(bytes.toString('ascii',0,3)!=='ID3'&&!(bytes[0]===255&&(bytes[1]&224)===224))throw Error('MP3 signature missing');
 count++;
}}
if(count!==audioCatalog.available.length||count<1)throw Error('Published audio list mismatch');
const template=readFileSync(new URL('../src/pages/services/phone-reception/samples.astro',import.meta.url),'utf8');
if(!template.includes('preload="none"')||template.includes('autoplay')||template.includes('api.openai.com'))throw Error('Playback must stay static and user-initiated');
console.log('Verified '+count+' static MP3 files; no generation requested.');
