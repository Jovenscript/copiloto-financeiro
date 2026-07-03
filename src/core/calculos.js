// ============================================================
// core/calculos.js — O CÉREBRO (funções puras, testáveis)
// Sem React, sem Firebase. Recebe dados, devolve respostas.
// ============================================================

export function chaveMes(d = new Date()) {
  const dt = typeof d === 'string' ? new Date(d + 'T12:00:00') : d;
  return dt.toISOString().slice(0, 7);
}
export function mesAnterior(ym) {
  const [a, m] = ym.split('-').map(Number);
  return chaveMes(new Date(a, m - 2, 1));
}
function stripTime(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
const doMes = (lancs, ym) => lancs.filter((l) => (l.data || '').startsWith(ym));

// dia do mês -> data ISO (respeita meses curtos)
export function dataVencimento(dia, ym = chaveMes()) {
  const [a, m] = ym.split('-').map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  const d = Math.min(Math.max(Number(dia) || 1, 1), ultimo);
  return `${ym}-${String(d).padStart(2, '0')}`;
}

export function totaisDoMes(lancs, ym) {
  let receitas = 0, despesas = 0;
  doMes(lancs, ym).forEach((l) => {
    const v = Number(l.valor) || 0;
    if (l.tipo === 'receita') receitas += v; else despesas += v;
  });
  return { receitas, despesas, saldo: receitas - despesas };
}

// Perguntas 1 e 2
export function gastosPorCategoria(lancs, ym) {
  const mapa = {};
  doMes(lancs, ym).filter((l) => l.tipo === 'despesa').forEach((l) => {
    mapa[l.categoria] = (mapa[l.categoria] || 0) + (Number(l.valor) || 0);
  });
  return Object.entries(mapa).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

// ---- Recorrentes & parcelamentos ----
export function recorrentesPendentes(recorrentes = [], ym = chaveMes()) {
  return recorrentes.filter((r) => r.ativo !== false && r.ultimoPago !== ym && r.ignoradoMes !== ym);
}
// Data de vencimento considerando adiamento (se adiado pra dentro do mês atual)
export function vencimentoEfetivo(r, ym = chaveMes()) {
  if (r.adiadoAte && r.adiadoAte.startsWith(ym)) return r.adiadoAte;
  return dataVencimento(r.diaVencimento, ym);
}
export function parcelamentosAtivos(parcelamentos = []) {
  return parcelamentos.filter((p) => (Number(p.parcelasPagas) || 0) < (Number(p.totalParcelas) || 0));
}
export function parcelasPendentesNoMes(parcelamentos = [], ym = chaveMes()) {
  return parcelamentosAtivos(parcelamentos).filter((p) => p.ultimoPago !== ym);
}
export function totalRecorrentes(recorrentes = []) {
  return recorrentes.filter((r) => r.ativo !== false).reduce((s, r) => s + (Number(r.valor) || 0), 0);
}
export function pesoParcelamentos(parcelamentos = []) {
  return parcelamentosAtivos(parcelamentos).reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);
}

// Perguntas 5: próximos vencimentos (N dias)
export function vencimentosProximos({ recorrentes = [], parcelamentos = [], dias = 7, hoje = new Date() }) {
  const ym = chaveMes(hoje);
  const h0 = stripTime(hoje);
  const limite = new Date(h0); limite.setDate(limite.getDate() + dias);
  const itens = [];
  recorrentesPendentes(recorrentes, ym).forEach((r) => {
    const data = vencimentoEfetivo(r, ym);
    const dv = new Date(data + 'T12:00:00');
    if (dv >= h0 && dv <= limite) itens.push({ id: r.id, tipo: 'recorrente', descricao: r.descricao, valor: Number(r.valor) || 0, categoria: r.categoria, data });
  });
  parcelasPendentesNoMes(parcelamentos, ym).forEach((p) => {
    const data = dataVencimento(p.diaVencimento, ym);
    const dv = new Date(data + 'T12:00:00');
    if (dv >= h0 && dv <= limite) itens.push({ id: p.id, tipo: 'parcela', descricao: `${p.descricao} (${(Number(p.parcelasPagas) || 0) + 1}/${p.totalParcelas})`, valor: Number(p.valorParcela) || 0, categoria: p.categoria, data });
  });
  return itens.sort((a, b) => a.data.localeCompare(b.data));
}

// Contas já vencidas e ainda não pagas — mesma forma de vencimentosProximos, olhando pra trás.
export function contasVencidas({ recorrentes = [], parcelamentos = [], hoje = new Date() }) {
  const ym = chaveMes(hoje);
  const h0 = stripTime(hoje);
  const itens = [];
  recorrentesPendentes(recorrentes, ym).forEach((r) => {
    const data = vencimentoEfetivo(r, ym);
    const dv = new Date(data + 'T12:00:00');
    if (dv < h0) itens.push({ id: r.id, tipo: 'recorrente', descricao: r.descricao, valor: Number(r.valor) || 0, categoria: r.categoria, data });
  });
  parcelasPendentesNoMes(parcelamentos, ym).forEach((p) => {
    const data = dataVencimento(p.diaVencimento, ym);
    const dv = new Date(data + 'T12:00:00');
    if (dv < h0) itens.push({ id: p.id, tipo: 'parcela', descricao: `${p.descricao} (${(Number(p.parcelasPagas) || 0) + 1}/${p.totalParcelas})`, valor: Number(p.valorParcela) || 0, categoria: p.categoria, data });
  });
  return itens.sort((a, b) => a.data.localeCompare(b.data));
}

// Pergunta 6: o que pago mês que vem
export function projecaoProximoMes({ recorrentes = [], parcelamentos = [] }) {
  const rec = totalRecorrentes(recorrentes);
  const parc = parcelamentosAtivos(parcelamentos).reduce((s, p) => {
    const restantes = (Number(p.totalParcelas) || 0) - (Number(p.parcelasPagas) || 0);
    return restantes > 0 ? s + (Number(p.valorParcela) || 0) : s;
  }, 0);
  return { recorrentes: rec, parcelas: parc, total: rec + parc };
}

// Panorama do mês — alimenta o dashboard inteiro (disponível x comprometido)
export function panoramaMes({ lancs = [], recorrentes = [], parcelamentos = [], cofres = [], ym = chaveMes() }) {
  const { receitas, despesas } = totaisDoMes(lancs, ym);
  const compRec = recorrentesPendentes(recorrentes, ym).reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const compParc = parcelasPendentesNoMes(parcelamentos, ym).reduce((s, p) => s + (Number(p.valorParcela) || 0), 0);
  const compCofres = cofres.reduce((s, c) => s + (Number(c.aporteMensal) || 0), 0);
  const comprometido = compRec + compParc + compCofres;
  const disponivel = receitas - despesas - comprometido;
  return {
    receitas, despesas, saldo: receitas - despesas,
    compRec, compParc, compCofres, comprometido, disponivel,
    saude: saudeFinanceira({ receitas, disponivel }),
  };
}

// Saúde financeira (indicador simples do doc)
export function saudeFinanceira({ receitas, disponivel }) {
  if (receitas <= 0) return { nivel: '—', cor: 'muted', ratio: 0 };
  const ratio = disponivel / receitas;
  if (disponivel < 0) return { nivel: 'Crítica', cor: 'negative', ratio };
  if (ratio < 0.1) return { nivel: 'Atenção', cor: 'negative', ratio };
  if (ratio < 0.25) return { nivel: 'Boa', cor: 'accent', ratio };
  return { nivel: 'Excelente', cor: 'positive', ratio };
}

// Pergunta 10
export function comparaMeses(lancs, ymAtual, ymAnt = mesAnterior(ymAtual)) {
  const atual = totaisDoMes(lancs, ymAtual);
  const anterior = totaisDoMes(lancs, ymAnt);
  const variacao = anterior.despesas === 0 ? null : ((atual.despesas - anterior.despesas) / anterior.despesas) * 100;
  return { despesaAtual: atual.despesas, despesaAnterior: anterior.despesas, saldoAtual: atual.saldo, saldoAnterior: anterior.saldo, variacaoDespesaPct: variacao, melhorou: atual.saldo >= anterior.saldo };
}

// ---- Cofres (Planejamento) ----
export function mesesAte(prazo, hoje = new Date()) {
  if (!prazo) return null;
  const p = new Date(prazo + 'T12:00:00');
  const meses = (p.getFullYear() - hoje.getFullYear()) * 12 + (p.getMonth() - hoje.getMonth());
  return Math.max(0, meses);
}
export function progressoCofre(c) {
  const alvo = Number(c.alvo) || 0, guardado = Number(c.guardado) || 0;
  const pct = alvo > 0 ? Math.min(100, (guardado / alvo) * 100) : 0;
  return { pct, falta: Math.max(0, alvo - guardado) };
}
export function aporteNecessario(c, hoje = new Date()) {
  const { falta } = progressoCofre(c);
  const meses = mesesAte(c.prazo, hoje);
  if (meses === null) return { mensal: null, meses: null, falta };
  if (meses <= 0) return { mensal: falta, meses: 0, falta };
  return { mensal: falta / meses, meses, falta };
}
// adiantado ou atrasado? compara aporte planejado com o necessário
export function statusCofre(c, hoje = new Date()) {
  const aporte = Number(c.aporteMensal) || 0;
  const need = aporteNecessario(c, hoje).mensal;
  if (!c.prazo || aporte <= 0 || need === null) return null;
  return { ok: aporte >= need, necessario: need, planejado: aporte };
}

// ---- Insights automáticos (Inteligência Financeira do doc) ----
export function gerarInsights({ lancs = [], recorrentes = [], parcelamentos = [], ym = chaveMes() }) {
  const out = [];
  const ymAnt = mesAnterior(ym);
  const catAtual = gastosPorCategoria(lancs, ym);
  const catAnt = Object.fromEntries(gastosPorCategoria(lancs, ymAnt).map((c) => [c.categoria, c.total]));

  // categoria crescendo
  catAtual.forEach((c) => {
    const ant = catAnt[c.categoria] || 0;
    if (ant > 0 && c.total > ant * 1.2) {
      const pct = Math.round(((c.total - ant) / ant) * 100);
      out.push({ tipo: 'alerta', icone: '📈', texto: `Você gastou ${pct}% a mais com ${c.categoria} que no mês passado.` });
    }
  });

  // maior gasto
  if (catAtual.length) {
    out.push({ tipo: 'info', icone: '🔎', texto: `Seu maior gasto este mês é ${catAtual[0].categoria}.` });
  }

  // peso do financiamento na renda
  const { receitas } = totaisDoMes(lancs, ym);
  const fin = recorrentes.filter((r) => r.categoria === 'financiamento').reduce((s, r) => s + (Number(r.valor) || 0), 0);
  if (receitas > 0 && fin > 0) {
    out.push({ tipo: 'info', icone: '🏦', texto: `Seu financiamento representa ${Math.round((fin / receitas) * 100)}% da sua renda.` });
  }

  // parcelamentos ativos
  const ativos = parcelamentosAtivos(parcelamentos);
  if (ativos.length) {
    out.push({ tipo: 'alerta', icone: '🧾', texto: `${ativos.length} parcelamento(s) ativo(s) pesando ${formatBRLnum(pesoParcelamentos(parcelamentos))}/mês.` });
  }

  // assinaturas
  const assin = recorrentes.filter((r) => r.categoria === 'assinaturas' && r.ativo !== false);
  if (assin.length) {
    const anual = assin.reduce((s, r) => s + (Number(r.valor) || 0), 0) * 12;
    out.push({ tipo: 'alerta', icone: '📺', texto: `Suas assinaturas somam ${formatBRLnum(anual)}/ano. Vale revisar.` });
  }

  if (!out.length) out.push({ tipo: 'info', icone: '✨', texto: 'Sem alertas este mês. Continue lançando pra eu ter mais o que analisar.' });
  return out;
}

function formatBRLnum(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Avisos (Central de Notificações) ----
export function gerarAvisos({ lancs = [], recorrentes = [], parcelamentos = [], cofres = [], compromissos = [], ym = chaveMes(), hoje = new Date() }) {
  const avisos = [];
  const v3 = vencimentosProximos({ recorrentes, parcelamentos, dias: 3, hoje });
  const v7 = vencimentosProximos({ recorrentes, parcelamentos, dias: 7, hoje });
  const ids3 = new Set(v3.map((x) => x.id));

  v3.forEach((v) => avisos.push({ urgencia: 'alta', icone: '⏰', titulo: `${v.descricao} vence já já`, texto: `Dia ${v.data.slice(8)} · ${formatBRLnum(v.valor)}` }));
  v7.filter((v) => !ids3.has(v.id)).forEach((v) => avisos.push({ urgencia: 'media', icone: '📅', titulo: v.descricao, texto: `Vence dia ${v.data.slice(8)} · ${formatBRLnum(v.valor)}` }));

  const pan = panoramaMes({ lancs, recorrentes, parcelamentos, cofres, ym });
  if (pan.disponivel < 0) avisos.push({ urgencia: 'alta', icone: '🚨', titulo: 'Você está no vermelho', texto: `Faltam ${formatBRLnum(Math.abs(pan.disponivel))} pros compromissos do mês.` });

  const comp = comparaMeses(lancs, ym);
  if (comp.variacaoDespesaPct !== null && comp.variacaoDespesaPct > 20) avisos.push({ urgencia: 'media', icone: '📈', titulo: 'Gastos subindo', texto: `${Math.round(comp.variacaoDespesaPct)}% a mais que mês passado.` });

  cofres.forEach((c) => {
    const s = statusCofre(c, hoje);
    if (s && !s.ok) avisos.push({ urgencia: 'media', icone: '🎯', titulo: `${c.nome} atrasado`, texto: `Guarde ${formatBRLnum(s.necessario)}/mês pra chegar no prazo.` });
  });

  compromissos.forEach((c) => {
    if (!c.data) return;
    const dias = Math.round((new Date(c.data + 'T12:00:00') - stripTime(hoje)) / 86400000);
    if (dias >= 0 && dias <= 3) {
      avisos.push({ urgencia: dias <= 1 ? 'alta' : 'media', icone: '📌', titulo: c.titulo, texto: dias === 0 ? 'É hoje!' : dias === 1 ? 'É amanhã' : `Em ${dias} dias` + (c.hora ? ` · ${c.hora}` : '') });
    }
  });

  const ordem = { alta: 0, media: 1, baixa: 2 };
  return avisos.sort((a, b) => ordem[a.urgencia] - ordem[b.urgencia]);
}

// ---- Evolução mensal (últimos N meses) ----
export function evolucaoMensal(lancs = [], n = 6, hoje = new Date()) {
  const meses = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ym = chaveMes(d);
    const t = totaisDoMes(lancs, ym);
    meses.push({ ym, label: ym.slice(5) + '/' + ym.slice(2, 4), receitas: t.receitas, despesas: t.despesas, saldo: t.saldo });
  }
  return meses;
}

// Envelopes (Reservas Mensais): quanto já gastou na categoria neste mês
export function statusEnvelope(envelope, lancs = [], ym = chaveMes()) {
  const gasto = lancs
    .filter((l) => l.tipo === 'despesa' && l.categoria === envelope.categoria && (l.data || '').startsWith(ym))
    .reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const meta = Number(envelope.metaMensal) || 0;
  const restante = meta - gasto;
  const pct = meta > 0 ? Math.min(100, (gasto / meta) * 100) : 0;
  return { gasto, meta, restante, pct, estourou: gasto > meta };
}

// Fatura do cartão no mês: soma os lançamentos com aquele cartaoId
export function faturaCartao(cartaoId, lancs = [], ym = chaveMes(), limite = 0) {
  const doCartao = lancs.filter((l) => l.cartaoId === cartaoId && (l.data || '').startsWith(ym) && l.tipo === 'despesa');
  const total = doCartao.reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const mapa = {};
  doCartao.forEach((l) => { mapa[l.categoria] = (mapa[l.categoria] || 0) + (Number(l.valor) || 0); });
  const porCategoria = Object.entries(mapa).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
  const pctLimite = limite > 0 ? Math.min(100, (total / limite) * 100) : 0;
  return { total, porCategoria, qtd: doCartao.length, pctLimite };
}

// Patrimônio: separa o que é REALMENTE seu do que é dívida (ex: dinheiro dos pais a devolver)
export function patrimonio(cofres = []) {
  const guardadoBruto = cofres.reduce((s, c) => s + (Number(c.guardado) || 0), 0);
  const aDevolver = cofres.reduce((s, c) => s + (Number(c.devolver) || 0), 0);
  const liquido = guardadoBruto - aDevolver;
  return { guardadoBruto, aDevolver, liquido };
}

// Extrato: lançamentos dos últimos N dias, ordenado por data desc
export function extratoPeriodo(lancs = [], dias = 60, hoje = new Date()) {
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() - dias);
  const limiteISO = limite.toISOString().slice(0, 10);
  return lancs
    .filter((l) => (l.data || '') >= limiteISO)
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
}
