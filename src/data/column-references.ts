// 変更履歴: 2026-11-11 参照元の長いURLを資料名と日付のリンクとして表示する。
/** 記録済みのHTTPS出典と一致する段落だけをリンクにし、自由HTMLや未知のURLを解釈しない。 */
export function columnReference(text:string,sources:{title:string;url:string}[]):{label:string;url:string}|null {
  const lines=text.trim().split('\n');
  const candidate=lines.at(-1)?.trim();
  const source=sources.find(item=>item.url===candidate&&item.url.startsWith('https://'));
  if(!source)return null;
  return {label:lines.slice(0,-1).join('\n').trim()||source.title,url:source.url};
}
