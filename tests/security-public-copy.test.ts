// 変更履歴: 2026-11-15 公開ホームの読み順とサービス境界への導線を回帰検査へ追加。
import { describe, expect, it } from 'vitest';
import homeSource from '../src/components/HomePage.astro?raw';
import positioningSource from '../src/components/SecurityPositioning.astro?raw';
import boundariesSource from '../src/components/SecurityBoundaries.astro?raw';
import specificationSource from '../src/pages/service-specification.astro?raw';
import policySource from '../src/data/security-service-policy.ts?raw';
import footerSource from '../src/components/SiteFooter.astro?raw';
import sitemapSource from '../src/pages/sitemap.xml.ts?raw';
import termsSource from '../src/pages/terms.astro?raw';

describe('SITEVEILの公開ホーム', () => {
  it('keeps_the_approved_hero_and_safety_check_first', () => {
    const home = homeSource.replace(/\s+/g, ' ');

    expect(home).toMatch(/<VeilHero\s*\/>\s*<SafetyCheck\s*\/>/);
    expect(home.indexOf('<VeilHero')).toBeLessThan(home.indexOf('<SecurityPositioning'));
  });

  it('explains_risk_discovery_with_stable_sections', () => {
    const publicCopy = `${positioningSource}\n${boundariesSource}`;
    const visibleCopy = publicCopy.replace(/<[^>]+>/g, '');

    expect(visibleCopy).toContain('確認できるリスクを、早期に見つける。');
    expect(positioningSource).toContain('<span>早期に見つける。</span>');
    for (const sectionId of ['positioning', 'service-modes', 'update-boundary', 'clone-testing', 'reporting']) {
      expect(publicCopy).toContain(`id="${sectionId}"`);
    }
  });

  it('links_visible_boundaries_to_their_full_documents', () => {
    const homeSources = [homeSource, positioningSource, boundariesSource].join('\n');

    expect(homeSources).toContain('href="/service-specification/"');
    expect(homeSources).toContain('href="/terms/"');
    expect(homeSources).not.toContain('守り続ける');
    expect(homeSources).not.toContain('安心して使い続ける');
  });
});

describe('利用規約', () => {
  it('states_service_scope_customer_authority_and_detection_limits', () => {
    expect(termsSource).toContain('本規約の目的');
    expect(termsSource).toContain('対象と許可範囲');
    expect(termsSource).toContain('正当な管理権限');
    expect(termsSource).toContain('必要な協力');
    expect(termsSource).toContain('誤検知');
    expect(termsSource).toContain('見逃し');
    expect(termsSource).toContain('安全を完全に保証');
  });

  it('limits_intrusive_tests_and_external_dependencies', () => {
    expect(termsSource).toContain('本番から分離された複製環境');
    expect(termsSource).toContain('第三者サービス');
    expect(termsSource).toContain('決済');
    expect(termsSource).toContain('メール送信');
    expect(termsSource).toContain('調査データ');
  });

  it('states_liability_caps_with_mandatory_exceptions', () => {
    const legalCopy = `${termsSource}\n${policySource}`;

    expect(legalCopy).toContain('直接かつ通常生ずべき損害');
    expect(legalCopy).toContain('当該サービス料金');
    expect(legalCopy).toContain('直前12か月');
    expect(legalCopy).toContain('故意または重大な過失');
    expect(legalCopy).toContain('法令上責任制限が認められない場合');
  });

  it('sets_contract_priority_governing_law_and_jurisdiction', () => {
    expect(termsSource).toContain('個別契約、本規約、サービスサイト');
    expect(termsSource).toContain('日本法');
    expect(termsSource).toContain('名古屋地方裁判所または名古屋簡易裁判所');
    expect(termsSource).not.toMatch(/TODO|TBD|未定|〇〇/);
    expect(footerSource).toContain('利用規約');
    expect(footerSource).toContain('terms/');
    expect(sitemapSource).toContain("'terms/'");
  });
});

describe('サービス仕様', () => {
  it('shows_confirmed_and_pre_contract_boundaries_without_hiding_them', () => {
    const specification = `${specificationSource}\n${policySource}`;

    expect(specificationSource).toContain('確定していること');
    expect(specificationSource).toContain('契約前に確定すること');
    expect(specification).toContain('診断実施時点');
    expect(specification).toContain('24時間365日の有人監視');
    expect(specification).toContain('契約前に確定する基準案');
    expect(specification).toContain('2営業日以内');
  });

  it('states_update_clone_stop_and_reporting_rules', () => {
    const specification = `${specificationSource}\n${policySource}`;

    expect(specification).toContain('更新適用');
    expect(specification).toContain('個人情報を削除または置換');
    expect(specification).toContain('決済を無効化');
    expect(specification).toContain('メール送信を無効化');
    expect(specification).toContain('外部APIを無効化');
    expect(specificationSource).toContain('中止条件');
    expect(specificationSource).toContain('報告書');
  });

  it('publishes_the_specification_route_in_navigation', () => {
    expect(footerSource).toContain('サービス仕様');
    expect(footerSource).toContain('service-specification/');
    expect(sitemapSource).toContain("'service-specification/'");
  });
});
