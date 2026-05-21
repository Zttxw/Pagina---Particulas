import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from './config.js';
import { sampleTextToParticles } from './textSampler.js';

// Función para extraer color de textura a vértices
function bakeTextureToVertexColors(geometry, material, fallbackColorHex) {
  if (geometry.attributes.color) return; // Ya tiene colores de vértice

  if (material.map && material.map.image) {
    const image = material.map.image;
    if (!image.width || !image.height) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const count = geometry.attributes.position.count;
      const colors = new Float32Array(count * 3);
      const uv = geometry.attributes.uv;
      
      if (!uv) throw new Error("No hay UVs");

      for (let i = 0; i < count; i++) {
        let u = uv.getX(i);
        let v = uv.getY(i);
        
        u = u - Math.floor(u);
        v = v - Math.floor(v);
        
        if (!material.map.flipY) v = 1.0 - v;
        
        const px = Math.floor(u * (canvas.width - 1));
        const py = Math.floor(v * (canvas.height - 1));
        const idx = (py * canvas.width + px) * 4;
        
        colors[i * 3] = imgData[idx] / 255;
        colors[i * 3 + 1] = imgData[idx + 1] / 255;
        colors[i * 3 + 2] = imgData[idx + 2] / 255;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return; // Éxito leyendo mapa
    } catch(e) {
      console.warn("No se pudo leer textura:", e);
    }
  }

  // Fallback si no hay textura (o falló)
  let c = material.color ? material.color.clone() : new THREE.Color(0xffffff);
  
  // Si el material es completamente blanco y tenemos un color configurado, usar el configurado
  if (c.getHex() === 0xffffff && fallbackColorHex) {
    c = new THREE.Color(fallbackColorHex);
  }

  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for(let i=0; i<count*3; i+=3){
    colors[i] = c.r; colors[i+1] = c.g; colors[i+2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export function loadAllModels(onProgress, onComplete) {
  const manager = new THREE.LoadingManager();
  
  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const percent = (itemsLoaded / itemsTotal) * 100;
    onProgress(percent);
  };

  const loader = new GLTFLoader(manager);
  const geometriesMap = new Map();
  const promises = [];

  CONFIG.MODELS.forEach(modelData => {
    if (modelData.isText) {
      const { positions, colors } = sampleTextToParticles(modelData.text, CONFIG.PARTICLES.count);
      geometriesMap.set(modelData.id, { positions, colors });
      return;
    }

    const files = Array.isArray(modelData.file) ? modelData.file : [{ url: modelData.file, offsetX: 0 }];
    
    const filePromises = files.map(fileObj => {
      return new Promise((resolve, reject) => {
        loader.load(
          fileObj.url,
          (gltf) => {
            let geometries = [];
            
            gltf.scene.updateMatrixWorld(true);
            gltf.scene.traverse((child) => {
              if (child.isMesh && child.geometry) {
                let geometry = child.geometry.clone();
                geometry.applyMatrix4(child.matrixWorld);
                
                if (geometry.index) {
                  geometry = geometry.toNonIndexed();
                }

                // Extraer colores
                if (child.material) {
                  bakeTextureToVertexColors(geometry, child.material, modelData.color);
                }
                
                // Limpiar atributos
                ['normal', 'uv', 'tangent'].forEach(attr => {
                  if (geometry.attributes[attr]) geometry.deleteAttribute(attr);
                });
                
                geometries.push(geometry);
              }
            });

            // Unir meshes de este archivo individual
            if (geometries.length > 0) {
              let mergedFileGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
              
              // Normalizar a tamaño 1 y centrar
              mergedFileGeometry.computeBoundingBox();
              const center = new THREE.Vector3();
              mergedFileGeometry.boundingBox.getCenter(center);
              mergedFileGeometry.translate(-center.x, -center.y, -center.z);
              
              const size = new THREE.Vector3();
              mergedFileGeometry.boundingBox.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z);
              if (maxDim > 0) mergedFileGeometry.scale(1/maxDim, 1/maxDim, 1/maxDim);
              
              // Aplicar desplazamiento relativo (por ejemplo, para poner muñecas lado a lado)
              mergedFileGeometry.translate(fileObj.offsetX || 0, 0, 0);
              
              resolve(mergedFileGeometry);
            } else {
              resolve(null);
            }
          },
          undefined,
          (error) => {
            console.error(`Error cargando archivo ${fileObj.url}:`, error);
            reject(error);
          }
        );
      });
    });

    const p = Promise.all(filePromises).then(processedFiles => {
      const validFiles = processedFiles.filter(g => g !== null);
      
      let finalGeometry;
      if (validFiles.length > 0) {
        finalGeometry = BufferGeometryUtils.mergeGeometries(validFiles, false);
        
        // Escalar todo el grupo para que sea visible pero sin tapar la pantalla
        finalGeometry.scale(2.5, 2.5, 2.5);
        
        // El desplazamiento se aplicará en el ParticleSystem (posición del contenedor)
        // en lugar de desplazar los vértices, para que al rotar gire sobre su propio centro.
      } else {
        finalGeometry = new THREE.BufferGeometry();
      }
      
      geometriesMap.set(modelData.id, finalGeometry);
    });

    promises.push(p);
  });

  Promise.all(promises).then(() => {
    onComplete(geometriesMap);
  }).catch((err) => {
    console.error("Falló la carga de algunos modelos.", err);
    onComplete(geometriesMap);
  });
}
