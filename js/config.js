export const CONFIG = {
  PARTICLES: {
    count: 70000,
    size: 0.012,
    color: '#aab4c2',  // Plateado suave para no competir con texto dorado
    colorVariation: 0.2,
    lerpSpeed: 0.04,
    dispersionRadius: 8
  },

  SCENE: {
    background: '#0a0a0a',
    cameraZ: 5,
    fov: 60
  },

  SCROLL: {
    triggerOffset: 0.35
  },

  MODELS: [
    {
      id: 'munecas',
      file: [
        { url: 'Imag3D/munecas_cusco_-_maximiliano_palomino.glb', offsetX: -0.6 },
        { url: 'Imag3D/munecas_cusco_maximiliana_palomino.glb', offsetX: 0.6 }
      ],
      offsetX: 1.5, // Mover todo el grupo a la derecha para no tapar el texto
      title: 'Muñecas de Maximiliano y Maximiliana',
      description: 'Hermosa artesanía representativa de la cultura local de Cusco, elaborada por Maximiliano y Maximiliana Palomino.',
      location: 'Cusco, Perú',
      rotationSpeed: 0.002
    },
    {
      id: 'ushnu',
      file: [{ url: 'Imag3D/ushnu.glb', offsetX: 0 }],
      offsetX: 2.0,
      color: '#c29b57', // Tono piedra inca cálida
      title: 'Ushnu de Huánuco Pampa',
      description: 'Plataforma ceremonial inca desde donde el Sapa Inca presidía rituales del Imperio.',
      location: 'Huánuco Pampa · Región Huánuco',
      rotationSpeed: 0.001
    },
    {
      id: 'intipunku',
      file: [{ url: 'Imag3D/intipunku_peru.glb', offsetX: 0 }],
      offsetX: 2.0,
      color: '#a38d6d', // Tono piedra antigua
      title: 'Intipunku',
      description: 'La Puerta del Sol, entrada principal a Machu Picchu en el Camino Inca, marcando el fin de la gran ruta.',
      location: 'Machu Picchu · Cusco',
      rotationSpeed: 0.0015
    }
  ]
};
