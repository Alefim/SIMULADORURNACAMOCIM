# Simulador de Urna - Camocim

Simulador fictício de urna eletrônica, preparado para funcionar como aplicativo instalável (PWA) em tablet, inclusive sem internet.

## Cargos e candidatos cadastrados

- **Deputado Estadual:** Sérgio Aguiar (40888), Romeu Aldigueri (40777) e Euvaldete Ferro (45455).
- **Deputado Federal:** Roger Aguiar (4044) e Tainah Marinho (4077).

A urna encerra a simulação após os votos para esses dois cargos.

## O que funciona offline

- tela de endereço e votação;
- lista de bairros, ruas, candidatos, fotos e áudios previamente armazenados;
- gravação local das simulações no próprio tablet;
- geração de arquivo `.csv` para abrir no Excel ou importar no Google Planilhas;
- fila de registros pendentes para sincronizar com o Google Planilhas quando a conexão voltar.

## Como instalar no tablet

1. Conecte o tablet à internet e abra o site publicado por HTTPS.
2. Aguarde aparecer a mensagem **Pronto para usar offline neste tablet**.
3. Toque em **Instalar no tablet** quando o navegador mostrar essa opção. No iPad, use **Compartilhar > Adicionar à Tela de Início**.
4. Abra o aplicativo instalado uma vez e faça um teste com o modo avião ativado.

## Exportar a planilha CSV

Na tela inicial, toque em **Baixar arquivo CSV**. O arquivo usa separador `;`, codificação UTF-8 e inclui endereço, observações, votos, candidatos, partidos e status de sincronização.

Os registros ficam salvos no tablet. O botão **Atualizar aplicativo** remove somente arquivos temporários do aplicativo e preserva as simulações. Limpar os dados do navegador ou desinstalar o aplicativo pode apagar os registros locais; por isso, faça exportações periódicas do CSV.

## Sincronização online

A URL do Google Apps Script permanece configurada em `js/config.js`. Quando houver internet, o aplicativo tenta enviar novos registros automaticamente. Também é possível usar o botão **Sincronizar agora**.
