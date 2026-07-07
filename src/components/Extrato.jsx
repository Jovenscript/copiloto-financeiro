import { useState } from 'react';
import { useLancamentos } from '../hooks/useLancamentos';
import { extratoPeriodo } from '../core/calculos';
import { infoCategoria } from '../core/schema';
import Card from './ui/Card';
import { formatarBRL } from './ui/Money';
import { salvarECompartilhar } from '../native/arquivos';

export default function Extrato() {
  const { lancamentos } = useLancamentos();
  const [dias, setDias] = useState(60);
  const [filtro, setFiltro] = useState('todos'); // todos | receita | despesa

  let itens = extratoPeriodo(lancamentos, dias);
  if (filtro !== 'todos') itens = itens.filter((l) => l.tipo === filtro);

  const totalEntrou = itens.filter((l) => l.tipo === 'receita').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const totalSaiu = itens.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + (Number(l.valor) || 0), 0);

  async function baixarCSV() {
    const linhas = [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Pago']];
    itens.forEach((l) => {
      linhas.push([l.data, l.tipo, infoCategoria(l.categoria).label, l.descricao, String(l.valor).replace('.', ','), l.pago ? 'Sim' : 'Não']);
    });
    const csv = linhas.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    await salvarECompartilhar({
      nome: `extrato-${dias}dias-${new Date().toISOString().slice(0, 10)}.csv`,
      mime: 'text/csv',
      dados: '\ufeff' + csv,
    });
  }

  // PDF de verdade (jsPDF) — funciona no APK, diferente do window.print.
  async function baixarPDF() {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const W = pdf.internal.pageSize.getWidth();
    let y = 18;

    pdf.setFontSize(16); pdf.setFont(undefined, 'bold');
    pdf.text('Extrato — Savings Trick', 14, y); y += 7;
    pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(110);
    pdf.text(`Últimos ${dias} dias · gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, y); y += 6;
    pdf.setTextColor(0);
    pdf.text(`Entrou: ${formatarBRL(totalEntrou)}   ·   Saiu: ${formatarBRL(totalSaiu)}`, 14, y); y += 8;
    pdf.setDrawColor(200); pdf.line(14, y, W - 14, y); y += 6;

    itens.forEach((l) => {
      if (y > 278) { pdf.addPage(); y = 18; }
      const info = infoCategoria(l.categoria);
      const sinal = l.tipo === 'receita' ? '+' : '-';
      pdf.setFontSize(10); pdf.setFont(undefined, 'bold');
      pdf.text(`${l.data.slice(8,10)}/${l.data.slice(5,7)}`, 14, y);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${l.descricao}`.slice(0, 52), 34, y);
      pdf.text(info.label, 34, y + 4);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${sinal} ${formatarBRL(l.valor)}`, W - 14, y, { align: 'right' });
      pdf.setFont(undefined, 'normal');
      y += 10;
    });

    const base64 = pdf.output('datauristring').split(',')[1];
    await salvarECompartilhar({
      nome: `extrato-${dias}dias-${new Date().toISOString().slice(0, 10)}.pdf`,
      mime: 'application/pdf',
      dados: base64,
      base64: true,
    });
  }

  return (
    <Card className="space-y-4 print-area">
      <div className="flex items-center justify-between no-print">
        <p className="font-num text-xl font-semibold">Extrato</p>
        <div className="flex items-center gap-3">
          <button onClick={baixarPDF} className="text-accent text-sm">Baixar PDF</button>
          <button onClick={baixarCSV} className="text-muted text-sm">CSV</button>
        </div>
      </div>

      {/* Cabeçalho só visível na impressão/PDF */}
      <div className="hidden print:block mb-2">
        <p className="text-lg font-bold">Extrato — Savings Trick</p>
        <p className="text-sm text-muted">Últimos {dias} dias · gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap no-print">
        {[30, 60, 90].map((d) => (
          <button key={d} onClick={() => setDias(d)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${dias === d ? 'bg-accent text-cream' : 'bg-surface-2 text-muted'}`}>
            {d} dias
          </button>
        ))}
        <span className="w-px bg-line mx-1" />
        {[['todos', 'Tudo'], ['receita', 'Entradas'], ['despesa', 'Saídas']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${filtro === id ? 'bg-accent text-cream' : 'bg-surface-2 text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Totais do período */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-positive/10 rounded-lg px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase">Entrou</p>
          <p className="font-num text-lg text-positive">{formatarBRL(totalEntrou)}</p>
        </div>
        <div className="bg-negative/10 rounded-lg px-3 py-2">
          <p className="text-muted text-[0.65rem] uppercase">Saiu</p>
          <p className="font-num text-lg text-negative">{formatarBRL(totalSaiu)}</p>
        </div>
      </div>

      {/* Lista */}
      {itens.length === 0 ? (
        <p className="text-muted text-sm text-center py-4">Sem movimentação no período. Lance algo em "+" pra ver aqui.</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
          {itens.map((l) => {
            const info = infoCategoria(l.categoria);
            const ehReceita = l.tipo === 'receita';
            return (
              <div key={l.id} className="flex items-center justify-between text-sm border-b border-line/40 pb-1.5">
                <div className="min-w-0">
                  <p className="text-cream/90 truncate">{info.icone} {l.descricao}</p>
                  <p className="text-muted text-xs">{l.data.slice(8, 10)}/{l.data.slice(5, 7)} · {info.label}</p>
                </div>
                <span className={`font-num shrink-0 ml-2 ${ehReceita ? 'text-positive' : 'text-negative'}`}>
                  {ehReceita ? '+' : '−'}{formatarBRL(l.valor)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
