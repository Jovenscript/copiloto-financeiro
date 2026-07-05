// ============================================================
// core/schema.js — A FONTE ÚNICA DA VERDADE
// Categorias + fábricas de todas as entidades, num lugar só.
// ============================================================

// tipo: receita | essencial | discricionario | meta
// (essencial/discricionario alimenta os Insights: discricionário é a alavanca)
export const CATEGORIAS = [
  { id: 'salario',      label: 'Salário',            icone: '💰', tipo: 'receita' },
  { id: 'extra',        label: 'Horas Extras / Bônus', icone: '💵', tipo: 'receita' },
  { id: 'outras_rec',   label: 'Outras Receitas',    icone: '🪙', tipo: 'receita' },

  { id: 'financiamento',label: 'Financiamento',      icone: '🏦', tipo: 'essencial' },
  { id: 'moradia',      label: 'Moradia / Condomínio', icone: '🏠', tipo: 'essencial' },
  { id: 'internet',     label: 'Internet / Telefone', icone: '📶', tipo: 'essencial' },
  { id: 'educacao',     label: 'Faculdade / Educação', icone: '📚', tipo: 'essencial' },
  { id: 'combustivel',  label: 'Combustível',        icone: '⛽', tipo: 'essencial' },
  { id: 'mercado',      label: 'Mercado',            icone: '🛒', tipo: 'essencial' },
  { id: 'saude',        label: 'Saúde / Farmácia',   icone: '💊', tipo: 'essencial' },

  { id: 'alimentacao',  label: 'Alimentação / Delivery', icone: '🍔', tipo: 'discricionario' },
  { id: 'transporte',   label: 'Uber / Transporte',  icone: '🚗', tipo: 'discricionario' },
  { id: 'lazer',        label: 'Lazer',              icone: '🎮', tipo: 'discricionario' },
  { id: 'compras',      label: 'Compras',            icone: '🛍️', tipo: 'discricionario' },
  { id: 'assinaturas',  label: 'Assinaturas',        icone: '📺', tipo: 'discricionario' },
  { id: 'outros',       label: 'Outros',             icone: '💸', tipo: 'discricionario' },
];

export const CAT_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));
export const categoriasDespesa = () => CATEGORIAS.filter((c) => c.tipo !== 'receita');
export const categoriasReceita = () => CATEGORIAS.filter((c) => c.tipo === 'receita');
export function infoCategoria(id) {
  return CAT_POR_ID[id] || { id, label: 'Outros', icone: '💸', tipo: 'discricionario' };
}

export function hojeISO() { return new Date().toISOString().slice(0, 10); }
const clampDia = (d) => Math.min(31, Math.max(1, Number(d) || 1));

// O que JÁ aconteceu
export function novoLancamento({ data, tipo, valor, categoria, descricao, pago, origem, cartaoId, orcamentoId } = {}) {
  const ehReceita = (tipo || '').toLowerCase() === 'receita';
  return {
    data: data || hojeISO(),
    tipo: ehReceita ? 'receita' : 'despesa',
    valor: Number(valor) || 0,
    categoria: categoria || (ehReceita ? 'salario' : 'outros'),
    descricao: (descricao || '').trim() || 'Sem descrição',
    pago: ehReceita ? true : !!pago,
    origem: origem || 'manual',
    cartaoId: cartaoId || null,
    orcamentoId: orcamentoId || null, // de qual orçamento esse gasto desconta (null = saldo geral)
    criadoEm: Date.now(),
  };
}

// O que se REPETE — definido uma vez
export function novoRecorrente({ descricao, valor, categoria, diaVencimento } = {}) {
  return {
    descricao: (descricao || '').trim() || 'Conta',
    valor: Number(valor) || 0,
    categoria: categoria || 'moradia',
    diaVencimento: clampDia(diaVencimento),
    ativo: true,
    ultimoPago: null, // 'YYYY-MM' do último mês pago
    adiadoAte: null,  // 'YYYY-MM-DD' — lembrar de novo nessa data
    ignoradoMes: null, // 'YYYY-MM' — pular alertas neste mês
    criadoEm: Date.now(),
  };
}

// Parcelamento / financiamento
export function novoParcelamento({ descricao, valorParcela, totalParcelas, parcelasPagas, diaVencimento, primeiraData, categoria, tipo } = {}) {
  return {
    descricao: (descricao || '').trim() || 'Parcelamento',
    valorParcela: Number(valorParcela) || 0,
    totalParcelas: Math.max(1, Number(totalParcelas) || 1),
    parcelasPagas: Number(parcelasPagas) || 0,
    diaVencimento: clampDia(diaVencimento),
    primeiraData: primeiraData || hojeISO(),
    categoria: categoria || 'compras',
    tipo: tipo || 'parcelamento', // parcelamento | financiamento
    ultimoPago: null,
    criadoEm: Date.now(),
  };
}

// Cofre — meta com dinheiro REAL
export function novoCofre({ nome, icone, alvo, guardado, aporteMensal, prazo, tipo, prioridade, devolver } = {}) {
  return {
    nome: (nome || '').trim() || 'Novo cofre',
    icone: icone || '🎯',
    alvo: Number(alvo) || 0,
    guardado: Number(guardado) || 0,
    aporteMensal: Number(aporteMensal) || 0,
    prazo: prazo || null,
    tipo: tipo || 'reserva', // evento | reserva | compra
    devolver: Number(devolver) || 0, // quanto desse guardado é dívida (ex: emprestado dos pais)
    prioridade: Number(prioridade) || 5,
    criadoEm: Date.now(),
  };
}

// Dados iniciais conhecidos do Marlon (doc mestre) — pro botão "carregar"
export const RECORRENTES_INICIAIS = [
  { descricao: 'Financiamento Apartamento', valor: 1546.00, categoria: 'financiamento', diaVencimento: 10 },
  { descricao: 'Condomínio',                valor: 390.00,  categoria: 'moradia',       diaVencimento: 10 },
  { descricao: 'Faculdade Carol',           valor: 131.24,  categoria: 'educacao',      diaVencimento: 5 },
  { descricao: 'Cotas Caixa',               valor: 57.06,   categoria: 'financiamento', diaVencimento: 10 },
  { descricao: 'Unifique (Internet)',       valor: 100.00,  categoria: 'internet',      diaVencimento: 15 },
  { descricao: 'Combustível (média)',       valor: 400.00,  categoria: 'combustivel',   diaVencimento: 5 },
];

export const COFRES_INICIAIS = [
  { nome: 'Casamento', icone: '💍', alvo: 30000, guardado: 0, tipo: 'evento', prioridade: 1 },
  { nome: 'Bebê',      icone: '👶', alvo: 15000, guardado: 0, tipo: 'evento', prioridade: 1 },
  { nome: 'Reserva de Emergência', icone: '🛡️', alvo: 20000, guardado: 0, tipo: 'reserva', prioridade: 2 },
];

// Mapeia a descrição da planilha -> categoria (por palavra-chave)
export function categoriaPorDescricao(desc, tipo) {
  const d = (desc || '').toLowerCase().trim();
  const ehReceita = (tipo || '').toLowerCase().startsWith('rece');
  if (ehReceita) {
    if (/sal[aá]rio/.test(d)) return 'salario';
    if (/extra|b[oô]nus|hora/.test(d)) return 'extra';
    return 'outras_rec';
  }
  const regras = [
    [/financ/, 'financiamento'],
    [/cotas?\s*caixa|^caixa/, 'financiamento'],
    [/condom[ií]nio|aluguel|moradia/, 'moradia'],
    [/celesc|energia|luz|[aá]gua|g[aá]s\b/, 'moradia'],
    [/unifique|claro|vivo|tim|^oi$|internet|telefone|celular/, 'internet'],
    [/faculdade|curso|educa|escola|mensalidade/, 'educacao'],
    [/combust[ií]vel|gasolina|etanol|posto/, 'combustivel'],
    [/mercado|supermercado|compras?/, 'mercado'],
    [/farm[aá]cia|sa[uú]de|rem[eé]dio|m[eé]dico/, 'saude'],
    [/uber|\b99\b|transporte|[oô]nibus|passagem/, 'transporte'],
    [/netflix|spotify|prime|disney|hbo|assinatura|streaming/, 'assinaturas'],
    [/ifood|delivery|restaurante|lanche|comida|alimenta/, 'alimentacao'],
    [/lazer|cinema|\bjogo|game/, 'lazer'],
  ];
  for (const [re, cat] of regras) if (re.test(d)) return cat;
  return 'outros';
}

// Compromisso NÃO-financeiro (médico, reunião...) — pra não esquecer nada
export function novoCompromisso({ titulo, data, hora, nota } = {}) {
  return {
    titulo: (titulo || '').trim() || 'Compromisso',
    data: data || hojeISO(),
    hora: hora || '',
    nota: (nota || '').trim(),
    criadoEm: Date.now(),
  };
}

// Envelope / Reserva Mensal — orçamento por categoria que abate com os gastos
export function novoEnvelope({ categoria, metaMensal } = {}) {
  return {
    categoria: categoria || 'mercado',
    metaMensal: Number(metaMensal) || 0,
    criadoEm: Date.now(),
  };
}

// Orçamento mensal — categoria criada pelo usuário com nome livre e limite mensal.
// Cada gasto lançado apontando pra ele consome o saldo aos poucos.
export function novoOrcamento({ nome, valorMensal, icone } = {}) {
  return {
    nome: (nome || '').trim() || 'Orçamento',
    valorMensal: Number(valorMensal) || 0,
    icone: (icone || '').trim() || '💰',
    criadoEm: Date.now(),
  };
}

// Cartão de crédito — meio de pagamento (os gastos viram lançamentos com cartaoId)
export function novoCartao({ nome, limite, diaFechamento, diaVencimento } = {}) {
  return {
    nome: (nome || '').trim() || 'Cartão',
    limite: Number(limite) || 0,
    diaFechamento: clampDia(diaFechamento || 1),
    diaVencimento: clampDia(diaVencimento || 10),
    criadoEm: Date.now(),
  };
}

// Fornecedor de uma meta (ex: buffet do casamento) — total, pago, falta
export function novoFornecedor({ metaId, nome, categoria, valorTotal, valorPago, nota } = {}) {
  return {
    metaId: metaId || '',
    nome: (nome || '').trim() || 'Fornecedor',
    categoria: (categoria || '').trim(),
    valorTotal: Number(valorTotal) || 0,
    valorPago: Number(valorPago) || 0,
    nota: (nota || '').trim(),
    criadoEm: Date.now(),
  };
}

// Convidado de uma meta (ex: casamento)
export function novoConvidado({ metaId, nome, grupo, confirmado } = {}) {
  return {
    metaId: metaId || '',
    nome: (nome || '').trim() || 'Convidado',
    grupo: (grupo || '').trim(),
    confirmado: !!confirmado,
    criadoEm: Date.now(),
  };
}
