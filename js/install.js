const CACHE_OFFLINE_NOME = 'simulador-urna-camocim-v20260821-2';
let eventoInstalacaoPendente = null;

function atualizarEstadoConexao() {
  const indicador = document.getElementById('conexao-status');
  if (!indicador) return;

  const online = navigator.onLine;
  indicador.textContent = online ? 'Online' : 'Offline';
  indicador.className = 'conexao-status ' + (online ? 'esta-online' : 'esta-offline');
  indicador.setAttribute('aria-label', online ? 'Tablet conectado à internet' : 'Tablet sem internet');
}

function listarArquivosParaUsoOffline() {
  const arquivos = [
    './',
    'index.html',
    'manifest.json',
    'css/style.css',
    'js/etapas.js',
    'js/config.js',
    'js/planilha.js',
    'js/endereco.js',
    'js/script.js',
    'js/install.js',
    'data/territorios.json',
    'Images/urna.png',
    'Images/brasao.png',
    'audios/numeros.mp3',
    'audios/corrige.mp3',
    'audios/confirma.mp3'
  ];

  if (Array.isArray(window.etapas) || typeof etapas !== 'undefined') {
    etapas.forEach((etapa) => {
      (etapa.candidatos || []).forEach((candidato) => {
        (candidato.fotos || []).forEach((foto) => {
          if (foto.url) arquivos.push('Images/' + foto.url);
        });
      });
    });
  }

  return Array.from(new Set(arquivos)).map((caminho) => new URL(caminho, document.baseURI).href);
}

async function armazenarArquivosOffline() {
  if (!('caches' in window)) return;

  const status = document.getElementById('cache-status');
  const cache = await caches.open(CACHE_OFFLINE_NOME);
  const arquivos = listarArquivosParaUsoOffline();
  let proximoIndice = 0;
  let concluidos = 0;
  let falhas = 0;

  if (status) {
    status.hidden = false;
    status.textContent = 'Preparando o aplicativo para uso offline...';
    status.className = 'endereco-status';
  }

  async function processarFila() {
    while (proximoIndice < arquivos.length) {
      const indiceAtual = proximoIndice++;
      const url = arquivos[indiceAtual];

      try {
        const existente = await cache.match(url, { ignoreSearch: true });
        if (!existente) {
          const resposta = await fetch(url, { cache: 'reload' });
          if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
          await cache.put(url, resposta);
        }
      } catch (erro) {
        falhas += 1;
        console.warn('Não foi possível guardar para uso offline:', url, erro);
      } finally {
        concluidos += 1;
        if (status && (concluidos === arquivos.length || concluidos % 8 === 0)) {
          status.textContent = 'Preparando modo offline: ' + concluidos + ' de ' + arquivos.length + ' arquivos.';
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, arquivos.length) }, processarFila));

  if (status) {
    if (falhas === 0) {
      status.textContent = 'Pronto para usar offline neste tablet.';
      status.className = 'endereco-status status-sucesso';
    } else {
      status.textContent = 'Modo offline preparado. ' + falhas + ' imagem(ns) não puderam ser armazenadas, mas a votação e o CSV funcionarão.';
      status.className = 'endereco-status status-aviso';
    }
  }
}

async function prepararServiceWorker() {
  atualizarEstadoConexao();
  if (!('serviceWorker' in navigator)) return;

  try {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registros
        .filter((registro) => registro.active && registro.active.scriptURL.includes('/js/service-worker.js'))
        .map((registro) => registro.unregister())
    );

    const registro = await navigator.serviceWorker.register('./service-worker.js?v=20260821-2', {
      scope: './'
    });

    if (typeof registro.update === 'function' && navigator.onLine) {
      registro.update();
    }

    await navigator.serviceWorker.ready;

    if (navigator.onLine) {
      await armazenarArquivosOffline();
    } else {
      const status = document.getElementById('cache-status');
      if (status) {
        status.hidden = false;
        status.textContent = 'Aplicativo aberto sem internet. Os dados serão salvos neste tablet.';
      }
    }
  } catch (erro) {
    console.error('Erro ao preparar modo offline:', erro);
    const status = document.getElementById('cache-status');
    if (status) {
      status.hidden = false;
      status.textContent = 'Não foi possível concluir a preparação offline. Abra novamente com internet.';
      status.className = 'endereco-status status-aviso';
    }
  }
}

async function solicitarArmazenamentoPersistente() {
  if (navigator.storage && typeof navigator.storage.persist === 'function') {
    try {
      await navigator.storage.persist();
    } catch (erro) {
      console.warn('Armazenamento persistente não concedido:', erro);
    }
  }
}

async function limparCacheDoSite() {
  const botao = document.getElementById('limpar-cache');
  const status = document.getElementById('cache-status');

  if (!navigator.onLine) {
    if (status) {
      status.hidden = false;
      status.textContent = 'Conecte o tablet à internet antes de atualizar o aplicativo.';
      status.className = 'endereco-status status-aviso';
    }
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Atualizando...';
  }

  if (status) {
    status.hidden = false;
    status.textContent = 'Removendo arquivos antigos. Os registros salvos serão preservados.';
  }

  try {
    if ('caches' in window) {
      const nomesCaches = await caches.keys();
      await Promise.all(
        nomesCaches
          .filter((nome) => nome.startsWith('simulador-urna-camocim-') || nome.startsWith('simulador-clean-'))
          .map((nome) => caches.delete(nome))
      );
    }

    if ('serviceWorker' in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registros
          .filter((registro) => registro.active && registro.active.scriptURL.includes('/service-worker.js'))
          .map((registro) => registro.unregister())
      );
    }

    if (status) status.textContent = 'Aplicativo atualizado. Recarregando...';

    const url = new URL(window.location.href);
    url.searchParams.set('atualizacao', Date.now().toString());
    window.location.replace(url.toString());
  } catch (erro) {
    console.error('Erro ao atualizar aplicativo:', erro);

    if (status) {
      status.textContent = 'Não foi possível atualizar os arquivos agora.';
      status.className = 'endereco-status status-aviso';
    }

    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Atualizar aplicativo';
    }
  }
}

function configurarInstalacaoDoAplicativo() {
  const botao = document.getElementById('instalar-app');
  if (!botao) return;

  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacaoPendente = evento;
    botao.hidden = false;
  });

  botao.addEventListener('click', async () => {
    if (!eventoInstalacaoPendente) return;
    eventoInstalacaoPendente.prompt();
    await eventoInstalacaoPendente.userChoice;
    eventoInstalacaoPendente = null;
    botao.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    eventoInstalacaoPendente = null;
    botao.hidden = true;
  });
}

function configurarAplicativoOffline() {
  const botaoLimpar = document.getElementById('limpar-cache');
  const botaoIniciar = document.getElementById('iniciar-simulacao');

  if (botaoLimpar) botaoLimpar.addEventListener('click', limparCacheDoSite);
  if (botaoIniciar) botaoIniciar.addEventListener('click', solicitarArmazenamentoPersistente, { once: true });

  window.addEventListener('online', () => {
    atualizarEstadoConexao();
    armazenarArquivosOffline();
  });
  window.addEventListener('offline', atualizarEstadoConexao);

  configurarInstalacaoDoAplicativo();
  prepararServiceWorker();
}

window.prepararConteudoOffline = armazenarArquivosOffline;
configurarAplicativoOffline();
