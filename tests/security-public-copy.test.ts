// 変更履歴: 2026-11-15 公開ホームの読み順とサービス境界への導線を回帰検査へ追加。
import { describe, expect, it } from 'vitest';
import homeSource from '../src/components/HomePage.astro?raw';
import positioningSource from '../src/components/SecurityPositioning.astro?raw';
import boundariesSource from '../src/components/SecurityBoundaries.astro?raw';
import specificationSource from '../src/pages/service-specification.astro?raw';
import policySource from '../src/data/security-service-policy.ts?raw';
import footerSource from '../src/components/SiteFooter.astro?raw';
import sitemapSource from '../src/pages/sitemap.xml.ts?raw';

describe('SITEVEILの公開ホーム', () => {
  it('keeps_the_approved_hero_and_safety_check_first', () => {
    const home = homeSource.replace(/\s+/g, ' ');

    expect(home).toMatch(/<VeilHero\s*\/>\s*<SafetyCheck\s*\/>/);
    expect(home.indexOf('<VeilHero')).toBeLessThan(home.indexOf('<SecurityPositioning'));
  });

  it('explains_risk_discovery_with_stable_sections', () => {
    const publicCopy = `${positioningSource}\n${boundariesSource}`;

    expect(publicCopy).toContain('確認できるリスクを、早期に見つける。');
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
