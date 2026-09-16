/* Service worker: deixa o aplicativo abrir mesmo sem internet.
   Ao publicar uma atualização, mude o número da versão abaixo. */
const VERSAO = 'oab-santana-v1';
const ARQUIVOS = [
  './', './index.html', './styles.css', './config.js',
  './conteudo.js', './dados.js', './app.js',
  './manifest.webmanifest',
  './icons/logo-horizontal.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // Reservas sempre vêm da rede; o resto pode vir do cache.
  if(e.request.url.includes('firestore') || e.request.url.includes('googleapis.com/google.firestore')) return;
  e.respondWith(
    fetch(e.request)
      .then(resposta => {
        const copia = resposta.clone();
        caches.open(VERSAO).then(c => c.put(e.request, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
