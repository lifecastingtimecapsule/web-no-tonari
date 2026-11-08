// 変更履歴: 2026-11-05 3Dヒーローの描画モード、解像度上限、情報面数を固定するテストを追加。
import { describe, expect, it } from 'vitest';
import {
  clampPixelRatio,
  getHeroCoreLayout,
  getHeroRenderMode,
  shouldAnimateHeroCore,
  shouldContinueHeroCoreFrame,
} from '../src/scripts/hero3d-policy';

describe('getHeroRenderMode', () => {
  it('WebGLを使用できない場合はSVGフォールバックを選ぶ', () => {
    expect(getHeroRenderMode({ webglAvailable: false, reducedMotion: false })).toBe('fallback');
  });

  it('縮小モーションかつWebGL対応の場合は静止3Dを選ぶ', () => {
    expect(getHeroRenderMode({ webglAvailable: true, reducedMotion: true })).toBe('static-3d');
  });

  it('通常環境ではインタラクティブ3Dを選ぶ', () => {
    expect(getHeroRenderMode({ webglAvailable: true, reducedMotion: false })).toBe('interactive-3d');
  });
});

describe('clampPixelRatio', () => {
  it('高解像度端末でも1.5を超えない', () => {
    expect(clampPixelRatio(2)).toBe(1.5);
    expect(clampPixelRatio(3)).toBe(1.5);
  });

  it('0以下の値は1へ補正する', () => {
    expect(clampPixelRatio(0)).toBe(1);
    expect(clampPixelRatio(-1)).toBe(1);
  });

  it('数値でない値は1へ補正する', () => {
    expect(clampPixelRatio(Number.NaN)).toBe(1);
  });
});

describe('getHeroCoreLayout', () => {
  it('375pxではコピーと造形を分離する積層構成を返す', () => {
    expect(getHeroCoreLayout(375)).toEqual({
      composition: 'stacked',
      scale: 0.66,
      pointerRange: 0,
    });
  });

  it('900px以上では左右分割と控えめなポインター追従を返す', () => {
    expect(getHeroCoreLayout(900)).toEqual({
      composition: 'split',
      scale: 1,
      pointerRange: 0.035,
    });
  });

  it('数値でない幅は安全な積層構成へ戻す', () => {
    expect(getHeroCoreLayout(Number.NaN)).toEqual({
      composition: 'stacked',
      scale: 0.66,
      pointerRange: 0,
    });
  });
});

describe('shouldAnimateHeroCore', () => {
  it('通常モーションかつヒーローと文書が表示中の場合だけ描画を継続する', () => {
    expect(shouldAnimateHeroCore({ reducedMotion: false, heroVisible: true, documentVisible: true })).toBe(true);
  });

  it.each([
    { reducedMotion: true, heroVisible: true, documentVisible: true },
    { reducedMotion: false, heroVisible: false, documentVisible: true },
    { reducedMotion: false, heroVisible: true, documentVisible: false },
  ])('縮小モーションまたは非表示状態では描画を停止する: %o', (visibilityState) => {
    expect(shouldAnimateHeroCore(visibilityState)).toBe(false);
  });
});

describe('shouldContinueHeroCoreFrame', () => {
  it('外殻の開き、ポインター追従、スクロール移動のいずれかが未完了なら次フレームを描画する', () => {
    expect(shouldContinueHeroCoreFrame({ openingProgress: 0.6, pointerDelta: 0, positionDelta: 0 })).toBe(true);
    expect(shouldContinueHeroCoreFrame({ openingProgress: 1, pointerDelta: 0.01, positionDelta: 0 })).toBe(true);
    expect(shouldContinueHeroCoreFrame({ openingProgress: 1, pointerDelta: 0, positionDelta: 0.01 })).toBe(true);
  });

  it('外殻と操作追従が完了したら装飾ループを停止する', () => {
    expect(shouldContinueHeroCoreFrame({ openingProgress: 1, pointerDelta: 0, positionDelta: 0 })).toBe(false);
  });
});
