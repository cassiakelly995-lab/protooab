/* Service worker da 247ª Subseção — OAB Santana de Parnaíba */
const VERSAO = 'oab-santana-v3';

const ESSENCIAIS = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './conteudo.js',
  './dados.js',
  './app.js',
  './manifest.webmanifest',
  './logo-horizontal.png',
  './favicon-64.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSAO).then(async (cache) => {
      // addAll falha inteiro se um arquivo faltar; aqui cada um é opcional
      await Promise.all(
        ESSENCIAIS.map((url) => cache.add(url).catch(() => null))
      );
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then(async (chaves) => {
      await Promise.all(
        chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fontes do Google etc.

  // Navegação: rede primeiro, cache como reserva (funciona offline)
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((c) => c.put('./index.html', copia));
          return resposta;
        })
        .catch(() =>
          caches.match('./index.html').then((r) => r || caches.match('./'))
        )
    );
    return;
  }

  // Demais arquivos: cache primeiro, atualizando em segundo plano
  evento.respondWith(
    caches.match(req).then((emCache) => {
      const daRede = fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((c) => c.put(req, copia));
          }
          return resposta;
        })
        .catch(() => emCache);
      return emCache || daRede;
    })
  );
});
