# Grupo Dvanera - Gestao de Agenda e Orcamentos

PWA em React, TypeScript e Firebase para administrar agenda, orcamentos, servicos, custos internos, integrantes, fornecedores e pagamentos Pix.

## Status de producao

- GitHub Pages: validado em 8 de junho de 2026.
- URL: https://gui130699.github.io/PWA-BANDASHOW/
- Workflow final: `27172060702`.
- Commit de producao validado: `08511aa`.
- Manifest: sem erros.
- Instalabilidade PWA: zero erros no Chrome DevTools Protocol.
- Service worker: ativo, controlando `/PWA-BANDASHOW/`.
- Rotas internas: refresh direto validado sem tela branca ou 404.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Identidade visual Dvanera

Atualizacao visual concluida em 9 de junho de 2026:

- logotipo oficial aplicado na home, autenticacao e paineis;
- hero com fotografia real de palco;
- paleta preto, grafite, marfim e dourado fosco;
- home comercial com Sobre, Servicos, Como funciona e CTA;
- login, cadastro, solicitacao e acesso admin com estrutura unificada;
- dashboards com indicadores compactos;
- fluxo de orcamento com progresso e linha do tempo;
- botao para voltar a tela inicial nas paginas de acesso;
- novos icones PWA e cache `grupo-dvanera-v5`;
- validacao responsiva em desktop e celular.

Guia completo: `BRANDING_DVANERA.md`.

## Stack

- React 19, React Router e TypeScript
- Vite 8 com code splitting
- Tailwind CSS
- Firebase Auth e Cloud Firestore
- React Hook Form, Zod, Lucide React e Recharts
- GitHub Actions e GitHub Pages
- Firebase Hosting opcional

## Instalar e rodar

```bash
npm install
npm run dev
```

Build local equivalente ao GitHub Pages:

```powershell
$env:VITE_BASE_PATH='/PWA-BANDASHOW/'
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

URL local:

```txt
http://127.0.0.1:4173/PWA-BANDASHOW/
```

## Variaveis Firebase

Crie `.env.local` a partir de `.env.example`. Nunca versione esse arquivo.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=pwa-bandashow.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwa-bandashow
VITE_FIREBASE_STORAGE_BUCKET=pwa-bandashow.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Secrets obrigatorias no GitHub:

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

O workflow define diretamente:

```env
VITE_BASE_PATH=/PWA-BANDASHOW/
```

## Checklist GitHub Pages

- [x] GitHub Pages habilitado.
- [x] Source configurado para GitHub Actions.
- [x] Secrets `VITE_FIREBASE_*` cadastradas.
- [x] `gui130699.github.io` cadastrado em Firebase Authentication > Authorized domains.
- [x] Workflow executado sem erro.
- [x] URL publica abre normalmente.
- [x] Refresh em `/login`, `/admin/acesso`, `/cliente`, `/admin/dashboard` e `/solicitar-orcamento` funciona.

O `postbuild` executa `scripts/createGhPagesFallback.ts`, copiando `dist/index.html` para `dist/404.html`. Isso permite que o React Router recupere rotas acessadas diretamente no GitHub Pages.

## PWA

Arquivos centrais:

```txt
public/manifest.webmanifest
public/sw.js
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-512.png
src/main.tsx
```

O service worker `grupo-dvanera-v5`:

- usa network-first para navegacao;
- usa cache de runtime somente para assets locais;
- ignora requisicoes nao GET e origens externas;
- nao intercepta Firebase Auth ou Firestore;
- executa `skipWaiting` e `clients.claim`;
- apaga caches antigos na ativacao.

Validacao executada na URL publica:

- Manifest URL correta.
- Nenhum erro de manifest.
- Nenhum erro de instalabilidade.
- Service worker `activated`.
- Pagina controlada pelo service worker.

Validacao manual complementar:

1. Abra a URL no Chrome.
2. Acesse DevTools > Application > Manifest.
3. Confirme os icones 192, 512 e maskable.
4. Em Service Workers, confirme `sw.js` ativo.
5. Use a opcao Instalar aplicativo do Chrome.

## Limpar service worker antigo

Se um navegador mantiver uma versao antiga:

1. DevTools > Application > Service Workers > Unregister.
2. Application > Storage > Clear site data.
3. Feche as abas do site.
4. Abra novamente com `Ctrl+Shift+R`.

Tambem e possivel executar no console:

```js
const registrations = await navigator.serviceWorker.getRegistrations()
await Promise.all(registrations.map((registration) => registration.unregister()))
const keys = await caches.keys()
await Promise.all(keys.map((key) => caches.delete(key)))
location.reload()
```

## Performance e bundle

Todas as paginas sao carregadas com `React.lazy` e `Suspense`. Recharts so e baixado quando uma pagina administrativa com graficos e aberta. Firebase usa imports modulares.

Principais arquivos do build de branding:

```txt
logo oficial             61.33 kB
hero                    273.51 kB
index                    58.46 kB
firebase-auth            85.71 kB
forms-vendor             87.43 kB
firebase-firestore      266.77 kB
react-vendor            283.70 kB
charts-vendor           343.60 kB
```

Nao existe chunk acima de 500 kB e o Vite nao emite mais esse aviso. A imagem principal foi reduzida de aproximadamente 2,05 MB em PNG para 273,51 kB em JPEG, sem alterar suas dimensoes.

## NPM audit

Comandos:

```bash
npm audit
npm audit --omit=dev
```

Resultado final:

- Dependencias de producao: 0 vulnerabilidades.
- Auditoria completa: 8 moderadas em dependencias transitivas de desenvolvimento do `firebase-admin`.
- Cadeia: `firebase-admin` > Google Cloud SDKs > `uuid` 9.
- O `firebase-admin` e usado apenas por scripts locais administrativos e nao entra no bundle web.
- `npm audit fix --force` nao foi aplicado porque exige downgrade com breaking change para `firebase-admin@10.3.0`.

Recomendacao: acompanhar novas versoes de `firebase-admin`, `@google-cloud/firestore` e `@google-cloud/storage`. Nao usar `--force` sem repetir todos os testes.

## Firebase obrigatorio

No projeto `pwa-bandashow`:

1. Ative Authentication.
2. Habilite Email/Password.
3. Mantenha `gui130699.github.io` em Authorized domains.
4. Crie o Cloud Firestore.
5. Publique regras e indices:

```bash
firebase login
firebase deploy --only firestore --project pwa-bandashow
```

## Primeiro admin

Pelo navegador:

1. Abra `/admin/acesso`.
2. Crie o primeiro e unico cadastro admin.
3. Depois da criacao, a rota passa a oferecer somente login.

Pelo script local:

```bash
npm run create-admin
```

O script exige service account e grava:

- `users/{uid}` com `role: "admin"`;
- `system/adminSetup`;
- `system/adminOwner`.

## Resetar admin

Nao existe senha mestre no front-end. O reset seguro e local:

```bash
npm run reset-admin
```

Configure uma destas opcoes sem versionar credenciais:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\caminho\service-account.json
```

ou:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

O script exige a confirmacao `RESETAR`, remove Auth e documentos de controle e registra auditoria.

## Dados e seguranca

Colecoes internas:

```txt
users
clients
services
bandMembers
suppliers
quotes
payments
memberPayments
supplierPayments
settings
auditLogs
system
```

Colecoes sanitizadas:

```txt
publicServices
clientQuoteViews
publicSettings
```

O cliente nao consegue ler `quotes`, `services`, `suppliers`, `bandMembers`, `settings`, `auditLogs` ou `system/adminOwner`. A visao `clientQuoteViews` remove custos, lucro, margem, notas administrativas e `costSnapshot`.

## Fluxo validado

```txt
em_analise
aprovado_aguardando_entrada
entrada_informada_pelo_cliente
agendado
realizado
```

O teste final criou fornecedor, integrante, servico, cliente, orcamento, entrada e restante. Custos de R$ 800 e R$ 500 foram consolidados em `costSnapshot`; o cliente recebeu somente a visao sanitizada. Os dois pagamentos foram informados pelo cliente e confirmados pelo admin. O evento entrou na agenda e foi marcado como realizado.

Todos os usuarios, documentos, configuracoes e logs temporarios foram removidos ao final. O Firebase voltou a conter somente o usuario original e nenhum primeiro admin configurado.

## Tratamento de erros

Mensagens amigaveis cobrem:

- Auth desabilitado ou configuracao ausente;
- dominio nao autorizado;
- permissao negada;
- indisponibilidade e falha de rede;
- excesso de tentativas;
- Pix ausente;
- servicos ou pagamentos vazios;
- orcamento ou perfil inexistente.

## Testes e documentacao

```bash
npm run lint
npm run build
npm run docs
```

Consulte:

- `CHECKLIST_PRODUCAO.md`
- `TESTES_MANUAIS_PRODUCAO.md`
- `RELATORIO_FINAL_PRODUCAO.md`
- `BRANDING_DVANERA.md`
- `DOCUMENTACAO_COMPLETA_PROJETO.txt`

## Solucao de tela branca

1. Confira o ultimo workflow em GitHub Actions.
2. Confirme as seis secrets Firebase.
3. Confirme `VITE_BASE_PATH=/PWA-BANDASHOW/`.
4. Confirme o dominio autorizado no Firebase Auth.
5. Abra a aba Network e procure assets com 404.
6. Limpe o service worker e o cache conforme a secao acima.

## Comandos principais

```bash
npm install
npm audit
npm audit --omit=dev
npm run lint
npm run build
npm run preview
npm run docs
npm run create-admin
npm run reset-admin
npm run seed
firebase deploy --only firestore --project pwa-bandashow
```
