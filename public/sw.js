// Service Worker Básico para permitir instalación PWA
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
  });
  
  self.addEventListener('fetch', (e) => {
    // Aquí podríamos configurar el modo offline avanzado en el futuro
  });