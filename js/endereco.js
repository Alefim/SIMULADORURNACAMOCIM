const TERRITORIOS_URL = 'data/territorios.json';

const painelEndereco = document.getElementById('painel-endereco');
const simulador = document.getElementById('simulador');
const nomeInput = document.getElementById('nome');
const bairroSelect = document.getElementById('bairro');
const ruaSelect = document.getElementById('rua');
const numeroCasaInput = document.getElementById('numero-casa');
const observacoesInput = document.getElementById('observacoes');
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
        enderecoStatus.textContent = 'Informe um nome fictício, selecione bairro e rua e digite um número de casa fictício.';
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
    const nome = nomeInput.value.trim();
    const bairroValido = bairroSelect.value !== '';
    const ruaValida = ruaSelect.value !== '';
    const numeroCasa = numeroCasaInput.value.trim();
    const observacoes = observacoesInput.value.trim();

    if (!nome || !bairroValido || !ruaValida || !numeroCasa) {
        enderecoStatus.textContent = 'Preencha nome fictício, bairro, rua e número fictício da casa para iniciar.';
        return;
    }

    const territorio = territorios[Number(bairroSelect.value)];

    window.simulacaoContexto = {
        simulacaoId: gerarIdSimulacao(),
        nome: nome,
        bairro: territorio.bairro,
        rua: ruaSelect.value,
        numeroCasa: numeroCasa,
        observacoes: observacoes,
        iniciadaEm: new Date().toISOString()
    };

    enderecoSelecionado.textContent =
        'Participante fictício: ' + nome + ' • ' + territorio.bairro + ' • ' + ruaSelect.value + ' • Nº ' + numeroCasa;

    painelEndereco.hidden = true;
    simulador.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

carregarTerritorios();
