'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ---------------------------------------------------------------------------
// Procedural soft-glow sprite texture (no external assets needed)
// ---------------------------------------------------------------------------
function createGlowTexture(size = 64, color = [1, 1, 1]): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${Math.floor(color[0] * 255)},${Math.floor(color[1] * 255)},${Math.floor(color[2] * 255)},1)`);
  grad.addColorStop(0.3, `rgba(${Math.floor(color[0] * 255)},${Math.floor(color[1] * 255)},${Math.floor(color[2] * 255)},0.5)`);
  grad.addColorStop(0.7, `rgba(${Math.floor(color[0] * 255)},${Math.floor(color[1] * 255)},${Math.floor(color[2] * 255)},0.1)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Procedural nebula sprite – large soft cloud puff
// ---------------------------------------------------------------------------
function createNebulaTexture(size = 256): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  // Layer multiple offset radial gradients for an organic cloud look
  const blobs = [
    { x: half * 0.9, y: half * 1.1, r: half * 0.9 },
    { x: half * 1.15, y: half * 0.85, r: half * 0.75 },
    { x: half * 0.75, y: half * 0.8, r: half * 0.65 },
    { x: half * 1.0, y: half * 1.2, r: half * 0.55 },
  ];

  ctx.globalCompositeOperation = 'lighter';
  for (const b of blobs) {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, 'rgba(255,255,255,0.18)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.07)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const PALETTE = {
  deepNavy: new THREE.Color('#050510'),
  indigo: new THREE.Color('#6366f1'),
  violet: new THREE.Color('#8b5cf6'),
  cyan: new THREE.Color('#06b6d4'),
  white: new THREE.Color('#e0e7ff'),
};

const PALETTE_ARRAY = [PALETTE.indigo, PALETTE.violet, PALETTE.cyan, PALETTE.white];

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // -----------------------------------------------------------------------
    // Renderer
    // -----------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // -----------------------------------------------------------------------
    // Scene + Camera
    // -----------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.0008);
    scene.background = PALETTE.deepNavy;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 0);

    // -----------------------------------------------------------------------
    // Post-processing – Bloom
    // -----------------------------------------------------------------------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,   // strength
      0.6,   // radius
      0.2    // threshold
    );
    composer.addPass(bloomPass);

    // -----------------------------------------------------------------------
    // Ambient light (subtle fill so shapes aren't totally black on back faces)
    // -----------------------------------------------------------------------
    scene.add(new THREE.AmbientLight(0x1a1a3e, 0.4));

    // Directional light – gives shapes dimension
    const dirLight = new THREE.DirectionalLight(0x6366f1, 0.6);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Point lights for cinematic color pops
    const pLight1 = new THREE.PointLight(0x8b5cf6, 2, 400);
    pLight1.position.set(-80, 40, -150);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(0x06b6d4, 2, 400);
    pLight2.position.set(80, -30, -250);
    scene.add(pLight2);

    // -----------------------------------------------------------------------
    // WARP TUNNEL PARTICLES – instanced mesh for performance
    // -----------------------------------------------------------------------
    const PARTICLE_COUNT = 2000;
    const TUNNEL_LENGTH = 800;
    const TUNNEL_RADIUS = 120;

    const particleGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Per-instance color
    const instanceColors = new Float32Array(PARTICLE_COUNT * 3);
    const dummy = new THREE.Object3D();

    // Store velocity/position data separately for the warp update loop
    const pData: { x: number; y: number; z: number; speed: number }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * TUNNEL_RADIUS;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -Math.random() * TUNNEL_LENGTH;
      const speed = 0.4 + Math.random() * 1.2;

      pData.push({ x, y, z, speed });

      dummy.position.set(x, y, z);
      const s = 0.4 + Math.random() * 1.2;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      particleMesh.setMatrixAt(i, dummy.matrix);

      const col = PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)];
      instanceColors[i * 3] = col.r;
      instanceColors[i * 3 + 1] = col.g;
      instanceColors[i * 3 + 2] = col.b;
    }

    particleMesh.instanceColor = new THREE.InstancedBufferAttribute(instanceColors, 3);
    scene.add(particleMesh);

    // -----------------------------------------------------------------------
    // FLOATING GEOMETRIC SHAPES (Icosahedrons & Octahedrons)
    // -----------------------------------------------------------------------
    interface FloatingShape {
      mesh: THREE.Mesh;
      rotSpeed: THREE.Vector3;
      orbitRadius: number;
      orbitSpeed: number;
      orbitPhase: number;
      baseY: number;
      bobSpeed: number;
      bobAmp: number;
    }

    const shapes: FloatingShape[] = [];
    const shapeDefs: { geo: THREE.BufferGeometry; count: number }[] = [
      { geo: new THREE.IcosahedronGeometry(3, 1), count: 8 },
      { geo: new THREE.OctahedronGeometry(2.5, 0), count: 6 },
    ];

    for (const def of shapeDefs) {
      for (let i = 0; i < def.count; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
          emissive: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
          emissiveIntensity: 0.6,
          metalness: 0.7,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
          wireframe: Math.random() > 0.5,
        });

        const mesh = new THREE.Mesh(def.geo, mat);
        const orbitRadius = 30 + Math.random() * 80;
        const baseY = (Math.random() - 0.5) * 60;
        mesh.position.set(
          Math.cos(Math.random() * Math.PI * 2) * orbitRadius,
          baseY,
          -100 - Math.random() * 300
        );
        const s = 0.8 + Math.random() * 2;
        mesh.scale.set(s, s, s);
        scene.add(mesh);

        shapes.push({
          mesh,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.005
          ),
          orbitRadius,
          orbitSpeed: 0.03 + Math.random() * 0.05,
          orbitPhase: Math.random() * Math.PI * 2,
          baseY,
          bobSpeed: 0.3 + Math.random() * 0.5,
          bobAmp: 2 + Math.random() * 5,
        });
      }
    }

    // -----------------------------------------------------------------------
    // NEBULA CLOUD SPRITES
    // -----------------------------------------------------------------------
    const nebulaTexture = createNebulaTexture(256);
    interface NebulaSprite {
      sprite: THREE.Sprite;
      driftSpeed: THREE.Vector3;
      pulseSpeed: number;
      pulsePhase: number;
      baseOpacity: number;
    }

    const nebulas: NebulaSprite[] = [];
    const nebulaColors = [
      PALETTE.indigo,
      PALETTE.violet,
      new THREE.Color('#3b0764'),
      new THREE.Color('#1e1b4b'),
      PALETTE.cyan,
    ];

    for (let i = 0; i < 12; i++) {
      const mat = new THREE.SpriteMaterial({
        map: nebulaTexture,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        transparent: true,
        opacity: 0.08 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const scale = 150 + Math.random() * 300;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 200,
        -100 - Math.random() * 500
      );
      scene.add(sprite);

      nebulas.push({
        sprite,
        driftSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.01
        ),
        pulseSpeed: 0.3 + Math.random() * 0.7,
        pulsePhase: Math.random() * Math.PI * 2,
        baseOpacity: (mat as THREE.SpriteMaterial).opacity,
      });
    }

    // -----------------------------------------------------------------------
    // STAR-FIELD glow sprites (small, scattered, add depth)
    // -----------------------------------------------------------------------
    const glowTex = createGlowTexture(32);
    for (let i = 0; i < 200; i++) {
      const col = PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)];
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: col,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const s = 1 + Math.random() * 3;
      sprite.scale.set(s, s, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 250,
        -50 - Math.random() * 700
      );
      scene.add(sprite);
    }

    // -----------------------------------------------------------------------
    // Mouse handling
    // -----------------------------------------------------------------------
    function handleMouseMove(e: MouseEvent) {
      // Normalize to -1..1
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    function handleTouchMove(e: TouchEvent) {
      mouseRef.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // -----------------------------------------------------------------------
    // Resize
    // -----------------------------------------------------------------------
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    }
    window.addEventListener('resize', handleResize);

    // -----------------------------------------------------------------------
    // Animation loop
    // -----------------------------------------------------------------------
    const clock = new THREE.Clock();
    let animId = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const delta = clock.getDelta(); // not used for fixed-step, but keeps clock advancing

      // -- Camera parallax from mouse --
      const targetX = mouseRef.current.x * 12;
      const targetY = mouseRef.current.y * 8;
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.y += (targetY - camera.position.y) * 0.02;
      camera.lookAt(0, 0, -200);

      // -- Warp tunnel: stream particles toward camera --
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = pData[i];
        p.z += p.speed;
        if (p.z > 10) {
          // Reset behind the camera
          p.z = -TUNNEL_LENGTH;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * TUNNEL_RADIUS;
          p.x = Math.cos(angle) * radius;
          p.y = Math.sin(angle) * radius;
        }

        dummy.position.set(p.x, p.y, p.z);
        // Scale up particles closer to camera for streak effect
        const distRatio = 1 - (p.z + TUNNEL_LENGTH) / TUNNEL_LENGTH;
        const s = 0.3 + distRatio * 2.5;
        // Stretch along Z for speed lines feel
        dummy.scale.set(s * 0.5, s * 0.5, s + p.speed * 1.5);
        dummy.lookAt(camera.position);
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      // -- Floating shapes: orbit + bob + rotate --
      for (const shape of shapes) {
        shape.orbitPhase += shape.orbitSpeed * 0.016;
        shape.mesh.position.x = Math.cos(shape.orbitPhase) * shape.orbitRadius;
        shape.mesh.position.y =
          shape.baseY + Math.sin(t * shape.bobSpeed) * shape.bobAmp;
        shape.mesh.rotation.x += shape.rotSpeed.x;
        shape.mesh.rotation.y += shape.rotSpeed.y;
        shape.mesh.rotation.z += shape.rotSpeed.z;

        // Subtle pulsing emissive
        const mat = shape.mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.4 + Math.sin(t * 1.5 + shape.orbitPhase) * 0.3;
      }

      // -- Nebula drift + pulse --
      for (const neb of nebulas) {
        neb.sprite.position.add(neb.driftSpeed);
        const mat = neb.sprite.material as THREE.SpriteMaterial;
        mat.opacity =
          neb.baseOpacity +
          Math.sin(t * neb.pulseSpeed + neb.pulsePhase) * 0.03;

        // Wrap nebulas that drift too far
        if (neb.sprite.position.x > 300) neb.sprite.position.x = -300;
        if (neb.sprite.position.x < -300) neb.sprite.position.x = 300;
        if (neb.sprite.position.y > 200) neb.sprite.position.y = -200;
        if (neb.sprite.position.y < -200) neb.sprite.position.y = 200;
      }

      // -- Animate point lights for dynamic color shifts --
      pLight1.position.x = Math.sin(t * 0.2) * 100;
      pLight1.position.y = Math.cos(t * 0.3) * 60;
      pLight2.position.x = Math.cos(t * 0.15) * 120;
      pLight2.position.z = -200 + Math.sin(t * 0.25) * 80;

      // -- Render with bloom --
      composer.render();
    }

    animate();

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);

      // Dispose all scene objects
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });

      particleGeo.dispose();
      particleMat.dispose();
      nebulaTexture.dispose();
      glowTex.dispose();

      for (const def of shapeDefs) {
        def.geo.dispose();
      }

      composer.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
