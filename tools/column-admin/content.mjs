// 変更履歴: 2026-11-11 記事形式と公開に渡す項目を限定し、自由HTMLを実行しない。
export const categories={security:'セキュリティ',system:'業務システム'};
/** 保存可能な文字列だけを受け付け、未知の項目は取り込まない。 */
export function validateArticle(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('記事の形式が正しくありません。');
 const text=(key,min,max)=>{const value=input[key];if(typeof value!=='string'||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw new Error(`${key}の長さ・文字を確認してください。`);return value.trim();};
 const slug=text('slug',3,80);if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug))throw new Error('URL名は半角小文字・数字・ハイフンで入力してください。');
 if(!Object.hasOwn(categories,input.category))throw new Error('分類を選んでください。');
 if(!Array.isArray(input.sources)||input.sources.length>6)throw new Error('参考リンクは6件までです。');
 const sources=input.sources.map(source=>{
  if(!source||typeof source.title!=='string'||source.title.trim().length<1||source.title.length>100||typeof source.url!=='string'||source.url.length>1000)throw new Error('参考リンクを確認してください。');
  let link;try{link=new URL(source.url);}catch{throw new Error('参考リンクはHTTPSのURLにしてください。');}
  if(link.protocol!=='https:'||link.username||link.password||!link.hostname.includes('.')||/[:\[\]]/.test(link.hostname)||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(link.hostname)||/\.(local|localhost|internal)$/.test(link.hostname))throw new Error('参考リンクは公開サイトのHTTPSにしてください。');
  return {title:source.title.trim(),url:link.href};
 });
 return {slug,title:text('title',1,100),summary:text('summary',1,220),category:input.category,body:text('body',1,30000),sources};
}
/** 記事本文を見出し・箇条書き・段落に分ける。HTMLやMarkdownリンクは解釈しない。 */
export function parseBody(body){
 const blocks=[];let paragraph=[];let items=[];
 const flushParagraph=()=>{if(paragraph.length){blocks.push({type:'paragraph',text:paragraph.join('\n')});paragraph=[];}};
 const flushItems=()=>{if(items.length){blocks.push({type:'list',items});items=[];}};
 for(const line of body.replace(/\r\n/g,'\n').split('\n')){
  if(!line.trim()){flushParagraph();flushItems();continue;}
  if(line.startsWith('## ')){flushParagraph();flushItems();blocks.push({type:'heading',text:line.slice(3)});}
  else if(line.startsWith('- ')){flushParagraph();items.push(line.slice(2));}
  else{flushItems();paragraph.push(line);}
 }
 flushParagraph();flushItems();return blocks;
}
/** 許可した公開項目だけを複製し、管理情報・下書きメモの流出を防ぐ。 */
export function toPublicArticle(article){
 const clean=validateArticle(article);
 for(const key of ['publishedAt','updatedAt'])if(typeof article[key]!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(article[key])||!Number.isFinite(Date.parse(article[key])))throw new Error('公開日が正しくありません。');
 return {...clean,publishedAt:article.publishedAt,updatedAt:article.updatedAt};
}
