// Gera um link que abre o Google Agenda com um evento MENSAL recorrente
// já preenchido (vencimento da conta). O Google cuida de notificar.
// Zero OAuth, zero config — só um link inteligente.

function fmtData(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
function brl(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function linkGoogleAgenda({ descricao, valor, diaVencimento }) {
  const hoje = new Date();
  const dia = Math.min(Math.max(Number(diaVencimento) || 1, 1), 28);
  // próximo vencimento (se já passou neste mês, pega o mês que vem)
  let venc = new Date(hoje.getFullYear(), hoje.getMonth(), dia, 9, 0, 0);
  if (venc < hoje) venc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia, 9, 0, 0);
  const fim = new Date(venc.getTime() + 30 * 60000);

  const text = encodeURIComponent(`💰 ${descricao} — ${brl(valor)}`);
  const details = encodeURIComponent('Conta a pagar · lembrete do Copiloto Financeiro');
  const dates = `${fmtData(venc)}/${fmtData(fim)}`;
  const recur = encodeURIComponent('RRULE:FREQ=MONTHLY'); // repete todo mês

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&recur=${recur}&details=${details}`;
}
