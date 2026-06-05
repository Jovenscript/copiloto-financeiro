import Card from '../components/ui/Card';

const EXEMPLOS = [
  'Onde estou gastando mais?',
  'O que posso cortar pra acelerar o casamento?',
  'Quanto preciso guardar por mês pra bater minha meta?',
  'O que mudou em relação ao mês passado?',
];

export default function IA() {
  return (
    <div className="space-y-5">
      <Card className="text-center py-8">
        <div className="text-5xl mb-3">🤖</div>
        <p className="font-num text-xl mb-2">Assistente em construção</p>
        <p className="text-muted text-sm">Em breve você conversa com o app sobre suas finanças — e ele usa todos os seus dados pra responder.</p>
      </Card>
      <Card>
        <p className="text-sm mb-3 text-muted">Perguntas que ele vai responder:</p>
        <div className="space-y-2">
          {EXEMPLOS.map((e, i) => (
            <div key={i} className="bg-surface-2 rounded-xl px-3 py-2.5 text-sm">💬 {e}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
