async function prepararServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registros
        .filter((registro) => registro.active && registro.active.scriptURL.includes('/js/service-worker.js'))
        .map((registro) => registro.unregister())
    );

    const registration = await navigator.serviceWorker.register('/service-worker.js?v=20260817-2024', {
      scope: '/'
    });

    if (typeof registration.update === 'function') {
      registration.update();
    }
  } catch (erro) {
    console.error('Erro ao preparar Service Worker:', erro);
  }
}

async function limparCacheDoSite() {
  const botao = document.getElementById('limpar-cache');
  const status = document.getElementById('cache-status');

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Limpando cache...';
  }

  if (status) {
    status.hidden = false;
    status.textContent = 'Removendo arquivos antigos do navegador...';
  }

  try {
    if ('caches' in window) {
      const nomesCaches = await caches.keys();
      await Promise.all(nomesCaches.map((nomeCache) => caches.delete(nomeCache)));
    }

    if ('serviceWorker' in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((registro) => registro.unregister()));
    }

    if (status) {
      status.textContent = 'Cache limpo. Atualizando o site...';
    }

    const url = new URL(window.location.href);
    url.searchParams.set('cache', Date.now().toString());
    window.location.replace(url.toString());
  } catch (erro) {
    console.error('Erro ao limpar cache:', erro);

    if (status) {
      status.textContent = 'Não foi possível limpar todo o cache automaticamente.';
    }

    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Limpar cache';
    }
  }
}

function garantirBotaoLimparCache() {
  let botao = document.getElementById('limpar-cache');

  if (!botao) {
    botao = document.createElement('button');
    botao.id = 'limpar-cache';
    botao.type = 'button';
    botao.textContent = 'Limpar cache';
    document.body.appendChild(botao);
  }

  Object.assign(botao.style, {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: '99999',
    border: '0',
    borderRadius: '10px',
    padding: '12px 16px',
    background: '#52606d',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,.22)'
  });

  botao.removeEventListener('click', limparCacheDoSite);
  botao.addEventListener('click', limparCacheDoSite);
}

garantirBotaoLimparCache();
prepararServiceWorker();
