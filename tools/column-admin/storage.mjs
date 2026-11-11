// 変更履歴: 2026-11-11 固定ファイルへの保存と公開用の射影を追加。
import {mkdir,lstat,readFile,open,rename,unlink} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {validateArticle,toPublicArticle} from './content.mjs';
/** 同じOS利用者によるシンボリックリンクの誤設定先へ書かない。 */
async function refuseLink(path){try{if((await lstat(path)).isSymbolicLink())throw new Error('保存先にシンボリックリンクは使えません。');}catch(error){if(error.code!=='ENOENT')throw error;}}
/** 固定保存先へ一時ファイルを同期してから置換する。途中書き込みを公開しない。 */
export async function writeJson(path,value,{exclusive=false}={}){
 await refuseLink(path);const serialized=JSON.stringify(value,null,2)+'\n';if(Buffer.byteLength(serialized)>4000000)throw new Error('保存容量の上限です。');
 if(exclusive){const file=await open(path,'wx',0o600);try{await file.writeFile(serialized);await file.sync();}finally{await file.close();}return;}
 const temporary=join(dirname(path),`.column-${randomUUID()}.tmp`);const file=await open(temporary,'wx',0o600);
 try{await file.writeFile(serialized);await file.sync();}finally{await file.close();}
 try{await rename(temporary,path);}finally{await unlink(temporary).catch(()=>{});}
}
/** 保存先と公開カタログを読み込み、記事IDと公開項目を分離して管理する。 */
export async function createStorage(privateDirectory,publicFile){
 await refuseLink(dirname(privateDirectory));await refuseLink(privateDirectory);await mkdir(privateDirectory,{recursive:true,mode:0o700});
 const articlesFile=join(privateDirectory,'articles.json');await refuseLink(articlesFile);await refuseLink(publicFile);
 const initialPublic=JSON.parse(await readFile(publicFile,'utf8')).map(toPublicArticle);
 let articles;try{articles=JSON.parse(await readFile(articlesFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;articles=initialPublic.map(article=>({...article,id:randomUUID(),revision:1,createdAt:article.publishedAt}));await writeJson(articlesFile,articles);}
 const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 let expectedPublic=digest(initialPublic);
 /** 外部編集で変わった公開一覧を、古い画面から上書きしない。 */
 async function publicArticles(){await refuseLink(publicFile);const list=JSON.parse(await readFile(publicFile,'utf8')).map(toPublicArticle);if(digest(list)!==expectedPublic){const error=new Error('公開データが別の操作で更新されました。管理画面を再起動してください。');error.status=409;throw error;}return list;}
 return {
  authFile:join(privateDirectory,'auth.json'),
  async list(){const published=await publicArticles();return articles.map(article=>({...article,staged:published.some(item=>item.slug===article.slug),matchesStaged:published.some(item=>item.slug===article.slug&&item.body===article.body&&item.title===article.title&&item.summary===article.summary&&item.category===article.category&&JSON.stringify(item.sources)===JSON.stringify(article.sources))}));},
  /** 一致するリビジョンだけを更新し、別画面の編集を失わない。 */
  async save(input,revision){
   const clean=validateArticle(input);const existing=input.id?articles.find(article=>article.id===input.id):undefined;
   if(input.id&&!existing)throw Object.assign(new Error('記事が見つかりません。'),{status:404});
   if((existing?.revision??0)!==revision)throw Object.assign(new Error('別の画面で更新されています。一覧を読み直してください。'),{status:409});
   if(existing&&existing.slug!==clean.slug)throw new Error('保存済み記事のURL名は変更できません。');
   if(articles.some(article=>article.id!==existing?.id&&article.slug===clean.slug))throw new Error('このURL名は使用されています。');
   if(!existing&&articles.length>=100)throw new Error('記事は100件までです。');
   const now=new Date().toISOString();const saved={...clean,id:existing?.id??randomUUID(),revision:(existing?.revision??0)+1,createdAt:existing?.createdAt??now,updatedAt:now,...(existing?.publishedAt?{publishedAt:existing.publishedAt}:{})};
   const updated=[...articles.filter(article=>article.id!==saved.id),saved];await writeJson(articlesFile,updated);articles=updated;return saved;
  },
  /** 保存済みの記事だけを公開データへ移す。取り下げても下書きは残す。 */
  async stage(id,revision,remove=false){
   const article=articles.find(item=>item.id===id);if(!article)throw Object.assign(new Error('記事が見つかりません。'),{status:404});
   if(article.revision!==revision)throw Object.assign(new Error('保存内容が更新されています。一覧を読み直してください。'),{status:409});
   const published=await publicArticles();const next=published.filter(item=>item.slug!==article.slug);
   if(!remove){const publishedAt=published.find(item=>item.slug===article.slug)?.publishedAt??article.publishedAt??new Date().toISOString();const publicArticle=toPublicArticle({...article,publishedAt});next.push(publicArticle);}
   next.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.slug.localeCompare(b.slug));await writeJson(publicFile,next);expectedPublic=digest(next);
  }
 };
}
