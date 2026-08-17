function doPost(e) {
  try {
    const dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (dados.tipo !== 'SIMULACAO_FICTICIA') {
      return resposta_({ ok: false, erro: 'Registro inválido' });
    }

    const arquivo = SpreadsheetApp.getActiveSpreadsheet();
    let aba = arquivo.getSheetByName('Simulacoes');
    if (!aba) aba = arquivo.insertSheet('Simulacoes');

    const votos = Array.isArray(dados.votos) ? dados.votos : [];
    const colunasBase = [
      'ID Simulação',
      'Data/Hora',
      'Nome',
      'Bairro',
      'Rua',
      'Número da Casa',
      'Observações',
      'Tipo'
    ];

    const colunasVotos = votos.map(function(voto) {
      return String(voto.etapa || '').trim();
    }).filter(Boolean);

    const colunasNecessarias = colunasBase.concat(colunasVotos);

    if (aba.getLastRow() === 0) {
      aba.appendRow(colunasNecessarias);
      aba.setFrozenRows(1);
    }

    let cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];

    colunasNecessarias.forEach(function(coluna) {
      if (cabecalho.indexOf(coluna) === -1) {
        aba.getRange(1, cabecalho.length + 1).setValue(coluna);
        cabecalho.push(coluna);
      }
    });

    const mapaVotos = {};
    votos.forEach(function(voto) {
      const etapa = String(voto.etapa || '').trim();
      if (!etapa) return;

      let valor = String(voto.candidato || '').trim();
      const numero = String(voto.voto || '').trim();
      const partido = String(voto.partido || '').trim();

      if (numero && numero !== 'branco' && valor !== 'NULO') {
        valor += ' (' + numero + ')';
      }
      if (partido) valor += ' - ' + partido;

      mapaVotos[etapa] = valor || numero || 'NULO';
    });

    const valoresBase = {
      'ID Simulação': dados.simulacaoId || '',
      'Data/Hora': dados.finalizadaEm || new Date().toISOString(),
      'Nome': dados.nome || '',
      'Bairro': dados.bairro || '',
      'Rua': dados.rua || '',
      'Número da Casa': dados.numeroCasa || '',
      'Observações': dados.observacoes || '',
      'Tipo': dados.tipo || 'SIMULACAO_FICTICIA'
    };

    const linha = cabecalho.map(function(coluna) {
      const valor = Object.prototype.hasOwnProperty.call(valoresBase, coluna)
        ? valoresBase[coluna]
        : (mapaVotos[coluna] || '');
      return seguro_(valor);
    });

    aba.appendRow(linha);
    aba.autoResizeColumns(1, cabecalho.length);

    return resposta_({ ok: true, simulacaoId: dados.simulacaoId || '' });
  } catch (erro) {
    return resposta_({ ok: false, erro: String(erro) });
  }
}

function doGet() {
  return resposta_({ ok: true, servico: 'SIMULADORURNACAMOCIM' });
}

function seguro_(valor) {
  const texto = String(valor == null ? '' : valor);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function resposta_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
