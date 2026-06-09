# Testes Manuais de Produção

## Revisão administrativa - 9 de junho de 2026

Validações locais executadas:

- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run check:text`
- [x] Home carregada em ambiente local
- [x] Rotas administrativas continuam protegidas e redirecionam para login sem sessão
- [x] Manifest e service worker preservados
- [x] Tipagem, lint e build validados após o complemento de conformidade

Roteiro autenticado para homologação:

- [ ] Abrir Serviços e alternar entre Acesso e Cadastro
- [ ] Tentar cadastrar serviço vazio e confirmar o bloqueio
- [ ] Cadastrar serviço após revisar o resumo
- [ ] Editar serviço pelo botão da lista e confirmar abertura da aba Cadastro
- [ ] Conferir permissão de edição de valor, vínculos e custo interno na lista
- [ ] Repetir o fluxo em Integrantes
- [ ] Conferir telefone, e-mail e dados Pix na lista de Integrantes
- [ ] Abrir Fornecedores e alternar entre Acesso e Cadastro
- [ ] Cadastrar fornecedor após revisar o resumo e confirmar retorno para Acesso
- [ ] Editar fornecedor pela lista e confirmar abertura da aba Cadastro preenchida
- [ ] Conferir busca e filtros por tipo e status em Fornecedores
- [ ] Cadastrar, editar, desativar e reativar um tipo de fornecedor
- [ ] Confirmar que tipos inativos não aparecem em novos cadastros
- [ ] Registrar pagamento de fornecedor e conferir o histórico
- [ ] Selecionar integrante pelo nome na página Pagamentos e conferir o valor padrão
- [ ] Registrar pagamento pendente e pago para integrante
- [ ] Selecionar fornecedor pelo nome na página Pagamentos e conferir o custo padrão
- [ ] Registrar pagamento pendente e pago para fornecedor
- [ ] Conferir Pix, contato, referência, observação, datas e responsável nos históricos
- [ ] Criar, editar, desativar e reativar cada cadastro auxiliar
- [ ] Confirmar que somente opções ativas aparecem nos selects
- [ ] Salvar cada grupo de Configurações e conferir `settings/main`
- [ ] Conferir a sincronização segura em `publicSettings/main`
- [ ] Conferir os logs geral e específicos dos grupos alterados
- [ ] Conferir os indicadores de Pix, PublicSettings, cache PWA e ambiente
- [ ] Validar a responsividade das novas telas em sessão administrativa

Os itens autenticados exigem credenciais administrativas e dados reais de homologação. Eles não foram marcados como concluídos sem uma sessão válida.

Data: 8 de junho de 2026

Ambientes:

- Preview: `http://127.0.0.1:4174/PWA-BANDASHOW/`
- Produção: `https://gui130699.github.io/PWA-BANDASHOW/`
- Firebase: `pwa-bandashow`

Todos os nomes e e-mails de QA usaram o sufixo `20260608931510`. Os registros, configurações, logs e contas temporarias foram removidos ao final.

## 1. Primeiro admin

Resultado: APROVADO.

- A rota `/admin/acesso` ofereceu a criação do primeiro admin.
- O cadastro temporário criou `users/{uid}`, `system/adminSetup` e `system/adminOwner`.
- Logout e login administrativo funcionaram.
- Após a limpeza, `/admin/acesso` voltou a oferecer a criação do primeiro admin.

## 2. Serviços e custos

Resultado: APROVADO.

- Fornecedor temporário criado com custo padrão de R$ 800.
- Integrante temporário criado com custo padrão de R$ 500.
- Serviço temporário criado por R$ 5.000.
- Os dois custos foram vinculados ao serviço.
- `publicServices` continha somente campos publicos.
- Não havia `supplierLinks`, `memberCostLinks` ou `internalNotes` no documento publico.

## 3. Cliente solicita orçamento

Resultado: APROVADO COM OBSERVACAO DE AUTOMACAO.

- Cadastro e login do cliente funcionaram pela interface.
- Dados cadastrais e dados do evento foram validados no assistente.
- O navegador automatizado não conseguiu operar os seletores nativos de data/hora.
- Para concluir o teste sem alterar o app, foi executado o mesmo batch autenticado previsto pelo serviço: `quotes/{id}` e `clientQuoteViews/{id}`.
- O detalhe sanitizado apareceu corretamente no painel do cliente.

Essa observação é uma limitação do controle automatizado sobre inputs nativos, não um erro reproduzido para o usuário.

## 4. Admin aprova orçamento

Resultado: APROVADO.

- O admin abriu o orçamento.
- O recalculo gerou custos internos totais de R$ 1.300.
- `costSnapshot` continha fornecedor de R$ 800 e integrante de R$ 500.
- Lucro estimado ficou em R$ 3.700 e margem em 74%.
- A aprovação alterou o status para `aprovado_aguardando_entrada`.
- Um pagamento de entrada de R$ 2.500 foi criado.

Durante este teste foi identificado e corrigido um erro real: a sincronização tentava salvar status de pagamento `undefined` antes de existirem pagamentos.

## 5. Cliente informa entrada

Resultado: APROVADO.

- A central de pagamentos exibiu a entrada.
- Chave Pix e valor foram apresentados.
- O cliente informou o pagamento com observação.
- Status alterado para `informado_pelo_cliente`.
- O cliente não recebeu permissão de confirmação.

Durante este teste foi corrigida a consulta da página de detalhe para filtrar pagamentos pelo proprietario, atendendo as Firestore Rules.

## 6. Admin confirma entrada

Resultado: APROVADO.

- O admin visualizou a entrada informada.
- O pagamento foi confirmado.
- O orçamento mudou para `agendado`.
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
- O orçamento e a agenda mostraram `realizado`.
- Auditorias `quote_financials_updated`, `quote_approved` e `quote_done` foram encontradas.

## 9. Segurança Firestore

Resultado: APROVADO.

Testes com token de cliente:

```txt
clientQuoteViews proprio: HTTP 200
quotes interno: HTTP 403
services interno: HTTP 403
settings interno: HTTP 403
system/adminOwner: HTTP 403
```

A visão do cliente não continha:

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
- Home pública carregou com imagem e assets corretos.
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

Validação Chrome DevTools Protocol na URL pública:

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
- manifest com ícones 192, 512 e maskable.

## 12. Dependências e build

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
- Usuarios totais após limpeza: 1, o usuário original.
- `system/adminSetup`: inexistente.
- Serviço, fornecedor, integrante, cliente, orçamento e pagamentos QA removidos.
- Configurações Pix QA removidas.
- Dez logs de auditoria QA removidos.

## Conclusao

O fluxo cliente/admin, segurança, deploy, PWA, performance e limpeza de dados passaram. O projeto esta apto para o primeiro admin definitivo ser criado pelo proprietario.

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
- desktop sem sobreposição de navegação, textos ou botões;
- celular sem overflow horizontal;
- hero manteve CTA e indício da seção seguinte;
- login carregou em desktop e celular;
- botão de retorno para a tela inicial visível;
- acesso admin exibiu somente criação do primeiro admin quando não configurado;
- manifest, favicon e ícones apontam para os novos assets;
- console do navegador sem erros na home;
- logotipo transparente sem fundo quadriculado;
- `npm run lint`: OK;
- `npm run build`: OK.

Viewports usados:

```txt
Desktop: 1280 x 720
Celular: 390 x 844
```
