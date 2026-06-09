import { useState } from 'react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useEnvelopes } from '../hooks/useEnvelopes';
import { useCompromissos } from '../hooks/useCompromissos';
import { useCartoes } from '../hooks/useCartoes';
import { useFornecedores } from '../hooks/useFornecedores';
import { useConvidados } from '../hooks/useConvidados';
import Card from './ui/Card';

export default function Backup() {
  const lanc = useLancamentos();
  const rec = useRecorrentes();
  const parc = useParcelamentos();
  const cof = useCofres();
  const env = useEnvelopes();
  const comp = useCompromissos();
  const cart = useCartoes();
  const forn = useFornecedores();
  const conv = useConvidados();
  const [msg, setMsg] = useState('');
  const [importando, setImportando] = useState(false);
  const [resetando, setResetando] = useState(false);

  // Colecoes de Backup (export/import) — sem fornecedores/convidados (são por meta)
  const colecoes = {
    lancamentos: lanc.lancamentos, recorrentes: rec.recorrentes, parcelamentos: parc.parcelamentos,
    cofres: cof.cofres, envelopes: env.envelopes, compromissos: comp.compromissos, cartoes: cart.cartoes,
  };
  const addFns = {
    lancamentos: lanc.adicionar, recorrentes: rec.adicionar, parcelamentos: parc.adicionar,
    cofres: cof.adicionar, envelopes: env.adicionar, compromissos: comp.adicionar, cartoes: cart.adicionar,
  };

  // Para reset — inclui TUDO (fornecedores e convidados também)
  const tudoParaResetar = [
    { nome: 'lançamentos', itens: lanc.lancamentos, remover: lanc.remover },
    { nome: 'recorrentes', itens: rec.recorrentes, remover: rec.remover },
    { nome: 'parcelamentos', itens: parc.parcelamentos, remover: parc.remover },
    { nome: 'cofres', itens: cof.cofres, remover: cof.remover },
    { nome: 'envelopes', itens: env.envelopes, remover: env.remover },
    { nome: 'compromissos', itens: comp.compromissos, remover: comp.remover },
    { nome: 'cartões', itens: cart.cartoes, remover: cart.remover },
    { nome: 'fornecedores', itens: forn.fornecedores, remover: forn.remover },
    { nome: 'convidados', itens: conv.convidados, remover: conv.remover },
  ];

  function exportar() {
    const dados = {};
    for (const k in colecoes) dados[k] = (colecoes[k] || []).map(({ id, ...resto }) => resto);
    const conteudo = JSON.stringify({ app: 'copiloto-financeiro', versao: 1, exportadoEm: new Date().toISOString(), dados }, null, 2);
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `copiloto-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    const total = Object.values(dados).reduce((s, arr) => s + arr.length, 0);
    setMsg(`✅ Backup baixado (${total} itens).`);
  }

  async function importar(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('Isso vai ADICIONAR os dados do arquivo aos seus dados atuais. Continuar?')) { e.target.value = ''; return; }
    setImportando(true); setMsg('');
    try {
      const json = JSON.parse(await file.text());
      const dados = json.dados || {};
      let total = 0;
      for (const k in addFns) {
        for (const item of (dados[k] || [])) { await addFns[k](item); total++; }
      }
      setMsg(`✅ Importados ${total} itens.`);
    } catch (err) {
      setMsg('❌ Arquivo inválido. É um backup .json do Copiloto?');
    } finally {
      setImportando(false); e.target.value = '';
    }
  }

  async function resetar() {
    const total = tudoParaResetar.reduce((s, g) => s + (g.itens?.length || 0), 0);
    if (total === 0) { setMsg('Já está vazio — nada pra apagar.'); return; }
    if (!window.confirm(`⚠ Vai apagar TODOS os ${total} itens (lançamentos, recorrentes, cofres, fornecedores, convidados, tudo).\n\nIsso NÃO TEM VOLTA.\n\nContinuar?`)) return;
    if (!window.confirm(`Tem certeza MESMO? Última chance.`)) return;
    setResetando(true); setMsg('');
    let apagados = 0;
    try {
      for (const grupo of tudoParaResetar) {
        for (const item of (grupo.itens || [])) {
          try { await grupo.remover(item.id); apagados++; } catch (e) { /* ignora item-a-item */ }
        }
      }
      setMsg(`✅ Reset concluído — ${apagados} itens apagados. Pode importar de novo.`);
    } catch (err) {
      setMsg(`❌ Reset falhou: ${err.message}`);
    } finally {
      setResetando(false);
    }
  }

  const totalAtual = tudoParaResetar.reduce((s, g) => s + (g.itens?.length || 0), 0);

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-num text-lg">💾 Backup</p>
        <p className="text-muted text-xs">guarde, restaure ou resete seus dados ({totalAtual} itens hoje)</p>
      </div>
      <button onClick={exportar} className="w-full bg-surface-2 border border-line rounded-xl py-2.5 text-sm hover:border-accent transition">⬇️ Exportar meus dados (.json)</button>
      <label className="block w-full text-center bg-surface-2 border border-line rounded-xl py-2.5 text-sm cursor-pointer hover:border-accent transition">
        {importando ? 'Importando...' : '⬆️ Importar de um arquivo'}
        <input type="file" accept=".json,application/json" className="hidden" onChange={importar} disabled={importando} />
      </label>

      <div className="pt-2 border-t border-line">
        <button
          onClick={resetar}
          disabled={resetando || totalAtual === 0}
          className="w-full bg-negative/15 text-negative border border-negative/30 rounded-xl py-2.5 text-sm hover:bg-negative/25 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {resetando ? 'Apagando...' : `💣 Resetar tudo (apaga ${totalAtual} itens)`}
        </button>
        <p className="text-muted text-[0.65rem] mt-1.5 px-1">útil pra testar do zero. Não tem volta — exporte antes se quiser segurança.</p>
      </div>

      {msg && <p className="text-xs text-muted pt-1">{msg}</p>}
    </Card>
  );
}
