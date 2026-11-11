// 変更履歴: 2026-11-11 ローカル管理の認証・公開分離・入力境界の回帰検査を追加。
// 役割: 架空記事・一時ディレクトリで公開用データだけが選択されることを確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateArticle,parseBody,toPublicArticle} from './content.mjs';
const article={slug:'test-security',title:'架空の記事',summary:'テストの概要',category:'security',body:'## 見出し\n\n<script>alert(1)</script>\n\n- 項目',sources:[]};
test('記事の上限・URL・パスを検査する',()=>{
 assert.equal(validateArticle(article).slug,'test-security');
 for(const invalid of [{slug:'../secret'},{title:''},{body:'a'.repeat(30001)},{category:'x'},{sources:[{title:'悪い参照',url:'javascript:alert(1)'}]}])assert.throws(()=>validateArticle({...article,...invalid}));
});
test('本文はHTMLとして解釈しない構造に分ける',()=>{
 const blocks=parseBody(article.body); assert.equal(blocks[0].type,'heading'); assert.equal(blocks[1].text,'<script>alert(1)</script>'); assert.equal(blocks[2].type,'list');
});
test('公開用へ下書きメモ・認証・管理IDを混ぜない',()=>{
 const published=toPublicArticle({...article,id:'private-id',notes:'DRAFT_ONLY',password:'SECRET',publishedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'});
 assert.deepEqual(Object.keys(published).sort(),['slug','title','summary','category','body','sources','publishedAt','updatedAt'].sort());
 assert.ok(!JSON.stringify(published).includes('DRAFT_ONLY'));
});

import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAdmin} from './server.mjs';
/** 一時保存先だけを使い、実記事・実パスワードに触れずAPIを試す。 */
async function fixture(){
 const directory=await mkdtemp(join(tmpdir(),'siteveil-columns-'));
 const publicFile=join(directory,'public.json');await writeFile(publicFile,'[]');
 const admin=await createAdmin({privateDirectory:join(directory,'private'),publicFile,setupToken:'test-bootstrap-code-not-a-real-secret'});
 return {admin,directory,publicFile,cleanup:()=>rm(directory,{recursive:true,force:true})};
}
/** HTTPと同じOrigin/Cookie/CSRF契約で、実ネットワークなしにハンドラーを呼ぶ。 */
function call(admin,path,method='GET',body,headers={}){
 return admin.handle(new Request('http://127.0.0.1:8792'+path,{method,headers:{host:'127.0.0.1:8792',...(method==='POST'?{origin:'http://127.0.0.1:8792','content-type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),'http://127.0.0.1:8792');
}
/** 実運用とは別の架空パスワードで検査用セッションを作る。 */
async function setup(admin){
 const response=await call(admin,'/api/setup','POST',{setupToken:'test-bootstrap-code-not-a-real-secret',password:'test-only-long-password-123'});
 assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0];const state=await (await call(admin,'/api/state','GET',undefined,{cookie})).json();
 return {cookie,csrf:state.csrf};
}
test('未ログイン・別Host・外部Origin・CSRF欠如の変更を拒否する',async()=>{
 const fixtureState=await fixture();const {admin}=fixtureState;
 try{
  assert.equal((await call(admin,'/api/articles')).status,401);
  assert.equal((await call(admin,'/api/state','GET',undefined,{host:'evil.example'})).status,403);
  assert.equal((await call(admin,'/api/setup','POST',{}, {origin:'https://evil.example'})).status,403);
  assert.equal((await call(admin,'/api/setup','POST',{password:'test-only-long-password-123',setupToken:'wrong'})).status,403);
  const {cookie}=await setup(admin);
  assert.equal((await call(admin,'/api/articles','POST',article,{cookie})).status,403);
 }finally{await fixtureState.cleanup();}
});
test('下書きと公開を分離し、変更競合・公開解除・ログアウトを処理する',async()=>{
 const fixtureState=await fixture();const {admin,publicFile,directory}=fixtureState;
 try{
  const {cookie,csrf}=await setup(admin);const headers={cookie,'x-csrf-token':csrf};
  const save=await call(admin,'/api/articles','POST',{article,revision:0},headers);assert.equal(save.status,200);const saved=await save.json();
  assert.equal(await readFile(publicFile,'utf8'),'[]');
  assert.equal((await call(admin,'/api/articles','POST',{article:{...article,id:saved.article.id},revision:0},headers)).status,409);
  assert.equal((await call(admin,'/api/stage','POST',{id:saved.article.id,revision:1},headers)).status,200);
  assert.equal(JSON.parse(await readFile(publicFile,'utf8'))[0].slug,article.slug);
  assert.equal((await call(admin,'/api/unstage','POST',{id:saved.article.id,revision:1},headers)).status,200);
  assert.equal(JSON.parse(await readFile(publicFile,'utf8')).length,0);
  const authText=await readFile(join(directory,'private','auth.json'),'utf8');assert.ok(!authText.includes('test-only-long-password-123'));
  assert.match((await call(admin,'/api/state','GET',undefined,{cookie})).headers.get('cache-control'),/no-store/);
  assert.equal((await call(admin,'/api/logout','POST',{},headers)).status,200);
  assert.equal((await call(admin,'/api/articles','GET',undefined,{cookie})).status,401);
 }finally{await fixtureState.cleanup();}
});
test('初回設定後の再設定、ログイン連打、過大入力を拒否する',async()=>{
 const fixtureState=await fixture();const {admin}=fixtureState;
 try{
  await setup(admin);
  assert.equal((await call(admin,'/api/setup','POST',{})).status,409);
  assert.equal((await call(admin,'/api/login','POST',{password:'x'.repeat(70000)})).status,413);
  for(let attempt=0;attempt<5;attempt++)assert.equal((await call(admin,'/api/login','POST',{password:'wrong-password'})).status,401);
  assert.equal((await call(admin,'/api/login','POST',{password:'test-only-long-password-123'})).status,429);
 }finally{await fixtureState.cleanup();}
});
test('30分でセッションが失効し、再ログインできる',async()=>{
 const fixtureState=await fixture();let now=0;
 try{
  const admin=await createAdmin({privateDirectory:join(fixtureState.directory,'expiry-private'),publicFile:fixtureState.publicFile,setupToken:'test-bootstrap-code-not-a-real-secret',clock:()=>now});
  const {cookie}=await setup(admin);now=1800000;
  assert.equal((await call(admin,'/api/articles','GET',undefined,{cookie})).status,401);
  const login=await call(admin,'/api/login','POST',{password:'test-only-long-password-123'});assert.equal(login.status,200);assert.notEqual(login.headers.get('set-cookie').split(';')[0],cookie);
 }finally{await fixtureState.cleanup();}
});
test('公開用データの外部変更を、古い画面から上書きしない',async()=>{
 const fixtureState=await fixture();try{
  const {admin,publicFile}=fixtureState;const {cookie,csrf}=await setup(admin);const headers={cookie,'x-csrf-token':csrf};
  const saved=await (await call(admin,'/api/articles','POST',{article,revision:0},headers)).json();
  await writeFile(publicFile,JSON.stringify([{...article,slug:'another-post',publishedAt:'2026-11-11T00:00:00.000Z',updatedAt:'2026-11-11T00:00:00.000Z'}]));
  assert.equal((await call(admin,'/api/stage','POST',{id:saved.article.id,revision:1},headers)).status,409);
  assert.equal(JSON.parse(await readFile(publicFile,'utf8'))[0].slug,'another-post');
 }finally{await fixtureState.cleanup();}
});
test('初回設定のOrigin必須、JSON限定、Cookie保護、任意ファイル非公開',async()=>{
 const fixtureState=await fixture();try{
  const {admin}=fixtureState;
  const absentOrigin=new Request('http://127.0.0.1:8792/api/setup',{method:'POST',headers:{host:'127.0.0.1:8792','content-type':'application/json'},body:'{}'});
  assert.equal((await admin.handle(absentOrigin,'http://127.0.0.1:8792')).status,403);
  assert.equal((await call(admin,'/api/setup','POST',{}, {'content-type':'text/plain'})).status,415);
  const {cookie,csrf}=await setup(admin);
  assert.equal((await call(admin,'/.local/column-admin/auth.json','GET',undefined,{cookie})).status,404);
  assert.equal((await call(admin,'/../auth.json','GET',undefined,{cookie})).status,404);
  const login=await call(admin,'/api/login','POST',{password:'test-only-long-password-123'});
  assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal(login.headers.get('access-control-allow-origin'),null);
  assert.equal((await call(admin,'/api/articles','GET',undefined,{cookie})).status,401);
  assert.equal((await call(admin,'/api/stage','POST',{id:'../../secret',revision:1},{cookie,'x-csrf-token':csrf})).status,401);
 }finally{await fixtureState.cleanup();}
});
test('本人指定の10文字を許可し、9文字を拒否する',async()=>{
 const fixtureState=await fixture();try{
  const {admin}=fixtureState;
  assert.equal((await call(admin,'/api/setup','POST',{setupToken:'test-bootstrap-code-not-a-real-secret',password:'123456789'})).status,400);
  assert.equal((await call(admin,'/api/setup','POST',{setupToken:'test-bootstrap-code-not-a-real-secret',password:'Test-12345'})).status,200);
 }finally{await fixtureState.cleanup();}
});
