import * as THREE from 'three';
import { CONFIG } from './config.js';

export function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.SCENE.background);

  const camera = new THREE.PerspectiveCamera(
    CONFIG.SCENE.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = CONFIG.SCENE.cameraZ;

  // Resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
  });

  return { renderer, camera, scene };
}

export function startLoop(renderer, scene, camera, particleSystem) {
  const clock = new THREE.Clock();

  function tick() {
    const delta = clock.getDelta();

    if (particleSystem) {
      particleSystem.update(delta);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();
}
