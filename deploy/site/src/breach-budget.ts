// 変更履歴: 2026-11-11 世界共通の照会枠を原子的に管理。記録するのは時刻と件数だけで、IP・メール・結果は保存しない。
import {DurableObject} from 'cloudflare:workers';
interface Usage {minute:number;hour:number;day:number;minuteCount:number;hourCount:number;dayCount:number;}
/** Durable Object一つに件数を集約し、並列リクエストでも照会元の枠を越えないようにする。 */
export class BreachBudget extends DurableObject {
  async fetch(request:Request):Promise<Response> {
    const provider=new URL(request.url).pathname.slice(1);
    const limits=provider==='hibp'?[2,100,800]:provider==='xposedornot'?[1,20,80]:provider==='xon-catalogue'?[1,40,80]:null;
    if(request.method!=='POST'||!limits)return new Response(null,{status:400});
    return this.ctx.storage.transaction(async storage=>{
      const now=Date.now();
      const minute=Math.floor(now/60000),hour=Math.floor(now/3600000),day=Math.floor(now/86400000);
      const prior=await storage.get<Usage>(provider);
      const usage:Usage={minute,hour,day,minuteCount:prior?.minute===minute?prior.minuteCount:0,hourCount:prior?.hour===hour?prior.hourCount:0,dayCount:prior?.day===day?prior.dayCount:0};
      const nextMinute=prior?.minute===minute&&usage.minuteCount>=limits[0];
      const nextHour=prior?.hour===hour&&usage.hourCount>=limits[1];
      const nextDay=prior?.day===day&&usage.dayCount>=limits[2];
      if(nextMinute||nextHour||nextDay){
        const wait=nextDay?86400-Math.floor(now/1000)%86400:nextHour?3600-Math.floor(now/1000)%3600:60-Math.floor(now/1000)%60;
        return Response.json({allowed:false},{status:429,headers:{'Retry-After':String(wait)}});
      }
      usage.minuteCount++;usage.hourCount++;usage.dayCount++;
      await storage.put(provider,usage);
      return Response.json({allowed:true});
    });
  }
}
