// 変更履歴: 2026-11-11 記事に記録されたHTTPS出典だけをリンクとして表示する境界を検査。
import {describe,it,expect} from 'vitest';
import {columnReference} from '../src/data/column-references';
const sources=[{title:'公式資料',url:'https://example.com/report'}];
describe('コラムの参照リンク',()=>{
 it('資料名と掲載日を残して出典をリンクにする',()=>{expect(columnReference('海外報道（2026年11月10日掲載）\nhttps://example.com/report',sources)).toEqual({label:'海外報道（2026年11月10日掲載）',url:sources[0].url});});
 it('記録にないURLをリンク化しない',()=>{expect(columnReference('資料\nhttps://other.example/report',sources)).toBeNull();});
 it('スクリプトやHTTPを参照元に紛れ込ませてもリンク化しない',()=>{for(const url of ['javascript:alert(1)','http://example.com/report'])expect(columnReference('資料\n'+url,[{title:'資料',url}])).toBeNull();});
 it('URLだけなら記録済みの資料名を表示する',()=>{expect(columnReference(sources[0].url,sources)?.label).toBe('公式資料');});
});
