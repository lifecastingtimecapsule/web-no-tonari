// 変更履歴: 2026-11-11 単一メールの照会と日本語の結果表示を追加。外部HTMLを挿入せず、履歴・永続ストレージへ保存しない。
interface DisplayBreach {service:string;dates:{source:string;date:string|null}[];fields:string[];sources:string[];dateConflict:boolean;unverified?:boolean;}
interface LookupResponse {message?:string;state?:'complete'|'partial';checkedAt?:string;providers?:{source:string;name:string;status:string;count:number|null}[];breaches?:DisplayBreach[];}
const providerLabels:Record<string,string>={hibp:'HIBP',xposedornot:'XposedOrNot'};
/** 取得元の日付精度を保ち、時差で別日にならない日本語表示にする。 */
function formatBreachDate(value:string|null):string{
  if(!value)return '不明';
  const components=value.split('-');
  const options:Intl.DateTimeFormatOptions={year:'numeric',timeZone:'UTC'};
  if(components.length>1)options.month='long';
  if(components.length>2)options.day='numeric';
  return new Intl.DateTimeFormat('ja-JP',options).format(new Date(`${value}${components.length===1?'-01-01':components.length===2?'-01':''}T00:00:00Z`));
}
/** 照会元の文字列はtextContentで描画し、装飾やリンクとして実行しない。 */
function appendTextElement(parent:HTMLElement,tag:string,text:string,className?:string):HTMLElement{
  const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;parent.append(element);return element;
}
/** 一度に一件だけ照会し、別アドレスの古い結果と失敗を混同しない。 */
function setupBreachCheck():void{
  const form=document.querySelector<HTMLFormElement>('[data-breach-form]');
  const status=document.querySelector<HTMLElement>('[data-breach-status]');
  const results=document.querySelector<HTMLElement>('[data-breach-results]');
  const title=document.querySelector<HTMLElement>('[data-breach-title]');
  const checked=document.querySelector<HTMLElement>('[data-breach-checked]');
  const notice=document.querySelector<HTMLElement>('[data-breach-notice]');
  const records=document.querySelector<HTMLElement>('[data-breach-records]');
  const email=form?.querySelector<HTMLInputElement>('[name=email]');
  const consent=form?.querySelector<HTMLInputElement>('[name=consent]');
  const button=form?.querySelector<HTMLButtonElement>('button[type=submit]');
  if(!form||!status||!results||!title||!checked||!notice||!records||!email||!consent||!button)return;
  let pending=false;let requestController:AbortController|null=null;
  window.addEventListener('pagehide',()=>requestController?.abort());
  window.addEventListener('pageshow',()=>{pending=false;button.disabled=false;form.removeAttribute('aria-busy');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;
    results.hidden=true;records.replaceChildren();status.removeAttribute('data-error');
    if(!email.validity.valid||!email.value.trim()||!consent.checked){status.textContent='メールアドレスと確認欄を見直してください。';status.setAttribute('data-error','');(!email.validity.valid?email:consent).focus();return;}
    pending=true;button.disabled=true;form.setAttribute('aria-busy','true');status.textContent='漏えい記録を確認しています…';
    requestController=new AbortController();const timeout=window.setTimeout(()=>requestController?.abort(),35000);
    try{
      const response=await fetch(form.dataset.api||'/api/breach-check',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},signal:requestController.signal,body:JSON.stringify({email:email.value.trim(),consent:consent.checked,website:form.querySelector<HTMLInputElement>('[name=website]')?.value||''})});
      const payload=await response.json() as LookupResponse;
      if(!response.ok)throw new Error(payload.message||'照会できませんでした。時間をおいてお試しください。');
      if(!['complete','partial'].includes(payload.state||'')||!Array.isArray(payload.breaches)||!Array.isArray(payload.providers))throw new Error('照会結果を読み取れませんでした。');
      const breaches=payload.breaches;
      title.textContent=breaches.length?`${breaches.length}件の漏えい記録を確認しました。`:payload.state==='partial'?'照会が一部完了していません。':'照会した記録には見つかりませんでした。';
      checked.textContent=payload.checkedAt?`確認日時：${new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date(payload.checkedAt))}（日本時間）`:'';
      const unavailable=payload.providers.filter(provider=>provider.status!=='ok');
      notice.textContent=unavailable.length?`${unavailable.map(provider=>provider.name).join('・')}に照会できませんでした。取得できた範囲の結果です。時間をおいて再度ご確認ください。`:'記録が見つからなくても、漏えいしていないことを保証するものではありません。';
      for(const breach of breaches){
        const article=document.createElement('article');article.className='breach-record';
        appendTextElement(article,'h3',breach.service);
        const dates=[...new Set(breach.dates.map(entry=>entry.date).filter((date):date is string=>Boolean(date)))];
        appendTextElement(article,'p',`発生時期：${dates.length===1?formatBreachDate(dates[0]):dates.length>1?'照会元により記録が異なります':'不明'}`,'breach-record__date');
        if(breach.fields.length){const list=document.createElement('ul');list.className='breach-record__fields';list.setAttribute('aria-label','漏えい対象と記録された情報');for(const field of breach.fields)appendTextElement(list,'li',field);article.append(list);}
        else appendTextElement(article,'p','漏えいした情報の種類：不明','breach-record__note');
        if(breach.unverified)appendTextElement(article,'p','照会元が未検証と分類した事案を含みます。','breach-record__note');
        if(breach.dateConflict)appendTextElement(article,'p',breach.dates.map(entry=>`${providerLabels[entry.source]||entry.source}：${formatBreachDate(entry.date)}`).join(' ／ '),'breach-record__note');
        appendTextElement(article,'p',`照会元：${breach.sources.map(source=>providerLabels[source]||source).join('・')}`,'breach-record__sources');
        records.append(article);
      }
      results.hidden=false;status.textContent=payload.state==='partial'?'一部の照会が完了していません。':'照会が完了しました。';title.focus({preventScroll:true});results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }catch(error){status.setAttribute('data-error','');status.textContent=error instanceof Error&&error.name!=='AbortError'?error.message:'照会に時間がかかっています。時間をおいて再度お試しください。';}
    finally{window.clearTimeout(timeout);pending=false;button.disabled=false;form.removeAttribute('aria-busy');requestController=null;}
  });
}
setupBreachCheck();
