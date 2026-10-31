/* ============================================================
   EXPERIÊNCIA 3D DO TOPO — um óculos 3D que coloca a página em foco.
   Fora das lentes, o texto aparece desfocado; dentro delas, nítido e levemente ampliado.
   Rolagem: o óculos se aproxima → troca de modelo (Quadrada, Gatinho, Aviador, Redonda)
   → a lente da Redonda cresce até ocupar a tela e revela a paisagem nítida.
   Os modelos (nome, cor, medida, material) ficam em MODELOS, logo abaixo.
   Se o 3D falhar, a seção mostra o título nítido e o site segue normal.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODELOS = [
  { nome: 'Quadrada', cor: 'Tartaruga', detalhe: 'Acetato tartaruga, polido à mão', medida: '52□19', forma: 'quadrada', material: 'tartaruga' },
  { nome: 'Gatinho', cor: 'Preto brilhante', detalhe: 'Acetato preto de brilho intenso', medida: '53□17', forma: 'gatinho', material: 'preto' },
  { nome: 'Aviador', cor: 'Vermelho rubi', detalhe: 'Metal leve, ponte dupla', medida: '57□15', forma: 'aviador', material: 'rubi' },
  { nome: 'Redonda', cor: 'Cristal', detalhe: 'Acetato transparente, leve como nada', medida: '49□21', forma: 'redonda', material: 'cristal' }
];
const FRASE = ['Tudo', 'em', 'foco'];
const FOTO_FINAL = 'paisagem.jpg';

const secao = document.getElementById('inicio');
const palco = secao.querySelector('.exp-palco');
const fundo = document.getElementById('exp-fundo');
const glc = document.getElementById('exp-gl');
const camadaHero = secao.querySelector('.exp-hero'), camadaModelo = secao.querySelector('.exp-modelo'), camadaFinal = secao.querySelector('.exp-final');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const temMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

const limitar = (v, a, b) => Math.min(Math.max(v, a), b);
const suave = t => t * t * (3 - 2 * t);
const faixa = (p, a, b) => limitar((p - a) / (b - a), 0, 1);

try { iniciar(); } catch (e) { semTresD(e); }

function semTresD(e) {
  if (e) console.warn('Experiência 3D desativada:', e);
  secao.classList.add('sem-3d');
  window.oculos3dOk = true; // evita o aviso de "não carregou"
}

function iniciar() {
  /* ---------- Renderizador, câmera e luz ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 400);
  camera.position.set(0, 0, 10);
  const luz = new THREE.DirectionalLight(0xffffff, 1.6); luz.position.set(3, 4, 6); cena.add(luz);
  const luzRubi = new THREE.PointLight(0xe0313f, 14, 30); luzRubi.position.set(-4, -2.5, 3); cena.add(luzRubi);

  /* ---------- Texto e fotos desenhados em 2D: uma versão desfocada (fundo) e outra nítida (vista pelas lentes) ---------- */
  const nitido = document.createElement('canvas');
  const ctxF = fundo.getContext('2d'), ctxN = nitido.getContext('2d');
  let texN = null, W = 0, H = 0, dpr = 1;
  const foto = new Image(); let fotoPronta = false;
  foto.onload = () => { fotoPronta = true; chaveCena = ''; };
  foto.src = FOTO_FINAL;

  function desenharTexto(ctx, w, h, linhas) {
    const n = linhas.length;
    const retrato = w / h < .9;
    let tam = n > 1 ? (retrato ? Math.min(w * .3, h * .17) : Math.min(w * .17, h * .28)) : (retrato ? w * .3 : Math.min(w * .16, h * .32));
    ctx.font = `800 ${tam}px Manrope, system-ui, sans-serif`;
    const maior = Math.max(...linhas.map(l => ctx.measureText(l).width));
    if (maior > w * .92) { tam *= w * .92 / maior; ctx.font = `800 ${tam}px Manrope, system-ui, sans-serif`; }
    const alt = tam * .84, y0 = h * .5 - (n - 1) * alt / 2;
    ctx.fillStyle = '#f5f1ec'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    linhas.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * alt + tam * .04));
  }
  function desenharFoto(ctx, w, h) {
    if (!fotoPronta) return;
    const r = Math.max(w / foto.width, h / foto.height), fw = foto.width * r, fh = foto.height * r;
    ctx.drawImage(foto, (w - fw) / 2, (h - fh) / 2, fw, fh);
  }
  function pintar(ctx, camadas) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0909'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * .55, 0, w / 2, h * .55, Math.max(w, h) * .6);
    g.addColorStop(0, 'rgba(224,49,63,.16)'); g.addColorStop(1, 'rgba(224,49,63,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.02em';
    camadas.forEach(c => {
      if (c.alfa <= 0.001) return;
      ctx.globalAlpha = c.alfa;
      if (c.foto) desenharFoto(ctx, w, h); else desenharTexto(ctx, w, h, c.linhas);
    });
    ctx.globalAlpha = 1;
  }
  let chaveCena = '';
  function atualizarCena(camadas) {
    const chave = W + 'x' + H + '|' + fotoPronta + '|' + camadas.map(c => (c.foto ? 'F' : c.linhas.join(' ')) + ':' + c.alfa.toFixed(3)).join(';');
    if (chave === chaveCena) return;
    chaveCena = chave;
    pintar(ctxF, camadas); pintar(ctxN, camadas);
    texN.needsUpdate = true;
  }

  /* ---------- Lentes: mostram a versão nítida, com leve ampliação a partir do centro de cada lente ---------- */
  const lentes = [];
  function materialLente() {
    const m = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uCentro: { value: new THREE.Vector2() }, uZoom: { value: 1.08 } },
      vertexShader: 'varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D uTex; uniform vec2 uRes; uniform vec2 uCentro; uniform float uZoom; varying vec2 vPos;
        void main(){
          vec2 q = uCentro + (gl_FragCoord.xy - uCentro) / uZoom;
          vec3 c = texture2D(uTex, q / uRes).rgb;
          float r = length(vPos) / .5;
          c *= 1.0 - smoothstep(.6, 1.1, r) * .3;
          float d = vPos.x + vPos.y * .7;
          c += smoothstep(.05, .0, abs(d - .16)) * .08 + smoothstep(.025, .0, abs(d - .27)) * .05;
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.DoubleSide, toneMapped: false
    });
    lentes.push(m);
    return m;
  }

  /* ---------- Formas das lentes (cada uma com ~1 unidade de largura, centrada no zero) ---------- */
  function formaLente(tipo, lado) {
    const s = new THREE.Shape(), X = x => x * lado;
    if (tipo === 'redonda') { s.absarc(0, 0, .47, 0, Math.PI * 2, false); return s; }
    if (tipo === 'quadrada') {
      const w = .5, h = .41, r = .17;
      s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
      s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
      return s;
    }
    if (tipo === 'gatinho') {
      s.moveTo(X(-.46), .04);
      s.bezierCurveTo(X(-.46), .30, X(-.15), .35, X(.18), .32);
      s.bezierCurveTo(X(.40), .30, X(.58), .46, X(.55), .2);
      s.bezierCurveTo(X(.52), -.10, X(.36), -.36, X(.04), -.36);
      s.bezierCurveTo(X(-.30), -.36, X(-.46), -.22, X(-.46), .04);
      return s;
    }
    // aviador: gota, mais larga embaixo e para fora
    s.moveTo(X(-.44), .30);
    s.bezierCurveTo(X(-.20), .36, X(.30), .36, X(.50), .28);
    s.bezierCurveTo(X(.62), .00, X(.42), -.47, X(.06), -.49);
    s.bezierCurveTo(X(-.30), -.49, X(-.48), -.12, X(-.44), .30);
    return s;
  }
  const MEIA = { quadrada: .5, gatinho: .55, aviador: .56, redonda: .47 };
  const ARO = { quadrada: 1.13, gatinho: 1.12, aviador: 1.05, redonda: 1.1 };
  const SEP = .68;

  /* ---------- Materiais ---------- */
  function texturaTartaruga() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#1c0b05'; x.fillRect(0, 0, 512, 512);
    const cores = ['rgba(120,52,16,', 'rgba(168,88,30,', 'rgba(58,22,8,', 'rgba(8,3,2,'];
    let semente = 7; const aleatorio = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) {
      const px = aleatorio() * 512, py = aleatorio() * 512, r = 5 + aleatorio() * 26, cor = cores[i % 4];
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, cor + (.35 + aleatorio() * .4) + ')'); g.addColorStop(1, cor + '0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * (.45 + aleatorio() * .6), aleatorio() * 3, 0, Math.PI * 2); x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 2.4);
    return t;
  }
  const MATERIAIS = {
    tartaruga: new THREE.MeshPhysicalMaterial({ map: texturaTartaruga(), roughness: .3, clearcoat: 1, clearcoatRoughness: .08 }),
    preto: new THREE.MeshPhysicalMaterial({ color: 0x0e0d0f, roughness: .2, clearcoat: 1, clearcoatRoughness: .04 }),
    rubi: new THREE.MeshPhysicalMaterial({ color: 0xa3121f, roughness: .22, metalness: .35, clearcoat: 1, clearcoatRoughness: .05 }),
    cristal: new THREE.MeshPhysicalMaterial({ color: 0xf1f4f6, roughness: .04, transparent: true, opacity: .58, clearcoat: 1, envMapIntensity: 2.4, depthWrite: false })
  };
  const METAL = new THREE.MeshStandardMaterial({ color: 0xd0cccc, metalness: 1, roughness: .28 });

  /* ---------- Montagem de cada modelo ---------- */
  function montar(modelo) {
    const g = new THREE.Group(), mat = MATERIAIS[modelo.material], meia = MEIA[modelo.forma], k = ARO[modelo.forma];
    const fino = modelo.forma === 'aviador';
    const extrusao = { depth: fino ? .03 : .07, bevelEnabled: true, bevelThickness: fino ? .02 : .035, bevelSize: fino ? .018 : .03, bevelSegments: 4, curveSegments: 12 };
    const lentesModelo = [];
    for (const lado of [-1, 1]) {
      const f = formaLente(modelo.forma, lado), pts = f.getPoints(120);
      const aro = new THREE.Shape(pts.map(p => new THREE.Vector2(p.x * k, p.y * k)));
      aro.holes.push(new THREE.Path(pts));
      const geo = new THREE.ExtrudeGeometry(aro, extrusao); geo.translate(0, 0, -extrusao.depth / 2);
      const m = new THREE.Mesh(geo, mat); m.position.x = SEP * lado; g.add(m);
      const lente = new THREE.Mesh(new THREE.ShapeGeometry(f, 64), materialLente());
      lente.position.set(SEP * lado, 0, 0); lente.renderOrder = -1; g.add(lente); lentesModelo.push(lente);
      // haste e dobradiça
      const hx = SEP * lado + lado * (meia * k - .03), hy = fino ? .26 : .2;
      const haste = new THREE.Mesh(new THREE.BoxGeometry(fino ? .03 : .055, fino ? .035 : .075, 2.2), fino ? METAL : mat);
      haste.position.set(hx, hy, -1.12); g.add(haste);
      const dob = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, .14), METAL); dob.position.set(hx, hy, -.05); g.add(dob);
      // plaquetas (só nos de metal)
      if (fino) { const pl = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), METAL); pl.scale.set(.6, 1, .4); pl.position.set(lado * (SEP - meia + .1), -.12, -.12); g.add(pl); }
    }
    // ponte
    const xi = SEP - meia * k + .04, yp = modelo.forma === 'redonda' ? .06 : .12;
    const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(-xi, yp, 0), new THREE.Vector3(0, yp + .1, .03), new THREE.Vector3(xi, yp, 0)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, fino ? .022 : .045, 10), fino ? METAL : mat));
    if (fino) { // ponte dupla do aviador
      const reta = new THREE.CatmullRomCurve3([new THREE.Vector3(-xi - .02, .33, 0), new THREE.Vector3(0, .34, .01), new THREE.Vector3(xi + .02, .33, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(reta, 16, .02, 8), METAL));
    }
    g.visible = false;
    cena.add(g);
    return { g, lentes: lentesModelo };
  }
  const oculos = MODELOS.map(montar);

  /* ---------- Tamanhos ---------- */
  let visW = 1, visH = 1, base = 1;
  function medir() {
    W = palco.clientWidth; H = palco.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    const bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    for (const c of [fundo, nitido]) { c.width = bw; c.height = bh; }
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); visW = visH * camera.aspect;
    const larg = 2 * SEP + 2 * .56 * 1.2;
    base = Math.min((W / H < .9 ? .84 : .4) * visW / larg, visH * .36);
    if (texN) texN.dispose();
    texN = new THREE.CanvasTexture(nitido);
    texN.generateMipmaps = false; texN.minFilter = THREE.LinearFilter;
    lentes.forEach(m => { m.uniforms.uTex.value = texN; m.uniforms.uRes.value.set(bw, bh); });
    fundo.style.setProperty('--desfoque', Math.round(Math.min(W, H) * .02) + 'px');
    chaveCena = '';
  }

  /* ---------- Mouse ---------- */
  let mx = 0, my = 0, rx = 0, ry = 0;
  if (temMouse && !reduzir) addEventListener('mousemove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; });

  /* ---------- Quadro a quadro ---------- */
  let inicioIntro = null, modeloInfo = -1;
  const v = new THREE.Vector3();
  const infoNum = camadaModelo.querySelector('[data-num]'), infoCor = camadaModelo.querySelector('[data-cor]'),
    infoDetalhe = camadaModelo.querySelector('[data-detalhe]'), infoMedida = camadaModelo.querySelector('[data-medida]');

  function quadro(t) {
    requestAnimationFrame(quadro);
    const r = secao.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = limitar(-r.top / Math.max(secao.offsetHeight - innerHeight, 1), 0, 1);

    // entrada: o óculos chega girando depois da tela de abertura
    if (inicioIntro === null && document.body.classList.contains('pronto')) inicioIntro = t;
    const intro = reduzir ? 1 : inicioIntro === null ? 0 : suave(limitar((t - inicioIntro) / 1800, 0, 1));

    // fases da rolagem
    const aprox = suave(faixa(p, .05, .15)) * (1 - suave(faixa(p, .17, .25)));
    const fm = limitar((p - .26) / .135, 0, 3.999);
    const m = Math.floor(fm), f = fm - m;
    const troca = m < 3 ? suave(faixa(f, .62, 1)) : 0;
    const mergulho = faixa(p, .8, .97), mg = suave(mergulho);
    const atual = p < .26 ? 0 : (troca > .5 ? m + 1 : m);

    // texto ao fundo
    const camadas = [];
    const heroParaModelo = faixa(p, .19, .26);
    if (p < .26) {
      camadas.push({ linhas: FRASE, alfa: 1 - heroParaModelo }, { linhas: [MODELOS[0].nome], alfa: heroParaModelo });
    } else if (mergulho > 0) {
      const ff = faixa(mergulho, .12, .45);
      camadas.push({ linhas: [MODELOS[3].nome], alfa: 1 - ff }, { foto: true, alfa: ff });
    } else {
      camadas.push({ linhas: [MODELOS[m].nome], alfa: 1 - troca });
      if (m < 3) camadas.push({ linhas: [MODELOS[m + 1].nome], alfa: troca });
    }
    atualizarCena(camadas);

    // qual óculos aparece e como ele está posicionado
    oculos.forEach((o, i) => { o.g.visible = i === atual; });
    const o = oculos[atual].g;
    rx += ((reduzir ? 0 : my) * .16 - rx) * .06; ry += ((reduzir ? 0 : mx) * .32 - ry) * .06;
    const giroTroca = troca < .5 ? troca * Math.PI : (troca - 1) * Math.PI;
    const flutua = reduzir ? 0 : Math.sin(t / 1100) * .04;
    let s = base * (1 + .55 * aprox) * (.55 + .45 * intro);
    let x = 0, y = flutua * (1 - mg);
    if (mergulho > 0) {
      const meiaDiag = Math.hypot(visW, visH) / 2;
      const alvo = meiaDiag / (.47 * base) * 1.25;
      s = base * Math.pow(alvo, mg);
      x = -SEP * s * suave(faixa(mergulho, 0, .35));
    }
    o.scale.setScalar(s);
    o.position.set(x, y, 0);
    o.rotation.set(rx * (1 - mg), (ry + giroTroca) * (1 - mg) - (1 - intro) * 2.6, (reduzir ? 0 : Math.sin(t / 1700) * .02) * (1 - mg));

    // centro de cada lente na tela, para a ampliação partir dele
    const bw = W * dpr, bh = H * dpr;
    oculos[atual].lentes.forEach(l => {
      l.getWorldPosition(v); v.project(camera);
      l.material.uniforms.uCentro.value.set((v.x + 1) / 2 * bw, (v.y + 1) / 2 * bh);
      l.material.uniforms.uZoom.value = (1.07 + .38 * aprox) * (1 - mg) + mg;
    });

    // textos sobre a cena
    camadaHero.style.opacity = (1 - faixa(p, .03, .1)) * intro;
    camadaModelo.style.opacity = faixa(p, .24, .28) * (1 - faixa(p, .8, .84));
    camadaFinal.style.opacity = faixa(p, .9, .96);
    if (atual !== modeloInfo) {
      modeloInfo = atual;
      const md = MODELOS[atual];
      infoNum.textContent = `0${atual + 1} / 0${MODELOS.length}`; infoCor.textContent = md.cor; infoDetalhe.textContent = md.detalhe; infoMedida.textContent = md.medida;
    }

    renderer.render(cena, camera);
  }

  medir();
  addEventListener('resize', () => { medir(); });
  const comecar = () => { window.oculos3dOk = true; secao.classList.add('com-3d'); requestAnimationFrame(quadro); };
  (document.fonts && document.fonts.load ? document.fonts.load('800 120px Manrope') : Promise.resolve()).then(comecar, comecar);
}
