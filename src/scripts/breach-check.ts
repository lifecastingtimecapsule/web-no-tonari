// 変更履歴: 2026-11-15 第三者アドレス照会の濫用を抑えるため、事案名・発生日・情報種類を表示せず件数区分だけに変更。
// 変更履歴: 2026-11-11 単一メールの照会と日本語の結果表示を追加。外部HTMLを挿入せず、履歴・永続ストレージへ保存しない。
interface LookupResponse {message?:string;state?:'complete'|'partial';checkedAt?:string;result?:{found:boolean;countBand:'0'|'1'|'2'|'3+'};unavailableSources?:number;}
/** 一度に一件だけ照会し、別アドレスの古い結果と失敗を混同しない。 */
function setupBreachCheck():void{
  const form=document.querySelector<HTMLFormElement>('[data-breach-form]');
  const status=document.querySelector<HTMLElement>('[data-breach-status]');
  const results=document.querySelector<HTMLElement>('[data-breach-results]');
  const title=document.querySelector<HTMLElement>('[data-breach-title]');
  const checked=document.querySelector<HTMLElement>('[data-breach-checked]');
  const notice=document.querySelector<HTMLElement>('[data-breach-notice]');
  const email=form?.querySelector<HTMLInputElement>('[name=email]');
  const consent=form?.querySelector<HTMLInputElement>('[name=consent]');
  const button=form?.querySelector<HTMLButtonElement>('button[type=submit]');
  if(!form||!status||!results||!title||!checked||!notice||!email||!consent||!button)return;
  let pending=false;let requestController:AbortController|null=null;
  window.addEventListener('pagehide',()=>requestController?.abort());
  window.addEventListener('pageshow',()=>{pending=false;button.disabled=false;form.removeAttribute('aria-busy');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;
    results.hidden=true;status.removeAttribute('data-error');
    if(!email.validity.valid||!email.value.trim()||!consent.checked){status.textContent='メールアドレスと確認欄を見直してください。';status.setAttribute('data-error','');(!email.validity.valid?email:consent).focus();return;}
    pending=true;button.disabled=true;form.setAttribute('aria-busy','true');status.textContent='漏えい記録を確認しています…';
    requestController=new AbortController();const timeout=window.setTimeout(()=>requestController?.abort(),35000);
    try{
      const response=await fetch(form.dataset.api||'/api/breach-check',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},signal:requestController.signal,body:JSON.stringify({email:email.value.trim(),consent:consent.checked,website:form.querySelector<HTMLInputElement>('[name=website]')?.value||''})});
      const payload=await response.json() as LookupResponse;
      if(!response.ok)throw new Error(payload.message||'照会できませんでした。時間をおいてお試しください。');
      if(!['complete','partial'].includes(payload.state||'')||!payload.result||!['0','1','2','3+'].includes(payload.result.countBand))throw new Error('照会結果を読み取れませんでした。');
      const countLabel=payload.result.countBand==='3+'?'3件以上':`${payload.result.countBand}件`;
      title.textContent=payload.result.found?`${countLabel}の漏えい記録を確認しました。`:payload.state==='partial'?'照会が一部完了していません。':'照会した記録には見つかりませんでした。';
      checked.textContent=payload.checkedAt?`確認日時：${new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date(payload.checkedAt))}（日本時間）`:'';
      notice.textContent=(payload.unavailableSources||0)>0?'一部の照会元に接続できませんでした。取得できた範囲の結果です。時間をおいて再度ご確認ください。':'記録が見つからなくても、漏えいしていないことを保証するものではありません。';
      results.hidden=false;status.textContent=payload.state==='partial'?'一部の照会が完了していません。':'照会が完了しました。';title.focus({preventScroll:true});results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }catch(error){status.setAttribute('data-error','');status.textContent=error instanceof Error&&error.name!=='AbortError'?error.message:'照会に時間がかかっています。時間をおいて再度お試しください。';}
    finally{window.clearTimeout(timeout);pending=false;button.disabled=false;form.removeAttribute('aria-busy');requestController=null;}
  });
}
setupBreachCheck();
