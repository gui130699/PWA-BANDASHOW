# Checklist de Produção - Grupo Dvanera

Validação final executada em 8 de junho de 2026.

## Revisão administrativa - 9 de junho de 2026

- [x] Serviços separados em Acesso e Cadastro
- [x] Integrantes separados em Acesso e Cadastro
- [x] Botões de edição carregam o registro na aba Cadastro
- [x] Cadastros vazios bloqueados
- [x] Resumo de confirmação antes de novos cadastros
- [x] Categorias de serviços no Firestore
- [x] Tipos de fornecedores no Firestore
- [x] Funções de integrantes no Firestore
- [x] Tipos de evento no Firestore
- [x] Regras de leitura e escrita dos cadastros auxiliares
- [x] Configurações organizadas em oito seções recolhíveis
- [x] Sincronização segura com `publicSettings/main`
- [x] Revisão textual PT-BR
- [x] `npm run check:text`

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
- [x] Cache v5 atualizado sem prender versão antiga
- [x] Navegacao offline basica carregada pelo app shell
- [x] Firebase Auth/Firestore não são cacheados

## Performance

- [x] Rotas com lazy loading
- [x] `Suspense` com estado de carregamento
- [x] Recharts carregado sob demanda
- [x] Firebase com imports modulares
- [x] Bundle analisado
- [x] Nenhum chunk acima de 500 kB
- [x] Aviso de chunk grande removido
- [x] Hero reduzido de 2,05 MB para 273,51 kB
- [x] Logo oficial transparente otimizado para 61,33 kB

## Branding e interface - 9 de junho de 2026

- [x] Logotipo oficial aplicado
- [x] Home comercial completa
- [x] Hero com fotografia real
- [x] Paleta Dvanera consolidada em tokens
- [x] Login, cadastro e admin com estrutura comum
- [x] Botao para voltar a tela inicial
- [x] Dashboard cliente com metricas
- [x] Dashboard admin com metricas
- [x] Progresso do novo orçamento
- [x] Linha do tempo do orçamento
- [x] Agenda com filtros responsivos
- [x] Icones PWA substituidos
- [x] Manifesto e metadados atualizados
- [x] Foco de teclado e movimento reduzido
- [x] Home validada em desktop e celular
- [x] Login validado em desktop e celular
- [x] Sem overflow horizontal nos viewports testados
- [x] `BRANDING_DVANERA.md` criado

## Segurança de dependências

- [x] `npm install` executado
- [x] `npm audit` executado
- [x] `npm audit fix` testado sem `--force`
- [x] `npm audit --omit=dev` sem vulnerabilidades
- [x] Oito alertas moderados de desenvolvimento documentados
- [x] Downgrade breaking de `firebase-admin` recusado
- [x] `npm@10 ci --dry-run` validado

## Segurança Firebase

- [x] Cliente não lê `quotes`
- [x] Cliente não lê `services`
- [x] Cliente não lê `suppliers`
- [x] Cliente não lê `bandMembers`
- [x] Cliente não lê `settings`
- [x] Cliente não lê `system/adminOwner`
- [x] Cliente lê somente sua `clientQuoteViews`
- [x] Cliente lê somente seus pagamentos
- [x] `publicServices` não expõe custos internos
- [x] `clientQuoteViews` não expõe custos, lucro ou notas admin
- [x] Reset admin permanece fora do front-end

## Orçamentos e pagamentos

- [x] Primeiro admin criado e autenticado em teste temporário
- [x] Fornecedor criado
- [x] Integrante criado
- [x] Serviço criado com custos vinculados
- [x] Cliente criado
- [x] Orçamento e visão sanitizada criados
- [x] Recalculo gera `costSnapshot`
- [x] Aprovação gera entrada
- [x] Cliente informa entrada
- [x] Admin confirma entrada
- [x] Evento entra na agenda
- [x] Admin gera restante
- [x] Cliente informa restante
- [x] Admin confirma restante
- [x] Evento marcado como realizado
- [x] Auditoria confirmada

## Robustez

- [x] Consulta Firestore não entra em ciclo de ressubscrição
- [x] Sincronização sem pagamento não grava `undefined`
- [x] Consulta de pagamentos do cliente respeita as regras
- [x] Usuário autenticado sem perfil não entra em loop
- [x] Erros Firebase recebem mensagens amigáveis
- [x] Pix ausente desabilita copia e mostra orientacao

## Qualidade final

- [x] `npm run lint`
- [x] `npm run build`
- [x] Preview local
- [x] Site publico
- [x] Rotas públicas e protegidas
- [x] Manifest publico
- [x] Service worker publico
- [x] Instalabilidade pública
- [x] Dados QA removidos
- [x] Contas QA removidas
- [x] Documentação atualizada
