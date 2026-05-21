import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor(scene, geometriesMap) {
    this.scene = scene;
    this.count = CONFIG.PARTICLES.count;
    this.modelsTargets = new Map();
    
    // Generar targets de posiciones y colores para cada modelo
    geometriesMap.forEach((data, id) => {
      // Si ya viene pre-procesado (ej: texto generado por textSampler.js)
      if (data.positions && data.colors) {
        this.modelsTargets.set(id, { positions: data.positions, colors: data.colors });
        return;
      }

      // Si es una BufferGeometry (modelos 3D cargados de GLB)
      const geometry = data;
      try {
        const dummyMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        const sampler = new MeshSurfaceSampler(dummyMesh).build();
        
        const targets = new Float32Array(this.count * 3);
        const targetColors = new Float32Array(this.count * 3);
        const position = new THREE.Vector3();
        const color = new THREE.Color();
        
        for (let i = 0; i < this.count; i++) {
          sampler.sample(position, undefined, color);
          
          targets[i * 3] = position.x;
          targets[i * 3 + 1] = position.y;
          targets[i * 3 + 2] = position.z;
          
          // Si no pudo extraer color, usa dorado por defecto
          if (color.r === 0 && color.g === 0 && color.b === 0 && !geometry.attributes.color) {
            color.set(CONFIG.PARTICLES.color);
          }

          targetColors[i * 3] = color.r;
          targetColors[i * 3 + 1] = color.g;
          targetColors[i * 3 + 2] = color.b;
        }
        
        this.modelsTargets.set(id, { positions: targets, colors: targetColors });
      } catch(e) {
        console.warn(`No se pudo samplear el modelo ${id}:`, e);
      }
    });

    // Estado inicial: dispersos
    this.positions = new Float32Array(this.count * 3);
    this.targetPositions = new Float32Array(this.count * 3);
    this.randomPhases = new Float32Array(this.count); // Para movimiento orgánico
    
    this.colors = new Float32Array(this.count * 3);
    this.targetColors = new Float32Array(this.count * 3);
    
    const radius = CONFIG.PARTICLES.dispersionRadius;
    const gold = new THREE.Color(CONFIG.PARTICLES.color);

    for (let i = 0; i < this.count; i++) {
      this.randomPhases[i] = Math.random() * Math.PI * 2;
      this.positions[i*3] = (Math.random() - 0.5) * radius;
      this.positions[i*3+1] = (Math.random() - 0.5) * radius;
      this.positions[i*3+2] = (Math.random() - 0.5) * radius;
      
      this.targetPositions[i*3] = this.positions[i*3];
      this.targetPositions[i*3+1] = this.positions[i*3+1];
      this.targetPositions[i*3+2] = this.positions[i*3+2];

      this.colors[i*3] = gold.r;
      this.colors[i*3+1] = gold.g;
      this.colors[i*3+2] = gold.b;

      this.targetColors[i*3] = gold.r;
      this.targetColors[i*3+1] = gold.g;
      this.targetColors[i*3+2] = gold.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: CONFIG.PARTICLES.size,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    this.currentModelId = null;
    this.isAnimating = false;
    this.activeRotationSpeed = 0.00005; // Girar de forma imperceptible
    this.targetOffsetX = 0;
    this.isUserInteracting = false;
  }

  transitionTo(modelId, durationMs = 1800) {
    if (!this.modelsTargets.has(modelId)) return;
    
    this.currentModelId = modelId;
    const nextData = this.modelsTargets.get(modelId);
    
    for (let i = 0; i < this.count * 3; i++) {
      this.targetPositions[i] = nextData.positions[i];
      this.targetColors[i] = nextData.colors[i];
    }
    
    const modelConfig = CONFIG.MODELS.find(m => m.id === modelId);
    this.activeRotationSpeed = modelConfig ? modelConfig.rotationSpeed : 0.001;
    this.targetOffsetX = modelConfig ? (modelConfig.offsetX || 0) : 0;
    this.isAnimating = true;

    // Reiniciar rotación y zoom al cambiar de figura
    this.points.quaternion.identity();
    this.points.scale.set(1, 1, 1);
  }

  disperse() {
    this.currentModelId = null;
    const gold = new THREE.Color(CONFIG.PARTICLES.color);
    
    for (let i = 0; i < this.count; i++) {
      // Distribución amplia para cubrir toda la pantalla sin bordes cuadrados visibles
      const rx = (Math.random() - 0.5) * 40; // Muy ancho
      const ry = (Math.random() - 0.5) * 40; // Muy alto
      const rz = (Math.random() - 0.5) * 30 - 5; // Profundo, detrás de la cámara

      this.targetPositions[i*3] = rx;
      this.targetPositions[i*3+1] = ry;
      this.targetPositions[i*3+2] = rz;

      this.targetColors[i*3] = gold.r;
      this.targetColors[i*3+1] = gold.g;
      this.targetColors[i*3+2] = gold.b;
    }

    this.activeRotationSpeed = 0.00005; // Girar de forma casi imperceptible
    this.targetOffsetX = 0;
    this.isAnimating = true;

    // Reiniciar rotación y zoom
    this.points.quaternion.identity();
    this.points.scale.set(1, 1, 1);
  }

  applyRepulsion(mouseNDC) {
    if (!this.currentModelId) return;
    
    const positions = this.points.geometry.attributes.position.array;
    
    for (let i = 0; i < this.count; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      
      const dx = px - (mouseNDC.x * 3);
      const dy = py - (mouseNDC.y * 3);
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 0.6) {
        const force = (0.6 - dist) * 0.15;
        this.targetPositions[i * 3] += dx * force;
        this.targetPositions[i * 3 + 1] += dy * force;
      }
    }
    this.isAnimating = true;
  }

  explodeAndReassemble() {
    if (!this.currentModelId) return;
    
    const radius = CONFIG.PARTICLES.dispersionRadius;
    const positions = this.points.geometry.attributes.position.array;
    
    for (let i = 0; i < this.count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * radius;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    
    this.transitionTo(this.currentModelId, 800);
  }

  update(delta) {
    if (this.isAnimating || !this.currentModelId) {
      let needsPosUpdate = false;
      let needsColUpdate = false;
      const positions = this.points.geometry.attributes.position.array;
      const colors = this.points.geometry.attributes.color.array;
      const lerpSpeed = CONFIG.PARTICLES.lerpSpeed;
      const time = Date.now() * 0.001;
      const isDispersed = !this.currentModelId;

      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        
        let tx = this.targetPositions[i3];
        let ty = this.targetPositions[i3 + 1];
        let tz = this.targetPositions[i3 + 2];

        // Movimiento orgánico como luciérnagas si están en el fondo estelar
        if (isDispersed) {
          const phase = this.randomPhases[i];
          tx += Math.sin(time * 0.5 + phase) * 2.0;
          ty += Math.cos(time * 0.3 + phase) * 2.0;
          tz += Math.sin(time * 0.4 + phase) * 2.0;
        }

        // Lerp Posiciones
        if (Math.abs(tx - positions[i3]) > 0.001) {
          positions[i3] += (tx - positions[i3]) * lerpSpeed;
          needsPosUpdate = true;
        }
        if (Math.abs(ty - positions[i3+1]) > 0.001) {
          positions[i3+1] += (ty - positions[i3+1]) * lerpSpeed;
          needsPosUpdate = true;
        }
        if (Math.abs(tz - positions[i3+2]) > 0.001) {
          positions[i3+2] += (tz - positions[i3+2]) * lerpSpeed;
          needsPosUpdate = true;
        }
        
        // Lerp Colores
        for (let j = 0; j < 3; j++) {
          const distC = this.targetColors[i3+j] - colors[i3+j];
          if (Math.abs(distC) > 0.001) {
            colors[i3+j] += distC * lerpSpeed;
            needsColUpdate = true;
          }
        }
      }

      if (isDispersed) {
        needsPosUpdate = true; // Siempre actualizar en estado disperso
      }

      if (needsPosUpdate) this.points.geometry.attributes.position.needsUpdate = true;
      if (needsColUpdate) this.points.geometry.attributes.color.needsUpdate = true;
      
      if (!needsPosUpdate && !needsColUpdate) {
        this.isAnimating = false;
      }
    }

    // Mover fluidamente el sistema de partículas hacia el offsetX designado
    const distX = this.targetOffsetX - this.points.position.x;
    if (Math.abs(distX) > 0.001) {
      this.points.position.x += distX * CONFIG.PARTICLES.lerpSpeed;
    }

    // Rotación matemática mejorada con Quaternions (permite interacción perfecta sin saltos)
    if (!this.currentModelId) {
      // Estrellas flotantes: rotación combinada lenta
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        this.activeRotationSpeed * 0.5,
        this.activeRotationSpeed,
        this.activeRotationSpeed * 0.2,
        'XYZ'
      ));
      this.points.quaternion.multiplyQuaternions(q, this.points.quaternion);
    } else {
      // Girar suavemente sobre el eje Y global si el usuario no lo está manipulando
      if (!this.isUserInteracting) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.activeRotationSpeed);
        this.points.quaternion.multiplyQuaternions(q, this.points.quaternion);
      }
    }
  }
}
