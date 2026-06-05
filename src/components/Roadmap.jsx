import Card from './ui/Card';

const FASES = [
  { n: 1, titulo: 'Reorganização', status: 'feito',
    itens: ['App dividido em 5 áreas: Início, Finanças, Agenda, IA, Perfil'] },
  { n: 2, titulo: 'Recursos profissionais', status: 'andamento',
    itens: ['✅ Anti-esquecimento (Pago / Adiar / Ignorar)', '✅ Cartão de crédito (fatura por categoria)', '⏳ Onboarding guiado', '⏳ Backup e exportar dados'] },
  { n: 3, titulo: 'IA Assistente', status: 'proximo',
    itens: ['Conversar com o app sobre suas finanças', 'Precisa de chave de API'] },
  { n: 4, titulo: 'App de celular (Capacitor)', status: 'futuro',
    itens: ['Notificação nativa + vibração', 'Offline + ícone na tela inicial', 'Preparar pras lojas'] },
  { n: 5, titulo: 'Polish & 3D', status: 'futuro',
    itens: ['Animações caprichadas', 'Cofrinho 3D 🐷'] },
];

const ESTILO = {
  feito:     { cor: 'text-positive', badge: '✅ Concluída',    anel: 'border-positive/50' },
  andamento: { cor: 'text-accent',   badge: '🔨 Em andamento', anel: 'border-accent/60' },
  proximo:   { cor: 'text-cream',    badge: '⏳ A seguir',      anel: 'border-line' },
  futuro:    { cor: 'text-muted',    badge: '🔭 Futuro',       anel: 'border-line' },
};

export default function Roadmap() {
  return (
    <Card>
      <p className="font-num text-lg mb-1">🗺️ Roadmap do app</p>
      <p className="text-muted text-xs mb-4">onde estamos e o que vem por aí</p>
      <div className="space-y-3">
        {FASES.map((f) => {
          const e = ESTILO[f.status];
          return (
            <div key={f.n} className={`border-l-2 ${e.anel} pl-3 py-0.5`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`font-medium text-sm ${e.cor}`}>Fase {f.n} · {f.titulo}</p>
                <span className="text-[0.62rem] text-muted whitespace-nowrap">{e.badge}</span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {f.itens.map((i, idx) => <li key={idx} className="text-muted text-xs">{i}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
