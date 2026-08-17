if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  navigator.serviceWorker.register('service-worker.js', {
    scope: './'
  }).then(function(registration) {
    if (typeof registration.update === 'function') {
      registration.update();
    }
  }).catch(function(e) {
    console.error('Erro durante o registro do service worker:', e);
  });
}

async function limparCacheDoSite() {
  const botao = document.getElementById('limpar-cache');
  const status = document.getElementById('cache-status');

  if (!botao || !status) return;

  botao.disabled = true;
  botao.textContent = 'Limpando cache...';
  status.hidden = false;
  status.textContent = 'Removendo arquivos antigos do navegador...';

  try {
    if ('caches' in window) {
      const nomesCaches = await caches.keys();
      await Promise.all(nomesCaches.map((nomeCache) => caches.delete(nomeCache)));
    }

    if ('serviceWorker' in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((registro) => registro.unregister()));
    }

    status.textContent = 'Cache limpo. Atualizando o site...';

    const url = new URL(window.location.href);
    url.searchParams.set('cache', Date.now().toString());
    window.location.replace(url.toString());
  } catch (erro) {
    console.error('Erro ao limpar cache:', erro);
    status.textContent = 'Não foi possível limpar todo o cache automaticamente.';
    botao.disabled = false;
    botao.textContent = 'Limpar cache';
  }
}

const botaoLimparCache = document.getElementById('limpar-cache');
if (botaoLimparCache) {
  botaoLimparCache.addEventListener('click', limparCacheDoSite);
}
