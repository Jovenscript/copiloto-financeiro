import { motion } from 'motion/react';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRecorrentes } from '../hooks/useRecorrentes';
import { useParcelamentos } from '../hooks/useParcelamentos';
import { gerarInsights, chaveMes } from '../core/calculos';
import Card from '../components/ui/Card';
import Evolucao from '../components/Evolucao';

export default function Insights() {
  const { lancamentos, carregando } = useLancamentos();
  const { recorrentes } = useRecorrentes();
  const { parcelamentos } = useParcelamentos();

  if (carregando) return <div className="space-y-3 animate-pulse"><div className="h-16 bg-surface rounded-2xl" /><div className="h-16 bg-surface rounded-2xl" /></div>;

  const insights = gerarInsights({ lancs: lancamentos, recorrentes, parcelamentos, ym: chaveMes() });

  return (
    <div className="space-y-3">
      <Evolucao />
      <p className="text-muted text-sm px-1 mb-2 pt-2">O que eu percebi olhando seus números:</p>
      {insights.map((i, idx) => (
        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
          <Card className={`flex items-start gap-3 ${i.tipo === 'alerta' ? 'border-negative/30' : ''}`}>
            <span className="text-2xl">{i.icone}</span>
            <p className="text-sm text-cream/90 pt-0.5">{i.texto}</p>
          </Card>
        </motion.div>
      ))}
      <p className="text-muted/60 text-xs px-1 pt-2">Quanto mais você lança, mais preciso eu fico. 📊</p>
    </div>
  );
}
