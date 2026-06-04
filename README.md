# ◑ Copiloto Financeiro

Copiloto de decisão financeira — não um app de "anotar gastos".
Stack: **React + Vite + Tailwind v4 + Firebase**. Mobile-first, pronto pra Capacitor (Android/iOS).

## 🚀 Rodar
```bash
npm install
npm run dev
```
Firebase: preencha `src/firebase.js`, ative E-mail/senha no Auth, crie o Firestore e cole `firestore.rules`.

## 🗂️ Estrutura
```
src/
├── config.js            # nome do app (renomear = aqui)
├── firebase.js          # conexão
├── core/
│   ├── schema.js        # FONTE DA VERDADE: categorias + fábricas + dados iniciais
│   └── calculos.js      # O CÉREBRO: funções puras testadas (panorama, vencimentos, cofres, insights)
├── services/            # CRUD Firestore: lancamentos, recorrentes, parcelamentos, cofres
├── hooks/               # tempo real (use*)
├── context/AuthContext.jsx
├── components/          # Layout, Login, RegistroRapido (FAB), ui/
└── pages/               # Inicio, Lancamentos, Compromissos, Planejamento, Insights
```

---

## 🛣️ Roadmap (mapeado do Documento Mestre)

### ✅ PRONTO (no ar agora)
- **Dashboard de decisão** — disponível x comprometido, entrou/saiu, próximos vencimentos, comparação com mês passado, gastos por categoria, indicador de Saúde Financeira
- **Agenda Financeira (Contas)** — recorrentes (define 1x, marca pago), parcelamentos/financiamentos agrupados, vencimentos 7 dias, projeção do próximo mês
- **Planejamento** — cofres reais (Casamento, Bebê, Reserva + custom): alvo, guardado, falta, quanto guardar/mês, "no caminho ou atrasado?"
- **Registro Rápido** — botão flutuante (+) em todas as telas
- **Insights automáticos** — categoria crescendo, maior gasto, % do financiamento na renda, parcelas ativas, assinaturas/ano
- **Dados iniciais** — botões pra carregar suas contas conhecidas e suas metas
- **Importação de planilha XLSX** — importa o orçamento do mês (Tipo/Descrição/Valor), categoriza sozinho, evita duplicar ao reimportar
- **Central de Avisos (🔔)** — alertas de vencimento, gastos subindo, vermelho, metas atrasadas + notificação do navegador (app aberto)
- **Import inteligente** — você define o dia de vencimento de cada conta; despesas viram recorrentes, receitas viram entrada do mês
- **Google Agenda** — botão que cria evento mensal recorrente no Google (ele notifica). Caminho esperto p/ lembretes, sem app nativo.
- **Evolução do saldo** — gráfico dos últimos 6 meses

### ▢ PRÓXIMO (web, mas preciso de você / mais trabalho)
- **Cartão de crédito** — meio de pagamento + análise por categoria (refino do modelo)
- **Relatórios** exportáveis

### ▢ DEPOIS (precisa de app nativo / IA / mais tempo)
- **Empacotar Android/iOS** — Capacitor (o código já está pronto pra isso)
- **Localização inteligente** (lembrete por GPS) — precisa de Capacitor + permissão de localização
- **Notificações adaptativas / push** — Capacitor + push + aprendizado de horário
- **Perfil comportamental** (aprende onde/quando você gasta) — coleta + análise ao longo do tempo
- **IA consultora** (análise em linguagem natural) — integra com a API da Anthropic. É uma fase própria, mas dá pra fazer.
- **Onboarding** (perguntas iniciais) + **Engajamento/pontuação** — fases de polish/gamificação

---

## 🎨 Nota de design
O doc pede **Roxo Neon**. Entreguei **Espresso Quente** (que você aprovou no deploy) porque, pra finanças, o quente passa mais confiança e cansa menos a vista. **Mas é sua escolha** — o tema inteiro são tokens em `src/index.css` (`@theme`). Trocar pra neon é mexer num arquivo só.
