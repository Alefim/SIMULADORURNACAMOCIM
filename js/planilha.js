const BANCO_LOCAL_NOME = 'simulador-urna-camocim';
const BANCO_LOCAL_VERSAO = 1;
const ARMAZEM_SIMULACOES = 'simulacoes';
const CHAVE_FALLBACK = 'simuladorUrnaCamocim.simulacoes';

let promessaBancoLocal = null;
let sincronizacaoEmAndamento = null;

function detalharVotosSimulados(votos) {
  return votos.map((item) => {
    const etapa = etapas.find((e) => e.titulo === item.etapa);
    const candidato = item.voto === 'branco'
      ? null
      : etapa?.candidatos.find((c) => c.numero === item.voto);

    return {
      etapa: item.etapa,
      voto: item.voto,
      candidato: candidato?.nome || (item.voto === 'branco' ? 'BRANCO' : 'NULO'),
      partido: candidato?.partido || ''
    };
  });
}

function montarRegistroSimulacao(votos) {
  const contexto = window.simulacaoContexto || {};
  const votosDetalhados = detalharVotosSimulados(votos);

  // Compatibilidade com a implantação atual do Apps Script:
  // Nome e Observações também seguem como colunas dinâmicas dentro de votos.
  const camposComplementares = [
    {
      etapa: 'Nome',
      voto: '',
      candidato: contexto.nome || '',
      partido: ''
    },
    {
      etapa: 'Observações',
      voto: '',
      candidato: contexto.observacoes || '',
      partido: ''
    }
  ];

  return {
    tipo: 'SIMULACAO_FICTICIA',
    simulacaoId: contexto.simulacaoId || '',
    nome: contexto.nome || '',
    bairro: contexto.bairro || '',
    rua: contexto.rua || '',
    numeroCasa: contexto.numeroCasa || '',
    observacoes: contexto.observacoes || '',
    iniciadaEm: contexto.iniciadaEm || '',
    finalizadaEm: new Date().toISOString(),
    salvoLocalmenteEm: new Date().toISOString(),
    sincronizado: false,
    sincronizadoEm: '',
    votos: votosDetalhados.concat(camposComplementares)
  };
}

function abrirBancoLocal() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB indisponível.'));
  }

  if (promessaBancoLocal) return promessaBancoLocal;

  promessaBancoLocal = new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(BANCO_LOCAL_NOME, BANCO_LOCAL_VERSAO);

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;
      if (!banco.objectStoreNames.contains(ARMAZEM_SIMULACOES)) {
        banco.createObjectStore(ARMAZEM_SIMULACOES, { keyPath: 'simulacaoId' });
      }
    };

    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error || new Error('Falha ao abrir banco local.'));
    requisicao.onblocked = () => reject(new Error('Banco local bloqueado por outra aba.'));
  });

  promessaBancoLocal.catch(() => {
    promessaBancoLocal = null;
  });

  return promessaBancoLocal;
}

function lerFallback() {
  try {
    const registros = JSON.parse(localStorage.getItem(CHAVE_FALLBACK) || '[]');
    return Array.isArray(registros) ? registros : [];
  } catch (erro) {
    console.error('Falha ao ler armazenamento alternativo:', erro);
    return [];
  }
}

function salvarFallback(registro) {
  const registros = lerFallback();
  const indice = registros.findIndex((item) => item.simulacaoId === registro.simulacaoId);

  if (indice >= 0) registros[indice] = registro;
  else registros.push(registro);

  localStorage.setItem(CHAVE_FALLBACK, JSON.stringify(registros));
}

function removerDoFallback(simulacaoId) {
  const registros = lerFallback().filter((item) => item.simulacaoId !== simulacaoId);
  localStorage.setItem(CHAVE_FALLBACK, JSON.stringify(registros));
}

async function salvarRegistroLocal(registro) {
  try {
    const banco = await abrirBancoLocal();

    await new Promise((resolve, reject) => {
      const transacao = banco.transaction(ARMAZEM_SIMULACOES, 'readwrite');
      transacao.objectStore(ARMAZEM_SIMULACOES).put(registro);
      transacao.oncomplete = () => resolve();
      transacao.onerror = () => reject(transacao.error || new Error('Falha ao gravar no tablet.'));
      transacao.onabort = () => reject(transacao.error || new Error('Gravação local cancelada.'));
    });

    removerDoFallback(registro.simulacaoId);
  } catch (erro) {
    console.warn('Usando armazenamento local alternativo:', erro);
    salvarFallback(registro);
  }

  return registro;
}

async function listarRegistrosIndexedDB() {
  const banco = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(ARMAZEM_SIMULACOES, 'readonly');
    const requisicao = transacao.objectStore(ARMAZEM_SIMULACOES).getAll();
    requisicao.onsuccess = () => resolve(requisicao.result || []);
    requisicao.onerror = () => reject(requisicao.error || new Error('Falha ao ler registros locais.'));
  });
}

async function listarSimulacoesLocais() {
  let registrosBanco = [];

  try {
    registrosBanco = await listarRegistrosIndexedDB();
  } catch (erro) {
    console.warn('Leitura do IndexedDB indisponível:', erro);
  }

  const combinados = new Map();
  lerFallback().forEach((registro) => combinados.set(registro.simulacaoId, registro));
  registrosBanco.forEach((registro) => combinados.set(registro.simulacaoId, registro));

  return Array.from(combinados.values()).sort((a, b) =>
    String(a.finalizadaEm || '').localeCompare(String(b.finalizadaEm || ''))
  );
}

function obterUrlPlanilha() {
  return window.SIMULADOR_CONFIG?.googleSheetsWebAppUrl?.trim() || '';
}

async function enviarRegistroParaPlanilha(registro) {
  const url = obterUrlPlanilha();

  if (!url) throw new Error('URL do Google Apps Script não configurada.');
  if (!navigator.onLine) throw new Error('Tablet sem conexão com a internet.');

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 20000);

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true,
      signal: controlador.signal,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(registro)
    });
  } finally {
    clearTimeout(limite);
  }

  const atualizado = {
    ...registro,
    sincronizado: true,
    sincronizadoEm: new Date().toISOString()
  };

  await salvarRegistroLocal(atualizado);
  return atualizado;
}

function exibirMensagemDados(mensagem, tipo = '') {
  const status = document.getElementById('dados-status');
  if (!status) return;

  status.textContent = mensagem;
  status.className = 'dados-status' + (tipo ? ' ' + tipo : '');
}

async function atualizarResumoRegistros() {
  const contador = document.getElementById('registros-resumo');
  const botaoExportar = document.getElementById('exportar-csv');
  const botaoSincronizar = document.getElementById('sincronizar-pendentes');
  const registros = await listarSimulacoesLocais();
  const pendentes = registros.filter((registro) => !registro.sincronizado).length;

  if (contador) {
    const totalTexto = registros.length === 1 ? '1 registro salvo' : registros.length + ' registros salvos';
    const pendenteTexto = pendentes === 1 ? '1 aguardando envio' : pendentes + ' aguardando envio';
    contador.textContent = totalTexto + ' no tablet • ' + pendenteTexto;
  }

  if (botaoExportar) botaoExportar.disabled = registros.length === 0;
  if (botaoSincronizar) botaoSincronizar.disabled = pendentes === 0 || !navigator.onLine;

  return { total: registros.length, pendentes };
}

async function salvarSimulacaoNaPlanilha(votos) {
  const registro = montarRegistroSimulacao(votos);

  try {
    await salvarRegistroLocal(registro);
    await atualizarResumoRegistros();
  } catch (erro) {
    console.error('Erro ao salvar simulação no tablet:', erro);
    return {
      ok: false,
      mensagem: 'Não foi possível salvar a simulação no tablet.'
    };
  }

  return {
    ok: true,
    salvoOffline: true,
    mensagem: navigator.onLine
      ? 'Simulação salva no tablet. Use “Sincronizar agora” para enviar à planilha.'
      : 'Simulação salva no tablet sem internet. Exporte o CSV ou sincronize quando a conexão voltar.'
  };
}

async function sincronizarSimulacoesPendentes(opcoes = {}) {
  if (sincronizacaoEmAndamento) return sincronizacaoEmAndamento;

  sincronizacaoEmAndamento = (async () => {
    const botao = document.getElementById('sincronizar-pendentes');

    if (!navigator.onLine) {
      if (!opcoes.silencioso) exibirMensagemDados('Sem internet. Os registros continuam seguros no tablet.', 'status-aviso');
      await atualizarResumoRegistros();
      return { enviados: 0, pendentes: 0 };
    }

    if (!obterUrlPlanilha()) {
      if (!opcoes.silencioso) exibirMensagemDados('A URL da planilha online ainda não está configurada.', 'status-aviso');
      return { enviados: 0, pendentes: 0 };
    }

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Sincronizando...';
    }

    const registros = await listarSimulacoesLocais();
    const pendentes = registros.filter((registro) => !registro.sincronizado);
    let enviados = 0;

    for (const registro of pendentes) {
      try {
        await enviarRegistroParaPlanilha(registro);
        enviados += 1;
      } catch (erro) {
        console.error('Falha na sincronização pendente:', erro);
        break;
      }
    }

    const resumo = await atualizarResumoRegistros();

    if (!opcoes.silencioso) {
      if (enviados > 0) {
        exibirMensagemDados(enviados + ' registro(s) enviado(s) para a planilha.', 'status-sucesso');
      } else if (resumo.pendentes === 0) {
        exibirMensagemDados('Todos os registros já estão sincronizados.', 'status-sucesso');
      } else {
        exibirMensagemDados('Não foi possível concluir o envio. Tente novamente com internet.', 'status-aviso');
      }
    }

    return { enviados, pendentes: resumo.pendentes };
  })();

  try {
    return await sincronizacaoEmAndamento;
  } finally {
    sincronizacaoEmAndamento = null;
    const botao = document.getElementById('sincronizar-pendentes');
    if (botao) botao.textContent = 'Sincronizar agora';
    atualizarResumoRegistros();
  }
}

function protegerCelulaCSV(valor) {
  let texto = valor == null ? '' : String(valor);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return '"' + texto.replace(/"/g, '""') + '"';
}

function formatarDataCSV(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR');
}

function votoDaEtapa(registro, tituloEtapa) {
  return (registro.votos || []).find((voto) => voto.etapa === tituloEtapa) || {};
}

async function exportarSimulacoesCSV() {
  const registros = await listarSimulacoesLocais();

  if (registros.length === 0) {
    exibirMensagemDados('Ainda não há simulações salvas para exportar.', 'status-aviso');
    return;
  }

  const titulosEtapas = etapas.map((etapa) => etapa.titulo);
  const cabecalho = [
    'ID Simulação',
    'Início',
    'Fim',
    'Nome',
    'Bairro',
    'Rua / Localidade',
    'Número da casa',
    'Observações',
    'Sincronizado com Google Planilhas',
    'Data da sincronização'
  ];

  titulosEtapas.forEach((titulo) => {
    cabecalho.push(titulo + ' - Número', titulo + ' - Candidato', titulo + ' - Partido');
  });

  const linhas = [cabecalho.map(protegerCelulaCSV).join(';')];

  registros.forEach((registro) => {
    const linha = [
      registro.simulacaoId,
      formatarDataCSV(registro.iniciadaEm),
      formatarDataCSV(registro.finalizadaEm),
      registro.nome,
      registro.bairro,
      registro.rua,
      registro.numeroCasa,
      registro.observacoes,
      registro.sincronizado ? 'SIM' : 'NÃO',
      formatarDataCSV(registro.sincronizadoEm)
    ];

    titulosEtapas.forEach((titulo) => {
      const voto = votoDaEtapa(registro, titulo);
      linha.push(voto.voto || '', voto.candidato || '', voto.partido || '');
    });

    linhas.push(linha.map(protegerCelulaCSV).join(';'));
  });

  const csv = '\uFEFF' + linhas.join('\r\n');
  const arquivo = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(arquivo);
  const agora = new Date();
  const dataArquivo = agora.toISOString().slice(0, 10);
  const horaArquivo = agora.toTimeString().slice(0, 5).replace(':', '');
  const link = document.createElement('a');

  link.href = url;
  link.download = 'simulacoes-urna-camocim-' + dataArquivo + '-' + horaArquivo + '.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  exibirMensagemDados('Arquivo CSV gerado com ' + registros.length + ' registro(s).', 'status-sucesso');
}

function configurarPainelDeDados() {
  const botaoExportar = document.getElementById('exportar-csv');
  const botaoSincronizar = document.getElementById('sincronizar-pendentes');

  if (botaoExportar) botaoExportar.addEventListener('click', exportarSimulacoesCSV);
  if (botaoSincronizar) botaoSincronizar.addEventListener('click', () => sincronizarSimulacoesPendentes());

  window.addEventListener('online', () => {
    atualizarResumoRegistros();
    exibirMensagemDados('Internet disponível. Toque em “Sincronizar agora” para enviar os registros pendentes.', 'status-sucesso');
  });
  window.addEventListener('offline', atualizarResumoRegistros);

  atualizarResumoRegistros();
}

window.salvarSimulacaoNaPlanilha = salvarSimulacaoNaPlanilha;
window.listarSimulacoesLocais = listarSimulacoesLocais;
window.exportarSimulacoesCSV = exportarSimulacoesCSV;
window.sincronizarSimulacoesPendentes = sincronizarSimulacoesPendentes;
window.atualizarResumoRegistros = atualizarResumoRegistros;

configurarPainelDeDados();
