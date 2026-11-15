// 変更履歴: 2026-11-15 SITEVEILの単発・定期・更新・侵入テスト・責任範囲を、公開ページで共有する基準として追加。
// 役割: サービス説明、仕様、利用規約で同じ境界を使い、完全保証や作業範囲の誤認を防ぐ。

export type ServiceMode = Readonly<{
  id: 'one-time' | 'recurring';
  publicName: string;
  summary: string;
  timing: string;
  included: readonly string[];
  excluded: readonly string[];
}>;

export const serviceModes: readonly ServiceMode[] = [
  {
    id: 'one-time',
    publicName: '単発リスクチェック',
    summary: '合意した対象を確認し、いま見えているリスクと対応の優先順位を整理します。',
    timing: '診断実施時点で確認できる状態を報告します。',
    included: ['事前に合意した対象・項目・方法の確認', '確認できたリスクと未確認範囲の報告'],
    excluded: ['継続監視', '修正', '復旧', '事故対応'],
  },
  {
    id: 'recurring',
    publicName: '定期リスクウォッチ',
    summary: '契約で定めた対象を定期的に確認し、変化や更新情報をお知らせします。',
    timing: '対象項目、確認頻度、通知方法は契約前に確定します。',
    included: ['契約で定めた対象・項目の定期確認', '確認できた変化・既知のリスク・更新情報の通知'],
    excluded: ['24時間365日の有人監視', '攻撃の即時検知・防御', '自動修正', '緊急対応', '完全な未然防止'],
  },
] as const;

export type MonitoringDraft = Readonly<{
  status: 'draft';
  label: string;
  items: readonly Readonly<{ target: string; proposedFrequency: string }>[];
  proposedNotification: string;
}>;

export const monitoringDraft: MonitoringDraft = {
  status: 'draft',
  label: '契約前に確定する基準案',
  items: [
    { target: 'サイト応答と証明書', proposedFrequency: '1日1回' },
    { target: '登録ソフトウェアの更新・既知脆弱性情報', proposedFrequency: '週1回' },
    { target: '公開設定と月次レポート', proposedFrequency: '月1回' },
  ],
  proposedNotification: '重大事項は確認後2営業日以内を基準案とし、正式な期限は契約前に確定します。',
} as const;

export type WorkBoundary = Readonly<{
  included: readonly string[];
  separateWork: readonly string[];
  note: string;
}>;

export const updateBoundary: WorkBoundary = {
  included: ['更新情報の確認', '既知脆弱性情報の確認', '影響の整理', '通知'],
  separateWork: ['バックアップ', '検証環境の準備', '更新適用', '設定変更', '動作確認', '復旧'],
  note: '更新の適用や復旧は、PHP・WordPress更新等の別契約で行います。',
} as const;

export type CloneTestBoundary = Readonly<{
  environment: string;
  productionProhibited: readonly string[];
  clonePreparation: readonly string[];
  report: string;
}>;

export const cloneTestBoundary: CloneTestBoundary = {
  environment: '書面承諾を得た、本番から分離された複製環境だけで実施します。',
  productionProhibited: ['侵入', 'データ変更', '権限拡大', '停止につながる検証'],
  clonePreparation: [
    '個人情報を削除または置換',
    '本番用認証情報を削除または置換',
    '決済を無効化',
    'メール送信を無効化',
    '外部APIを無効化',
  ],
  report: '本番との差異、実施内容、到達できた範囲、未確認範囲を報告書に記載します。',
} as const;

export type LiabilityBoundary = Readonly<{
  damageScope: string;
  oneTimeCap: string;
  recurringCap: string;
  exceptions: readonly string[];
  reviewStatus: string;
}>;

export const liabilityBoundary: LiabilityBoundary = {
  damageScope: '直接かつ通常生ずべき損害',
  oneTimeCap: '単発サービスでは、お客様が支払った当該サービス料金を上限とする案です。',
  recurringCap: '継続サービスでは、損害発生日直前12か月に受領した当該サービス料金の総額を上限とする案です。',
  exceptions: ['当社の故意または重大な過失がある場合', '法令上責任制限が認められない場合'],
  reviewStatus: '公開前に、顧客属性と実際の運用に合わせた専門家確認が必要な基準案です。',
} as const;
