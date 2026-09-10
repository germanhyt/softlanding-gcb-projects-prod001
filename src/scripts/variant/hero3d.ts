type ThreeModule = typeof import('three');

export interface Hero3DOptions {
  particleCount?: number;
  mobileBreakpoint?: number;
  mobileFps?: number;
  desktopFps?: number;
}

const DEFAULTS: Required<Hero3DOptions> = {
  particleCount: 4000,
  mobileBreakpoint: 768,
  mobileFps: 30,
  desktopFps: 60,
};

export function initHero3D(
  canvas: HTMLCanvasElement,
  fallback: HTMLElement | null
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar WebView disponible antes de importar three
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl') || probe.getContext('webgl2') || probe.getContext('experimental-webgl');
    if (!gl) {
      canvas.classList.add('disabled');
      reject(new Error('WebGL no disponible'));
      return;
    }

    const opts = { ...DEFAULTS };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      canvas.classList.add('disabled');
      resolve();
      return;
    }

    let started = false;
    let disposed = false;
    let rafId: number | null = null;
    let renderer: import('three').WebGLRenderer | null = null;
    let scene: import('three').Scene | null = null;
    let camera: import('three').PerspectiveCamera | null = null;
    let points: import('three').Points | null = null;
    let geometry: import('three').BufferGeometry | null = null;
    let material: import('three').Material | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    let mouse = { x: 0, y: 0 };
    let currentRot = { x: 0, y: 0 };

    const start = async () => {
      if (started || disposed) return;
      started = true;

      let THREE: ThreeModule;
      try {
        THREE = await import('three');
      } catch (e) {
        canvas.classList.add('disabled');
        reject(e);
        return;
      }

      const isMobile = window.innerWidth < opts.mobileBreakpoint;
      const targetFps = isMobile ? opts.mobileFps : opts.desktopFps;
      const frameInterval = 1000 / targetFps;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 6);

      // Particle field (gold dust): esfera shell distribution
      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(opts.particleCount * 3);
      const colors = new Float32Array(opts.particleCount * 3);
      const sizes = new Float32Array(opts.particleCount);

      // Deterministic radial distribution (no random per-frame)
      const PHI = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < opts.particleCount; i++) {
        const y = 1 - (i / (opts.particleCount - 1)) * 2; // [-1, 1]
        const radius = Math.sqrt(1 - y * y);
        const theta = PHI * i;
        const r = 2.5 + (i % 7) * 0.35;
        positions[i * 3] = Math.cos(theta) * radius * r;
        positions[i * 3 + 1] = y * r;
        positions[i * 3 + 2] = Math.sin(theta) * radius * r;

        // Color: gold base con variantes hacia violet/blue (mismo gradiente del brand)
        const t = (i / opts.particleCount);
        const cr = 0.79 + t * 0.16; // gold+ violet blend
        const cg = 0.66 - t * 0.27;
        const cb = 0.30 + t * 0.55;
        colors[i * 3] = cr;
        colors[i * 3 + 1] = cg;
        colors[i * 3 + 2] = cb;

        sizes[i] = 0.012 + (i % 5) * 0.006;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      material = new THREE.PointsMaterial({
        size: 0.04,
        sizeAttenuation: true,
        depthWrite: false,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // El canvas ahora está vivo: ocultar fallback CSS
      if (fallback) fallback.classList.add('disabled');

      // Mouse parallax (rotación del Points object)
      const onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener('mousemove', onMouseMove, { passive: true });

      // ResizeObserver con debounce manual
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (!renderer || !camera || disposed) return;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }, 120);
      };
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(canvas);

      // Animation loop con frametime clamp + IntersectionObserver pause
      let lastTime = performance.now();
      let visible = true;
      let timeAccum = 0;

      const tick = (now: number) => {
        if (disposed || !visible) {
          rafId = null;
          return;
        }
        const elapsed = now - lastTime;
        if (elapsed < frameInterval) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        lastTime = now;
        timeAccum += elapsed * 0.0006;

        // Lerp rotation
        const targetX = mouse.y * 0.4;
        const targetY = mouse.x * 0.6;
        currentRot.x += (targetX - currentRot.x) * 0.04;
        currentRot.y += (targetY - currentRot.y) * 0.04;

        if (points) {
          points.rotation.x = currentRot.x + Math.sin(timeAccum * 0.15) * 0.05;
          points.rotation.y = currentRot.y + timeAccum * 0.06;
          (points.material as import('three').PointsMaterial).opacity =
            0.78 + Math.sin(timeAccum * 0.7) * 0.12;
        }

        if (renderer && scene && camera) renderer.render(scene, camera);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      // Pause/resume con IntersectionObserver
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          visible = entry.isIntersecting;
          if (visible && !rafId && !disposed) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
          } else if (!visible && rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        },
        { threshold: 0.01 }
      );
      intersectionObserver.observe(canvas);

      // Cleanup
      const cleanup = () => {
        if (disposed) return;
        disposed = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        window.removeEventListener('mousemove', onMouseMove);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();

        if (geometry) {
          geometry.dispose();
          geometry = null;
        }
        if (material) {
          material.dispose();
          material = null;
        }
        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
          renderer = null;
        }
        scene = null;
        camera = null;
        points = null;
      };
      window.addEventListener('pagehide', cleanup, { once: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        } else if (visible && !disposed && !rafId) {
          rafId = requestAnimationFrame(tick);
        }
      });

      resolve();
    };

    // Lazy mount via IntersectionObserver
    const lazy = new IntersectionObserver(
      (entries, obs) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          obs.disconnect();
          start();
        }
      },
      { rootMargin: '200px' }
    );
    lazy.observe(canvas);

    // Safety timeout: si nunca intersecta en 10s, no bloqueamos resolve
    setTimeout(() => {
      if (!started && !disposed) {
        resolve();
      }
    }, 10000);
  });
}
