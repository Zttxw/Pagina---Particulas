import { CONFIG } from './config.js';
import { initScene, startLoop } from './scene.js';
import { loadAllModels } from './loader.js';
import { ParticleSystem } from './particles.js';
import { initScroll } from './scroll.js';
import { initInteractions } from './interactions.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bg-canvas');
  
  // 1. Inicializar escena
  const { renderer, camera, scene } = initScene(canvas);
  
  // Mostrar porcentaje inicial en loader
  const loaderPercent = document.getElementById('loader-percent-value');
  const loaderBar = document.getElementById('loader-bar');
  const loaderEl = document.getElementById('loader');

  // 2. Cargar modelos
  loadAllModels(
    // onProgress
    (percent) => {
      loaderPercent.innerText = Math.round(percent);
      loaderBar.style.width = `${percent}%`;
    },
    // onComplete
    (geometriesMap) => {
      // Ocultar loader
      loaderEl.classList.add('hidden');
      setTimeout(() => {
        loaderEl.style.display = 'none';
      }, 1000);

      // 3. Inicializar sistema de partículas (empiezan como estrellas dispersas)
      const particleSystem = new ParticleSystem(scene, geometriesMap);

      // 4. Configurar scroll
      initScroll(particleSystem);

      // 5. Configurar interacciones
      initInteractions(canvas, particleSystem, camera);

      // 5.5 UI Interactiva (3D Hover en Testimonios y Paquetes)
      initUIInteractions();

      // Mostrar hint de interacciones si el usuario entra a una sección
      // Aquí se hace de forma pasiva, o se puede controlar desde scroll.js
      
      // 6. Iniciar el loop principal
      startLoop(renderer, scene, camera, particleSystem);
    }
  );
});

// Lógica de Tilt 3D para tarjetas interactivas
function initUIInteractions() {
  const cards = document.querySelectorAll('.testimonial-card, .pricing-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Rotación máxima de 10 grados
      const xPct = (x / rect.width - 0.5) * 15; 
      const yPct = (y / rect.height - 0.5) * -15;
      
      card.style.transform = `perspective(1000px) rotateY(${xPct}deg) rotateX(${yPct}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    });
  });
}
