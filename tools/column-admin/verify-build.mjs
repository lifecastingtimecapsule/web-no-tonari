// 変更履歴: 2026-11-11 公開配信物へ管理画面・認証・検査用下書きが混入しないことを検査。
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
/** 生成済みの静的ファイルだけを再帰検査する。認証情報そのものは読まない。 */
async function inspect(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const path=join(directory,entry.name);assert.ok(!['.local','column-admin','auth.json','articles.json','admin.js','admin.css'].includes(entry.name),`管理用ファイルが公開物に存在: ${path}`);
 if(entry.isDirectory())await inspect(path);else if(/\.(html|js|json|xml|css)$/.test(entry.name)){const text=await readFile(path,'utf8');for(const marker of ['DRAFT_ONLY_20261111','siteveil_editor=','setupUrlFragment','fixture-only-password'])assert.ok(!text.includes(marker),`非公開の印が公開物に存在: ${path}`);}
}}
await inspect(fileURLToPath(new URL('../../dist',import.meta.url)));console.log('公開生成物: 管理画面・認証・検査用下書きの混入なし');
