import * as THREE from 'three';

export function initInteractions(canvas, particleSystem, camera) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  
  const mouseNDC = new THREE.Vector2();

  function onPointerDown(e) {
    if (particleSystem.currentModelId) {
      isDragging = true;
      particleSystem.isUserInteracting = true; // Detener auto-rotación
    }
  }

  function onPointerUp(e) {
    isDragging = false;
    // Reanudar auto-rotación después de 2 segundos de inactividad
    setTimeout(() => {
      if (!isDragging) particleSystem.isUserInteracting = false;
    }, 2000);
  }

  function onPointerMove(e) {
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcular NDC para repulsión
    mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;

    if (isDragging && particleSystem.points) {
      const deltaMove = {
        x: clientX - previousMousePosition.x,
        y: clientY - previousMousePosition.y
      };

      // Rotar el sistema de partículas (mayor sensibilidad)
      const deltaRotationQuaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
          deltaMove.y * 0.01,
          deltaMove.x * 0.01,
          0,
          'XYZ'
        ));

      particleSystem.points.quaternion.multiplyQuaternions(deltaRotationQuaternion, particleSystem.points.quaternion);
    } else {
      // Hover repulsión desactivado temporalmente para no deformar el modelo
      // al mover el mouse o rotarlo libremente
      /*
      if (particleSystem.currentModelId) {
         particleSystem.applyRepulsion(mouseNDC);
      }
      */
    }

    previousMousePosition = { x: clientX, y: clientY };
  }

  function onDoubleClick(e) {
    particleSystem.explodeAndReassemble();
  }

  // Event Listeners
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('dblclick', onDoubleClick);

  // Zoom con Ctrl + Rueda
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault(); // Evitar zoom del navegador
      if (particleSystem.points && particleSystem.currentModelId) {
        const zoomSpeed = 0.002;
        let scale = particleSystem.points.scale.x;
        scale -= e.deltaY * zoomSpeed;
        scale = Math.max(0.8, Math.min(scale, 2.2)); // Límite estricto: no menos de 0.8 de tamaño original
        particleSystem.points.scale.set(scale, scale, scale);
        
        particleSystem.isUserInteracting = true;
        clearTimeout(particleSystem.zoomTimeout);
        particleSystem.zoomTimeout = setTimeout(() => {
          particleSystem.isUserInteracting = false;
        }, 2000);
      }
    }
  }, { passive: false });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    previousMousePosition.x = e.touches[0].clientX;
    previousMousePosition.y = e.touches[0].clientY;
    onPointerDown(e);
  }, { passive: false });
  
  window.addEventListener('touchend', onPointerUp);
  window.addEventListener('touchmove', onPointerMove, { passive: false });
}
