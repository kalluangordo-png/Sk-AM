import React, { useState, useMemo, useEffect } from "react";
import {
  Lock,
  Trash2,
  Printer,
  Download,
  Plus,
  Upload,
  Edit,
  Palette,
  Clock,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Smartphone,
  Banknote,
  CreditCard,
  Search,
  CheckCircle,
  Flag,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Ticket,
  Settings,
  AlertTriangle,
  QrCode,
  Bike,
  MessageCircle,
  Send,
  Star, // Ícone para a aba de Adicionais
  ListPlus, // Ícone de lista
} from "lucide-react";

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxWidth = 800;
      const scaleSize = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scaleSize;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.7));
    };
  };
};

const OrderTimerBadge = ({ timestamp }) => {
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    const calc = () => setMinutes(Math.floor((Date.now() - timestamp) / 60000));
    calc();
    const i = setInterval(calc, 60000);
    return () => clearInterval(i);
  }, [timestamp]);

  let color = "text-green-500 border-green-500/30 bg-green-500/10";
  if (minutes > 20)
    color = "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
  if (minutes > 40)
    color = "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse";

  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded border ${color} flex items-center gap-1 uppercase`}
    >
      <Clock size={10} /> {minutes} min
    </span>
  );
};

export default function AdminDashboard({
  onBack,
  orders,
  updateOrder,
  deleteOrder,
  menuItems,
  updateMenuItem,
  addMenuItem,
  deleteMenuItem,
  // Props dos Extras (Vem do App.js)
  extras = [],
  addExtra,
  deleteExtra,
  // Outras props
  bairros,
  setBairros,
  appConfig,
  saveGlobalSettings,
  motoboys,
  coupons,
  themeStyle,
  textThemeStyle,
  hardResetMenu,
  simulateIncomingOrder,
}) {
  const [tab, setTab] = useState("orders");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");

  // Forms
  const [newBairro, setNewBairro] = useState({ nome: "", taxa: "" });
  const [newMoto, setNewMoto] = useState({ name: "", login: "" });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "fixed",
  });

  // Form de Adicional (Novo)
  const [newExtra, setNewExtra] = useState({ name: "", price: "" });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    category: "LINHA SMASH",
    priceSolo: "",
    priceCombo: "",
    description: "",
    image: "",
    stock: 100,
    order: 0,
  });

  const [printerWidth, setPrinterWidth] = useState(
    localStorage.getItem("sk_printer_width") || "58mm"
  );
  useEffect(() => {
    localStorage.setItem("sk_printer_width", printerWidth);
  }, [printerWidth]);

  // --- METRICS ---
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.timestamp >= startOfDay.getTime());
  const totalOrdersCount = todayOrders.length;
  const deliveredToday = orders
    .filter(
      (o) => o.status === "delivered" && o.timestamp >= startOfDay.getTime()
    )
    .sort((a, b) => b.timestamp - a.timestamp);
  const totalRevenue = deliveredToday.reduce((acc, o) => acc + o.total, 0);
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const paymentStats = {
    pix: deliveredToday
      .filter((o) => o.payment && o.payment.includes("Pix"))
      .reduce((acc, o) => acc + o.total, 0),
    card: deliveredToday
      .filter(
        (o) =>
          o.payment &&
          (o.payment.includes("Crédito") ||
            o.payment.includes("Débito") ||
            o.payment.includes("Cartão"))
      )
      .reduce((acc, o) => acc + o.total, 0),
    cash: deliveredToday
      .filter((o) => o.payment && o.payment.includes("Dinheiro"))
      .reduce((acc, o) => acc + o.total, 0),
  };

  const prep = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const delivering = orders.filter((o) => o.status === "delivering");

  const sortedMenu = useMemo(
    () => [...menuItems].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [menuItems]
  );

  const filteredMenu = sortedMenu.filter((i) => {
    const matchesSearch = i.name
      .toLowerCase()
      .includes(menuSearch.toLowerCase());
    const matchesCategory =
      selectedCategory === "TODOS" || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- FUNÇÕES DE AÇÃO ---
  const sendQuickMessage = (order, type) => {
    if (!order.phone) return alert("Cliente sem telefone cadastrado.");
    const cleanPhone = order.phone.replace(/\D/g, "");
    let message = "";
    if (type === "confirm") {
      message = `Olá *${
        order.customer
      }*! Recebemos seu pedido no SK Burgers.🍔\nJá estamos preparando! O tempo estimado é de *${
        appConfig.deliveryTime || "40-50 min"
      }*.`;
    } else if (type === "dispatch") {
      message = `Olá *${order.customer}*! Seu pedido saiu para entrega 🛵💨\nFique atento ao interfone/campainha. Bom apetite!`;
    }
    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const moveItem = (index, direction) => {
    if (menuSearch !== "") return alert("Limpe a busca para ordenar.");
    const itemToMove = filteredMenu[index];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredMenu.length) return;
    const itemTarget = filteredMenu[targetIndex];
    let order1 = itemToMove.order || 0;
    let order2 = itemTarget.order || 0;
    if (order1 === order2) order2 = order1 + 1;
    updateMenuItem(itemToMove.id, { order: order2 });
    updateMenuItem(itemTarget.id, { order: order1 });
  };

  const handleDeleteItem = (id, name) => {
    if (
      window.confirm(`Tem certeza que deseja apagar "${name}" do cardápio?`)
    ) {
      deleteMenuItem(id);
    }
  };

  // --- FUNÇÕES DE ADICIONAIS (EXTRAS) ---
  const handleAddExtra = () => {
    if (newExtra.name && newExtra.price) {
      addExtra({
        name: newExtra.name,
        price: parseFloat(newExtra.price),
        available: true,
        id: Date.now().toString(), // ID temporário, Firebase sobrescreve
      });
      setNewExtra({ name: "", price: "" });
    }
  };

  const handleDeleteExtra = (id) => {
    if (window.confirm("Apagar este adicional permanentemente?")) {
      deleteExtra(id);
    }
  };

  const clearSystem = () => {
    if (confirm("⚠️ PERIGO: Apagar TODOS os pedidos?")) {
      if (confirm("Última chance: Tem certeza?")) {
        orders.forEach((o) => deleteOrder(o.id));
        alert("Sistema zerado!");
      }
    }
  };

  const printOrder = (order) => {
    const w = window.open("", "", "width=350,height=600");
    const fontSize = printerWidth === "58mm" ? "11px" : "14px";
    const width = printerWidth === "58mm" ? "56mm" : "78mm";
    w.document.write(
      `<html><head><title>Pedido #${
        order.id.split("-")[1]
      }</title><style>body{font-family:'Courier New',monospace;font-size:${fontSize};width:${width};margin:0;padding:0;color:#000}.center{text-align:center}.bold{font-weight:bold}.row{display:flex;justify-content:space-between}.line{border-bottom:1px dashed #000;margin:5px 0}.text-lg{font-size:1.2em}.mt{margin-top:10px}</style></head><body><div class="center bold text-lg">${appConfig.storeName.toUpperCase()}</div><div class="center">${new Date(
        order.timestamp
      ).toLocaleString()}</div><div class="line"></div><div class="center bold text-lg">SENHA: ${
        order.id.split("-")[1]
      }</div><div class="line"></div><div class="bold">${
        order.customer
      }</div><div>${
        order.phone || ""
      }</div><div class="line"></div>${order.items
        .map(
          (i) =>
            `<div class="row"><span class="bold">${i.qtd}x</span><span>${
              i.name
            }</span><span>${(i.price * i.qtd).toFixed(2)}</span></div>${
              i.details
                ? `<div style="font-size:0.9em">(${i.details})</div>`
                : ""
            }`
        )
        .join(
          ""
        )}<div class="line"></div><div class="row"><span>Entrega:</span><span>${order.deliveryFee?.toFixed(
        2
      )}</span></div><div class="row bold text-lg"><span>TOTAL:</span><span>R$ ${order.total.toFixed(
        2
      )}</span></div><div class="line"></div><div>Pag: ${
        order.payment
      }</div><div class="bold mt">Endereço:</div><div>${
        order.address
      }</div><div class="center mt" style="font-size:0.8em">Sistema SK Delivery</div></body></html>`
    );
    w.print();
  };

  const downloadReport = () => {
    const headers = "ID,Data,Cliente,Total,Pagamento\n";
    const rows = deliveredToday
      .map(
        (o) =>
          `${o.id},${new Date(o.timestamp).toLocaleDateString()},${
            o.customer
          },${o.total},${o.payment}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendas_hoje.csv";
    a.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file)
      compressImage(file, (base64) =>
        setProdForm({ ...prodForm, image: base64 })
      );
  };

  const addBairro = () => {
    if (newBairro.nome) {
      saveGlobalSettings({
        bairros: [
          ...bairros,
          { ...newBairro, taxa: parseFloat(newBairro.taxa) },
        ],
      });
      setNewBairro({ nome: "", taxa: "" });
    }
  };
  const removeBairro = (n) =>
    saveGlobalSettings({ bairros: bairros.filter((b) => b.nome !== n) });

  const addMotoboy = () => {
    if (newMoto.name) {
      saveGlobalSettings({
        motoboys: [...motoboys, { ...newMoto, id: Date.now() }],
      });
      setNewMoto({ name: "", login: "" });
    }
  };
  const removeMotoboy = (id) =>
    saveGlobalSettings({ motoboys: motoboys.filter((m) => m.id !== id) });

  const addCoupon = () => {
    if (newCoupon.code && newCoupon.discount) {
      saveGlobalSettings({
        coupons: [
          ...(coupons || []),
          {
            ...newCoupon,
            code: newCoupon.code.toUpperCase(),
            discount: parseFloat(newCoupon.discount),
          },
        ],
      });
      setNewCoupon({ code: "", discount: "", type: "fixed" });
    }
  };
  const removeCoupon = (code) =>
    saveGlobalSettings({ coupons: coupons.filter((c) => c.code !== code) });

  const openNewProduct = () => {
    setEditingId(null);
    setProdForm({
      name: "",
      category: "LINHA SMASH",
      priceSolo: "",
      priceCombo: "",
      description: "",
      image: "",
      stock: 100,
      order: Date.now(),
    });
    setShowProductForm(true);
  };
  const openEditProduct = (item) => {
    setEditingId(item.id);
    setProdForm({
      ...item,
      priceSolo: item.priceSolo || "",
      priceCombo: item.priceCombo || "",
      stock: item.stock || 0,
    });
    setShowProductForm(true);
  };
  const handleSaveProduct = () => {
    const payload = {
      ...prodForm,
      priceSolo: parseFloat(prodForm.priceSolo),
      priceCombo: parseFloat(prodForm.priceCombo || 0),
      stock: parseInt(prodForm.stock),
      available: true,
      rating: 5.0,
      options: editingId
        ? menuItems.find((i) => i.id === editingId).options
        : [],
      order: prodForm.order || Date.now(),
    };
    if (editingId) updateMenuItem(editingId, payload);
    else addMenuItem(payload);
    setShowProductForm(false);
  };

  const PaymentIcon = ({ payment }) => {
    if (!payment) return null;
    if (payment.includes("Pix"))
      return (
        <span className="text-[9px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 flex items-center gap-1 w-fit">
          <Smartphone size={10} /> PIX
        </span>
      );
    if (
      payment.includes("Crédito") ||
      payment.includes("Débito") ||
      payment.includes("Cartão")
    )
      return (
        <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 w-fit">
          <CreditCard size={10} /> CARTÃO
        </span>
      );
    return (
      <span className="text-[9px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1 w-fit">
        <Banknote size={10} /> DINHEIRO
      </span>
    );
  };

  const MetricCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-zinc-900/80 backdrop-blur p-4 rounded-2xl border border-white/5 flex items-center gap-4 shadow-lg">
      <div
        className={`p-3 rounded-xl bg-opacity-20 ${color.replace(
          "text-",
          "bg-"
        )}`}
      >
        <Icon className={color} size={24} />
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          {title}
        </p>
        <p className="text-2xl font-black text-white">{value}</p>
        {subtext && <p className="text-[10px] text-zinc-400">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 pt-16 min-h-screen bg-zinc-950 font-sans text-white selection:bg-yellow-500 selection:text-black">
      <header className="fixed top-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 p-4 px-6 flex justify-between items-center z-40 mt-7">
        <h1
          style={textThemeStyle}
          className="font-black flex items-center gap-2 text-lg"
        >
          <Lock size={18} /> ADMIN
        </h1>
        <button
          onClick={onBack}
          className="text-xs font-bold text-red-500 border border-red-900/50 hover:bg-red-900/20 px-4 py-2 rounded-lg transition"
        >
          SAIR
        </button>
      </header>

      <div className="flex gap-2 mt-6 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["orders", "reports", "menu", "extras", "config"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap uppercase transition ${
              tab === t
                ? "bg-white text-black shadow-lg scale-105"
                : "bg-zinc-900 text-zinc-400 border border-white/5"
            }`}
          >
            {t === "orders"
              ? "Pedidos"
              : t === "reports"
              ? "Financeiro"
              : t === "menu"
              ? "Cardápio"
              : t === "extras"
              ? "Adicionais"
              : "Config"}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-in slide-in-from-top-5">
            <MetricCard
              title="Faturamento Hoje"
              value={`R$ ${totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              color="text-green-500"
            />
            <MetricCard
              title="Pedidos Hoje"
              value={totalOrdersCount}
              icon={ShoppingBag}
              color="text-blue-500"
            />
            <MetricCard
              title="Ticket Médio"
              value={`R$ ${avgTicket.toFixed(2)}`}
              icon={TrendingUp}
              color="text-yellow-500"
            />
          </div>

          <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4">
            {/* --- COZINHA --- */}
            <div className="min-w-[85vw] md:min-w-0 snap-center space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 sticky top-0 bg-zinc-950 z-10">
                <h3 className="text-red-500 text-xs font-black uppercase flex items-center gap-2">
                  <Clock size={14} /> Cozinha ({prep.length})
                </h3>
                {simulateIncomingOrder && (
                  <button
                    onClick={simulateIncomingOrder}
                    className="text-[9px] bg-zinc-900 border border-white/10 px-3 py-1 rounded-full hover:bg-zinc-800 transition"
                  >
                    + Teste
                  </button>
                )}
              </div>
              {prep.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 p-4 rounded-2xl border border-l-4 border-red-500 border-y-white/5 border-r-white/5 shadow-xl relative group"
                >
                  <button
                    onClick={() => deleteOrder(o.id)}
                    className="absolute top-3 right-3 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-black text-white text-lg">
                        {o.customer}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-zinc-500">
                          #{o.id.split("-")[1]}
                        </span>
                        <PaymentIcon payment={o.payment} />
                      </div>
                    </div>
                    <OrderTimerBadge timestamp={o.timestamp} />
                  </div>
                  <div className="text-xs text-zinc-300 bg-black/30 p-3 rounded-xl mb-3 border border-white/5 space-y-1">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="font-bold text-white">
                          {i.qtd}x {i.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => printOrder(o)}
                      className="bg-zinc-800 p-2.5 rounded-lg text-white hover:bg-zinc-700 transition"
                    >
                      <Printer size={18} />
                    </button>
                    {/* BOTÃO DE ZAP (Confirmar Pedido) */}
                    {o.phone && (
                      <button
                        onClick={() => sendQuickMessage(o, "confirm")}
                        className="bg-green-500/10 text-green-500 border border-green-500/50 p-2.5 rounded-lg hover:bg-green-500/20 transition"
                      >
                        <MessageCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => updateOrder(o.id, { status: "ready" })}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-sm font-black py-2 rounded-lg text-white shadow-lg transition"
                    >
                      PRONTO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- PRONTOS --- */}
            <div className="min-w-[85vw] md:min-w-0 snap-center space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 sticky top-0 bg-zinc-950 z-10">
                <h3 className="text-yellow-500 text-xs font-black uppercase flex items-center gap-2">
                  <CheckCircle size={14} /> Prontos ({ready.length})
                </h3>
              </div>
              {ready.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-yellow-500 shadow-xl"
                >
                  <div className="flex justify-between font-bold text-white mb-1">
                    <span>{o.customer}</span>
                    <span className="text-green-400 text-sm">
                      R$ {o.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mb-4 truncate flex items-center gap-1">
                    <Flag size={10} /> {o.address}
                  </div>
                  {/* BOTÃO DE ZAP (Saiu para Entrega) */}
                  {o.phone && (
                    <button
                      onClick={() => sendQuickMessage(o, "dispatch")}
                      className="w-full mb-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 border border-yellow-500/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Send size={12} /> Avisar: Saiu p/ Entrega
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {motoboys.map((m) => (
                      <button
                        key={m.id}
                        onClick={() =>
                          updateOrder(o.id, {
                            status: "delivering",
                            assignedTo: m.id,
                          })
                        }
                        className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/50 text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Bike size={12} /> {m.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="min-w-[85vw] md:min-w-0 snap-center space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 sticky top-0 bg-zinc-950 z-10">
                <h3 className="text-blue-500 text-xs font-black uppercase flex items-center gap-2">
                  <Bike size={14} /> Em Rota ({delivering.length})
                </h3>
              </div>
              {delivering.map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 p-4 rounded-2xl border-l-4 border-blue-500 shadow-xl opacity-70 hover:opacity-100 transition"
                >
                  <div className="font-bold text-white mb-1">{o.customer}</div>
                  <div className="text-xs text-blue-400 flex items-center gap-1 bg-blue-900/20 w-fit px-2 py-1 rounded">
                    <Bike size={12} />{" "}
                    {motoboys.find((m) => m.id === o.assignedTo)?.name ||
                      "Motoboy"}
                  </div>
                </div>
              ))}
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 sticky top-0 bg-zinc-950 z-10">
                <h3 className="text-green-500 text-xs font-black uppercase flex items-center gap-2">
                  <Flag size={14} /> Entregues ({deliveredToday.length})
                </h3>
              </div>
              {deliveredToday.slice(0, 15).map((o) => (
                <div
                  key={o.id}
                  className="bg-zinc-900 p-3 rounded-xl border border-white/5 opacity-50 hover:opacity-100 transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-xs text-zinc-300">
                      {o.customer}
                    </div>
                    <div className="text-10px text-zinc-600 flex items-center gap-1">
                      <CheckCircle size={8} />{" "}
                      {new Date(o.timestamp).toLocaleTimeString().slice(0, 5)}
                    </div>
                  </div>
                  <span className="text-green-600 font-black text-xs">
                    R$ {o.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "reports" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="PIX"
              value={`R$ ${paymentStats.pix.toFixed(2)}`}
              icon={Smartphone}
              color="text-green-500"
            />
            <MetricCard
              title="CARTÃO"
              value={`R$ ${paymentStats.card.toFixed(2)}`}
              icon={CreditCard}
              color="text-blue-500"
            />
            <MetricCard
              title="DINHEIRO"
              value={`R$ ${paymentStats.cash.toFixed(2)}`}
              icon={Banknote}
              color="text-yellow-500"
            />
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5 text-center shadow-2xl">
            <TrendingUp size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-zinc-400 text-xs font-bold uppercase mb-2">
              Total Consolidado
            </h3>
            <div className="text-5xl font-black text-white mb-6">
              R$ {deliveredToday.reduce((a, o) => a + o.total, 0).toFixed(2)}
            </div>
            <button
              onClick={downloadReport}
              className="bg-zinc-700 text-white text-xs font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 mx-auto hover:bg-zinc-600 transition"
            >
              <Download size={16} /> EXPORTAR EXCEL
            </button>
          </div>
        </div>
      )}

      {tab === "menu" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-white/10 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-3.5 text-zinc-500"
                />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 text-sm text-white focus:border-yellow-500 outline-none"
                />
              </div>
              <button
                onClick={openNewProduct}
                className="bg-green-600 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-500 transition shadow-lg shadow-green-900/20"
              >
                <Plus size={18} /> NOVO
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                "TODOS",
                "LINHA SMASH",
                "LINHA PREMIUM",
                "ACOMPANHAMENTOS",
                "BEBIDAS",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                      : "bg-black text-zinc-500 border border-white/10 hover:bg-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {showProductForm && (
            <div className="bg-zinc-900 p-5 rounded-3xl border border-white/10 space-y-4 animate-in fade-in shadow-2xl relative">
              <button
                onClick={() => setShowProductForm(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <Trash2 size={20} />
              </button>
              <h3 className="font-black text-lg text-yellow-500">
                {editingId ? "Editar Produto" : "Novo Produto"}
              </h3>
              <div className="grid gap-3">
                <input
                  className="w-full bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none focus:border-yellow-500"
                  placeholder="Nome do Produto"
                  value={prodForm.name}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, name: e.target.value })
                  }
                />
                <div className="flex gap-3">
                  <label className="flex-1 bg-zinc-800 p-3 rounded-xl text-xs border border-white/10 flex items-center gap-2 cursor-pointer hover:bg-zinc-700 transition justify-center">
                    <Upload size={16} />{" "}
                    <span className="truncate">
                      {prodForm.image ? "Imagem OK" : "Foto"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <input
                    className="w-24 bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none text-center"
                    type="number"
                    placeholder="Qtd"
                    value={prodForm.stock}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, stock: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none"
                    type="number"
                    placeholder="R$ Solo"
                    value={prodForm.priceSolo}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, priceSolo: e.target.value })
                    }
                  />
                  <input
                    className="flex-1 bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none"
                    type="number"
                    placeholder="R$ Combo"
                    value={prodForm.priceCombo}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, priceCombo: e.target.value })
                    }
                  />
                </div>
                <select
                  className="w-full bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none"
                  value={prodForm.category}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, category: e.target.value })
                  }
                >
                  {[
                    "LINHA SMASH",
                    "LINHA PREMIUM",
                    "ACOMPANHAMENTOS",
                    "BEBIDAS",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <textarea
                  className="w-full bg-black p-3 rounded-xl text-sm border border-white/10 text-white outline-none resize-none h-20"
                  placeholder="Descrição..."
                  value={prodForm.description}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, description: e.target.value })
                  }
                />
                <button
                  onClick={handleSaveProduct}
                  className="w-full bg-blue-600 py-3 rounded-xl text-sm font-black hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                >
                  SALVAR PRODUTO
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredMenu.map((item, index) => (
              <div
                key={item.id}
                className="bg-zinc-900 p-3 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/20 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  {menuSearch === "" && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveItem(index, "up")}
                        className="text-zinc-600 hover:text-white transition"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        className="text-zinc-600 hover:text-white transition"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  )}
                  <img
                    src={item.image}
                    className={`w-14 h-14 rounded-xl object-cover bg-black border border-white/5 ${
                      !item.available && "grayscale opacity-50"
                    }`}
                  />
                  <div>
                    <div className="font-bold text-sm text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      R$ {item.priceSolo.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateMenuItem(item.id, { available: !item.available })
                    }
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black border transition ${
                      item.available
                        ? "bg-green-500/10 border-green-500/50 text-green-500"
                        : "bg-red-500/10 border-red-500/50 text-red-500"
                    }`}
                  >
                    {item.available ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}{" "}
                    {item.available ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => openEditProduct(item)}
                    className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="text-zinc-600 hover:text-red-500 p-2 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ABA DE ADICIONAIS (EXTRAS) --- */}
      {tab === "extras" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <Star size={16} /> Gerenciar Adicionais
            </h3>

            {/* Formulário de Adição */}
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-black p-3 rounded-lg border border-white/10 text-xs text-white"
                placeholder="Nome (Ex: Bacon Extra)"
                value={newExtra.name}
                onChange={(e) =>
                  setNewExtra({ ...newExtra, name: e.target.value })
                }
              />
              <input
                className="w-24 bg-black p-3 rounded-lg border border-white/10 text-xs text-white"
                type="number"
                placeholder="R$ Preço"
                value={newExtra.price}
                onChange={(e) =>
                  setNewExtra({ ...newExtra, price: e.target.value })
                }
              />
              <button
                onClick={handleAddExtra}
                className="bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Lista de Adicionais */}
            <div className="space-y-2">
              {extras.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">
                  Nenhum adicional cadastrado.
                </p>
              ) : (
                extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex justify-between items-center bg-black p-3 rounded-lg border border-white/5"
                  >
                    <div>
                      <div className="text-white font-bold text-sm">
                        {extra.name}
                      </div>
                      <div className="text-yellow-500 text-xs font-black">
                        R$ {extra.price.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExtra(extra.id)}
                      className="text-zinc-600 hover:text-red-500 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="space-y-6 animate-in fade-in">
          {/* --- CONFIGURAÇÃO TEMPO DE ENTREGA (NOVO) --- */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Clock size={16} /> Tempo Estimado de Entrega
            </h3>
            <div className="space-y-2">
              <input
                className="w-full bg-black p-3 rounded-lg border border-white/10 text-white text-sm"
                placeholder="Ex: 40-50 min"
                value={appConfig.deliveryTime || ""}
                onChange={(e) =>
                  saveGlobalSettings({
                    config: { ...appConfig, deliveryTime: e.target.value },
                  })
                }
              />
              <p className="text-[10px] text-zinc-500">
                Esse tempo aparecerá para o cliente no cardápio.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <QrCode size={16} /> Chave Pix da Loja
            </h3>
            <div className="space-y-2">
              <input
                className="w-full bg-black p-3 rounded-lg border border-white/10 text-white text-sm"
                placeholder="Ex: 12.345.678/0001-90 (CNPJ) ou Email"
                value={appConfig.pixKey || ""}
                onChange={(e) =>
                  saveGlobalSettings({
                    config: { ...appConfig, pixKey: e.target.value },
                  })
                }
              />
              <p className="text-[10px] text-zinc-500">
                Essa chave aparecerá para o cliente copiar na hora de pagar.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Ticket size={16} /> Cupons de Desconto
            </h3>
            <div className="space-y-2 mb-3">
              {coupons &&
                coupons.map((c) => (
                  <div
                    key={c.code}
                    className="flex justify-between items-center bg-black p-2 rounded-lg border border-white/5"
                  >
                    <div>
                      <span className="text-yellow-500 font-black text-xs">
                        {c.code}
                      </span>
                      <span className="text-zinc-500 text-[10px] ml-2">
                        {c.type === "percent"
                          ? `${c.discount * 100}% OFF`
                          : `R$ ${c.discount} OFF`}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCoupon(c.code)}
                      className="text-red-500 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-black p-3 rounded-lg border border-white/10 text-xs text-white uppercase"
                placeholder="CÓDIGO"
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, code: e.target.value })
                }
              />
              <input
                className="w-20 bg-black p-3 rounded-lg border border-white/10 text-xs text-white"
                type="number"
                placeholder="Valor"
                value={newCoupon.discount}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discount: e.target.value })
                }
              />
              <select
                className="bg-black p-3 rounded-lg border border-white/10 text-xs text-white"
                value={newCoupon.type}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, type: e.target.value })
                }
              >
                <option value="fixed">R$</option>
                <option value="percent">%</option>
              </select>
              <button
                onClick={addCoupon}
                className="bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Settings size={16} /> Impressão
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPrinterWidth("58mm")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold border ${
                  printerWidth === "58mm"
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500 border-white/10"
                }`}
              >
                58mm (Pequena)
              </button>
              <button
                onClick={() => setPrinterWidth("80mm")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold border ${
                  printerWidth === "80mm"
                    ? "bg-white text-black"
                    : "bg-black text-zinc-500 border-white/10"
                }`}
              >
                80mm (Grande)
              </button>
            </div>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Palette size={16} /> Aparência
            </h3>
            <div className="space-y-3">
              <input
                className="w-full bg-black p-3 rounded-lg border border-white/10 text-white text-sm"
                placeholder="Nome da Loja"
                value={appConfig.storeName}
                onChange={(e) =>
                  saveGlobalSettings({
                    config: { ...appConfig, storeName: e.target.value },
                  })
                }
              />
              <div className="flex items-center gap-3 bg-black p-2 rounded-lg border border-white/10">
                <label className="text-xs text-zinc-400">Cor do Tema:</label>
                <input
                  type="color"
                  value={appConfig.themeColor}
                  onChange={(e) =>
                    saveGlobalSettings({
                      config: { ...appConfig, themeColor: e.target.value },
                    })
                  }
                  className="h-8 w-full rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>
          </div>
          <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 mt-4">
            <h3 className="text-red-500 font-black text-sm mb-3 flex items-center gap-2 uppercase tracking-widest">
              <AlertTriangle size={16} /> Zona de Perigo
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Apagar todos os pedidos para começar do zero.
            </p>
            <button
              onClick={clearSystem}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Trash2 size={16} /> ZERAR SISTEMA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
