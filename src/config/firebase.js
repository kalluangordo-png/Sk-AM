import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- SUAS CHAVES DO FIREBASE (JÁ CORRIGIDAS) ---
const firebaseConfig = {
  apiKey: "AIzaSyBTcBT1E42L9tLeIEXaJTLUO9-8KTYYyeE",
  authDomain: "sk-burgers.firebaseapp.com",
  projectId: "sk-burgers",
  storageBucket: "sk-burgers.firebasestorage.app",
  messagingSenderId: "730774889060",
  appId: "1:730774889060:web:d9be05097ff9dcc65b7571",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = "sk-burgers-app-v1"; // Identificador único para separar seus dados

// --- CONFIGURAÇÃO DA LOJA ---
export const INITIAL_CONFIG = {
  storeName: "SK BURGERS",
  openHour: 18,
  closeHour: 23,
  forceClose: false,
  themeColor: "#EAB308", // Amarelo SK
  address: "Rua 212 - Cidade Nova",
  pixKey: "92999999999", // EDITE AQUI SUA CHAVE PIX REAL
};

// --- CARDÁPIO COMPLETO (V14) ---
export const INITIAL_MENU = [
  // --- LINHA SMASH ---
  {
    id: "smash-01",
    name: "SK ORIGINAL",
    category: "LINHA SMASH",
    description:
      "O Clássico: Pão brioche macio, 1 smash de carne (70g), queijo derretido e Maionese Secreta SK. Simples e perfeito.",
    priceSolo: 16.9,
    priceCombo: 26.9,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    available: true,
    order: 1,
  },
  {
    id: "smash-02",
    name: "SK SALAD",
    category: "LINHA SMASH",
    description:
      "O Fresquinho: Pão brioche, 1 smash de carne (70g), queijo, alface americana crocante, tomate e cebola roxa.",
    priceSolo: 18.9,
    priceCombo: 28.9,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
    available: true,
    order: 2,
  },
  {
    id: "smash-03",
    name: "SK DOUBLE SMASH",
    category: "LINHA SMASH",
    description:
      "⭐ O Favorito: Pão brioche, 2 carnes smash (sabor em dobro!), dobro de queijo cheddar e bacon em cubos crocantes.",
    priceSolo: 22.9,
    priceCombo: 32.9,
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
    available: true,
    order: 3,
  },

  // --- LINHA PREMIUM ---
  {
    id: "prem-01",
    name: "O CABOQUINHO",
    category: "LINHA PREMIUM",
    description:
      "Sabor de Manaus 🍌: Pão brioche, carne alta 150g, queijo coalho tostado, fatias de banana pacovã frita e fio de melaço.",
    priceSolo: 29.9,
    priceCombo: 39.9,
    image:
      "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80",
    available: true,
    order: 4,
  },
  {
    id: "prem-02",
    name: "SK GORGON",
    category: "LINHA PREMIUM",
    description:
      "🧀 NOVIDADE: Pão brioche, carne alta 150g, Creme de Gorgonzola Artesanal e cebola roxa caramelizada.",
    priceSolo: 29.9,
    priceCombo: 39.9,
    image:
      "https://images.unsplash.com/photo-1586190848861-99c9519d2293?w=800&q=80",
    available: true,
    order: 5,
  },
  {
    id: "prem-03",
    name: "MONSTRO DA 212",
    category: "LINHA PREMIUM",
    description:
      "O Matador de Fome: Pão brioche, carne alta 150g, queijo cheddar, fatias de bacon, ovo frito, alface, tomate e molho especial.",
    priceSolo: 32.9,
    priceCombo: 42.9,
    image:
      "https://images.unsplash.com/photo-1617196019294-dcce4794333d?w=800&q=80",
    available: true,
    order: 6,
  },

  // --- BEBIDAS ---
  {
    id: "beb-01",
    name: "Coca-Cola Lata 350ml",
    category: "BEBIDAS",
    description: "Gelada",
    priceSolo: 6.0,
    priceCombo: 0,
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
    available: true,
    order: 7,
  },
  {
    id: "beb-02",
    name: "Guaraná Lata 350ml",
    category: "BEBIDAS",
    description: "Gelado",
    priceSolo: 6.0,
    priceCombo: 0,
    image:
      "https://images.unsplash.com/photo-1579630942078-100a2569effb?w=800&q=80",
    available: true,
    order: 8,
  },
];

export const INITIAL_BAIRROS = [
  { nome: "Cidade Nova", taxa: 0.0 },
  { nome: "Novo Aleixo", taxa: 5.0 },
  { nome: "Nova Cidade", taxa: 7.0 },
  { nome: "Centro", taxa: 10.0 },
];

export const INITIAL_MOTOBOYS = [
  { id: "moto1", name: "Marcos", login: "marcos" },
  { id: "moto2", name: "João", login: "joao" },
];

export const INITIAL_COUPONS = [
  { code: "SK10", discount: 10, type: "percent" },
  { code: "ENTREGA", discount: 5, type: "fixed" },
];
