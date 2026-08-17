# Configurar o Google Planilhas

A integração deste projeto foi preparada para **simulações fictícias/de treinamento**.

## 1. Criar a planilha

Crie uma planilha no Google Planilhas. A aba `Simulacoes` será criada automaticamente no primeiro envio.

## 2. Adicionar o Apps Script

Na planilha, abra **Extensões > Apps Script**.

Apague o conteúdo inicial e copie o código do arquivo:

`google-apps-script/Code.gs`

Salve o projeto.

## 3. Publicar como Web App

No Apps Script:

1. Clique em **Implantar > Nova implantação**.
2. Escolha **Aplicativo da Web**.
3. Em **Executar como**, escolha sua conta.
4. Defina o acesso necessário para o simulador conseguir enviar os registros.
5. Clique em **Implantar**.
6. Copie a URL gerada do Aplicativo da Web.

## 4. Ligar a URL ao simulador

Abra `js/config.js` e coloque a URL entre as aspas:

```js
window.SIMULADOR_CONFIG = {
  googleSheetsWebAppUrl: 'COLE_AQUI_A_URL_DO_WEB_APP'
};
```

Depois faça commit/push ou redeploy do site.

## Estrutura gravada

Cada simulação cria uma linha com:

- ID da simulação
- Data/Hora
- Bairro
- Rua/localidade
- Número fictício da casa
- Tipo (`SIMULACAO_FICTICIA`)
- uma coluna para cada cargo existente no simulador

Nos cargos, a célula recebe o nome do candidato, o número e o partido quando o número digitado existe na lista de candidatos. Votos em branco e nulos também são registrados.
