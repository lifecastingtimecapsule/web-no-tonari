// 変更履歴: 2026-11-11 外部送信しない下書き編集・安全なプレビュー・公開用確定を追加。
import {parseBody} from '/content.js';
const element=id=>document.getElementById(id);
let csrf='',setupToken='',setupRequired=false,articles=[],selected=null,dirty=false,busy=false,lockTimer,warningTimer;
const fragment=new URLSearchParams(location.hash.slice(1));setupToken=fragment.get('setup')??'';if(location.hash)history.replaceState(null,'',location.pathname);
/** 状態表示にはHTMLを使わず、操作できた内容と復旧方法を伝える。 */
function status(message){element('status').textContent=message;}
/** CookieはHttpOnlyのまま、同一OriginとCSRFトークン付きで操作する。 */
async function api(path,body){
 const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await response.json();if(!response.ok){if(response.status===401&&path!=='login'){await initialize();}throw new Error(result.error??'操作できませんでした。');}return result;
}
/** 未保存の本文を、記事切替やログアウトで失わない。 */
function mayLeave(){return !dirty||confirm('保存していない変更があります。変更を破棄して移動しますか？');}
/** 非同期操作の連打を止め、結果の順序を保つ。 */
async function perform(action){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('button,input,textarea,select')];const previous=buttons.map(button=>button.disabled);buttons.forEach(button=>button.disabled=true);try{await action();}catch(error){status(error.message??'操作できませんでした。');}finally{busy=false;buttons.forEach((button,index)=>button.disabled=previous[index]);updateButtons();}}
/** 未保存の記事を公開用へ移さないよう操作の可否を揃える。 */
function updateButtons(){element('stage').disabled=!selected||dirty||busy;element('unstage').disabled=!selected?.staged||busy;}
/** 一覧は記事タイトルと公開用データの状態だけを表示する。 */
function renderList(){element('article-list').replaceChildren();for(const article of articles){const item=document.createElement('li');const button=document.createElement('button');button.type='button';button.textContent=article.title;button.setAttribute('aria-current',String(selected?.id===article.id));const note=document.createElement('small');note.textContent=article.staged?(article.matchesStaged?'公開用に確定済み':'下書きに未反映の変更あり'):'下書きのみ';button.append(note);button.addEventListener('click',()=>{if(mayLeave())openArticle(article);});item.append(button);element('article-list').append(item);}if(!articles.length){const item=document.createElement('li');item.textContent='まだ記事がありません。';element('article-list').append(item);}}
/** 保存済みURLを固定してリンク切れを避ける。 */
function openArticle(article=null){selected=article;dirty=false;element('editor-panel').hidden=false;element('empty-editor').hidden=true;element('preview').hidden=true;for(const key of ['title','slug','summary','body'])element(key).value=article?.[key]??'';element('category').value=article?.category??'security';element('sources').value=(article?.sources??[]).map(source=>`${source.title} | ${source.url}`).join('\n');element('slug').readOnly=!!article;element('editor-heading').textContent=article?'記事を編集':'新しい記事';element('article-status').textContent=article?(article.staged?'公開用データあり。実サイトの配信状況とは別です。':'下書きのみ・非公開'):'このMacに下書きを保存します。';renderList();updateButtons();}
/** フォームから公開可能な項目だけを取り出す。 */
function readArticle(){return {...(selected?{id:selected.id}:{}),slug:element('slug').value,title:element('title').value,summary:element('summary').value,body:element('body').value,category:element('category').value,sources:element('sources').value.split('\n').filter(line=>line.trim()).map(line=>{const separator=line.indexOf('|');if(separator<0)throw new Error('参考リンクは「資料名 | https://…」で入力してください。');return {title:line.slice(0,separator).trim(),url:line.slice(separator+1).trim()};})};}
/** HTMLを挿入せず本文を文字ノードにして表示する。 */
function preview(){const article=readArticle();element('preview-title').textContent=article.title;element('preview-summary').textContent=article.summary;element('preview-body').replaceChildren();for(const block of parseBody(article.body)){const node=document.createElement(block.type==='heading'?'h3':block.type==='list'?'ul':'p');if(block.type==='list'){for(const text of block.items){const item=document.createElement('li');item.textContent=text;node.append(item);}}else node.textContent=block.text;element('preview-body').append(node);}element('preview').hidden=false;status('表示見本を更新しました。保存・公開はまだ行っていません。');}
/** 認証された一覧を取得し、保存・公開用の状態を読み直す。 */
async function reloadArticles(){articles=(await api('articles')).articles;renderList();}
/** 未認証では本文をDOMからも破棄し、初回設定と通常ログインを分ける。 */
async function initialize(){
 clearTimeout(lockTimer);clearTimeout(warningTimer);const state=await api('state');csrf=state.csrf??'';setupRequired=state.setupRequired;element('login-panel').hidden=state.authenticated;element('workspace').hidden=!state.authenticated;element('logout').hidden=!state.authenticated;
 if(state.authenticated){const remaining=state.expiresAt-Date.now();warningTimer=setTimeout(()=>status('あと2分でログインが終了します。未保存の内容を保存してください。'),Math.max(0,remaining-120000));lockTimer=setTimeout(()=>{void initialize().then(()=>status('ログインの有効期限が切れました。もう一度ログインしてください。')).catch(error=>status(error.message));},Math.max(0,remaining+100));await reloadArticles();return;}
 articles=[];selected=null;dirty=false;renderList();element('editor-form').reset();element('preview').hidden=true;element('preview-body').replaceChildren();element('preview-title').textContent='';element('preview-summary').textContent='';element('editor-panel').hidden=true;element('empty-editor').hidden=false;
 element('login-title').textContent=setupRequired?'管理者パスワードを設定':'ログイン';element('login-description').textContent=setupRequired?'10文字以上のパスワードを設定します。初回設定は起動時の専用URLからだけ行えます。':'このMacの管理者パスワードを入力してください。ログインは30分で終了します。未保存の記事は終了前に保存してください。';element('password').autocomplete=setupRequired?'new-password':'current-password';element('password').minLength=setupRequired?10:1;element('login-submit').textContent=setupRequired?'設定して始める':'ログインする';if(setupRequired&&!setupToken)status('起動時に表示された「初回設定」のURLを開いてください。');
}
element('login-form').addEventListener('submit',event=>{event.preventDefault();void perform(async()=>{const password=element('password').value;try{await api(setupRequired?'setup':'login',{password,...(setupRequired?{setupToken}:{})});setupToken='';status('ログインしました。');await initialize();}finally{element('password').value='';}});});
element('logout').addEventListener('click',()=>{if(mayLeave())void perform(async()=>{await api('logout',{});await initialize();status('ログアウトしました。');});});
element('new-article').addEventListener('click',()=>{if(mayLeave())openArticle();});
element('refresh').addEventListener('click',()=>{if(mayLeave())void perform(async()=>{await reloadArticles();const refreshed=selected?articles.find(article=>article.id===selected.id):null;openArticle(refreshed);status('一覧を読み直しました。');});});
element('editor-form').addEventListener('input',()=>{dirty=true;updateButtons();});
element('editor-form').addEventListener('submit',event=>{event.preventDefault();void perform(async()=>{const saved=await api('articles',{article:readArticle(),revision:selected?.revision??0});await reloadArticles();openArticle(articles.find(article=>article.id===saved.article.id));status('このMacに下書きを保存しました。公開内容は変わっていません。');});});
element('preview-button').addEventListener('click',()=>{try{preview();}catch(error){status(error.message);}});
for(const action of ['stage','unstage'])element(action).addEventListener('click',()=>{void perform(async()=>{if(!selected||dirty)throw new Error('先に下書きを保存してください。');await api(action,{id:selected.id,revision:selected.revision});const id=selected.id;await reloadArticles();openArticle(articles.find(article=>article.id===id));status(action==='stage'?'公開用に確定しました。実サイトへの反映は、このチャットへ「コラムを公開して」と依頼してください。':'公開用から取り下げました。サイトから削除するには配信が必要です。下書きは残っています。');});});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();}});
initialize().catch(error=>status(error.message));

// 2026-11-11: 長い非表示の後も期限を再検査し、ログイン切れの本文を残さない。
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&csrf)void api('state').then(state=>{if(!state.authenticated)return initialize();}).catch(error=>status(error.message));});
