Com certeza! Um Banner Promocional bem bonito no topo é a melhor forma de avisar sobre promoções e deixar o app com cara de "iFood".

Vou adicionar um banner logo abaixo da barra de busca. Ele vai ter:

🖼️ Uma imagem de fundo apetitosa.

✨ Um efeito degradê elegante.

🔥 Uma chamada para ação (ex: "Oferta do Dia").

PASSO ÚNICO: Atualizar o App do Cliente
Vou te mandar o código COMPLETO do arquivo src/screens/CustomerApp.js já com o banner incluído. Assim você não corre risco de colar no lugar errado.

Abra src/screens/CustomerApp.js.

Apague tudo.

Copie e cole o código abaixo:

JavaScript

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  MapPin,
  CheckCircle,
  Bike,
  Package,
  Plus,
  X,
  Flame,
  Search,
  Gift,
  Home,
  List,
  User,
  ChevronRight,
  Star,
  Zap // Ícone novo para o banner
} from "lucide-react";

export default function CustomerApp({
  onBack,
  addOrder,
  menuItems,
  categories,
  showToast,
  bairros,
  appConfig,
  orders,
  myOrderIds,
  coupons,
  themeStyle,
  textThemeStyle,
}) {
  const [tab, setTab] = useState("menu");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [form, setForm] = useState(
    () =>
      JSON.parse(localStorage.getItem("sk_user_data")) || {
        name: "",
        street: "",
        number: "",
        reference: "",
        payment: "Pix",
        change: "",
        points: 0,
      }
  );
  
  const [selectedBairro, setSelectedBairro] = useState(bairros[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isCombo, setIsCombo] = useState(null);
  const [obs, setObs] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

  const isOpen =
    !appConfig.forceClose &&
    new Date().getHours() >= appConfig.openHour &&
    new Date().getHours() < appConfig.closeHour;

  // --- FILTROS ---
  const filteredMenu = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeCategory === "TODOS" && searchTerm === "") return true;
      const matchesCategory = activeCategory === "TODOS" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, activeCategory]);

  const myActiveOrders = useMemo(() => {
    return orders.filter((o) => myOrderIds.includes(o.id));
  }, [orders, myOrderIds]);

  useEffect(() => localStorage.setItem("sk_user_data", JSON.stringify(form)), [form]);

  // --- CONTROLE DO BOTÃO VOLTAR ---
  useEffect(() => {
    const handleBackButton = (event) => {
      if (selectedProduct) {
        setSelectedProduct(null);
      } else if (isCartOpen) {
        setIsCartOpen(false);
      } else if (tab !== "menu") {
        setTab("menu");
      }
    };
    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [selectedProduct, isCartOpen, tab]);

  const openWithHistory = (action) => {
    window.history.pushState(null, "", window.location.href);
    action();
  };

  const handleTabChange = (newTab) => {
      if (newTab !== tab) setTab(newTab);
  };

  // --- LOGICA CARRINHO ---
  const handleOptionChange = (groupName, item, type, price) => {
    setSelectedOptions((prev) => {
      const current = prev[groupName] || [];
      if (type === "radio") return { ...prev, [groupName]: [item] };
      if (type === "check") {
        const exists = current.find((x) => x.name === item.name);
        if (exists) return { ...prev, [groupName]: current.filter((x) => x.name !== item.name) };
        return { ...prev, [groupName]: [...current, { ...item, price }] };
      }
      return prev;
    });
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (selectedProduct.stock !== undefined && selectedProduct.stock <= 0) return alert("Produto Esgotado!");
    
    if (selectedProduct.options) {
      for (let opt of selectedProduct.options) {
        if (opt.required && (!selectedOptions[opt.name] || selectedOptions[opt.name].length === 0))
          return alert(`Selecione: ${opt.name}`);
      }
    }

    let price = selectedProduct.priceSolo;
    let name = selectedProduct.name;
    let desc = [];
    
    Object.keys(selectedOptions).forEach((key) => {
      selectedOptions[key].forEach((opt) => {
        desc.push(opt.name);
        if (opt.price) price += opt.price;
      });
    });

    if (isCombo) {
      price = selectedProduct.priceCombo || price;
      name = `COMBO ${name}`;
      desc.push("+ Batata + Refri");
    }
    if (obs) desc.push(`Obs: ${obs}`);
    
    setCart([...cart, { id: Date.now(), name, details: desc.join(", "), price, qtd: 1 }]);
    window.history.back(); 
    setTimeout(() => openWithHistory(() => setIsCartOpen(true)), 100);
    showToast("Adicionado!");
  };

  const total = cart.reduce((a, b) => a + b.price * b.qtd, 0) + (selectedBairro ? selectedBairro.taxa : 0) - discount;

  const send = () => {
    if (!form.name || !form.street || !form.number) return alert("Preencha o endereço!");
    if (!selectedBairro) return alert("Selecione seu bairro!");

    const pointsEarned = Math.floor(total);
    addOrder({
      customer: form.name,
      phone: appConfig.whatsapp,
      address: `${form.street}, ${form.number} - ${selectedBairro.nome} (${form.reference})`,
      total,
      payment: form.payment,
      status: "preparing",
      items: cart,
      assignedTo: null,
      deliveryFee: selectedBairro.taxa,
    });
    setForm((prev) => ({ ...prev, points: (prev.points || 0) + pointsEarned }));
    setCart([]);
    window.history.back();
    setTab("orders");
    
    const msg = `🍔 *PEDIDO SK* \n👤 ${form.name}\n📍 ${selectedBairro.nome}\n\n${cart.map((i) => `${i.qtd}x ${i.name}`).join("\n")}\n\n💰 TOTAL: R$ ${total.toFixed(2)}`;
    window.open(`https://wa.me/${appConfig.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // --- COMPONENTE DO CARD DE PRODUTO ---
  const ProductCard = ({ item }) => (
    <div 
      key={item.id} 
      onClick={() => openWithHistory(() => { setSelectedProduct(item); setSelectedOptions({}); setIsCombo(null); setObs(""); })}
      className={`relative flex flex-col bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden active:scale-[0.98] transition shadow-lg mb-6 ${!item.available || (item.stock <= 0) ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="h-44 w-full relative">
          <img src={item.image} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"></div>
          <div className="absolute bottom-3 left-4 right-4">
             <div className="flex items-center gap-1 text-yellow-500 mb-1">
                <Star size={12} fill="#EAB308" /> <span className="text-xs font-bold">{item.rating || "5.0"}</span>
             </div>
             <h3 className="font-black text-xl text-white leading-none shadow-black drop-shadow-md">{item.name}</h3>
          </div>
      </div>
      
      <div className="p-4 pt-2 flex justify-between items-end bg-zinc-900">
          <p className="text-xs text-zinc-400 line-clamp-2 w-2/3 leading-relaxed">{item.description}</p>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mt-2">
                <span className="font-black text-lg text-white">R$ {item.priceSolo.toFixed(2)}</span>
                <button className="bg-yellow-500 text-black p-1.5 rounded-full shadow-lg shadow-yellow-500/20">
                    <Plus size={18} strokeWidth={3} />
                </button>
             </div>
          </div>
      </div>
    </div>
  );

  const OrderStatus = ({ status }) => {
    const steps = {
      preparing: { label: "Cozinha", color: "text-orange-500", icon: Flame, percent: "33%" },
      ready: { label: "Pronto", color: "text-yellow-500", icon: Package, percent: "66%" },
      delivering: { label: "A Caminho", color: "text-blue-500", icon: Bike, percent: "80%" },
      delivered: { label: "Entregue", color: "text-green-500", icon: CheckCircle, percent: "100%" },
    };
    const current = steps[status] || steps["preparing"];
    const Icon = current.icon;
    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-bold ${current.color} flex items-center gap-1`}>
            <Icon size={12} /> {current.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${status === 'delivered' ? 'bg-green-500 w-full' : status === 'delivering' ? 'bg-blue-500 w-3/4' : status === 'ready' ? 'bg-yellow-500 w-1/2' : 'bg-orange-500 w-1/4'}`}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-950 min-h-screen pb-24 font-sans text-white selection:bg-yellow-500 selection:text-black">
      
      {/* HEADER GLASS */}
      <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-40 px-5 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3" onClick={onBack}>
           <div style={themeStyle} className="w-10 h-10 rounded-full flex items-center justify-center font-black text-black text-xs shadow-lg shadow-yellow-500/20">SK</div>
           <div>
             <h1 className="font-bold text-sm leading-none tracking-wide text-white">{appConfig.storeName}</h1>
             <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`relative flex h-2 w-2`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? "bg-green-400" : "bg-red-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? "bg-green-500" : "bg-red-500"}`}></span>
                </span>
                <p className={`text-[10px] font-bold ${isOpen ? "text-green-500" : "text-red-500"}`}>{isOpen ? "ABERTO" : "FECHADO"}</p>
             </div>
           </div>
        </div>
        <button onClick={() => openWithHistory(() => setIsCartOpen(true))} className="relative bg-zinc-900 p-2.5 rounded-full border border-white/10 active:scale-90 transition hover:bg-zinc-800">
          <ShoppingCart size={20} className="text-white" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center font-bold border-2 border-zinc-950 shadow-sm animate-bounce">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {/* CONTEÚDO */}
      {tab === "menu" && (
        <>
          {/* BUSCA MODERNA */}
          <div className="px-5 mt-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-zinc-500 group-focus-within:text-yellow-500 transition" />
                </div>
                <input 
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all shadow-inner"
                    placeholder="O que vamos comer hoje?"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          {/* --- NOVO BANNER PROMOCIONAL --- */}
          <div className="px-5 mt-6">
            <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-900/20 group">
                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><Zap size={10} fill="black" /> OFERTA</span>
                    </div>
                    <h3 className="font-black text-2xl text-white leading-tight shadow-black drop-shadow-lg">PIZZA DO CHEF</h3>
                    <p className="text-xs text-gray-300 font-medium mb-3 max-w-[200px]">Peça hoje e ganhe borda recheada grátis!</p>
                </div>
            </div>
          </div>

          {/* CATEGORIAS (STORIES COM ANEL GRADIENTE) */}
          <div className="mt-6 pl-5 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
             <button onClick={() => setActiveCategory("TODOS")} className="flex flex-col items-center gap-2 snap-start min-w-[70px]">
                <div className={`w-[70px] h-[70px] rounded-full p-[2px] transition-all ${activeCategory === "TODOS" ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600 animate-spin-slow" : "bg-zinc-800"}`}>
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center border-2 border-zinc-950">
                        <span className="font-bold text-[10px]">TODOS</span>
                    </div>
                </div>
             </button>
             {categories.map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat)} className="flex flex-col items-center gap-2 snap-start min-w-[70px]">
                  <div className={`w-[70px] h-[70px] rounded-full p-[2px] transition-all ${activeCategory === cat ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600" : "bg-zinc-800"}`}>
                      <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center border-2 border-zinc-950 text-2xl">
                          {cat.includes("SMASH") && "🍔"}
                          {cat.includes("PREMIUM") && "👑"}
                          {cat.includes("BEBIDAS") && "🥤"}
                          {cat.includes("ACOMP") && "🍟"}
                          {!cat.includes("SMASH") && !cat.includes("PREMIUM") && !cat.includes("BEBIDAS") && !cat.includes("ACOMP") && "🍽️"}
                      </div>
                  </div>
                  <span className={`text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[70px] ${activeCategory === cat ? "text-yellow-500" : "text-zinc-500"}`}>{cat.split(" ")[1] || cat}</span>
               </button>
             ))}
          </div>

          {/* LISTA DE PRODUTOS */}
          <div className="px-5 mt-2 space-y-8">
             {activeCategory === "TODOS" && searchTerm === "" ? (
                categories.map(cat => {
                  const itemsInCat = filteredMenu.filter(i => i.category === cat);
                  if (itemsInCat.length === 0) return null;
                  return (
                    <div key={cat} className="animate-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-3 mb-4 mt-2">
                         <h3 className="font-black text-lg text-white tracking-tight uppercase italic">{cat}</h3>
                         <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                      </div>
                      <div>{itemsInCat.map(item => <ProductCard key={item.id} item={item} />)}</div>
                    </div>
                  );
                })
             ) : (
                <div className="animate-in slide-in-from-bottom-4">
                   {activeCategory !== "TODOS" && (
                      <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-yellow-500"><Flame size={18} /> {activeCategory}</h2>
                   )}
                   {filteredMenu.map(item => <ProductCard key={item.id} item={item} />)}
                   {filteredMenu.length === 0 && <div className="text-center py-10 opacity-50"><p>Nada encontrado.</p></div>}
                </div>
             )}
          </div>
        </>
      )}

      {/* TELA DE PEDIDOS E PERFIL (MANTIDOS IGUAIS) */}
      {tab === "orders" && (
        <div className="p-5 pt-10 animate-in fade-in">
            <h2 className="text-2xl font-black mb-6">Meus Pedidos</h2>
            {myActiveOrders.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <Package size={64} className="mx-auto mb-4 text-zinc-700" />
                    <p className="font-bold text-zinc-500">Sua lista está vazia.</p>
                    <button onClick={() => setTab("menu")} className="mt-4 text-yellow-500 text-sm font-bold">Ir para o Cardápio</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {myActiveOrders.map(o => (
                        <div key={o.id} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-lg">
                            <div className="flex justify-between mb-3 border-b border-white/5 pb-2">
                                <span className="font-bold text-zinc-400">#{o.id.split("-")[1]}</span>
                                <span className="font-black text-green-500">R$ {o.total.toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-zinc-300 mb-4">{o.items.map(i => i.name).join(", ")}</div>
                            <div className="bg-black/30 p-3 rounded-xl">
                               <div className="flex justify-between items-center mb-2">
                                  <span className={`text-xs font-bold ${o.status === 'preparing' ? 'text-orange-500' : o.status === 'ready' ? 'text-yellow-500' : o.status === 'delivering' ? 'text-blue-500' : 'text-green-500'}`}>
                                     {o.status === 'preparing' ? 'Preparando' : o.status === 'ready' ? 'Pronto na Loja' : o.status === 'delivering' ? 'Saiu p/ Entrega' : 'Entregue'}
                                  </span>
                                  <span className="text-[10px] text-zinc-600">{new Date(o.timestamp).toLocaleTimeString().slice(0,5)}</span>
                               </div>
                               <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ${o.status === 'delivered' ? 'bg-green-500 w-full' : o.status === 'delivering' ? 'bg-blue-500 w-3/4' : o.status === 'ready' ? 'bg-yellow-500 w-1/2' : 'bg-orange-500 w-1/4'}`}></div>
                               </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {tab === "profile" && (
          <div className="p-5 pt-10 text-center animate-in fade-in">
              <div className="w-28 h-28 bg-gradient-to-tr from-zinc-800 to-zinc-900 rounded-full mx-auto mb-4 flex items-center justify-center text-zinc-500 border-4 border-zinc-950 shadow-2xl shadow-yellow-900/10">
                  <User size={48} />
              </div>
              <h2 className="text-2xl font-black mb-1 text-white">{form.name || "Visitante"}</h2>
              <p className="text-yellow-500 text-xs font-bold tracking-widest uppercase mb-8">Cliente VIP SK</p>
              
              <div className="bg-zinc-900/50 rounded-3xl p-6 text-left border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="bg-yellow-500/10 p-3 rounded-2xl text-yellow-500"><Gift size={24} /></div>
                          <div>
                              <p className="font-bold text-sm text-white">SK Points</p>
                              <p className="text-xs text-zinc-500">Seu saldo atual</p>
                          </div>
                      </div>
                      <span className="font-black text-2xl text-white">{form.points}</span>
                  </div>
              </div>
          </div>
      )}

      {/* BOTTOM BAR (NAV) */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex justify-between items-center z-50 pb-6">
         <button onClick={() => handleTabChange("menu")} className={`flex flex-col items-center gap-1 transition duration-300 ${tab === "menu" ? "text-yellow-500 -translate-y-1" : "text-zinc-600"}`}>
             <Home size={26} strokeWidth={tab === "menu" ? 3 : 2} />
             {tab === "menu" && <span className="w-1 h-1 rounded-full bg-yellow-500"></span>}
         </button>
         
         <button onClick={() => handleTabChange("orders")} className={`flex flex-col items-center gap-1 relative transition duration-300 ${tab === "orders" ? "text-yellow-500 -translate-y-1" : "text-zinc-600"}`}>
             <List size={26} strokeWidth={tab === "orders" ? 3 : 2} />
             {myActiveOrders.filter(o => o.status !== 'delivered').length > 0 && (
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse shadow-lg shadow-red-500/50"></span>
             )}
             {tab === "orders" && <span className="w-1 h-1 rounded-full bg-yellow-500"></span>}
         </button>

         <button onClick={() => handleTabChange("profile")} className={`flex flex-col items-center gap-1 transition duration-300 ${tab === "profile" ? "text-yellow-500 -translate-y-1" : "text-zinc-600"}`}>
             <User size={26} strokeWidth={tab === "profile" ? 3 : 2} />
             {tab === "profile" && <span className="w-1 h-1 rounded-full bg-yellow-500"></span>}
         </button>
      </div>

      {/* MODAL PRODUTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-950 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 shadow-2xl shadow-black">
            <div className="relative h-72 shrink-0">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
              <button onClick={() => window.history.back()} className="absolute top-5 right-5 bg-black/40 p-2 rounded-full text-white backdrop-blur border border-white/10 active:scale-90 transition"><X size={20} /></button>
              <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{selectedProduct.category.split(" ")[1] || "LANCHE"}</span>
                     <div className="flex items-center text-yellow-500 text-xs font-bold gap-1"><Star size={10} fill="currentColor" /> {selectedProduct.rating}</div>
                  </div>
                  <h2 className="text-3xl font-black text-white leading-none mb-2 shadow-black drop-shadow-lg">{selectedProduct.name}</h2>
                  <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">{selectedProduct.description}</p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-zinc-950">
              {selectedProduct.options && selectedProduct.options.map((opt, idx) => (
                <div key={idx} className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex justify-between">
                      {opt.name} 
                      {opt.required && <span className="text-red-500 text-[10px] bg-red-500/10 px-2 rounded">OBRIGATÓRIO</span>}
                  </label>
                  <div className="space-y-2">
                    {opt.type === "radio" && (
                      <div className="flex flex-wrap gap-2">
                        {opt.items.map((i) => (
                          <button
                            key={i}
                            onClick={() => handleOptionChange(opt.name, { name: i }, "radio")}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedOptions[opt.name]?.[0]?.name === i ? "bg-white text-black border-white shadow-lg shadow-white/10" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"}`}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    )}
                    {opt.type === "check" && opt.items.map((i) => {
                      const isSelected = selectedOptions[opt.name]?.find((x) => x.name === i.name);
                      return (
                        <button
                          key={i.name}
                          onClick={() => handleOptionChange(opt.name, i, "check", i.price)}
                          className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all active:scale-[0.99] ${isSelected ? "bg-green-500/10 border-green-500/50 text-white shadow-lg shadow-green-500/10" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                        >
                          <span className="font-medium">{i.name}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${isSelected ? "bg-green-500 text-black" : "bg-black/30"}`}>+ R$ {i.price.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!selectedProduct.category.includes("COMBO") && !selectedProduct.category.includes("ACOMPANHAMENTOS") && !selectedProduct.category.includes("BEBIDAS") && selectedProduct.priceCombo > 0 && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center font-bold text-yellow-500 text-sm">
                    <span className="flex items-center gap-2"><Flame size={16} fill="currentColor" /> Virar Combo?</span>
                    <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px]">+ R$ {(selectedProduct.priceCombo - selectedProduct.priceSolo).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Adiciona Batata Frita e Refrigerante ao seu pedido.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setIsCombo(true)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isCombo === true ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" : "bg-zinc-900 hover:bg-zinc-800 border border-white/5"}`}>SIM, QUERO</button>
                    <button onClick={() => setIsCombo(false)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isCombo === false ? "bg-white text-black" : "bg-zinc-900 hover:bg-zinc-800 border border-white/5"}`}>NÃO, OBRIGADO</button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Observações</label>
                  <textarea 
                    placeholder="Ex: Sem cebola, capricha no molho..." 
                    className="w-full bg-zinc-950 p-4 rounded-2xl text-sm text-white border border-zinc-800 focus:border-yellow-500/50 outline-none transition resize-none h-24" 
                    value={obs} 
                    onChange={(e) => setObs(e.target.value)} 
                  />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-zinc-950 pb-8">
              <button onClick={addToCart} style={themeStyle} className="w-full text-black py-4 rounded-2xl font-black text-lg flex justify-between px-8 hover:brightness-110 shadow-xl shadow-yellow-500/20 active:scale-95 transition-all transform">
                <span>ADICIONAR</span>
                <span>R$ {(parseFloat(selectedProduct.priceSolo) + (isCombo ? selectedProduct.priceCombo - selectedProduct.priceSolo : 0) + Object.values(selectedOptions).flat().reduce((a, b) => a + (b.price || 0), 0)).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARRINHO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in slide-in-from-bottom-10 backdrop-blur-xl">
          <div className="flex justify-between items-center p-6 border-b border-white/5 bg-zinc-950">
            <h2 className="font-black text-2xl tracking-tight">Seu Pedido</h2>
            <button onClick={() => window.history.back()} className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.map((i, x) => (
              <div key={x} className="flex justify-between items-start bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-3">
                    <div className="bg-zinc-800 w-8 h-8 rounded text-xs font-bold flex items-center justify-center text-zinc-400">{i.qtd}x</div>
                    <div>
                      <div className="font-bold text-white text-lg leading-none mb-1">{i.name}</div>
                      <div className="text-xs text-zinc-500 max-w-[200px] leading-relaxed">{i.details}</div>
                    </div>
                </div>
                <span className="font-bold text-white">R$ {i.price.toFixed(2)}</span>
              </div>
            ))}
            
            <div className="bg-zinc-900/80 p-5 rounded-3xl border border-white/5 space-y-5 shadow-lg">
              <h3 className="text-xs font-black uppercase text-zinc-500 flex items-center gap-2 tracking-widest"><MapPin size={14} /> Onde vamos entregar?</h3>
              <input className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition focus:ring-1 focus:ring-yellow-500/50" placeholder="Seu Nome Completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
              <div className="relative">
                 <select className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm text-white appearance-none" onChange={(e) => setSelectedBairro(bairros.find((b) => b.nome === e.target.value))}>
                    {bairros.map((b) => (
                    <option key={b.nome} value={b.nome}>{b.nome} (+ R$ {b.taxa.toFixed(2)})</option>
                    ))}
                 </select>
                 <ChevronRight className="absolute right-4 top-4 text-zinc-500 rotate-90" size={16} />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <input className="col-span-3 w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm text-white" placeholder="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                <input className="col-span-1 w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm text-white text-center" placeholder="Nº" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <input className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm text-white" placeholder="Ponto de Referência" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              
              <div className="flex gap-3 pt-2 border-t border-white/5">
                 <input className="flex-1 bg-black border border-zinc-800 p-4 rounded-xl text-sm uppercase text-white font-mono" placeholder="CUPOM" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                 <button onClick={applyCoupon} className="bg-zinc-800 px-6 rounded-xl font-bold text-xs hover:bg-zinc-700 transition">APLICAR</button>
              </div>

              <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-500 mt-2">Pagamento</h3>
                  <div className="flex gap-2">
                      <button onClick={() => setForm({...form, payment: "Pix"})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${form.payment === "Pix" ? "bg-green-500/20 border-green-500 text-green-500" : "bg-black border-zinc-800 text-zinc-500"}`}>PIX</button>
                      <button onClick={() => setForm({...form, payment: "Cartão"})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${form.payment === "Cartão" ? "bg-blue-500/20 border-blue-500 text-blue-500" : "bg-black border-zinc-800 text-zinc-500"}`}>CARTÃO</button>
                      <button onClick={() => setForm({...form, payment: "Dinheiro"})} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${form.payment === "Dinheiro" ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-black border-zinc-800 text-zinc-500"}`}>DINHEIRO</button>
                  </div>
              </div>
              
              {form.payment === "Dinheiro" && (
                  <input className="w-full bg-black border border-yellow-500/50 p-4 rounded-xl text-sm text-white animate-in fade-in" placeholder="Troco para quanto?" value={form.change} onChange={(e) => setForm({ ...form, change: e.target.value })} />
              )}
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-zinc-950 pb-8">
            <div className="flex justify-between items-end mb-6">
              <span className="text-zinc-400 text-sm">Total a pagar</span>
              <div className="text-right">
                  {discount > 0 && <span className="block text-xs text-red-500 line-through mr-1">R$ {(total + discount).toFixed(2)}</span>}
                  <span className="text-3xl font-black text-white leading-none">R$ {total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={send} disabled={!isOpen} style={themeStyle} className="w-full text-black disabled:bg-zinc-800 disabled:text-zinc-600 py-5 rounded-2xl font-black text-lg shadow-xl shadow-yellow-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
              {isOpen ? <><Bike size={20} /> ENVIAR PEDIDO</> : <><Lock size={20} /> LOJA FECHADA</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}