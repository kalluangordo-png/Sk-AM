import React, { useState } from "react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  ChefHat,
  MapPin,
  ArrowRight,
  Trash2,
  Receipt,
  CheckCircle,
  History,
  CheckSquare,
  Square,
  Search,
  Bike,
} from "lucide-react";

// --- LISTA DE ADICIONAIS (SÓ APARECE DENTRO DO LANCHE) ---
const EXTRAS_OPTIONS = [
  { name: "Batata Frita Individual (150g)", price: 10.0 },
  { name: "Batata SK (Cheddar e Bacon - 300g)", price: 18.0 },
  { name: "Adicional de Smash (Carne 70g + Queijo)", price: 6.0 },
  { name: "Pote Extra de Maionese Verde (30ml)", price: 2.0 },
];

export default function CustomerApp({
  onBack,
  menuItems,
  addOrder,
  bairros,
  appConfig,
  orders,
  myOrderIds,
  categories,
  themeStyle,
  textThemeStyle,
}) {
  const [view, setView] = useState("menu");
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    bairroIndex: "",
    payment: "Pix",
    change: "",
    obs: "",
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qtd, 0);
  const deliveryFee =
    form.bairroIndex !== "" && bairros[form.bairroIndex]
      ? parseFloat(bairros[form.bairroIndex].taxa)
      : 0;
  const finalTotal = cartTotal + deliveryFee;

  // Filtra os itens do menu principal (NÃO MOSTRA OS ADICIONAIS AQUI)
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "TODOS" || item.category === activeCategory;
    return matchesCategory && item.available;
  });

  const openItemModal = (item) => {
    setSelectedItem({ ...item, qtd: 1, obs: "", type: "solo" });
    setSelectedExtras([]);
  };

  const toggleExtra = (extra) => {
    if (selectedExtras.find((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const basePrice =
      selectedItem.type === "combo"
        ? selectedItem.priceCombo
        : selectedItem.priceSolo;
    const extrasPrice = selectedExtras.reduce((acc, ex) => acc + ex.price, 0);
    const unitPrice = basePrice + extrasPrice;

    let finalName =
      selectedItem.type === "combo"
        ? `COMBO ${selectedItem.name}`
        : selectedItem.name;
    const extrasString = selectedExtras.map((e) => `+ ${e.name}`).join(", ");

    let finalObs = selectedItem.obs;
    if (extrasString) {
      finalObs = finalObs
        ? `${finalObs} | EXTRAS: ${extrasString}`
        : `EXTRAS: ${extrasString}`;
    }

    const newItem = {
      ...selectedItem,
      name: finalName,
      price: unitPrice,
      obs: finalObs,
      id: Date.now(),
    };

    setCart([...cart, newItem]);
    setSelectedItem(null);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const handleFinishOrder = () => {
    if (!form.name.trim()) return alert("Por favor, digite seu nome.");
    if (!form.address.trim()) return alert("Digite seu endereço.");
    if (form.bairroIndex === "") return alert("Selecione seu bairro.");
    if (cart.length === 0) return alert("Seu carrinho está vazio.");

    const newOrder = {
      customer: form.name,
      phone: form.phone,
      address: `${form.address} - ${bairros[form.bairroIndex].nome}`,
      bairro: bairros[form.bairroIndex].nome,
      deliveryFee: deliveryFee,
      items: cart.map((i) => ({
        name: i.name,
        qtd: i.qtd,
        price: i.price,
        details: i.obs,
      })),
      total: finalTotal,
      payment: form.payment,
      change: form.payment === "Dinheiro" ? form.change : null,
      status: "preparing",
    };

    addOrder(newOrder);
    setCart([]);
    setView("history");
    alert("Pedido enviado com sucesso!");
  };

  const ItemCard = ({ item }) => (
    <div
      key={item.id}
      onClick={() => openItemModal(item)}
      className="bg-zinc-900 border border-white/5 p-3 rounded-2xl flex gap-4 items-center active:scale-95 transition cursor-pointer hover:border-white/20"
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 rounded-xl object-cover bg-black"
      />
      <div className="flex-1">
        <h3 className="font-bold text-white leading-tight mb-1">{item.name}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-yellow-500 font-black">
            R$ {item.priceSolo.toFixed(2)}
          </span>
          <div className="bg-zinc-800 p-1.5 rounded-lg text-white">
            <Plus size={16} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!selectedItem) return null;
    const isCombo = selectedItem.type === "combo";
    const basePrice = isCombo
      ? selectedItem.priceCombo
      : selectedItem.priceSolo;
    const extrasTotal = selectedExtras.reduce((acc, ex) => acc + ex.price, 0);
    const finalUnitPrice = basePrice + extrasTotal;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white z-20"
          >
            <X size={20} />
          </button>

          <div className="shrink-0 h-48 w-full relative">
            <img
              src={selectedItem.image}
              className="w-full h-full object-cover"
              alt={selectedItem.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
          </div>

          <div className="p-5 overflow-y-auto space-y-5 scrollbar-hide">
            <div>
              <h3 className="text-2xl font-black text-white leading-none">
                {selectedItem.name}
              </h3>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {selectedItem.priceCombo > 0 && (
              <div className="bg-black p-1 rounded-xl flex shrink-0">
                <button
                  onClick={() =>
                    setSelectedItem({ ...selectedItem, type: "solo" })
                  }
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                    !isCombo
                      ? "bg-zinc-800 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  SÓ O LANCHE (R$ {selectedItem.priceSolo.toFixed(2)})
                </button>
                <button
                  onClick={() =>
                    setSelectedItem({ ...selectedItem, type: "combo" })
                  }
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${
                    isCombo
                      ? "bg-yellow-500 text-black shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  COMBO (R$ {selectedItem.priceCombo.toFixed(2)})
                </button>
              </div>
            )}

            {/* AQUI ESTÃO OS ADICIONAIS (Só aparecem dentro do modal) */}
            <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
              <h4 className="text-yellow-500 font-bold text-xs uppercase mb-3 flex items-center gap-2">
                <Plus size={12} /> Turbinar seu pedido?
              </h4>
              <div className="space-y-2">
                {EXTRAS_OPTIONS.map((extra, idx) => {
                  const isSelected = selectedExtras.some(
                    (e) => e.name === extra.name
                  );
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition text-left ${
                        isSelected
                          ? "bg-green-500/10 border-green-500/50"
                          : "bg-black/40 border-white/5 hover:bg-black/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare size={18} className="text-green-500" />
                        ) : (
                          <Square size={18} className="text-zinc-600" />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-white" : "text-zinc-400"
                          }`}
                        >
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-yellow-500">
                        + R$ {extra.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                Observações
              </label>
              <textarea
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm mt-1 outline-none focus:border-yellow-500 transition h-20 resize-none"
                placeholder="Ex: Sem cebola..."
                value={selectedItem.obs}
                onChange={(e) =>
                  setSelectedItem({ ...selectedItem, obs: e.target.value })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-900 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-black rounded-xl border border-white/10 h-12">
                <button
                  onClick={() =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      qtd: Math.max(1, prev.qtd - 1),
                    }))
                  }
                  className="px-4 h-full text-zinc-400 hover:text-white"
                >
                  <Minus size={18} />
                </button>
                <span className="font-black text-white w-6 text-center">
                  {selectedItem.qtd}
                </span>
                <button
                  onClick={() =>
                    setSelectedItem((prev) => ({ ...prev, qtd: prev.qtd + 1 }))
                  }
                  className="px-4 h-full text-zinc-400 hover:text-white"
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                onClick={addToCart}
                className="flex-1 h-12 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl flex justify-between px-4 items-center shadow-lg active:scale-95 transition"
              >
                <span>ADICIONAR</span>
                <span>R$ {(finalUnitPrice * selectedItem.qtd).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view === "history") {
    const myHistory = orders.filter((o) => myOrderIds.includes(o.id));
    return (
      <div className="min-h-screen bg-zinc-950 pb-20 p-4">
        <header className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={() => setView("menu")}
            className="bg-zinc-900 p-2 rounded-full text-white border border-white/10"
          >
            <ArrowRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white">Meus Pedidos</h1>
        </header>
        {myHistory.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Receipt size={64} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400">Você ainda não fez pedidos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myHistory.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-900 border border-white/5 rounded-2xl p-4 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl ${
                    order.status === "ready"
                      ? "bg-yellow-500 text-black"
                      : order.status === "delivering"
                      ? "bg-blue-500 text-white"
                      : order.status === "delivered"
                      ? "bg-green-500 text-white"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {order.status === "preparing" && "Em Preparo"}{" "}
                  {order.status === "ready" && "Saiu p/ Entrega"}{" "}
                  {order.status === "delivering" && "Motoboy a Caminho"}{" "}
                  {order.status === "delivered" && "Entregue"}
                </div>
                <div className="text-xs text-zinc-500 mb-2">
                  #{order.id.split("-")[1]} •{" "}
                  {new Date(order.timestamp).toLocaleDateString()}
                </div>
                <div className="space-y-1 mb-3">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="text-sm text-zinc-300">
                      <span className="font-bold text-white">{i.qtd}x</span>{" "}
                      {i.name}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Total Pago</span>
                  <span className="font-black text-white">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "checkout") {
    return (
      <div className="min-h-screen bg-zinc-950 pb-20 p-4 animate-in slide-in-from-right">
        <header className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={() => setView("cart")}
            className="bg-zinc-900 p-2 rounded-full text-white border border-white/10"
          >
            <ArrowRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white">Finalizar Pedido</h1>
        </header>
        <div className="space-y-4">
          <section className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-yellow-500 font-bold text-xs uppercase mb-3 flex items-center gap-2">
              <ChefHat size={14} /> Seus Dados
            </h3>
            <input
              placeholder="Seu Nome"
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white mb-2 outline-none focus:border-yellow-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Telefone / WhatsApp"
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-yellow-500"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </section>
          <section className="bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-blue-500 font-bold text-xs uppercase mb-3 flex items-center gap-2">
              <MapPin size={14} /> Entrega
            </h3>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white mb-2 outline-none"
              value={form.bairroIndex}
              onChange={(e) =>
                setForm({ ...form, bairroIndex: e.target.value })
              }
            >
              <option value="">Selecione o Bairro...</option>
              {bairros.map((b, idx) => (
                <option key={idx} value={idx}>
                  {b.nome} (+ R$ {b.taxa.toFixed(2)})
                </option>
              ))}
            </select>
            <input
              placeholder="Rua, Número e Complemento"
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </section>
          <section className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
            <h3 className="text-green-500 font-bold text-xs uppercase mb-3 flex items-center gap-2">
              <Receipt size={14} /> Pagamento
            </h3>
            <div className="flex gap-2 mb-3">
              {["Pix", "Cartão", "Dinheiro"].map((method) => (
                <button
                  key={method}
                  onClick={() => setForm({ ...form, payment: method })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    form.payment === method
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-black border-white/10 text-zinc-400"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {form.payment === "Dinheiro" && (
              <input
                type="number"
                placeholder="Troco para quanto? (Ex: 50)"
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-green-500"
                value={form.change}
                onChange={(e) => setForm({ ...form, change: e.target.value })}
              />
            )}
          </section>
          <div className="bg-zinc-800 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Subtotal</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Entrega</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-black text-xl pt-2 border-t border-white/10">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleFinishOrder}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(22,163,74,0.4)] transition active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle /> CONFIRMAR PEDIDO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-white font-sans relative">
      {renderModal()}

      {/* HEADER STICKY COM LOGO LIMPA E NÚCLEO VERDE */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 pb-2">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter leading-none">
                <span className="text-yellow-500">SK</span> BURGERS
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-500">
                  Núcleo 16
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("history")}
              className="bg-zinc-800 p-3 rounded-xl relative hover:bg-zinc-700 transition"
            >
              <History size={20} className="text-zinc-400" />
            </button>
            <button
              onClick={onBack}
              className="bg-zinc-800 p-3 rounded-xl text-red-500 font-bold text-xs hover:bg-zinc-700 transition"
            >
              SAIR
            </button>
          </div>
        </div>

        <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {["TODOS", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 border border-white/5 hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* BANNER */}
      <div className="px-4 pt-4 animate-in slide-in-from-top-5">
        <div className="relative h-44 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
          <img
            src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt="Banner Burger"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
          <div className="absolute inset-0 p-6 flex flex-col justify-center items-start">
            <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded mb-2 shadow-lg tracking-widest">
              PROMOÇÃO
            </span>
            <h3
              className="text-4xl font-black text-white leading-none italic tracking-tighter mb-2"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              ENTREGA <br />
              <span className="text-yellow-500">GRÁTIS</span>
            </h3>
            <p className="text-zinc-300 text-xs font-bold mt-1 max-w-[180px] leading-tight drop-shadow-md">
              Até 3km em pedidos acima de R$ 35,00
            </p>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS (ORGANIZADA POR SEÇÕES) */}
      <div className="pt-4 px-4 pb-10">
        {activeCategory === "TODOS" ? (
          categories.map((cat) => {
            const itemsInCat = menuItems.filter(
              (i) => i.category === cat && i.available
            );
            if (itemsInCat.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-yellow-500 font-black text-lg mb-3 border-l-4 border-yellow-500 pl-3 flex items-center tracking-wide">
                  {cat}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                  {itemsInCat.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {filteredMenu.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
            {filteredMenu.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm col-span-full">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom-4 pointer-events-none flex justify-center">
          <button
            onClick={() => setView("cart")}
            className="w-full max-w-[400px] bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center font-bold hover:bg-green-500 transition pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <span className="bg-black/20 w-8 h-8 flex items-center justify-center rounded-full text-sm">
                {cart.reduce((a, b) => a + b.qtd, 0)}
              </span>
              <span>Ver Carrinho</span>
            </div>
            <span className="font-black text-lg">
              R$ {cartTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
