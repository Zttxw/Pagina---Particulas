# Turismo Cusco - Experiencia Interactiva con Three.js

Un proyecto web inmersivo que utiliza Three.js para mostrar modelos 3D arqueológicos peruanos a través de un sistema dinámico de partículas.

## Estructura de Carpetas

- `/assets/models`: Contiene los archivos `.glb` de los modelos 3D.
- `/css`: Hojas de estilo modularizadas (main, hero, sections, loader, ui).
- `/js`: Módulos JavaScript (ES6 modules) sin bundler.
  - `main.js`: Orquestador principal.
  - `config.js`: Valores centralizados (partículas, modelos, escena).
  - `scene.js`: Configuración básica de Three.js.
  - `loader.js`: Carga paralela de modelos `.glb`.
  - `particles.js`: Sistema principal de partículas (posicionamiento, interpolación, repulsión).
  - `scroll.js`: Detección de secciones para transiciones de modelos.
  - `interactions.js`: Interacciones del usuario (drag, hover, double-click).

## Cómo correr el proyecto

Debido a restricciones de CORS para cargar archivos externos (como los `.glb`), **no puedes** simplemente abrir el archivo `index.html` en el navegador dándole doble clic.

Debes levantar un servidor local. Las formas más sencillas son:

1. **VS Code Live Server:** Instala la extensión "Live Server" en VS Code, haz clic derecho en `index.html` y selecciona "Open with Live Server".
2. **Python:** Si tienes Python instalado, ejecuta en la raíz del proyecto:
   - `python -m http.server 8000` (y entra a http://localhost:8000)
3. **Node.js (http-server):** Si tienes Node, ejecuta `npx http-server`.

## Cómo agregar un nuevo modelo

1. Copia tu archivo `.glb` dentro de la carpeta `assets/models/`.
2. Edita `js/config.js` y añade una nueva entrada en el arreglo `MODELS` con la siguiente estructura:
   ```javascript
   {
     id: 'mi-modelo',
     file: 'assets/models/mi_modelo.glb',
     title: 'Título del modelo',
     description: 'Descripción breve.',
     location: 'Ubicación',
     rotationSpeed: 0.001
   }
   ```
3. Edita `index.html` y agrega una nueva etiqueta `<article class="model-section" data-model-id="mi-modelo">` copiando la estructura de las otras.

## Tecnologías Utilizadas
- **Three.js (r158)**: Carga vía Importmap (cdn.jsdelivr.net).
- **Vanilla JavaScript**: Módulos ES6.
- **CSS3 Vanilla**: Sin frameworks, priorizando custom properties (variables) y animaciones nativas.

## Créditos
Los modelos 3D deben ser provistos por el usuario (recomendado modelos optimizados en Sketchfab u otros orígenes).



<img width="1057" height="622" alt="image" src="https://github.com/user-attachments/assets/dcb5406f-5f0e-4051-bb4d-b0d7095cafd7" />

<img width="1789" height="766" alt="image" src="https://github.com/user-attachments/assets/0fdac485-52fa-42d3-8048-26fb99fc1949" />

<img width="1616" height="554" alt="image" src="https://github.com/user-attachments/assets/1b15530c-7d55-4d37-ac7b-603c91cc45ea" />



