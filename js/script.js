let seuVotoPara = document.querySelector('.d-1-1 span');
let cargo = document.querySelector('.d-1-2 span');
let descricao = document.querySelector('.d-1-4');
let aviso = document.querySelector('.d-2');
let lateral = document.querySelector('.d-1-right');
let numeros = document.querySelector('.d-1-3');

let etapaAtual = 0;
let numero = '';
let votoBranco = false;
let votos = [];
let simulacaoFinalizada = false;

function comecarEtapa() {
    if (simulacaoFinalizada) return;

    let etapa = etapas[etapaAtual];
    if (!etapa) return;

    let numeroHTML = '';
    numero = '';
    votoBranco = false;

    for (let i = 0; i < etapa.numeros; i++) {
        numeroHTML += i === 0
            ? '<div class="numero pisca"></div>'
            : '<div class="numero"></div>';
    }

    seuVotoPara.style.display = 'none';
    cargo.innerHTML = etapa.titulo;
    descricao.innerHTML = '';
    aviso.style.display = 'none';
    lateral.innerHTML = '';
    numeros.innerHTML = numeroHTML;
}

function atualizaInterface() {
    let etapa = etapas[etapaAtual];
    if (!etapa) return;

    let candidato = etapa.candidatos.find((item) => item.numero === numero);

    seuVotoPara.style.display = 'block';
    aviso.style.display = 'block';

    if (candidato) {
        descricao.innerHTML = 'Nome: ' + candidato.nome + '<br/>Partido: ' + candidato.partido;

        let fotosHTML = '';
        for (let i in candidato.fotos) {
            if (candidato.fotos[i].small) {
                fotosHTML += '<div class="d-1-image small"><img src="Images/' + candidato.fotos[i].url + '" alt="" />' + candidato.fotos[i].legenda + '</div>';
            } else {
                fotosHTML += '<div class="d-1-image"><img src="Images/' + candidato.fotos[i].url + '" alt="" />' + candidato.fotos[i].legenda + '</div>';
            }
        }
        lateral.innerHTML = fotosHTML;
    } else {
        descricao.innerHTML = '<div class="aviso--grande pisca">VOTO NULO</div>';
        lateral.innerHTML = '';
    }
}

function clicou(n) {
    if (simulacaoFinalizada) return;

    let somNumeros = new Audio();
    somNumeros.src = 'audios/numeros.mp3';
    somNumeros.play();

    let elNumero = document.querySelector('.numero.pisca');
    if (elNumero !== null) {
        elNumero.innerHTML = n;
        numero = numero + n;

        elNumero.classList.remove('pisca');
        if (elNumero.nextElementSibling !== null) {
            elNumero.nextElementSibling.classList.add('pisca');
        } else {
            atualizaInterface();
        }
    }
}

function branco() {
    if (simulacaoFinalizada) return;

    numero = '';
    votoBranco = true;

    seuVotoPara.style.display = 'block';
    aviso.style.display = 'block';
    numeros.innerHTML = '';
    descricao.innerHTML = '<div class="aviso--grande pisca">VOTO EM BRANCO</div>';
    lateral.innerHTML = '';
}

function corrige() {
    if (simulacaoFinalizada) return;

    let somCorrige = new Audio();
    somCorrige.src = 'audios/corrige.mp3';
    somCorrige.play();
    comecarEtapa();
}

async function finalizarSimulacao() {
    simulacaoFinalizada = true;

    const tela = document.querySelector('.tela');
    tela.innerHTML = '<div class="aviso--gigante">FIM</div><div id="status-planilha" class="status-planilha">Salvando simulação...</div>';

    const status = document.getElementById('status-planilha');

    if (typeof window.salvarSimulacaoNaPlanilha !== 'function') {
        status.textContent = 'Simulação finalizada. Módulo da planilha não carregado.';
        return;
    }

    const resultado = await window.salvarSimulacaoNaPlanilha(votos);
    status.textContent = resultado.mensagem;
    status.classList.add(resultado.ok ? 'status-sucesso' : 'status-aviso');
}

function confirma() {
    if (simulacaoFinalizada) return;

    let etapa = etapas[etapaAtual];
    if (!etapa) return;

    let votoConfirmado = false;
    let somConfirma = new Audio('audios/confirma.mp3');

    if (votoBranco === true) {
        votoConfirmado = true;
        somConfirma.play();

        votos.push({
            etapa: etapa.titulo,
            voto: 'branco'
        });
    } else if (numero.length === etapa.numeros) {
        votoConfirmado = true;
        somConfirma.play();

        votos.push({
            etapa: etapa.titulo,
            voto: numero
        });
    }

    if (votoConfirmado) {
        etapaAtual++;
        if (etapas[etapaAtual] !== undefined) {
            comecarEtapa();
        } else {
            finalizarSimulacao();
        }
    }
}

comecarEtapa();
