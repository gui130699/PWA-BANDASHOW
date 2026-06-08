# Checklist de Producao - Grupo Dvanera

Validacao final executada em 8 de junho de 2026.

## Deploy

- [x] GitHub Pages funcionando
- [x] Refresh em rotas internas funcionando
- [x] Secrets `VITE_FIREBASE_*` configuradas
- [x] Authorized domain `gui130699.github.io` configurado
- [x] GitHub Actions executando com sucesso
- [x] Fallback `dist/404.html` gerado no postbuild
- [x] Workflow usa Node 22 e `npm ci`
- [x] Permissoes Pages corretas

## PWA

- [x] Manifest valido
- [x] `start_url`, `scope` e `id` usam `/PWA-BANDASHOW/`
- [x] Icone 192 configurado
- [x] Icone 512 configurado
- [x] Icone maskable configurado
- [x] Service worker ativo
- [x] App atende aos criterios de instalabilidade
- [x] Cache v4 atualizado sem prender versao antiga
- [x] Navegacao offline basica carregada pelo app shell
- [x] Firebase Auth/Firestore nao sao cacheados

## Performance

- [x] Rotas com lazy loading
- [x] `Suspense` com estado de carregamento
- [x] Recharts carregado sob demanda
- [x] Firebase com imports modulares
- [x] Bundle analisado
- [x] Nenhum chunk acima de 500 kB
- [x] Aviso de chunk grande removido
- [x] Hero reduzido de 2,05 MB para 273,51 kB

## Seguranca de dependencias

- [x] `npm install` executado
- [x] `npm audit` executado
- [x] `npm audit fix` testado sem `--force`
- [x] `npm audit --omit=dev` sem vulnerabilidades
- [x] Oito alertas moderados de desenvolvimento documentados
- [x] Downgrade breaking de `firebase-admin` recusado
- [x] `npm@10 ci --dry-run` validado

## Seguranca Firebase

- [x] Cliente nao le `quotes`
- [x] Cliente nao le `services`
- [x] Cliente nao le `suppliers`
- [x] Cliente nao le `bandMembers`
- [x] Cliente nao le `settings`
- [x] Cliente nao le `system/adminOwner`
- [x] Cliente le somente sua `clientQuoteViews`
- [x] Cliente le somente seus pagamentos
- [x] `publicServices` nao expoe custos internos
- [x] `clientQuoteViews` nao expoe custos, lucro ou notas admin
- [x] Reset admin permanece fora do front-end

## Orcamentos e pagamentos

- [x] Primeiro admin criado e autenticado em teste temporario
- [x] Fornecedor criado
- [x] Integrante criado
- [x] Servico criado com custos vinculados
- [x] Cliente criado
- [x] Orcamento e visao sanitizada criados
- [x] Recalculo gera `costSnapshot`
- [x] Aprovacao gera entrada
- [x] Cliente informa entrada
- [x] Admin confirma entrada
- [x] Evento entra na agenda
- [x] Admin gera restante
- [x] Cliente informa restante
- [x] Admin confirma restante
- [x] Evento marcado como realizado
- [x] Auditoria confirmada

## Robustez

- [x] Consulta Firestore nao entra em ciclo de ressubscricao
- [x] Sincronizacao sem pagamento nao grava `undefined`
- [x] Consulta de pagamentos do cliente respeita as regras
- [x] Usuario autenticado sem perfil nao entra em loop
- [x] Erros Firebase recebem mensagens amigaveis
- [x] Pix ausente desabilita copia e mostra orientacao

## Qualidade final

- [x] `npm run lint`
- [x] `npm run build`
- [x] Preview local
- [x] Site publico
- [x] Rotas publicas e protegidas
- [x] Manifest publico
- [x] Service worker publico
- [x] Instalabilidade publica
- [x] Dados QA removidos
- [x] Contas QA removidas
- [x] Documentacao atualizada
