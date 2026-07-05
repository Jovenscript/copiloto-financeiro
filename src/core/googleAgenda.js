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
  const details = encodeURIComponent('Conta a pagar · lembrete do Savings Trick');
  const dates = `${fmtData(venc)}/${fmtData(fim)}`;
  const recur = encodeURIComponent('RRULE:FREQ=MONTHLY'); // repete todo mês

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&recur=${recur}&details=${details}`;
}

// Evento ÚNICO (compromisso datado, ex: médico). All-day se sem hora.
export function linkGoogleAgendaEvento({ titulo, data, hora, nota }) {
  if (!data) return '#';
  const [y, m, d] = data.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  let dates;
  if (hora) {
    const [hh, mm] = hora.split(':').map(Number);
    const s = new Date(y, m - 1, d, hh, mm);
    const e = new Date(s.getTime() + 60 * 60000);
    dates = `${fmtData(s)}/${fmtData(e)}`;
  } else {
    const nx = new Date(y, m - 1, d + 1);
    dates = `${y}${pad(m)}${pad(d)}/${nx.getFullYear()}${pad(nx.getMonth() + 1)}${pad(nx.getDate())}`;
  }
  const text = encodeURIComponent(titulo || 'Compromisso');
  const details = encodeURIComponent(nota || 'Compromisso · Savings Trick');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
}
