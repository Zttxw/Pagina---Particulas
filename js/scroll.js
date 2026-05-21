import { CONFIG } from './config.js';

export function initScroll(particleSystem) {
  const sections = document.querySelectorAll('[data-model-id]');
  const canvas = document.getElementById('bg-canvas');
  const marquees = document.querySelectorAll('.marquee');
  
  let currentActiveId = null;

  // Configurar textos en cascada (separar por palabra, luego por letra)
  const cascadeTexts = document.querySelectorAll('.scroll-cascade');
  cascadeTexts.forEach(el => {
    const text = el.getAttribute('data-text') || el.innerText;
    el.innerHTML = '';
    let charIndex = 0;
    text.split(' ').forEach((word, wi) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      word.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.innerText = char;
        charSpan.className = 'char';
        charSpan.style.transitionDelay = `${charIndex * 0.04}s`;
        wordSpan.appendChild(charSpan);
        charIndex++;
      });
      el.appendChild(wordSpan);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        
        // Revelar letras en cascada
        const cascades = entry.target.querySelectorAll('.scroll-cascade');
        cascades.forEach(c => c.classList.add('in-view'));

        const modelId = entry.target.getAttribute('data-model-id');
        
        if (modelId && modelId !== currentActiveId) {
          
          // Activar panel de texto si es model-section
          document.querySelectorAll('.model-section').forEach(s => s.classList.remove('is-active'));
          if (entry.target.classList.contains('model-section')) {
            entry.target.classList.add('is-active');
          }
          
          if (modelId === 'disperse') {
            const shouldExplode = currentActiveId && currentActiveId !== 'disperse';
            particleSystem.disperse(shouldExplode);
            // Partículas de fondo visibles como estrellas suaves
            canvas.style.opacity = '0.2';
            canvas.style.pointerEvents = 'none';
          } else {
            particleSystem.transitionTo(modelId, 1500);
            canvas.style.opacity = '1';
            canvas.style.pointerEvents = 'auto';
          }
          
          currentActiveId = modelId;
        }
      }
    });
  }, {
    root: null,
    rootMargin: '-10% 0px -10% 0px',
    threshold: 0.15
  });

  sections.forEach(sec => observer.observe(sec));

  // Observar el hero para volver a dispersar al subir
  const hero = document.querySelector('.hero');
  if (hero) {
    const heroObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && currentActiveId !== null) {
        particleSystem.disperse();
        canvas.style.opacity = '1';
        canvas.style.pointerEvents = 'none';
        currentActiveId = null;
        document.querySelectorAll('.model-section').forEach(s => s.classList.remove('is-active'));
      }
    }, { threshold: 0.5 });
    heroObs.observe(hero);
  }

  // Parallax del Marquee
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    marquees.forEach(marquee => {
      const speed = parseFloat(marquee.getAttribute('data-speed') || '0.1');
      const span = marquee.querySelector('span');
      if (span) {
        span.style.transform = `translateX(${scrollY * speed}px)`;
      }
    });
  });
}
