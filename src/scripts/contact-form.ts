// 変更履歴: 2026-11-11 直接送信を追加。連打時は並行送信せず、失敗した入力は消さない。
/** 入力を検証して固定の自社APIへ送信する。再試行には同じIDを使い二重配送を防ぐ。 */
function setupContactForm():void {
  const form=document.querySelector<HTMLFormElement>('[data-direct-contact]');
  const button=form?.querySelector<HTMLButtonElement>('[data-contact-send]');
  const status=form?.querySelector<HTMLElement>('[data-contact-result]');
  if(!form||!button||!status) return;
  let submitting=false;
  let requestId=crypto.randomUUID();
  form.addEventListener('input',()=>{if(!submitting) requestId=crypto.randomUUID();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(submitting) return;
    if(!form.reportValidity()) return;
    const fields=new FormData(form);
    const payload={name:String(fields.get('name')||''),company:String(fields.get('company')||''),email:String(fields.get('email')||''),message:String(fields.get('message')||''),website:String(fields.get('website')||''),requestId};
    submitting=true;
    button.disabled=true;
    form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea').forEach(field=>{field.disabled=true;});
    button.textContent='送信中…';
    status.textContent='';
    try{
      const response=await fetch(location.hostname === 'lifecastingtimecapsule.github.io' ? 'https://site-veil.com/api/contact' : '/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      let result:{message?:string};
      try { result=await response.json(); } catch { throw new Error('送信できませんでした。入力は残っています。時間をおいてお試しください。'); }
      if(!response.ok) throw new Error(result.message||'送信できませんでした。時間をおいてお試しください。');
      status.textContent=result.message||'送信しました。お問い合わせありがとうございます。';
      form.reset();
      requestId=crypto.randomUUID();
    }catch(error){
      status.textContent=error instanceof Error && error.name!=='TimeoutError' && error.name!=='AbortError' ? error.message : '送信を確認できませんでした。入力は残っています。再度お試しください。';
    }finally{
      submitting=false;
      button.disabled=false;
      form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea').forEach(field=>{field.disabled=false;});
      button.textContent='送信する ↗';
      status.focus({preventScroll:true});
    }
  });
}
setupContactForm();
