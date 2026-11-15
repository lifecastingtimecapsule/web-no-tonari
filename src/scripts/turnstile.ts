// 変更履歴: 2026-11-15 公開チェックで必要になった時だけTurnstileを実行し、各送信後にトークンを破棄する処理を追加。
// 役割: 通常時の画面を変えず、Cloudflareが必要と判断した場合だけ利用者へ確認画面を表示する。
interface TurnstileApi {
  render(container:HTMLElement,options:Record<string,unknown>):string;
  execute(widgetId:string):void;
  getResponse(widgetId:string):string;
  reset(widgetId:string):void;
}
declare global {interface Window {turnstile?:TurnstileApi;}}

let scriptPromise:Promise<TurnstileApi>|null=null;

/** 公式スクリプトを一度だけ読み込み、読み込み失敗を無期限に保持しない。 */
function loadTurnstile():Promise<TurnstileApi>{
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(scriptPromise)return scriptPromise;
  const loading=new Promise<TurnstileApi>((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    const timeout=window.setTimeout(()=>reject(new Error('turnstile-load-timeout')),15000);
    script.addEventListener('load',()=>{window.clearTimeout(timeout);window.turnstile?resolve(window.turnstile):reject(new Error('turnstile-unavailable'));},{once:true});
    script.addEventListener('error',()=>{window.clearTimeout(timeout);reject(new Error('turnstile-load-failed'));},{once:true});
    document.head.append(script);
  });
  scriptPromise=loading.catch(error=>{scriptPromise=null;throw error;});
  return scriptPromise;
}

export interface TurnstileController {token():Promise<string>;reset():void;}

/** 送信操作ごとに新しい単回トークンを取得し、対話が必要な場合だけウィジェットを見せる。 */
export function createTurnstileController(container:HTMLElement,action:string):TurnstileController{
  const sitekey=container.dataset.sitekey??'';
  let api:TurnstileApi|null=null;let widgetId:string|null=null;let resolveToken:((token:string)=>void)|null=null;let rejectToken:((error:Error)=>void)|null=null;let timer=0;
  const settle=(token?:string,error?:Error):void=>{window.clearTimeout(timer);const resolve=resolveToken;const reject=rejectToken;resolveToken=null;rejectToken=null;if(token)resolve?.(token);else reject?.(error??new Error('turnstile-failed'));};
  const ensureWidget=async():Promise<void>=>{
    if(widgetId)return;
    api=await loadTurnstile();
    widgetId=api.render(container,{sitekey,action,execution:'execute',appearance:'interaction-only',callback:(token:string)=>settle(token),'error-callback':()=>settle(undefined,new Error('turnstile-error')),'expired-callback':()=>settle(undefined,new Error('turnstile-expired')),'timeout-callback':()=>settle(undefined,new Error('turnstile-timeout'))});
  };
  return {
    async token():Promise<string>{
      if(!sitekey)throw new Error('turnstile-sitekey-missing');
      await ensureWidget();
      const existing=api?.getResponse(widgetId!);if(existing)return existing;
      if(resolveToken)throw new Error('turnstile-pending');
      const pending=new Promise<string>((resolve,reject)=>{resolveToken=resolve;rejectToken=reject;timer=window.setTimeout(()=>settle(undefined,new Error('turnstile-timeout')),120000);});
      api?.execute(widgetId!);
      return pending;
    },
    reset():void{window.clearTimeout(timer);resolveToken=null;rejectToken=null;if(api&&widgetId)api.reset(widgetId);},
  };
}
