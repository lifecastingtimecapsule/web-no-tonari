// 変更履歴: 2026-11-15 単発・定期・更新・侵入テスト・責任範囲の公開境界を回帰検査へ追加。
import { describe, expect, it } from 'vitest';
import {
  cloneTestBoundary,
  liabilityBoundary,
  serviceModes,
  updateBoundary,
} from '../src/data/security-service-policy';
import { pricingOptions } from '../src/data/pricing';

describe('SITEVEILのサービス境界', () => {
  it('keeps_one_time_and_recurring_obligations_distinct', () => {
    const oneTime = serviceModes.find((mode) => mode.id === 'one-time');
    const recurring = serviceModes.find((mode) => mode.id === 'recurring');
    const recurringPrice = pricingOptions.find((option) => option.name === '定期リスクウォッチ');

    expect(oneTime?.timing).toContain('診断実施時点');
    expect(oneTime?.excluded).toContain('継続監視');
    expect(recurring?.publicName).toBe('定期リスクウォッチ');
    expect(recurring?.excluded).toEqual(expect.arrayContaining([
      '24時間365日の有人監視',
      '攻撃の即時検知・防御',
      '自動修正',
    ]));
    expect(recurringPrice?.description).toContain('対象項目と実施頻度は契約前に確定');
  });

  it('limits_intrusive_testing_to_a_clone', () => {
    expect(cloneTestBoundary.environment).toContain('本番から分離された複製環境');
    expect(cloneTestBoundary.productionProhibited).toEqual(expect.arrayContaining([
      '侵入',
      'データ変更',
      '権限拡大',
      '停止につながる検証',
    ]));
    expect(cloneTestBoundary.clonePreparation).toEqual(expect.arrayContaining([
      '個人情報を削除または置換',
      '本番用認証情報を削除または置換',
      '決済を無効化',
      'メール送信を無効化',
      '外部APIを無効化',
    ]));
  });

  it('separates_update_notice_from_update_work', () => {
    expect(updateBoundary.included).toEqual(expect.arrayContaining([
      '更新情報の確認',
      '既知脆弱性情報の確認',
      '影響の整理',
      '通知',
    ]));
    expect(updateBoundary.separateWork).toEqual(expect.arrayContaining([
      'バックアップ',
      '検証環境の準備',
      '更新適用',
      '設定変更',
      '動作確認',
      '復旧',
    ]));
  });

  it('preserves_mandatory_liability_exceptions', () => {
    expect(liabilityBoundary.damageScope).toBe('直接かつ通常生ずべき損害');
    expect(liabilityBoundary.oneTimeCap).toContain('当該サービス料金');
    expect(liabilityBoundary.recurringCap).toContain('直前12か月');
    expect(liabilityBoundary.exceptions).toEqual(expect.arrayContaining([
      '当社の故意または重大な過失がある場合',
      '法令上責任制限が認められない場合',
    ]));
  });
});
