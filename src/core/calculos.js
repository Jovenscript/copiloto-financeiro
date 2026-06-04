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
  return recorrentes.filter((r) => r.ativo !== false && r.ultimoPago !== ym);
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
    const data = dataVencimento(r.diaVencimento, ym);
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
