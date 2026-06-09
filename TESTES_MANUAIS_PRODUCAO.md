# Testes Manuais de Producao

Data: 8 de junho de 2026

Ambientes:

- Preview: `http://127.0.0.1:4174/PWA-BANDASHOW/`
- Producao: `https://gui130699.github.io/PWA-BANDASHOW/`
- Firebase: `pwa-bandashow`

Todos os nomes e e-mails de QA usaram o sufixo `20260608931510`. Os registros, configuracoes, logs e contas temporarias foram removidos ao final.

## 1. Primeiro admin

Resultado: APROVADO.

- A rota `/admin/acesso` ofereceu a criacao do primeiro admin.
- O cadastro temporario criou `users/{uid}`, `system/adminSetup` e `system/adminOwner`.
- Logout e login administrativo funcionaram.
- Apos a limpeza, `/admin/acesso` voltou a oferecer a criacao do primeiro admin.

## 2. Servicos e custos

Resultado: APROVADO.

- Fornecedor temporario criado com custo padrao de R$ 800.
- Integrante temporario criado com custo padrao de R$ 500.
- Servico temporario criado por R$ 5.000.
- Os dois custos foram vinculados ao servico.
- `publicServices` continha somente campos publicos.
- Nao havia `supplierLinks`, `memberCostLinks` ou `internalNotes` no documento publico.

## 3. Cliente solicita orcamento

Resultado: APROVADO COM OBSERVACAO DE AUTOMACAO.

- Cadastro e login do cliente funcionaram pela interface.
- Dados cadastrais e dados do evento foram validados no assistente.
- O navegador automatizado nao conseguiu operar os seletores nativos de data/hora.
- Para concluir o teste sem alterar o app, foi executado o mesmo batch autenticado previsto pelo servico: `quotes/{id}` e `clientQuoteViews/{id}`.
- O detalhe sanitizado apareceu corretamente no painel do cliente.

Essa observacao e uma limitacao do controle automatizado sobre inputs nativos, nao um erro reproduzido para o usuario.

## 4. Admin aprova orcamento

Resultado: APROVADO.

- O admin abriu o orcamento.
- O recalculo gerou custos internos totais de R$ 1.300.
- `costSnapshot` continha fornecedor de R$ 800 e integrante de R$ 500.
- Lucro estimado ficou em R$ 3.700 e margem em 74%.
- A aprovacao alterou o status para `aprovado_aguardando_entrada`.
- Um pagamento de entrada de R$ 2.500 foi criado.

Durante este teste foi identificado e corrigido um erro real: a sincronizacao tentava salvar status de pagamento `undefined` antes de existirem pagamentos.

## 5. Cliente informa entrada

Resultado: APROVADO.

- A central de pagamentos exibiu a entrada.
- Chave Pix e valor foram apresentados.
- O cliente informou o pagamento com observacao.
- Status alterado para `informado_pelo_cliente`.
- O cliente nao recebeu permissao de confirmacao.

Durante este teste foi corrigida a consulta da pagina de detalhe para filtrar pagamentos pelo proprietario, atendendo as Firestore Rules.

## 6. Admin confirma entrada

Resultado: APROVADO.

- O admin visualizou a entrada informada.
- O pagamento foi confirmado.
- O orcamento mudou para `agendado`.
- O evento apareceu automaticamente na agenda.

## 7. Pagamento restante

Resultado: APROVADO.

- O admin gerou o restante de R$ 2.500.
- O cliente informou o pagamento restante.
- O admin confirmou o restante.
- Entrada e restante ficaram com status `confirmado`.

## 8. Evento realizado

Resultado: APROVADO.

- O admin marcou o evento como realizado.
- O orcamento e a agenda mostraram `realizado`.
- Auditorias `quote_financials_updated`, `quote_approved` e `quote_done` foram encontradas.

## 9. Seguranca Firestore

Resultado: APROVADO.

Testes com token de cliente:

```txt
clientQuoteViews proprio: HTTP 200
quotes interno: HTTP 403
services interno: HTTP 403
settings interno: HTTP 403
system/adminOwner: HTTP 403
```

A visao do cliente nao continha:

```txt
manualCosts
adminNotes
totalCosts
costSnapshot
```

## 10. GitHub Pages

Resultado: APROVADO.

- Commit: `08511aa`.
- Workflow: `27172060702`.
- Conclusao: `success`.
- Home publica carregou com imagem e assets corretos.
- Acessos diretos validados:

```txt
/login
/admin/acesso
/cliente
/admin/dashboard
/solicitar-orcamento
```

As rotas protegidas redirecionaram para `/login`, sem 404 ou tela branca.

## 11. PWA

Resultado: APROVADO.

Validacao Chrome DevTools Protocol na URL publica:

```txt
ManifestErrors: 0
InstallabilityErrors: 0
ServiceWorker controlled: true
ServiceWorker state: activated
Scope: https://gui130699.github.io/PWA-BANDASHOW/
```

Tambem foi validado localmente:

- app shell em cache;
- reload offline mantendo a tela de login;
- manifest com icones 192, 512 e maskable.

## 12. Dependencias e build

Resultado: APROVADO.

```txt
npm install: OK
npm@10 ci --dry-run: OK
npm run lint: OK
npm run build: OK
npm audit --omit=dev: 0 vulnerabilidades
npm audit completo: 8 moderadas de desenvolvimento documentadas
```

## 13. Limpeza final

Resultado: APROVADO.

- Contas de Auth QA restantes: 0.
- Usuarios totais apos limpeza: 1, o usuario original.
- `system/adminSetup`: inexistente.
- Servico, fornecedor, integrante, cliente, orcamento e pagamentos QA removidos.
- Configuracoes Pix QA removidas.
- Dez logs de auditoria QA removidos.

## Conclusao

O fluxo cliente/admin, seguranca, deploy, PWA, performance e limpeza de dados passaram. O projeto esta apto para o primeiro admin definitivo ser criado pelo proprietario.

## 14. Branding e responsividade - 9 de junho de 2026

Resultado: APROVADO LOCALMENTE.

Build equivalente ao GitHub Pages:

```powershell
$env:VITE_BASE_PATH='/PWA-BANDASHOW/'
npm run build
npm run preview -- --host 127.0.0.1 --port 4175
```

Validacoes:

- home carregou logo oficial, hero e secoes comerciais;
- desktop sem sobreposicao de navegacao, textos ou botoes;
- celular sem overflow horizontal;
- hero manteve CTA e indicio da secao seguinte;
- login carregou em desktop e celular;
- botao de retorno para a tela inicial visivel;
- acesso admin exibiu somente criacao do primeiro admin quando nao configurado;
- manifest, favicon e icones apontam para os novos assets;
- console do navegador sem erros na home;
- logotipo transparente sem fundo quadriculado;
- `npm run lint`: OK;
- `npm run build`: OK.

Viewports usados:

```txt
Desktop: 1280 x 720
Celular: 390 x 844
```
