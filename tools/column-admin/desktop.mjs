// 変更履歴: 2026-11-11 デスクトップから、必要な時だけ管理サーバーを起動してログインを開く。
// 役割: 外部公開・パスワード保存・自動ログインを追加せず、Macの起動操作を一つにする。
import {spawn} from 'node:child_process';
import {open,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const origin='http://127.0.0.1:8792';
/** 固定URLの応答がSITEVEILの管理画面か確認し、別サービスの画面を開かない。 */
export async function probeAdmin(){
 try{
  const response=await fetch(origin+'/api/state',{redirect:'error',signal:AbortSignal.timeout(1200)});
  if(!response.ok)return {kind:'occupied'};
  const state=await response.json();
  if(typeof state.authenticated!=='boolean'||typeof state.setupRequired!=='boolean')return {kind:'occupied'};
  const page=await fetch(origin+'/',{redirect:'error',signal:AbortSignal.timeout(1200)});
  if(!page.ok||!(await page.text()).includes('<title>コラム管理 | SITEVEIL</title>'))return {kind:'occupied'};
  return {kind:'ready',setupRequired:state.setupRequired};
 }catch(error){return error.cause?.code==='ECONNREFUSED'?{kind:'stopped'}:{kind:'unavailable'};}
}
/** 起動済みなら再利用し、停止中なら同じローカル専用サーバーだけを起動する。 */
export async function ensureAdmin(){
 const current=await probeAdmin();
 if(current.kind==='ready')return current;
 if(current.kind!=='stopped')throw new Error('管理画面へ接続できません。8792番を使う別のアプリがないか確認してください。');
 await stat(root+'.local/column-admin/auth.json').catch(()=>{throw new Error('管理者の初回設定が必要です。SITEVEILの作業チャットへ「管理画面の初回設定を開いて」と依頼してください。');});
 await mkdir(root+'.local/column-admin',{recursive:true,mode:0o700});
 const log=await open(root+'.local/column-admin/desktop-server.log','a',0o600);
 let child;
 try{child=spawn(process.execPath,[root+'tools/column-admin/start.mjs'],{cwd:root,detached:true,stdio:['ignore',log.fd,log.fd],env:{PATH:'/usr/bin:/bin',LANG:'ja_JP.UTF-8'}});child.on('error',()=>{});child.unref();}finally{await log.close();}
 for(let attempt=0;attempt<40;attempt++){
  await new Promise(done=>setTimeout(done,200));
  const state=await probeAdmin();if(state.kind==='ready')return state;
 }
 throw new Error('管理画面の起動を確認できませんでした。SITEVEILの作業チャットへ起動確認を依頼してください。');
}
/** macOS標準の方法で画面を開く。--checkは画面を開かず起動確認だけに使う。 */
async function main(){
 try{
  const state=await ensureAdmin();
  if(state.setupRequired)throw new Error('管理者の初回設定が必要です。SITEVEILの作業チャットへご連絡ください。');
  if(process.argv.includes('--check')){console.log('SITEVEIL管理画面: ローカル接続OK');return;}
  const browser=spawn('/usr/bin/open',[origin+'/'],{stdio:'ignore'});
  browser.on('error',()=>{console.error('ブラウザを開けませんでした。http://127.0.0.1:8792/ を開いてください。');});
 }catch(error){
  const message=`SITEVEIL コラム管理\n\n${error.message}\n\nパスワードや下書きを変更する操作は行っていません。\n`;
  console.error(message);process.exitCode=1;
  if(!process.argv.includes('--check')){
   await mkdir(root+'.local/column-admin',{recursive:true,mode:0o700});
   const notice=root+'.local/column-admin/desktop-error.txt';await writeFile(notice,message,{mode:0o600});
   spawn('/usr/bin/open',[notice],{stdio:'ignore'}).on('error',()=>{});
  }
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
