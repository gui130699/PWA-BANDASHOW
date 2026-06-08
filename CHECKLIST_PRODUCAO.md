# Checklist de Producao - Grupo Dvanera

## Seguranca

- [x] Cliente nao le `quotes` internos
- [x] Cliente nao le `services` internos
- [x] Cliente nao le `suppliers`
- [x] Cliente nao le `bandMembers`
- [x] Cliente nao le `settings` internos
- [x] `clientQuoteViews` criada para leitura segura do cliente
- [x] `publicServices` criada para catalogo publico sem custos
- [x] `publicSettings` criada para Pix/contatos publicos
- [x] Senha mestre removida do front-end
- [x] Reset admin movido para script local com Firebase Admin SDK
- [x] Firestore Rules revisadas

## Orcamentos

- [x] Custos internos copiados para `costSnapshot` ao recalcular/aprovar
- [x] `costSnapshot` guarda custo historico com quantidade e custo total
- [x] Lucro calculado a partir de custos internos
- [x] Margem calculada a partir do lucro
- [x] Entrada usa percentual configuravel
- [x] `depositPercent` salvo no orcamento
- [x] Status oficial padronizado sem `entrada_confirmada`

## Pagamentos

- [x] Cliente informa entrada
- [x] Cliente informa restante
- [x] Cliente nao confirma pagamento
- [x] Admin confirma entrada por funcao unica
- [x] Admin confirma restante por funcao unica
- [x] Evento entra na agenda ao confirmar entrada
- [x] `clientQuoteViews` sincronizada apos confirmacoes

## Auditoria

- [x] Servicos registram criacao/edicao
- [x] Integrantes registram criacao/edicao/desativacao
- [x] Fornecedores registram criacao/edicao/desativacao
- [x] Orcamentos registram aprovacoes, recusas, cancelamentos, recalculos e realizados
- [x] Pagamentos confirmados registram log
- [x] Configuracoes registram log
- [x] Reset admin registra log via script local
- [x] Admin visualiza logs recentes

## UX/Admin

- [x] Dashboard admin usa dados reais do mes
- [x] Agenda filtra por status, cidade, cliente e tipo
- [x] Agenda mostra telefone, local, servicos, entrada e restante
- [x] Detalhe admin mostra percentual de entrada
- [x] Detalhe admin possui recalculo de custos

## UX/Cliente

- [x] Cliente visualiza orcamentos por `clientQuoteViews`
- [x] Cliente visualiza status amigavel
- [x] Cliente ve entrada/restante conforme percentual salvo
- [x] Cliente ve todos os pagamentos pendentes
- [x] Cliente copia chave Pix
- [x] Cliente informa pagamento com observacao

## Deploy

- [x] PWA cache atualizado para `grupo-dvanera-v3`
- [x] `npm install`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Firestore Rules publicadas
- [ ] GitHub Pages funcionando
- [ ] PWA instalavel

## Testes manuais recomendados

- [ ] Criar primeiro admin em `/admin/acesso`
- [ ] Criar servico com fornecedor/integrante vinculado
- [ ] Criar cliente
- [ ] Solicitar orcamento
- [ ] Aprovar orcamento
- [ ] Conferir `clientQuoteViews` sem custos internos
- [ ] Cliente informar entrada
- [ ] Admin confirmar entrada
- [ ] Ver evento na agenda
- [ ] Gerar pagamento restante
- [ ] Cliente informar restante
- [ ] Admin confirmar restante
- [ ] Marcar evento como realizado
