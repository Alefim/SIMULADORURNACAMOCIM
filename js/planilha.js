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
    votos: votosDetalhados.concat(camposComplementares)
  };
}

async function salvarSimulacaoNaPlanilha(votos) {
  const url = window.SIMULADOR_CONFIG?.googleSheetsWebAppUrl?.trim();

  if (!url) {
    return {
      ok: false,
      configuracaoPendente: true,
      mensagem: 'URL do Google Apps Script ainda não configurada em js/config.js.'
    };
  }

  const registro = montarRegistroSimulacao(votos);

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(registro)
    });

    return {
      ok: true,
      mensagem: 'Simulação enviada para a planilha.'
    };
  } catch (erro) {
    console.error('Erro ao enviar simulação:', erro);
    return {
      ok: false,
      mensagem: 'Não foi possível enviar os dados para a planilha.'
    };
  }
}

window.salvarSimulacaoNaPlanilha = salvarSimulacaoNaPlanilha;
