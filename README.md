# Grupo Dvanera - Gestao de Agenda e Orcamentos

PWA profissional para administrar agenda, orcamentos, servicos, custos internos, integrantes, fornecedores e pagamentos Pix do Grupo Dvanera.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Firebase Auth, Firestore e Firebase Hosting
- React Router
- react-hook-form + zod
- date-fns
- lucide-react
- Recharts

## Instalar

```bash
npm install
```

## Configurar Firebase

1. Copie `.env.example` para `.env`.
2. Preencha as variaveis `VITE_FIREBASE_*` com os dados do app web do projeto Firebase `pwa-bandashow`.
3. Ative Firebase Auth com provedor e-mail/senha.
4. Crie o Firestore Database.
5. Publique regras e indices:

```bash
firebase login
firebase use pwa-bandashow
firebase deploy --only firestore
```

As credenciais reais nao devem ser commitadas.

## Rodar localmente

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy Hosting

```bash
firebase login
firebase use pwa-bandashow
npm run deploy
```

## Criar primeiro admin

Baixe uma service account no Firebase Console e configure uma das opcoes no `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\caminho\service-account.json
FIREBASE_PROJECT_ID=pwa-bandashow
ADMIN_EMAIL=admin@grupodvanera.com.br
ADMIN_PASSWORD=sua-senha-forte
ADMIN_NAME=Administrador Grupo Dvanera
```

Depois rode:

```bash
npm run create-admin
```

O script cria o usuario no Firebase Auth e grava `users/{uid}` com `role: "admin"`.

## Popular dados de teste

```bash
npm run seed
```

O seed cria servicos, fornecedores, integrantes e `settings/main` com valores iniciais.

## Rotas

Publicas:

- `/`
- `/login`
- `/cadastro`
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

- `users`: perfil e role.
- `clients`: dados cadastrais do cliente.
- `services`: servicos vendidos, preco base, status e custos vinculados.
- `bandMembers`: integrantes, Pix e valor padrao.
- `suppliers`: fornecedores, Pix e custo padrao.
- `quotes`: orcamentos, evento, itens, status, totais e custos internos.
- `payments`: entrada de 50%, restante e confirmacoes.
- `memberPayments`: pagamentos para integrantes.
- `supplierPayments`: pagamentos para fornecedores.
- `settings/main`: Pix da banda e mensagens padrao.
- `auditLogs`: historico/auditoria administrativa.

## Regras de seguranca

- Admin pode ler e escrever tudo.
- Cliente le e atualiza os proprios dados.
- Cliente cria orcamento apenas para si mesmo.
- Cliente le apenas os proprios orcamentos e pagamentos.
- Cliente so pode informar pagamento de entrada; confirmacao e sempre admin.
- Cliente nao tem permissoes para colecoes internas de integrantes, fornecedores e custos financeiros.

Observacao importante: Firestore nao faz mascaramento de campos por leitura no mesmo documento. O front-end nao exibe custos internos ao cliente e as regras limitam escrita indevida, mas para seguranca maxima futura recomenda-se criar uma colecao publica separada, por exemplo `clientQuoteViews`, sem campos de custo.

## Fluxo principal

1. Cliente cria cadastro.
2. Cliente solicita orcamento em quatro etapas.
3. Orcamento nasce com status `em_analise`.
4. Admin ajusta valores, desconto, taxa, custos e aprova ou reprova.
5. Aprovado gera pagamento de entrada `entrada_50`.
6. Cliente copia Pix e informa pagamento.
7. Admin confirma manualmente.
8. Evento entra na agenda como `agendado`.
9. Admin pode gerar pagamento restante e marcar evento como `realizado`.

## Restauracao Git

Ver commits:

```bash
git log --oneline
```

Voltar para o ultimo commit estavel mantendo historico:

```bash
git revert <hash-do-commit>
```

Voltar temporariamente para um commit para inspecao:

```bash
git switch --detach <hash-do-commit>
```

Retornar para o trabalho atual:

```bash
git switch main
```

## Proximos passos recomendados

- Separar bundle por rota com `lazy()` e `Suspense`.
- Criar `clientQuoteViews` para leitura publica segura sem custos internos.
- Adicionar upload de comprovante com Firebase Storage.
- Adicionar testes de regras Firestore com Emulator Suite.
- Criar auditoria automatica nas principais mutacoes administrativas.
