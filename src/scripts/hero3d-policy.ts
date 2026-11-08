// 変更履歴: 2026-11-05 端末条件から3Dヒーローの安全な描画方針を決める純粋関数を追加。
// 変更履歴: 2026-11-05 単一3Dコアの積層・左右分割構成とポインター範囲を返す契約を追加。
// 変更履歴: 2026-11-05 初回演出と操作追従の完了後に連続描画を止める契約を追加。

export type HeroRenderMode = 'fallback' | 'static-3d' | 'interactive-3d';

export type HeroRenderInput = {
  webglAvailable: boolean;
  reducedMotion: boolean;
};

export type HeroCoreLayout = {
  composition: 'stacked' | 'split';
  scale: number;
  pointerRange: number;
};

export type HeroCoreAnimationInput = {
  reducedMotion: boolean;
  heroVisible: boolean;
  documentVisible: boolean;
};

export type HeroCoreFrameInput = {
  openingProgress: number;
  pointerDelta: number;
  positionDelta: number;
};

/** WebGL対応状況と動きの設定から、ヒーローの描画方式を決定する。 */
export function getHeroRenderMode(input: HeroRenderInput): HeroRenderMode {
  if (!input.webglAvailable) return 'fallback';
  return input.reducedMotion ? 'static-3d' : 'interactive-3d';
}

/** GPU負荷を抑えるため、描画用ピクセル比を1から1.5の範囲へ制限する。 */
export function clampPixelRatio(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, 1.5);
}

/** 画面幅から、単一3Dコアの構図・大きさ・ポインター追従範囲を決定する。 */
export function getHeroCoreLayout(viewportWidth: number): HeroCoreLayout {
  if (!Number.isFinite(viewportWidth) || viewportWidth < 900) {
    return { composition: 'stacked', scale: 0.66, pointerRange: 0 };
  }

  return { composition: 'split', scale: 1, pointerRange: 0.035 };
}

/** 縮小モーションと表示状態から、3Dコアの継続描画が必要かを判定する。 */
export function shouldAnimateHeroCore(input: HeroCoreAnimationInput): boolean {
  return !input.reducedMotion && input.heroVisible && input.documentVisible;
}

/** 初回演出または操作追従が未完了の間だけ、次の描画フレームを要求する。 */
export function shouldContinueHeroCoreFrame(input: HeroCoreFrameInput): boolean {
  return input.openingProgress < 0.999 || input.pointerDelta > 0.0001 || input.positionDelta > 0.0001;
}
