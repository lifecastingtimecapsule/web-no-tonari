// 変更履歴: 2026-11-15 公開ホームの読み順とサービス境界への導線を回帰検査へ追加。
import { describe, expect, it } from 'vitest';
import homeSource from '../src/components/HomePage.astro?raw';
import positioningSource from '../src/components/SecurityPositioning.astro?raw';
import boundariesSource from '../src/components/SecurityBoundaries.astro?raw';

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
