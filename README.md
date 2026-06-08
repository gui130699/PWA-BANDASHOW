# Grupo Dvanera - Gestao de Agenda e Orcamentos

PWA profissional para administrar agenda, orcamentos, servicos, custos internos, integrantes, fornecedores, pagamentos Pix e configuracoes do Grupo Dvanera.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Firebase Auth e Cloud Firestore
- GitHub Pages como deploy principal
- Firebase Hosting opcional
- React Router
- react-hook-form + zod
- lucide-react
- Recharts

## Instalar

```bash
npm install
```

## Configurar ambiente

Copie `.env.example` para `.env.local` para o app web e preencha:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=pwa-bandashow.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwa-bandashow
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Para scripts administrativos locais, use uma service account do Firebase:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\caminho\service-account.json
FIREBASE_PROJECT_ID=pwa-bandashow
ADMIN_EMAIL=admin@grupodvanera.com.br
ADMIN_PASSWORD=sua-senha-forte
ADMIN_NAME=Administrador Grupo Dvanera
```

Tambem e possivel usar `FIREBASE_SERVICE_ACCOUNT_JSON` com o JSON em uma unica linha.

## Firebase obrigatorio

No Firebase Console do projeto `pwa-bandashow`:

1. Ative Authentication.
2. Habilite o provedor Email/Password.
3. Em Authorized domains, adicione `gui130699.github.io`.
4. Crie o Cloud Firestore.
5. Publique regras e indices:

```bash
firebase login
firebase deploy --only firestore --project pwa-bandashow
```

## Rodar localmente

```bash
npm run dev
```

## Validar

```bash
npm run lint
npm run build
```

## Deploy principal - GitHub Pages

O deploy principal e feito por GitHub Actions a cada push na branch `main`.

```bash
git push origin main
```

O workflow `.github/workflows/deploy-pages.yml` injeta as secrets `VITE_FIREBASE_*` e define:

```env
VITE_BASE_PATH=/PWA-BANDASHOW/
```

URL publica:

```txt
https://gui130699.github.io/PWA-BANDASHOW/
```

## Deploy Firebase Hosting opcional

```bash
npm run deploy
```

## Criar primeiro admin

Opcao via navegador:

1. Abra `/admin/acesso`.
2. Se ainda nao existir admin, crie o primeiro cadastro.
3. Depois disso, a tela passa a ser apenas login admin.

Opcao via script local:

```bash
npm run create-admin
```

O script usa Firebase Admin SDK, cria o usuario no Auth e grava:

- `users/{uid}` com `role: "admin"`
- `system/adminSetup`
- `system/adminOwner`

## Resetar admin com seguranca

Nao existe segredo administrativo no front-end. Para remover o admin primario e liberar novo cadastro, rode localmente:

```bash
npm run reset-admin
```

O script:

- exige service account local;
- localiza `system/adminOwner`;
- pede confirmacao digitando `RESETAR`;
- remove `users/{uid}`;
- remove `system/adminOwner`;
- remove `system/adminSetup`;
- remove o usuario do Firebase Auth, se existir;
- registra auditoria em `auditLogs`.

## Popular dados iniciais

```bash
npm run seed
```

O seed cria dados internos e tambem espelhos publicos:

- `services` e `publicServices`
- `settings/main` e `publicSettings/main`

## Rotas

Publicas:

- `/`
- `/login`
- `/cadastro`
- `/admin/acesso`
- `/solicitar-orcamento`

Cliente:

- `/cliente`
- `/cliente/novo-orcamento`
- `/cliente/orcamentos`
- `/cliente/orcamentos/:id`
- `/cliente/pagamentos`

Admin:

- `/admin/dashboard`
- `/admin/agenda`
- `/admin/orcamentos`
- `/admin/orcamentos/:id`
- `/admin/servicos`
- `/admin/integrantes`
- `/admin/fornecedores`
- `/admin/pagamentos`
- `/admin/clientes`
- `/admin/configuracoes`

## Colecoes Firestore

Internas:

- `users`: perfis e roles.
- `clients`: dados cadastrais do cliente.
- `services`: servicos internos com custos, fornecedores, integrantes e observacoes internas.
- `bandMembers`: integrantes, Pix e valores padrao.
- `suppliers`: fornecedores, Pix e custos padrao.
- `quotes`: orcamentos internos com custos, lucro, margem e notas admin.
- `payments`: pagamentos de cliente.
- `memberPayments`: pagamentos para integrantes.
- `supplierPayments`: pagamentos para fornecedores.
- `settings/main`: configuracoes completas do admin.
- `auditLogs`: auditoria administrativa.
- `system/adminSetup` e `system/adminOwner`: controle de admin unico.

Publicas/sanitizadas:

- `publicServices`: catalogo de servicos sem custos internos.
- `clientQuoteViews`: versao segura do orcamento para cliente, sem `totalCosts`, `estimatedProfit`, `estimatedMargin`, `manualCosts`, `costSnapshot` e `adminNotes`.
- `publicSettings/main`: Pix, recebedor, instrucoes e contatos publicos.

## Separacao de dados sensiveis

O cliente nao le:

- `quotes`
- `services`
- `suppliers`
- `bandMembers`
- `settings`

O cliente le:

- seus documentos em `clientQuoteViews`
- seus documentos em `payments`
- `publicServices` ativos
- `publicSettings/main`

Essa separacao existe porque Firestore nao mascara campos de um documento. Por isso dados internos e dados publicos ficam em documentos diferentes.

## Fluxo oficial do orcamento

```txt
em_analise
aprovado_aguardando_entrada
entrada_informada_pelo_cliente
agendado
realizado
recusado
cancelado
```

1. Cliente solicita orcamento.
2. O sistema cria `quotes/{quoteId}` e `clientQuoteViews/{quoteId}`.
3. Admin revisa valores e recalcula custos internos.
4. Admin aprova ou recusa.
5. Ao aprovar, o sistema gera pagamento de entrada.
6. Cliente informa pagamento.
7. Admin confirma pagamento.
8. Evento entra na agenda como `agendado`.
9. Admin pode gerar pagamento restante.
10. Cliente informa restante.
11. Admin confirma restante.
12. Admin marca evento como `realizado`.

## Calculos financeiros

O percentual de entrada vem de `settings/main.defaultDepositPercent` no momento da aprovacao/recalculo.

```ts
depositAmount = total * (depositPercent / 100)
remainingAmount = total - depositAmount
```

O campo `depositPercent` fica salvo no orcamento para preservar o historico caso a configuracao mude no futuro.

Custos internos sao copiados para `costSnapshot` no momento da aprovacao/recalculo. Assim, alteracoes futuras em fornecedores ou integrantes nao alteram orcamentos antigos.

## Pagamentos

Tipos novos:

- `entrada`
- `restante`
- `outro`

Tipos legados ainda sao reconhecidos para compatibilidade:

- `entrada_50`
- `restante_50`

Funcoes centrais:

- `clientMarkPaymentAsPaid(payment, message)`: cliente informa pagamento.
- `confirmPayment(paymentId, actor)`: admin confirma entrada/restante e sincroniza agenda/cliente.
- `createFinalPayment(quote, settings)`: gera pagamento restante.

## Auditoria

Acoes administrativas importantes registram `auditLogs`, incluindo:

- servico criado/editado;
- fornecedor criado/editado/desativado;
- integrante criado/editado/desativado;
- orcamento aprovado/recusado/cancelado/recalculado/realizado;
- pagamento confirmado;
- configuracoes alteradas;
- reset admin via script.

Os ultimos logs aparecem em `/admin/configuracoes`.

## Checklist de seguranca

- Cliente nao le `quotes`.
- Cliente nao le `services`.
- Cliente nao le `suppliers`.
- Cliente nao le `bandMembers`.
- Cliente nao le `settings`.
- Cliente so informa pagamento, nunca confirma.
- Admin confirma pagamentos.
- Senha mestre removida do front-end.
- Regras Firestore protegem colecoes internas.
- Dados publicos sao sincronizados em colecoes proprias.

## Restauracao Git

Ver commits:

```bash
git log --oneline
```

Voltar para um commit mantendo historico:

```bash
git revert <hash-do-commit>
```

Inspecionar um commit:

```bash
git switch --detach <hash-do-commit>
```

Retornar:

```bash
git switch main
```

## Comandos uteis

```bash
npm install
npm run lint
npm run build
npm run dev
npm run preview
npm run create-admin
npm run reset-admin
npm run seed
firebase deploy --only firestore --project pwa-bandashow
```
