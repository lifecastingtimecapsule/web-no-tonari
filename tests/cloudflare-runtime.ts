// 変更履歴: 2026-11-11 既存のドメイン転送テストがWorkersのエクスポートを読み込めるようにする最小スタブ。
// 役割: テスト専用。照会上限やストレージの正しさをこのスタブで保証せず、実ランタイムでも確認する。
export class DurableObject { constructor(public ctx:unknown){} }
