// 変更履歴: 2026-11-11 本人の依頼で、Macデスクトップにローカル管理用アプリを配置する。
// 役割: 既存の別ファイルを上書きせず、パスワードを含まない起動アイコンを作成する。
import {mkdir,writeFile,lstat,readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const application=join(homedir(),'Desktop','SITEVEIL コラム管理.app');
const marker='com.siteveil.local-column-admin';
try{
 const existing=await lstat(application);
 if(!existing.isDirectory()||existing.isSymbolicLink()||!(await readFile(join(application,'Contents/Info.plist'),'utf8')).includes(marker))throw new Error('同名の別ファイルがあります。上書きせず停止しました。');
}catch(error){if(error.code!=='ENOENT')throw error;}
if(root.includes('\n'))throw new Error('プロジェクトのパスを確認してください。');
/** シェルの文字展開を避け、プロジェクトの場所を固定引数にする。 */
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
await mkdir(join(application,'Contents/MacOS'),{recursive:true,mode:0o755});
await writeFile(join(application,'Contents/Info.plist'),`<?xml version="1.0" encoding="UTF-8"?>
<!-- 変更履歴: 2026-11-11 デスクトップ専用起動アプリ。認証情報は格納しない。 -->
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>CFBundleName</key><string>SITEVEIL コラム管理</string><key>CFBundleDisplayName</key><string>SITEVEIL コラム管理</string><key>CFBundleIdentifier</key><string>${marker}</string><key>CFBundleExecutable</key><string>siteveil-columns</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>1</string><key>LSUIElement</key><true/></dict></plist>`,{mode:0o644});
await writeFile(join(application,'Contents/MacOS/siteveil-columns'),`#!/bin/zsh
# 変更履歴: 2026-11-11 SITEVEILのローカル管理を起動。パスワードは保存しない。
exec ${quote(root+'node_modules/node/bin/node')} ${quote(root+'tools/column-admin/desktop.mjs')}
`,{mode:0o755});
console.log('デスクトップに「SITEVEIL コラム管理.app」を作成しました。');
