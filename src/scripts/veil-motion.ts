// 変更履歴: 2026-11-11 ヒーローのスクロール開始でロゴを即表示。ヒーロー通過の背景切替とは分離。
// 変更履歴: 2026-11-11 描画の地色を白にし、ナビ・本文と連続させる。
// 変更履歴: 2026-11-11 タップ位置への顔料の集合と復帰を追加。小画面の描画量・フレーム数を抑え、毎フレームのレイアウト参照を撤去。
// 変更履歴: 2026-11-11 青の領域を縮小し、オレンジに重なる赤い顔料を増加。
// 変更履歴: 2026-11-11 オレンジ主体へ再調整し、青・紫を差し色として追加。黄色の強さを抑える指定を反映。
// 変更履歴: 2026-11-11 黄色の面積を増やし、赤・オレンジ・緑を小さな差し色へ抑制。
// 変更履歴: 2026-11-11 ユーザー指定に合わせ、黄色を主役にオレンジと緑を添える配色へ変更。
// 変更履歴: 2026-11-11 暗い顔料を明るい青・アクア・ピーチへ変更。怖い印象を避けて流れを軽くする。
// 変更履歴: 2026-11-11 ヒーロー通過時だけヘッダーに正式ロゴを表示する監視を追加。
// 変更履歴: 2026-11-11 説明カード切替を撤去。非同期の操作待ちを作らない、独自の流動インク描画へ変更。

/** GPUで顔料の流れと指跡のマスクを描く。外部画像・通信・入力内容は使わない。 */
function createInkRenderer(canvas: HTMLCanvasElement) {
  const graphics = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!graphics) return null;
  const vertexSource = 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}';
  const fragmentSource = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform vec3 strokes[12];
    uniform vec3 gathering;
    float hash(vec2 point){return fract(sin(dot(point,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 point){
      vec2 cell=floor(point),fraction=fract(point);fraction=fraction*fraction*(3.-2.*fraction);
      return mix(mix(hash(cell),hash(cell+vec2(1.,0.)),fraction.x),mix(hash(cell+vec2(0.,1.)),hash(cell+1.),fraction.x),fraction.y);
    }
    float cloud(vec2 point){
      float total=0.,weight=.5;
      mat2 rotation=mat2(.8,-.6,.6,.8);
      for(int octave=0;octave<5;octave++){total+=weight*noise(point);point=rotation*point*2.04+4.3;weight*=.5;}
      return total;
    }
    void main(){
      vec2 screenUv=gl_FragCoord.xy/resolution;
      float gatheringScale=1.-gathering.z*.72;
      vec2 uv=(screenUv-gathering.xy)/gatheringScale+gathering.xy;
      float aspect=resolution.x/resolution.y;
      vec2 point=vec2(uv.x*aspect,uv.y);
      float clock=time*.045;
      vec2 warp=vec2(cloud(point*3.+vec2(clock,-clock)),cloud(point*3.+vec2(4.8,-clock)));
      vec2 folded=point*4.+warp*1.8;
      float pigment=cloud(folded+vec2(cloud(folded+clock),cloud(folded-clock+8.))*1.8);
      float folds=cloud(folded*3.+warp*7.-clock);
      float veins=pow(max(0.,1.-abs(pigment-.5)*13.),3.);
      // Orange and red lead; blue is restricted to small pockets and violet remains an accent.
      vec3 ink=mix(vec3(1.,.43,.14),vec3(1.,.70,.34),smoothstep(.26,.70,pigment));
      ink=mix(ink,vec3(1.,.85,.40),smoothstep(.57,.76,folds)*.34);
      ink=mix(ink,vec3(.96,.20,.13),(1.-smoothstep(.36,.51,pigment))*.88);
      ink=mix(ink,vec3(.24,.55,.91),(1.-smoothstep(.23,.31,pigment))*.82);
      ink=mix(ink,vec3(.60,.37,.83),smoothstep(.58,.72,folds)*(1.-smoothstep(.48,.61,pigment))*.91);
      ink+=vec3(.10,.08,.04)*veins*folds;
      ink*=.92+.12*smoothstep(.23,.8,folds);
      // A naturally present diagonal ribbon makes the first frame complete, without requiring a gesture.
      float center=.78-.56*uv.x+.10*sin(uv.x*7.+warp.x*3.);
      float ribbon=1.-smoothstep(.10,.24,abs(uv.y-center)+(warp.y-.5)*.14);
      float reveal=ribbon;
      for(int stroke=0;stroke<12;stroke++){
        vec2 delta=(uv-strokes[stroke].xy)*vec2(aspect,1.);
        float radius=strokes[stroke].z;
        reveal=max(reveal,(1.-smoothstep(radius*.55,radius+.06,length(delta)+(pigment-.5)*.09))*step(.001,radius));
      }
      float wisps=cloud(point*16.+warp*5.);
      reveal=smoothstep(.12,.83,reveal+(wisps-.5)*.35);
      vec3 paper=vec3(1.);
      gl_FragColor=vec4(mix(paper,ink,reveal),1.);
    }`;
  /** シェーダーの失敗は静的な代替表示に戻し、ページ全体には波及させない。 */
  const compileShader = (kind: number, source: string) => {
    const shader = graphics.createShader(kind);
    if (!shader) return null;
    graphics.shaderSource(shader, source);
    graphics.compileShader(shader);
    if (!graphics.getShaderParameter(shader, graphics.COMPILE_STATUS)) { graphics.deleteShader(shader); return null; }
    return shader;
  };
  const vertexShader = compileShader(graphics.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(graphics.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = graphics.createProgram();
  if (!program) return null;
  graphics.attachShader(program, vertexShader);
  graphics.attachShader(program, fragmentShader);
  graphics.linkProgram(program);
  if (!graphics.getProgramParameter(program, graphics.LINK_STATUS)) return null;
  graphics.useProgram(program);
  const vertices = graphics.createBuffer();
  graphics.bindBuffer(graphics.ARRAY_BUFFER, vertices);
  graphics.bufferData(graphics.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), graphics.STATIC_DRAW);
  const position = graphics.getAttribLocation(program, 'position');
  graphics.enableVertexAttribArray(position);
  graphics.vertexAttribPointer(position, 2, graphics.FLOAT, false, 0, 0);
  const resolution = graphics.getUniformLocation(program, 'resolution');
  const time = graphics.getUniformLocation(program, 'time');
  const strokes = graphics.getUniformLocation(program, 'strokes[0]');
  const gathering = graphics.getUniformLocation(program, 'gathering');
  let renderWidth = 1;
  let renderHeight = 1;
  /** サイズ変更時だけ描画解像度を算出し、小画面のGPU負荷を制限する。 */
  const resizeInk = (): void => {
    const bounds = canvas.getBoundingClientRect();
    const compact = bounds.width <= 800;
    const pixelRatio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.25, Math.sqrt((compact ? 420000 : 900000) / Math.max(1, bounds.width * bounds.height)));
    renderWidth = Math.max(1, Math.round(bounds.width * pixelRatio));
    renderHeight = Math.max(1, Math.round(bounds.height * pixelRatio));
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  };
  new ResizeObserver(resizeInk).observe(canvas);
  resizeInk();
  return {
    /** ピクセル数を抑えて描画し、端末の高DPIが負荷を無制限に増やさないようにする。 */
    draw(elapsed: number, trail: Float32Array, gatheringPoint: Float32Array) {
      graphics.viewport(0, 0, renderWidth, renderHeight);
      graphics.uniform2f(resolution, renderWidth, renderHeight);
      graphics.uniform3fv(gathering, gatheringPoint);
      graphics.uniform1f(time, elapsed);
      graphics.uniform3fv(strokes, trail);
      graphics.drawArrays(graphics.TRIANGLES, 0, 6);
    },
  };
}

/** スクロール開始でヘッダーロゴを表示し、ヒーロー通過時には背景を白へ切り替える。 */
function setupHeroBrand(): void {
  const heroSection = document.querySelector<HTMLElement>('[data-veil-stage]');
  if (!heroSection) return;
  heroSection.setAttribute('data-brand-observed', '');
  /** 現在のスクロール位置とヒーロー境界を、ロゴと背景それぞれへ反映する。 */
  const syncHeroBrand = (): void => {
    heroSection.toggleAttribute('data-brand-visible', window.scrollY > 1);
    heroSection.toggleAttribute('data-hero-passed', heroSection.getBoundingClientRect().bottom <= 1);
  };
  new IntersectionObserver(syncHeroBrand, {threshold:[0,.001]}).observe(heroSection);
  window.addEventListener('scroll',syncHeroBrand,{passive:true});
  window.addEventListener('pageshow',syncHeroBrand);
  window.addEventListener('resize',syncHeroBrand,{passive:true});
  syncHeroBrand();
}
setupHeroBrand();

/** 一つの描画予約だけを保ち、スクロール・タップ・リンク操作は一切捕捉しない。 */
function setupVeilPreview(): void {
  const stage = document.querySelector<HTMLElement>('[data-veil-stage]');
  const canvas = stage?.querySelector<HTMLCanvasElement>('[data-ink-canvas]');
  if (!stage || !canvas) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const renderer = createInkRenderer(canvas);
  if (!renderer) return;
  const trail = new Float32Array(36);
  const gatheringPoint = new Float32Array([.5, .5, 0]);
  const compactScreen = matchMedia('(max-width: 800px)');
  let gatheringStarted = -10;
  let pendingFrame = 0;
  let inView = true;
  let previousFrame = 0;
  let elapsed = 3;
  let strokeIndex = 0;
  let contextLost = false;
  /** 小画面は最大24fps、それ以外は最大30fps。非表示・停止・縮小モーションでは再予約を行わない。 */
  const paintVeil = (timestamp: number): void => {
    pendingFrame = 0;
    if (contextLost) return;
    const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, .05) : 0;
    const animate = !reducedMotion.matches && inView && !document.hidden;
    if (animate && timestamp - previousFrame < (compactScreen.matches ? 41 : 32)) { pendingFrame = requestAnimationFrame(paintVeil); return; }
    previousFrame = timestamp;
    if (animate) elapsed += delta;
    if (animate) for (let stroke=0;stroke<12;stroke++) trail[stroke*3+2] = Math.max(0, trail[stroke*3+2] - delta * .045);
    const gatheringAge = elapsed - gatheringStarted;
    gatheringPoint[2] = animate && gatheringAge < 1.35 ? Math.pow(Math.sin(Math.PI * Math.max(0, gatheringAge) / 1.35), 2) : 0;
    renderer.draw(elapsed, trail, gatheringPoint);
    stage.setAttribute('data-ink-ready', '');
    if (animate) pendingFrame = requestAnimationFrame(paintVeil);
  };
  /** 状態変更時に古い予約を破棄し、最後に指定した状態をすぐ描画する。 */
  const resetVeil = (): void => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
    previousFrame = 0;
    if (!contextLost) pendingFrame = requestAnimationFrame(paintVeil);
  };
  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    const bounds = stage.getBoundingClientRect();
    trail[strokeIndex*3] = (event.clientX-bounds.left)/bounds.width;
    trail[strokeIndex*3+1] = 1-(event.clientY-bounds.top)/bounds.height;
    trail[strokeIndex*3+2] = .16;
    strokeIndex = (strokeIndex+1)%12;
  }, {passive:true});
  /** クリック成立時のみ集合するため、タッチスクロールやリンク操作を妨げない。連打は一つの演出を更新する。 */
  stage.addEventListener('click', event => {
    if (reducedMotion.matches || !inView || document.hidden || contextLost) return;
    if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea')) return;
    const bounds = stage.getBoundingClientRect();
    gatheringPoint[0] = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    gatheringPoint[1] = Math.max(0, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height));
    gatheringStarted = elapsed;
    trail.fill(0);
  }, {passive:true});
  /** OS設定変更時は軌跡も消し、静止状態を即時反映する。 */
  const syncMotionPreference = (): void => {
    trail.fill(0);
    gatheringStarted = -10;
    gatheringPoint[2] = 0;
    resetVeil();
  };
  reducedMotion.addEventListener('change', syncMotionPreference);
  document.addEventListener('visibilitychange', resetVeil);
  window.addEventListener('resize', resetVeil, {passive:true});
  new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? false; resetVeil(); }).observe(stage);
  canvas.addEventListener('webglcontextlost', () => {
    contextLost = true;
    cancelAnimationFrame(pendingFrame);
    stage.removeAttribute('data-ink-ready');
  });
  syncMotionPreference();
}
setupVeilPreview();
