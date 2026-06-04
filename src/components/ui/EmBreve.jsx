import Card from './Card';

// Placeholder das áreas que vêm nas próximas fases. Mostra o que
// virá (não fica uma tela vazia sem sentido).
export default function EmBreve({ icone, fase, titulo, itens }) {
  return (
    <div className="space-y-4">
      <Card className="text-center py-10">
        <div className="text-4xl mb-3">{icone}</div>
        <p className="font-num text-2xl mb-1">{titulo}</p>
        <p className="text-accent text-xs uppercase tracking-[0.2em]">{fase}</p>
      </Card>
      <Card>
        <p className="text-muted text-sm mb-3">O que vai morar aqui:</p>
        <ul className="space-y-2">
          {itens.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-cream/90">
              <span className="text-accent">›</span> {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
