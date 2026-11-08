// 変更履歴: 2026-11-05 単一の黒鉛色外殻と温かな核へ3Dヒーローを再設計し、動的な縮小モーション切替を追加。
// 変更履歴: 2026-11-05 永続する呼吸表現を廃止し、初回演出と操作追従時だけ描画する方式へ変更。
import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import {
  clampPixelRatio,
  getHeroCoreLayout,
  getHeroRenderMode,
  shouldAnimateHeroCore,
  shouldContinueHeroCoreFrame,
} from './hero3d-policy';

type HeroSceneResources = {
  geometries: BufferGeometry[];
  materials: Material[];
};

type CoreSculpture = {
  group: Group;
  leftShell: Mesh;
  rightShell: Mesh;
  warmCore: Mesh;
  innerCore: Mesh;
  warmCoreMaterial: MeshStandardMaterial;
  innerCoreMaterial: MeshBasicMaterial;
};

/** 対象キャンバスでWebGLコンテキストを確保できるかを確認する。 */
function supportsWebGL(canvas: HTMLCanvasElement): boolean {
  try {
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Three.jsで生成したGPUリソースを明示的に破棄する。 */
function disposeSceneResources(resources: HeroSceneResources): void {
  resources.geometries.forEach((geometry) => geometry.dispose());
  resources.materials.forEach((material) => material.dispose());
}

/** 黒鉛色の二つの外殻と、あずき色から琥珀色へ温度を持つ核を生成する。 */
function createCoreSculpture(resources: HeroSceneResources): CoreSculpture {
  const group = new Group();
  const shellGeometry = new SphereGeometry(1.55, 64, 32);
  const shellMaterial = new MeshStandardMaterial({
    color: 0x282c33,
    metalness: 0.52,
    roughness: 0.44,
    side: DoubleSide,
  });
  const leftShell = new Mesh(shellGeometry, shellMaterial);
  const rightShell = new Mesh(shellGeometry, shellMaterial);
  leftShell.scale.set(0.48, 1.14, 0.74);
  rightShell.scale.copy(leftShell.scale);
  leftShell.rotation.y = 0.12;
  rightShell.rotation.y = -0.12;

  const coreGeometry = new IcosahedronGeometry(1.05, 2);
  const warmCoreMaterial = new MeshStandardMaterial({
    color: 0x9b4c61,
    emissive: 0x9b4c61,
    emissiveIntensity: 0.28,
    metalness: 0.16,
    roughness: 0.38,
    flatShading: true,
  });
  const warmCore = new Mesh(coreGeometry, warmCoreMaterial);
  warmCore.scale.set(0.82, 1.08, 0.82);
  warmCore.position.z = 0.16;

  const innerCoreGeometry = new IcosahedronGeometry(0.68, 4);
  const innerCoreMaterial = new MeshBasicMaterial({
    color: 0xc98a4a,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const innerCore = new Mesh(innerCoreGeometry, innerCoreMaterial);
  innerCore.scale.set(0.78, 1.05, 0.78);
  innerCore.position.z = 0.2;

  const rimGeometry = new TorusGeometry(1.18, 0.018, 8, 96, Math.PI * 0.48);
  const rimMaterial = new MeshBasicMaterial({
    color: 0x315cff,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const rim = new Mesh(rimGeometry, rimMaterial);
  rim.rotation.set(0.34, -0.42, 1.08);

  group.add(warmCore, innerCore, leftShell, rightShell, rim);
  group.rotation.set(-0.08, -0.22, -0.05);
  resources.geometries.push(shellGeometry, coreGeometry, innerCoreGeometry, rimGeometry);
  resources.materials.push(shellMaterial, warmCoreMaterial, innerCoreMaterial, rimMaterial);

  return { group, leftShell, rightShell, warmCore, innerCore, warmCoreMaterial, innerCoreMaterial };
}

/** ヒーロー内へ単一3Dコアを初期化し、ページ離脱時に使う後始末関数を返す。 */
export function initHero3D(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  const fallback = root.querySelector<HTMLElement>('[data-hero-fallback]');
  if (!canvas || !fallback) return () => undefined;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderMode = getHeroRenderMode({
    webglAvailable: supportsWebGL(canvas),
    reducedMotion: reducedMotionQuery.matches,
  });
  if (renderMode === 'fallback') return () => undefined;

  let webGLRenderer: WebGLRenderer;
  try {
    webGLRenderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return () => undefined;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 0, 7.8);

  const resources: HeroSceneResources = { geometries: [], materials: [] };
  const sculpture = createCoreSculpture(resources);
  scene.add(sculpture.group);

  scene.add(new AmbientLight(0xa9afb8, 1.85));
  const keyLight = new DirectionalLight(0xf1efea, 1.45);
  keyLight.position.set(3.2, 4.8, 6);
  scene.add(keyLight);
  const edgeLight = new DirectionalLight(0x315cff, 0.92);
  edgeLight.position.set(-4, -1, 4);
  scene.add(edgeLight);

  let animationFrameId = 0;
  let heroIsVisible = true;
  let documentIsVisible = !document.hidden;
  let reducedMotion = reducedMotionQuery.matches;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerRange = 0;
  let cameraOffsetX = 0;
  let cameraOffsetY = 0;
  let scrollProgress = 0;
  let compositionBaseY = 0;
  let openingProgress = reducedMotion ? 1 : 0;
  let lastFrameTime = performance.now();
  let isDisposed = false;

  /** 外殻を開いた完成状態へ固定し、縮小モーション時も造形の意味を保つ。 */
  const applyStaticState = (): void => {
    sculpture.leftShell.position.x = -0.92;
    sculpture.leftShell.rotation.z = -0.13;
    sculpture.rightShell.position.x = 0.92;
    sculpture.rightShell.rotation.z = 0.13;
    sculpture.warmCore.scale.set(0.82, 1.08, 0.82);
    sculpture.innerCore.scale.set(0.78, 1.05, 0.78);
  };

  /** 現在のカメラと造形を一度描画する。 */
  const renderScene = (): void => {
    webGLRenderer.render(scene, camera);
  };

  /** 表示中かつ通常モーションのときだけ、初回の開く動きと操作追従を描画する。 */
  const animateScene = (frameTime: number): void => {
    animationFrameId = 0;
    if (isDisposed || !shouldAnimateHeroCore({ reducedMotion, heroVisible: heroIsVisible, documentVisible: documentIsVisible })) return;

    const deltaSeconds = Math.min((frameTime - lastFrameTime) / 1000, 0.05);
    lastFrameTime = frameTime;
    openingProgress += (1 - openingProgress) * Math.min(deltaSeconds * 3.8, 1);
    if (openingProgress >= 0.999) openingProgress = 1;
    const easedOpening = 1 - Math.pow(1 - openingProgress, 3);

    sculpture.leftShell.position.x = -0.92 * easedOpening;
    sculpture.leftShell.rotation.z = -0.13 * easedOpening;
    sculpture.rightShell.position.x = 0.92 * easedOpening;
    sculpture.rightShell.rotation.z = 0.13 * easedOpening;

    cameraOffsetX += (pointerTargetX - cameraOffsetX) * 0.04;
    cameraOffsetY += (pointerTargetY - cameraOffsetY) * 0.04;
    sculpture.group.rotation.y = -0.22 + cameraOffsetX;
    sculpture.group.rotation.x = -0.08 + cameraOffsetY;
    const targetPositionY = compositionBaseY + scrollProgress * -0.26;
    sculpture.group.position.y += (targetPositionY - sculpture.group.position.y) * 0.04;
    sculpture.warmCoreMaterial.emissiveIntensity = 0.28 - scrollProgress * 0.12;
    sculpture.innerCoreMaterial.opacity = 0.58 - scrollProgress * 0.18;
    renderScene();

    const pointerDelta = Math.abs(pointerTargetX - cameraOffsetX) + Math.abs(pointerTargetY - cameraOffsetY);
    const positionDelta = Math.abs(targetPositionY - sculpture.group.position.y);
    if (shouldContinueHeroCoreFrame({ openingProgress, pointerDelta, positionDelta })) {
      animationFrameId = window.requestAnimationFrame(animateScene);
    }
  };

  /** 重複した描画ループを作らず、必要なときだけ再開する。 */
  const startAnimation = (): void => {
    if (animationFrameId || !shouldAnimateHeroCore({ reducedMotion, heroVisible: heroIsVisible, documentVisible: documentIsVisible })) return;
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(animateScene);
  };

  /** ヒーローの実寸にレンダラー、カメラ、造形位置を同期する。 */
  const resizeScene = (): void => {
    const width = Math.max(root.clientWidth, 1);
    const height = Math.max(root.clientHeight, 1);
    const coreLayout = getHeroCoreLayout(width);
    webGLRenderer.setPixelRatio(clampPixelRatio(window.devicePixelRatio));
    webGLRenderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pointerRange = coreLayout.pointerRange;
    sculpture.group.scale.setScalar(coreLayout.scale * 0.72);
    sculpture.group.position.x = coreLayout.composition === 'split' ? 2.05 : 0;
    compositionBaseY = coreLayout.composition === 'split' ? -0.08 : -1.72;
    sculpture.group.position.y = compositionBaseY;
    renderScene();
  };

  /** デスクトップ上のポインター位置を最大2度程度のカメラ角度へ変換する。 */
  const handlePointerMove = (event: PointerEvent): void => {
    if (pointerRange === 0) return;
    pointerTargetX = (event.clientX / window.innerWidth - 0.5) * pointerRange * 2;
    pointerTargetY = (0.5 - event.clientY / window.innerHeight) * pointerRange * 1.4;
    startAnimation();
  };

  /** ヒーローのスクロール量を最大1までの穏やかな減光へ変換する。 */
  const handleScroll = (): void => {
    scrollProgress = Math.min(Math.max(window.scrollY / Math.max(root.clientHeight, 1), 0), 1);
    startAnimation();
  };

  /** タブの表示状態に合わせてGPU描画を停止・再開する。 */
  const handleVisibilityChange = (): void => {
    documentIsVisible = !document.hidden;
    if (documentIsVisible) startAnimation();
  };

  /** OSの縮小モーション変更へ再読込なしで追従する。 */
  const handleReducedMotionChange = (event: MediaQueryListEvent): void => {
    reducedMotion = event.matches;
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    if (reducedMotion) {
      openingProgress = 1;
      applyStaticState();
      renderScene();
      return;
    }
    startAnimation();
  };

  /** WebGLコンテキスト喪失時は3Dを隠し、静止フォールバックへ即時復帰する。 */
  const handleContextLost = (event: Event): void => {
    event.preventDefault();
    root.removeAttribute('data-webgl-ready');
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  };

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    heroIsVisible = entry?.isIntersecting ?? false;
    if (heroIsVisible) startAnimation();
  }, { rootMargin: '80px' });
  const resizeObserver = new ResizeObserver(resizeScene);

  resizeObserver.observe(root);
  visibilityObserver.observe(root);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  canvas.addEventListener('webglcontextlost', handleContextLost);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });

  applyStaticState();
  if (!reducedMotion) {
    sculpture.leftShell.position.x = 0;
    sculpture.leftShell.rotation.z = 0;
    sculpture.rightShell.position.x = 0;
    sculpture.rightShell.rotation.z = 0;
  }
  resizeScene();
  root.dataset.webglReady = 'true';
  renderScene();
  startAnimation();

  /** 画面遷移や再初期化時にイベントとGPU資源を残さないための後始末。 */
  return (): void => {
    if (isDisposed) return;
    isDisposed = true;
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('scroll', handleScroll);
    root.removeAttribute('data-webgl-ready');
    disposeSceneResources(resources);
    webGLRenderer.dispose();
  };
}
