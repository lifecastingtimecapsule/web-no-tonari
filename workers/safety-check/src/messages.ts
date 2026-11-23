// 変更履歴: 2026-11-23 診断結果を技術者向けから一般向けへ作り替えるため、やさしい言い換え・危険度・過去事例の型を追加。
// 役割: 判定項目（CheckItem）を、専門知識のない人にも伝わる言葉と「放置するとどうなるか」「過去に起きたこと」に変換する。
// 方針: 事実に基づく範囲で表現する。根拠のない確率・統計・被害件数は作らない。攻撃や侵入の試行は行っていない。
import type { CheckItem } from './checks';

export interface PlainCopy {
  /** やさしい見出し */
  title: string;
  /** やさしい一文 */
  summary: string;
  /** 放置するとどうなるか（任意） */
  danger?: string;
  /** 過去に起きたこと（任意・一般化した事実） */
  past?: string;
}

export const PLAIN: Record<string, PlainCopy> = {
  https: {
    title: '暗号化（鍵マーク）',
    summary: 'https:// で安全に開けるかどうか。',
    danger: '暗号化されていないと、入力した内容を第三者に見られる可能性があります。',
    past: '古い http:// のままのサイトで、ログイン情報を盗まれる被害が報告されています。',
  },
  page: {
    title: 'サイトの応答',
    summary: 'サイトが自動の確認を拒否したため、内容を確認できませんでした。',
    danger: '自動アクセスを制限しているサイトは、検索エンジンやAIからも中身が見えにくくなります。',
  },
  redirect: {
    title: 'http:// からの自動切り替え',
    summary: '古い http:// で開いたとき、https:// に自動で切り替わるか。',
    danger: '切り替わらないと、暗号化されない画面のまま表示されます。',
  },
  hsts: {
    title: '常に暗号化で開く設定',
    summary: 'ブラウザに「いつも https:// で開く」と伝えているか。',
    danger: '設定がないと、通信を乗っ取られたときに暗号化されない画面へ誘導されることがあります。',
  },
  headers: {
    title: 'ブラウザの防御設定',
    summary: 'サイトを悪用した攻撃を防ぐ設定が入っているか。',
    danger: '設定が薄いと、あなたのサイトが別の攻撃の踏み台にされることがあります。',
  },
  exposure: {
    title: 'ソフトのバージョン隠し',
    summary: '使っているソフトの種類や版が外から見えるか。',
    danger: '古い版が丸見えだと、弱点を狙う攻撃の的になります。',
    past: 'WordPressの古い版を狙った改ざん被害は、繰り返し確認されています。',
  },
  mixed: {
    title: '古い http:// の読み込み',
    summary: 'https:// のページの中で、暗号化されない画像やプログラムを読み込んでいないか。',
    danger: '鍵マークに警告が出たり、表示が崩れたり、改ざんに気づきにくくなります。',
  },
  seo: {
    title: '検索結果とSNSでの見え方',
    summary: '検索したときに出るタイトル・説明と、LINEやXで共有したときの画像があるか。',
    danger: '検索結果にURLだけが並んだり、共有しても画像が出ないことがあります。同じ順位でもクリックされにくくなります。',
  },
  files: {
    title: '公開設定ファイル',
    summary: 'robots.txt・サイトマップ・security.txt が公開されているか。',
    danger: '検索エンジンへの案内や、脆弱性の連絡先がなく、対応が遅れることがあります。',
  },
  wordpress: {
    title: 'WordPressの設定',
    summary: 'WordPressかどうか、ユーザー名が外から推測できるか。',
    danger: 'ユーザー名が分かると、ログイン突破の試行を受けやすくなります。',
    past: '管理画面への総当たり攻撃（パスワード当て）で侵入される被害が定番です。',
  },
  speed: {
    title: '表示の速さ',
    summary: 'トップページが表示されるまでの時間。',
    danger: '遅いと、訪問者が待たずに離れてしまいます。',
  },
  spf: {
    title: '偽メール対策（SPF）',
    summary: '会社のドメインを名乗る偽メールを防ぐ設定があるか。',
    danger: '対策がないと、取引先やお客様に偽メールが届きやすくなります。',
    past: '取引先を装って振込先を変えさせる「ビジネスメール詐欺」が増えています。',
  },
  dmarc: {
    title: '偽メール対策（DMARC）',
    summary: '偽メールを受信側で止められる設定になっているか。',
    danger: '設定が弱いと、なりすましメールがそのまま届いてしまいます。',
    past: '実在する取引先アドレスを装った偽メールが、実際に確認されています。',
  },
  'breach-domain': {
    title: '過去の漏えい',
    summary: 'このドメインが、漏えい元として公表されたことがあるか。',
    danger: '漏えいしたパスワードを使い回していると、他のサービスへの侵入に使われる可能性があります。',
    past: '他社の漏えい情報を使った「パスワードリスト攻撃」が実際に起きています。',
  },
};

/** 判定項目に、やさしい表現を付ける。未定義の項目は元の文をそのまま使う。 */
export function decorate(items: CheckItem[]): CheckItem[] {
  return items.map((item) => {
    const plain = PLAIN[item.id];
    return plain ? { ...item, plain } : { ...item, plain: { title: item.title, summary: item.summary } };
  });
}

export type RiskLevel = 'good' | 'watch' | 'caution' | 'danger' | 'unknown';

export interface RiskSummary {
  /** 0〜100。見つかった問題の重み付けで算出する（確率ではない） */
  score: number;
  level: RiskLevel;
  label: string;
  headline: string;
  note: string;
  known: number;
  total: number;
}

const WEIGHT = { action: 30, advice: 12 };

/**
 * 危険度スコアを、見つかった問題の重みだけで算出する。
 * - 確率ではない。公開情報から見つかった問題の合計に上限を設けた目安。
 * - 判定できなかった項目は加点しない（known で別途示す）。
 */
export function scoreRisk(items: CheckItem[]): RiskSummary {
  const counts = { ok: 0, advice: 0, action: 0, unknown: 0 };
  for (const item of items) counts[item.status] += 1;
  const raw = counts.action * WEIGHT.action + counts.advice * WEIGHT.advice;
  const score = Math.min(100, raw);
  const known = counts.ok + counts.advice + counts.action;
  const total = items.length;

  if (known === 0) {
    return {
      score: 0, level: 'unknown', label: '判定できませんでした',
      headline: '自動では判定できませんでした',
      note: 'サイトが自動の確認を拒否した可能性があります。お問い合わせからご相談ください。',
      known, total,
    };
  }
  if (score >= 60) {
    return {
      score, level: 'danger', label: '危険',
      headline: 'このまま放置すると、被害につながる可能性があります',
      note: '見つかった問題の重みから算出した目安です。攻撃や侵入の試行はしていません。',
      known, total,
    };
  }
  if (score >= 25) {
    return {
      score, level: 'caution', label: '注意',
      headline: 'いくつか危険なサインがあります',
      note: '見つかった問題の重みから算出した目安です。攻撃や侵入の試行はしていません。',
      known, total,
    };
  }
  if (score > 0) {
    return {
      score, level: 'watch', label: 'やや注意',
      headline: '小さな注意点があります',
      note: '見つかった問題の重みから算出した目安です。攻撃や侵入の試行はしていません。',
      known, total,
    };
  }
  return {
    score: 0, level: 'good', label: '良好',
    headline: '公開情報の範囲では、大きな問題は見つかりませんでした',
    note: '確認できた範囲の結果です。管理画面の中や、ソフトの更新状況までは分かりません。',
    known, total,
  };
}
