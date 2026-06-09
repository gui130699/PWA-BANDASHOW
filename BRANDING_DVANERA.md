# Identidade Visual do Grupo Dvanera

Documento de referencia para manter a identidade oficial do Grupo Dvanera consistente na home, autenticacao, painel do cliente, painel administrativo e PWA.

## Direcao visual

A interface combina palco, musica e operacao profissional. O resultado deve transmitir energia, confianca e organizacao sem transformar o painel em uma pagina promocional.

Principios:

- preto e grafite como base;
- marfim para texto e logotipo;
- dourado fosco para destaque e acao principal;
- azul e verde somente como cores funcionais;
- fotografia real de palco nas telas publicas e de autenticacao;
- paineis internos densos, claros e orientados a tarefas;
- cantos discretos, bordas finas e sombras controladas.

## Paleta

| Uso | Cor | Valor |
| --- | --- | --- |
| Fundo principal | Preto | `#050505` |
| Fundo secundario | Grafite profundo | `#0B0C0C` |
| Superficie | Carvao | `#101211` |
| Superficie elevada | Grafite | `#171A18` |
| Borda | Branco com baixa opacidade | `rgba(255,255,255,0.10)` |
| Texto principal | Marfim | `#F7F0DE` |
| Texto secundario | Cinza frio | Tailwind `slate-400` |
| Destaque principal | Dourado fosco | `#D8AA36` |
| Destaque escuro | Dourado profundo | `#B98520` |
| Sucesso | Verde esmeralda | Tailwind `emerald` |
| Informacao | Azul ceu | Tailwind `sky` |
| Erro | Vermelho | Tailwind `red` |

Os tokens ficam em `tailwind.config.ts` e `src/index.css`.

## Tipografia

- Interface e textos: `Inter`, `Segoe UI`, `Arial`, sans-serif.
- Titulos e numeros de destaque: `Arial Black`, `Inter`, sans-serif.
- Titulos usam `font-display`.
- Nao usar tamanho de fonte vinculado diretamente a largura da tela.
- Letter spacing negativo nao faz parte da identidade.

## Arquivos oficiais

```txt
src/assets/brand/logo-dvanera-original.jpeg
src/assets/brand/logo-dvanera-light.png
src/assets/brand/mark-dvanera.png
src/assets/dvanera-hero.jpg
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-512.png
public/icons/gd-icon.svg
```

Uso:

- `logo-dvanera-original.jpeg`: referencia recebida do Grupo Dvanera.
- `logo-dvanera-light.png`: wordmark oficial em marfim e fundo transparente.
- `mark-dvanera.png`: monograma quadrado para PWA e contextos compactos.
- `dvanera-hero.jpg`: palco principal da home e da autenticacao.

Para substituir a fotografia, mantenha enquadramento horizontal, palco claramente visivel e arquivo otimizado. Evite imagens abstratas, desfocadas ou sem relacao direta com shows.

## Componentes de marca

```txt
src/components/brand/BrandLogo.tsx
src/components/brand/AuthShell.tsx
src/components/ui/MetricCard.tsx
src/components/ui/PageHeader.tsx
src/components/ui/QuoteTimeline.tsx
```

- `BrandLogo`: alterna entre wordmark completo e monograma.
- `AuthShell`: estrutura comum de login, cadastro, solicitacao e acesso admin.
- `MetricCard`: indicadores compactos para os dashboards.
- `PageHeader`: titulo, descricao e acao principal das paginas internas.
- `QuoteTimeline`: progresso visual do orcamento do cliente.

## Aplicacao por tela

### Home

- hero em tela cheia com fotografia real;
- logotipo oficial como primeiro sinal da marca;
- chamada comercial e botoes de orcamento/login;
- secoes Sobre, Servicos, Como funciona, Por que contratar e CTA;
- icone administrativo discreto no canto superior direito;
- WhatsApp exibido somente quando configurado no Firebase.

### Autenticacao

- fundo de palco com camada escura;
- logotipo oficial;
- card de formulario em carvao;
- botao com seta para voltar a tela inicial em desktop e celular;
- mesma estrutura para login, cadastro, solicitacao e primeiro admin.

### Painel do cliente

- metricas compactas;
- novo orcamento como acao primaria;
- progresso em quatro etapas;
- linha do tempo no detalhe do orcamento;
- pagamentos Pix com estados e orientacoes claras.

### Painel administrativo

- navegacao lateral com logo oficial;
- dashboard com indicadores por cor funcional;
- tabelas com cabecalho discreto e hover dourado;
- agenda com filtros responsivos;
- formularios e modais usando os componentes globais.

## PWA

O manifesto usa:

```txt
name: Grupo Dvanera
short_name: Dvanera
theme_color: #050505
background_color: #050505
```

O cache atual e `grupo-dvanera-v5`. Sempre altere o numero do cache quando trocar assets criticos, icones ou shell principal.

## Acessibilidade e responsividade

- foco de teclado global visivel em dourado;
- botoes de icone possuem `aria-label` e `title` quando necessario;
- contraste alto entre texto e superfice;
- animacoes sao desativadas com `prefers-reduced-motion`;
- tabelas usam rolagem horizontal controlada;
- home e autenticacao nao geram overflow horizontal;
- controles mantem pelo menos 44 px de altura;
- textos quebram ou truncam somente onde o contexto permanece compreensivel.

## Validacao visual

Em 9 de junho de 2026 foram validados:

- home em desktop;
- home em viewport de celular;
- login em desktop;
- login em viewport de celular;
- acesso ao primeiro admin;
- ausencia de overflow horizontal;
- carregamento do logo, hero e assets;
- retorno para a tela inicial.
