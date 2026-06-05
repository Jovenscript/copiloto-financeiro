import { useState } from 'react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { useCofres } from '../hooks/useCofres';
import { useEnvelopes } from '../hooks/useEnvelopes';
import { useCompromissos } from '../hooks/useCompromissos';
import { useCartoes } from '../hooks/useCartoes';
import Card from './ui/Card';

export default function Backup() {
  const lanc = useLancamentos();
  const rec = useRecorrentes();
  const parc = useParcelamentos();
  const cof = useCofres();
  const env = useEnvelopes();
  const comp = useCompromissos();
  const cart = useCartoes();
  const [msg, setMsg] = useState('');
  const [importando, setImportando] = useState(false);

  const colecoes = {
    lancamentos: lanc.lancamentos, recorrentes: rec.recorrentes, parcelamentos: parc.parcelamentos,
    cofres: cof.cofres, envelopes: env.envelopes, compromissos: comp.compromissos, cartoes: cart.cartoes,
  };
  const addFns = {
    lancamentos: lanc.adicionar, recorrentes: rec.adicionar, parcelamentos: parc.adicionar,
    cofres: cof.adicionar, envelopes: env.adicionar, compromissos: comp.adicionar, cartoes: cart.adicionar,
  };

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

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-num text-lg">💾 Backup</p>
        <p className="text-muted text-xs">guarde ou restaure todos os seus dados</p>
      </div>
      <button onClick={exportar} className="w-full bg-surface-2 border border-line rounded-xl py-2.5 text-sm hover:border-accent transition">⬇️ Exportar meus dados (.json)</button>
      <label className="block w-full text-center bg-surface-2 border border-line rounded-xl py-2.5 text-sm cursor-pointer hover:border-accent transition">
        {importando ? 'Importando...' : '⬆️ Importar de um arquivo'}
        <input type="file" accept=".json,application/json" className="hidden" onChange={importar} disabled={importando} />
      </label>
      {msg && <p className="text-xs text-muted pt-1">{msg}</p>}
    </Card>
  );
}
