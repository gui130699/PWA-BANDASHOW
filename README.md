# Grupo Dvanera - Gestão de Agenda e Orçamentos

PWA em React, TypeScript e Firebase para administrar agenda, orçamentos, serviços, custos internos, integrantes, fornecedores e pagamentos Pix.

## Status de produção

- GitHub Pages: validado em 8 de junho de 2026.
- URL: https://gui130699.github.io/PWA-BANDASHOW/
- Workflow final: `27172060702`.
- Commit de produção validado: `08511aa`.
- Manifest: sem erros.
- Instalabilidade PWA: zero erros no Chrome DevTools Protocol.
- Service worker: ativo, controlando `/PWA-BANDASHOW/`.
- Rotas internas: refresh direto validado sem tela branca ou 404.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## Identidade visual Dvanera

Atualização visual concluída em 9 de junho de 2026:

- logotipo oficial aplicado na home, autenticação e painéis;
- hero com fotografia real de palco;
- paleta preto, grafite, marfim e dourado fosco;
- home comercial com Sobre, Serviços, Como funciona e CTA;
- login, cadastro, solicitação e acesso admin com estrutura unificada;
- dashboards com indicadores compactos;
- fluxo de orçamento com progresso e linha do tempo;
- botão para voltar a tela inicial nas páginas de acesso;
- novos ícones PWA e cache `grupo-dvanera-v6`;
- validação responsiva em desktop e celular.

Guia completo: `BRANDING_DVANERA.md`.

## Stack

- React 19, React Router e TypeScript
- Vite 8 com code splitting
- Tailwind CSS
- Firebase Auth e Cloud Firestore
- React Hook Form, Zod, Lucide React e Recharts
- GitHub Actions e GitHub Pages
- Firebase Hosting opcional

## Administração de cadastros

As páginas de Serviços, Integrantes e Fornecedores possuem duas áreas internas bem separadas:

- **Acesso**: consulta, busca, filtros, edição e ativação/desativação;
- **Cadastro**: criação e edição com formulário completo;
- o botão **Editar** carrega o registro na aba Cadastro;
- novos cadastros exigem campos obrigatórios e uma confirmação com resumo;
- após salvar, a interface retorna automaticamente para Acesso.

Em Serviços, a consulta também informa permissão de edição do valor, vínculos e custo interno padrão. Em Integrantes, a listagem administrativa reúne telefone, e-mail, chave e tipo de chave Pix, valor padrão e ações relacionadas. Em Fornecedores, a consulta reúne contatos, localização, dados Pix, custos, pagamentos e o gerenciamento dos tipos carregados do Firestore.

A página de Pagamentos permite selecionar integrantes e fornecedores diretamente das listas ativas. O valor padrão é preenchido automaticamente e o registro guarda destinatário, função ou tipo, contatos, Pix, data, status, referência, observação e responsável pelo lançamento.

Os cadastros auxiliares são mantidos no Firestore e podem ser gerenciados nos formulários ou em Configurações:

```txt
serviceCategories
supplierTypes
memberRoles
eventTypes
```

Somente opções ativas aparecem nos selects. Valores antigos permanecem disponíveis durante a edição para preservar o histórico.

## Configurações administrativas

A página `/admin/configuracoes` organiza os dados em oito seções recolhíveis:

- Dados da Banda
- Pagamento e Pix
- Regras de Orçamento
- Cadastros Auxiliares
- Mensagens Automáticas
- Aparência do Sistema
- Segurança e Administração
- Auditoria e Manutenção

O salvamento é centralizado em `settingsService.updateSettings()`: atualiza `settings/main`, sincroniza somente os campos públicos seguros em `publicSettings/main` e registra auditoria geral e por grupo alterado. A área de manutenção mostra o estado da configuração Pix, da sincronização pública, do cache PWA e do ambiente.

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

## Variáveis Firebase

Crie `.env.local` a partir de `.env.example`. Nunca versione esse arquivo.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=pwa-bandashow.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwa-bandashow
VITE_FIREBASE_STORAGE_BUCKET=pwa-bandashow.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Secrets obrigatórias no GitHub:

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
- [x] URL pública abre normalmente.
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

O service worker `grupo-dvanera-v6`:

- usa network-first para navegação;
- usa cache de runtime somente para assets locais;
- ignora requisições não GET e origens externas;
- não intercepta Firebase Auth ou Firestore;
- executa `skipWaiting` e `clients.claim`;
- apaga caches antigos na ativacao.

Validação executada na URL pública:

- Manifest URL correta.
- Nenhum erro de manifest.
- Nenhum erro de instalabilidade.
- Service worker `activated`.
- Página controlada pelo service worker.

Validação manual complementar:

1. Abra a URL no Chrome.
2. Acesse DevTools > Application > Manifest.
3. Confirme os ícones 192, 512 e maskable.
4. Em Service Workers, confirme `sw.js` ativo.
5. Use a opção Instalar aplicativo do Chrome.

## Limpar service worker antigo

Se um navegador mantiver uma versão antiga:

1. DevTools > Application > Service Workers > Unregister.
2. Application > Storage > Clear site data.
3. Feche as abas do site.
4. Abra novamente com `Ctrl+Shift+R`.

Também é possível executar no console:

```js
const registrations = await navigator.serviceWorker.getRegistrations()
await Promise.all(registrations.map((registration) => registration.unregister()))
const keys = await caches.keys()
await Promise.all(keys.map((key) => caches.delete(key)))
location.reload()
```

## Performance e bundle

Todas as páginas são carregadas com `React.lazy` e `Suspense`. Recharts só é baixado quando uma página administrativa com gráficos é aberta. Firebase usa imports modulares.

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

Não existe chunk acima de 500 kB e o Vite não emite mais esse aviso. A imagem principal foi reduzida de aproximadamente 2,05 MB em PNG para 273,51 kB em JPEG, sem alterar suas dimensões.

## NPM audit

Comandos:

```bash
npm audit
npm audit --omit=dev
```

Resultado final:

- Dependências de produção: 0 vulnerabilidades.
- Auditoria completa: 8 moderadas em dependências transitivas de desenvolvimento do `firebase-admin`.
- Cadeia: `firebase-admin` > Google Cloud SDKs > `uuid` 9.
- O `firebase-admin` é usado apenas por scripts locais administrativos e não entra no bundle web.
- `npm audit fix --force` não foi aplicado porque exige downgrade com breaking change para `firebase-admin@10.3.0`.

Recomendação: acompanhar novas versões de `firebase-admin`, `@google-cloud/firestore` e `@google-cloud/storage`. Não usar `--force` sem repetir todos os testes.

## Firebase obrigatório

No projeto `pwa-bandashow`:

1. Ative Authentication.
2. Habilite Email/Password.
3. Mantenha `gui130699.github.io` em Authorized domains.
4. Crie o Cloud Firestore.
5. Publique regras e índices:

```bash
firebase login
firebase deploy --only firestore --project pwa-bandashow
```

## Primeiro admin

Pelo navegador:

1. Abra `/admin/acesso`.
2. Crie o primeiro e único cadastro admin.
3. Depois da criação, a rota passa a oferecer somente login.

Pelo script local:

```bash
npm run create-admin
```

O script exige service account e grava:

- `users/{uid}` com `role: "admin"`;
- `system/adminSetup`;
- `system/adminOwner`.

## Resetar admin

Não existe senha mestre no front-end. O reset seguro é local:

```bash
npm run reset-admin
```

Configure uma destas opções sem versionar credenciais:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\caminho\service-account.json
```

ou:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

O script exige a confirmação `RESETAR`, remove Auth e documentos de controle e registra auditoria.

## Dados e segurança

Coleções internas:

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
serviceCategories
supplierTypes
memberRoles
eventTypes
settings
auditLogs
system
```

Coleções sanitizadas:

```txt
publicServices
clientQuoteViews
publicSettings
```

O cliente não consegue ler `quotes`, `services`, `suppliers`, `bandMembers`, `settings`, `auditLogs` ou `system/adminOwner`. A visão `clientQuoteViews` remove custos, lucro, margem, notas administrativas e `costSnapshot`.

## Fluxo validado

```txt
em_analise
aprovado_aguardando_entrada
entrada_informada_pelo_cliente
agendado
realizado
```

O teste final criou fornecedor, integrante, serviço, cliente, orçamento, entrada e restante. Custos de R$ 800 e R$ 500 foram consolidados em `costSnapshot`; o cliente recebeu somente a visão sanitizada. Os dois pagamentos foram informados pelo cliente e confirmados pelo admin. O evento entrou na agenda e foi marcado como realizado.

Todos os usuários, documentos, configurações e logs temporários foram removidos ao final. O Firebase voltou a conter somente o usuário original e nenhum primeiro admin configurado.

## Tratamento de erros

Mensagens amigáveis cobrem:

- Auth desabilitado ou configuracao ausente;
- domínio não autorizado;
- permissão negada;
- indisponibilidade e falha de rede;
- excesso de tentativas;
- Pix ausente;
- serviços ou pagamentos vazios;
- orçamento ou perfil inexistente.

## Testes e documentação

```bash
npm run lint
npm run build
npm run check:text
npm run docs
```

Consulte:

- `CHECKLIST_PRODUCAO.md`
- `TESTES_MANUAIS_PRODUCAO.md`
- `RELATORIO_FINAL_PRODUCAO.md`
- `BRANDING_DVANERA.md`
- `DOCUMENTACAO_COMPLETA_PROJETO.txt`

## Solução de tela branca

1. Confira o último workflow em GitHub Actions.
2. Confirme as seis secrets Firebase.
3. Confirme `VITE_BASE_PATH=/PWA-BANDASHOW/`.
4. Confirme o domínio autorizado no Firebase Auth.
5. Abra a aba Network e procure assets com 404.
6. Limpe o service worker e o cache conforme a seção acima.

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
