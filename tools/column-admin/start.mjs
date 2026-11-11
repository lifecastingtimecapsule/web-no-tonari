// 変更履歴: 2026-11-11 外部公開できない固定ループバック起動を追加。
// 役割: 公開サイトと独立した管理サーバーを127.0.0.1:8792だけで開く。
import http from 'node:http';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {createAdmin} from './server.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const origin='http://127.0.0.1:8792';
const admin=await createAdmin({privateDirectory:root+'.local/column-admin',publicFile:root+'src/data/columns.json'});
const server=http.createServer({maxHeaderSize:8192,requestTimeout:15000,headersTimeout:10000},async(request,response)=>{
 try{
  const headers=new Headers();for(const [name,value] of Object.entries(request.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(','):value);
  const incoming=new Request(origin+(request.url??'/'),{method:request.method,headers,...(!['GET','HEAD'].includes(request.method)?{body:Readable.toWeb(request),duplex:'half'}:{})});
  const result=await admin.handle(incoming,origin);response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));
 }catch{response.writeHead(400,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});response.end('入力を処理できませんでした。');}
});
server.maxConnections=8;server.keepAliveTimeout=3000;
server.on('error',()=>{console.error('管理画面を起動できません。8792番が使用中か確認してください。');process.exitCode=1;});
server.listen(8792,'127.0.0.1',()=>{
 console.log('SITEVEIL コラム管理（このMac専用）');
 console.log(admin.setupRequired?`初回設定: ${origin}/#setup=${admin.setupUrlFragment}`:`ログイン: ${origin}/`);
 console.log('終了するには Control+C。初回設定URLは共有しないでください。');
});
