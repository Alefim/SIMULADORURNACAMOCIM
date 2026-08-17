const TERRITORIOS_URL = 'https://raw.githubusercontent.com/Alefim/VISITAS-CAMPO-CAMOCIM-ELEI-ES-2026/main/app/data/territorios.json';

const painelEndereco = document.getElementById('painel-endereco');
const simulador = document.getElementById('simulador');
const bairroSelect = document.getElementById('bairro');
const ruaSelect = document.getElementById('rua');
const numeroCasaInput = document.getElementById('numero-casa');
const iniciarBtn = document.getElementById('iniciar-simulacao');
const enderecoStatus = document.getElementById('endereco-status');

let territorios = [];

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
        enderecoStatus.textContent = 'Selecione o bairro, a rua e informe o número da casa.';
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
    const numeroValido = numeroCasaInput.value.trim() !== '';

    if (!bairroValido || !ruaValida || !numeroValido) {
        enderecoStatus.textContent = 'Preencha bairro, rua e número da casa para iniciar.';
        return;
    }

    // O endereço serve somente para organizar o acesso à simulação.
    // Não é anexado aos votos nem salvo no navegador.
    numeroCasaInput.value = '';
    painelEndereco.hidden = true;
    simulador.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

carregarTerritorios();
