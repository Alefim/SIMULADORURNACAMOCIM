const TERRITORIOS_URL = 'data/territorios.json';

const painelEndereco = document.getElementById('painel-endereco');
const simulador = document.getElementById('simulador');
const bairroSelect = document.getElementById('bairro');
const ruaSelect = document.getElementById('rua');
const numeroCasaInput = document.getElementById('numero-casa');
const iniciarBtn = document.getElementById('iniciar-simulacao');
const enderecoStatus = document.getElementById('endereco-status');
const enderecoSelecionado = document.getElementById('endereco-selecionado');

let territorios = [];
window.simulacaoContexto = null;

function gerarIdSimulacao() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return 'SIM-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

async function carregarTerritorios() {
    try {
        const resposta = await fetch(TERRITORIOS_URL, { cache: 'no-store' });
        if (!resposta.ok) throw new Error('Falha ao carregar bairros e ruas.');

        territorios = await resposta.json();
        bairroSelect.innerHTML = '<option value="">Selecione o bairro</option>';

        territorios.forEach((item, indice) => {
            const option = document.createElement('option');
            option.value = indice;
            option.textContent = item.bairro;
            bairroSelect.appendChild(option);
        });

        bairroSelect.disabled = false;
        enderecoStatus.textContent = 'Selecione o bairro, a rua e informe um número de casa fictício.';
    } catch (erro) {
        console.error(erro);
        enderecoStatus.textContent = 'Não foi possível carregar a lista de bairros e ruas.';
    }
}

bairroSelect.addEventListener('change', () => {
    ruaSelect.innerHTML = '<option value="">Selecione a rua</option>';
    ruaSelect.disabled = true;

    if (bairroSelect.value === '') return;

    const territorio = territorios[Number(bairroSelect.value)];
    territorio.ruas.forEach((nomeRua) => {
        const option = document.createElement('option');
        option.value = nomeRua;
        option.textContent = nomeRua;
        ruaSelect.appendChild(option);
    });

    ruaSelect.disabled = false;
});

iniciarBtn.addEventListener('click', () => {
    const bairroValido = bairroSelect.value !== '';
    const ruaValida = ruaSelect.value !== '';
    const numeroCasa = numeroCasaInput.value.trim();

    if (!bairroValido || !ruaValida || !numeroCasa) {
        enderecoStatus.textContent = 'Preencha bairro, rua e número fictício da casa para iniciar.';
        return;
    }

    const territorio = territorios[Number(bairroSelect.value)];

    window.simulacaoContexto = {
        simulacaoId: gerarIdSimulacao(),
        bairro: territorio.bairro,
        rua: ruaSelect.value,
        numeroCasa: numeroCasa,
        iniciadaEm: new Date().toISOString()
    };

    enderecoSelecionado.textContent =
        'Simulação: ' + territorio.bairro + ' • ' + ruaSelect.value + ' • Nº ' + numeroCasa;

    painelEndereco.hidden = true;
    simulador.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

carregarTerritorios();
