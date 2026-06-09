// Lista padrão dos itens do casamento (extraída do controle atual do Marlon).
// Carregada pelo botão "Carregar lista padrão" dentro do Ambiente do Casamento.
// Os 2 "aportes" do controle antigo (valores investidos R$22k + pais Caroline R$10k)
// NÃO entram como fornecedores — já estão refletidos no cofre.guardado = R$32.000.

export const FORNECEDORES_CASAMENTO_PADRAO = [
  { nome: 'DJ',                       categoria: 'Som / Música',   valorTotal: 3600,  valorPago: 3600 },
  { nome: 'Fotógrafo',                categoria: 'Fotografia',     valorTotal: 2890,  valorPago: 2890 },
  { nome: 'Comida (Nosso)',           categoria: 'Gastronomia',    valorTotal: 4025,  valorPago: 0 },
  { nome: 'Comida (Pais)',            categoria: 'Gastronomia',    valorTotal: 4025,  valorPago: 0 },
  { nome: 'Água (Nosso)',             categoria: 'Bebidas',        valorTotal: 825,   valorPago: 0 },
  { nome: 'Água (Pais)',              categoria: 'Bebidas',        valorTotal: 825,   valorPago: 0 },
  { nome: 'Refrigerante (Nosso)',     categoria: 'Bebidas',        valorTotal: 1155,  valorPago: 0 },
  { nome: 'Refrigerante (Pais)',      categoria: 'Bebidas',        valorTotal: 1155,  valorPago: 0 },
  { nome: 'Chopp (Nosso)',            categoria: 'Bebidas',        valorTotal: 880,   valorPago: 0 },
  { nome: 'Chopp (Pais)',             categoria: 'Bebidas',        valorTotal: 880,   valorPago: 0 },
  { nome: 'Cerimonialista',           categoria: 'Cerimonialista', valorTotal: 2400,  valorPago: 300 },
  { nome: 'Decoradora',               categoria: 'Decoração',      valorTotal: 5050,  valorPago: 505 },
  { nome: 'Maquiagem / Cabelo',       categoria: 'Beleza',         valorTotal: 1550,  valorPago: 465 },
  { nome: 'Igreja',                   categoria: 'Cerimônia',      valorTotal: 1518,  valorPago: 759 },
  { nome: 'Garçom',                   categoria: 'Equipe',         valorTotal: 1080,  valorPago: 0 },
  { nome: 'Zeladora',                 categoria: 'Equipe',         valorTotal: 350,   valorPago: 0 },
  { nome: 'Café',                     categoria: 'Gastronomia',    valorTotal: 350,   valorPago: 0 },
  { nome: 'E-cad',                    categoria: 'Outros',         valorTotal: 350,   valorPago: 0 },
  { nome: 'Vestido e terno',          categoria: 'Trajes',         valorTotal: 3800,  valorPago: 1560 },
  { nome: 'Músicos',                  categoria: 'Som / Música',   valorTotal: 1500,  valorPago: 750 },
  { nome: 'Docinhos e bolo',          categoria: 'Confeitaria',    valorTotal: 2000,  valorPago: 600 },
];

// TOTAL: R$ 40.208 previsto · R$ 11.429 pago · R$ 28.779 a pagar
// Cobertos pelo guardado de R$ 32.000 no cofre (sobram ~R$ 3.221)
