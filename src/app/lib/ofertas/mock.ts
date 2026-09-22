export type Oferta = {
  id: number;
  nome: string;
  precoAntigo: number;
  precoAtual: number;
  desconto: number;
  imagem: string;
  link: string;
};

export const ofertas: Oferta[] = [
  {
    id: 1,
    nome: "Fone Bluetooth",
    precoAntigo: 199.9,
    precoAtual: 79.9,
    desconto: 60,
    imagem: "https://placehold.co/600x600?text=Fone+Bluetooth",
    link: "https://exemplo.com/fone",
  },
  {
    id: 2,
    nome: "Smartwatch Inteligente",
    precoAntigo: 299.9,
    precoAtual: 129.9,
    desconto: 57,
    imagem: "https://placehold.co/600x600?text=Smartwatch",
    link: "https://exemplo.com/smartwatch",
  },
  {
    id: 3,
    nome: "Teclado Mecânico",
    precoAntigo: 249.9,
    precoAtual: 149.9,
    desconto: 40,
    imagem: "https://placehold.co/600x600?text=Teclado",
    link: "https://exemplo.com/teclado",
  },
];