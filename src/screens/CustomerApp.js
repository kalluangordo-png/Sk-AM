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
} from "lucide-react";

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
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  // --- ESTADOS DO FORMULÁRIO DE CHECKOUT ---
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    bairroIndex: "",
    payment: "Pix",
    change: "",
    obs: "",
  });

  // --- CALCULA TOTAIS ---
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qtd, 0);

  const deliveryFee =
    form.bairroIndex !== "" && bairros[form.bairroIndex]
      ? parseFloat(bairros[form.bairroIndex].taxa)
      : 0;

  const finalTotal = cartTotal + deliveryFee;

  // --- FILTRO DO MENU ---
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "TODOS" || item.category === activeCategory;
    return matchesCategory && item.available;
  });

  // --- FUNÇÕES DO CARRINHO ---
  const openItemModal = (item) => {
    setSelectedItem({ ...item, qtd: 1, obs: "", type: "solo" });
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const finalPrice =
      selectedItem.type === "combo"
        ? selectedItem.priceCombo
        : selectedItem.priceSolo;

    const finalName =
      selectedItem.type === "combo"
        ? `COMBO ${selectedItem.name}`
        : selectedItem.name;

    const newItem = {
      ...selectedItem,
      name: finalName,
      price: finalPrice,
      id: Date.now(),
    };

    setCart([...cart, newItem]);
    setSelectedItem(null);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  // --- FINALIZAR PEDIDO ---
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
    alert("Pedido enviado com sucesso! Acompanhe o status.");
  };

  // --- MODAL DE PRODUTO ---
  const renderModal = () => {
    if (!selectedItem) return null;
    const isCombo = selectedItem.type === "combo";
    const currentPrice = isCombo
      ? selectedItem.priceCombo
      : selectedItem.priceSolo;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white z-10"
          >
            <X size={20} />
          </button>

          <img
            src={selectedItem.image}
            className="w-full h-48 object-cover"
            alt={selectedItem.name}
          />

          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-2xl font-black text-white leading-none">
                {selectedItem.name}
              </h3>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {selectedItem.priceCombo > 0 && (
              <div className="bg-black p-1 rounded-xl flex">
                <button
                  onClick={() =>
                    setSelectedItem({ ...selectedItem, type: "solo" })
                  }
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    !isCombo ? "bg-zinc-800 text-white" : "text-zinc-500"
                  }`}
                >
                  SÓ O LANCHE (R$ {selectedItem.priceSolo.toFixed(2)})
                </button>
                <button
                  onClick={() =>
                    setSelectedItem({ ...selectedItem, type: "combo" })
                  }
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    isCombo ? "bg-yellow-500 text-black" : "text-zinc-500"
                  }`}
                >
                  COMBO (R$ {selectedItem.priceCombo.toFixed(2)})
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Alguma observação?
              </label>
              <textarea
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm mt-1 outline-none focus:border-yellow-500"
                rows="2"
                placeholder="Ex: Sem cebola, capricha no molho..."
                value={selectedItem.obs}
                onChange={(e) =>
                  setSelectedItem({ ...selectedItem, obs: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center bg-black rounded-xl border border-white/10">
                <button
                  onClick={() =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      qtd: Math.max(1, prev.qtd - 1),
                    }))
                  }
                  className="p-3 text-zinc-400 hover:text-white"
                >
                  <Minus size={18} />
                </button>
                <span className="font-black text-white w-8 text-center">
                  {selectedItem.qtd}
                </span>
                <button
                  onClick={() =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      qtd: prev.qtd + 1,
                    }))
                  }
                  className="p-3 text-zinc-400 hover:text-white"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={addToCart}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3.5 rounded-xl flex justify-between px-6 items-center shadow-lg active:scale-95 transition"
              >
                <span>ADICIONAR</span>
                <span>R$ {(currentPrice * selectedItem.qtd).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- TELA: HISTÓRICO ---
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
                  className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl
                  ${
                    order.status === "ready"
                      ? "bg-yellow-500 text-black"
                      : order.status === "delivering"
                      ? "bg-blue-500 text-white"
                      : order.status === "delivered"
                      ? "bg-green-500 text-white"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {order.status === "preparing" && "Em Preparo"}
                  {order.status === "ready" && "Saiu p/ Entrega"}
                  {order.status === "delivering" && "Motoboy a Caminho"}
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

  // --- TELA: CHECKOUT ---
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
          <section className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
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

          <section className="bg-zinc-900 p-4 rounded-2xl border border-white/5">
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

  // --- TELA: CARRINHO (CART) ---
  if (view === "cart") {
    return (
      <div className="min-h-screen bg-zinc-950 pb-20 p-4 animate-in slide-in-from-right">
        <header className="flex items-center gap-4 mb-6 pt-4">
          <button
            onClick={() => setView("menu")}
            className="bg-zinc-900 p-2 rounded-full text-white border border-white/10"
          >
            <ArrowRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white">Carrinho</h1>
        </header>

        {cart.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <ShoppingBag size={64} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-bold mb-6">
              Sua sacola está vazia.
            </p>
            <button
              onClick={() => setView("menu")}
              className="text-yellow-500 font-bold text-sm border border-yellow-500/30 px-6 py-2 rounded-full hover:bg-yellow-500/10"
            >
              VER CARDÁPIO
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-24">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {item.name}
                    </h4>
                    {item.obs && (
                      <p className="text-zinc-500 text-xs mt-1">
                        Obs: "{item.obs}"
                      </p>
                    )}
                    <p className="text-yellow-500 font-bold text-xs mt-2">
                      {item.qtd}x R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 p-2 hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400 font-bold">Total</span>
                <span className="text-2xl font-black text-white">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setView("checkout")}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg transition active:scale-95"
              >
                IR PARA PAGAMENTO
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- TELA: MENU (PADRÃO) ---
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-white font-sans relative">
      {renderModal()}

      {/* HEADER STICKY (GRUDENTO) - AQUI ESTÁ A CORREÇÃO! */}
      {/* Mudamos de 'fixed' para 'sticky'. Agora ele respeita a largura do container */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 pb-2">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Bem-vindo ao
            </h2>
            <h1
              className="text-xl font-black italic tracking-tighter"
              style={textThemeStyle}
            >
              {appConfig.storeName}
            </h1>
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

        {/* CATEGORIAS */}
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

      {/* LISTA DE PRODUTOS */}
      {/* Removido o 'pt-32' exagerado, agora usamos 'pt-4' pois o header é sticky e empurra o conteúdo */}
      <div className="pt-4 px-4 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
        {filteredMenu.map((item) => (
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
              <h3 className="font-bold text-white leading-tight mb-1">
                {item.name}
              </h3>
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
        ))}

        {filteredMenu.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm col-span-full">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}
      </div>

      {/* BOTÃO FLUTUANTE DO CARRINHO */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom-4 pointer-events-none flex justify-center">
          {/* Adicionei um wrapper para limitar a largura no PC também */}
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
