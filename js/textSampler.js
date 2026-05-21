import { CONFIG } from './config.js';

export function sampleTextToParticles(text, count) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Alta resolución para un escaneo limpio
  canvas.width = 2048;
  canvas.height = 1024;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Tipografía impactante
  ctx.font = '900 280px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Dibujar texto
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const validPixels = [];
  
  // Escanear píxeles blancos (resolución de salto 2 para mayor velocidad)
  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      const index = (y * canvas.width + x) * 4;
      if (imgData[index] > 128) {
        // Normalizar a -1 y +1
        const normX = (x / canvas.width) * 2 - 1;
        const normY = -(y / canvas.height) * 2 + 1;
        validPixels.push({ x: normX, y: normY });
      }
    }
  }
  
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const aspect = canvas.width / canvas.height;
  const textScale = 4.0; // Tamaño del texto en el espacio 3D
  
  // Color base
  const baseColor = parseInt(CONFIG.PARTICLES.color.replace('#', '0x'));
  const r = ((baseColor >> 16) & 255) / 255;
  const g = ((baseColor >> 8) & 255) / 255;
  const b = (baseColor & 255) / 255;
  
  for (let i = 0; i < count; i++) {
    const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
    
    // Asignar posición base con ligera aleatoriedad para rellenar
    let px = pixel.x * aspect * textScale + (Math.random() - 0.5) * 0.08;
    let py = pixel.y * textScale + (Math.random() - 0.5) * 0.08;
    let pz = (Math.random() - 0.5) * 0.3; // Volumen Z
    
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    
    // Variación de color dorada/blanca
    const mix = Math.random() * 0.4;
    colors[i * 3] = Math.min(1, r + mix);
    colors[i * 3 + 1] = Math.min(1, g + mix);
    colors[i * 3 + 2] = Math.min(1, b + mix);
  }
  
  return { positions, colors };
}
