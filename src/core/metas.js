// metas.js — fábricas dos itens de um "ambiente de meta" (casamento, bebê...)
// Isolado do schema.js pra ser 100% seguro de subir sem conflito.

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

export function novoConvidado({ metaId, nome, grupo, confirmado } = {}) {
  return {
    metaId: metaId || '',
    nome: (nome || '').trim() || 'Convidado',
    grupo: (grupo || '').trim(),
    confirmado: !!confirmado,
    criadoEm: Date.now(),
  };
}
