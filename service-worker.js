const CACHE_PREFIX = 'simulador-urna-camocim-';
const CACHE_VERSION = 'v20260824-1';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const BASE_URL = new URL('./', self.location.href);

const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/etapas.js',
  './js/config.js',
  './js/planilha.js',
  './js/endereco.js',
  './js/script.js',
  './js/install.js',
  './data/territorios.json',
  './Images/urna.png',
  './audios/numeros.mp3',
  './audios/corrige.mp3',
  './audios/confirma.mp3'
].map((caminho) => new URL(caminho, BASE_URL).href);

async function adicionarAoCacheSemInterromper(cache, url) {
  try {
    const resposta = await fetch(url, { cache: 'reload' });
    if (resposta.ok) await cache.put(url, resposta);
  } catch (erro) {
    console.warn('Arquivo offline não armazenado:', url, erro);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ARQUIVOS_ESSENCIAIS.map((url) => adicionarAoCacheSemInterromper(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(
      nomes
        .filter((nome) => nome.startsWith(CACHE_PREFIX) && nome !== CACHE_NAME)
        .map((nome) => caches.delete(nome))
    );
    await self.clients.claim();
  })());
});

async function responderNavegacao(requisicao) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const respostaRede = await fetch(requisicao);
    if (respostaRede.ok) await cache.put(requisicao, respostaRede.clone());
    return respostaRede;
  } catch (erro) {
    return (
      await cache.match(requisicao, { ignoreSearch: true }) ||
      await cache.match(new URL('./index.html', BASE_URL).href) ||
      await cache.match(new URL('./', BASE_URL).href)
    );
  }
}

async function responderArquivoEstatico(requisicao) {
  const cache = await caches.open(CACHE_NAME);
  const armazenado = await cache.match(requisicao, { ignoreSearch: true });
  if (armazenado) return armazenado;

  try {
    const respostaRede = await fetch(requisicao);
    if (respostaRede.ok) await cache.put(requisicao, respostaRede.clone());
    return respostaRede;
  } catch (erro) {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const requisicao = event.request;
  const url = new URL(requisicao.url);

  if (requisicao.method !== 'GET' || url.origin !== self.location.origin) return;

  if (requisicao.mode === 'navigate') {
    event.respondWith(responderNavegacao(requisicao));
    return;
  }

  event.respondWith(responderArquivoEstatico(requisicao));
});
