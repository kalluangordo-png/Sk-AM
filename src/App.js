import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Loader2, Maximize2, Monitor, Smartphone } from "lucide-react";

// --- IMPORTANDO CONFIGURAÇÕES ---
import {
  db,
  auth,
  appId,
  INITIAL_MENU,
  INITIAL_BAIRROS,
  INITIAL_CONFIG,
  INITIAL_MOTOBOYS,
  INITIAL_COUPONS,
} from "./config/firebase";

// --- IMPORTANDO TELAS ---
import LoginScreen from "./screens/LoginScreen";
import CustomerApp from "./screens/CustomerApp";
import AdminDashboard from "./screens/AdminDashboard";
import MotoboyApp from "./screens/MotoboyApp";
import KitchenDisplay from "./screens/KitchenDisplay";

// --- FIREBASE IMPORTS ---
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  deleteDoc,
  setDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [view, setView] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS GLOBAIS ---
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [bairros, setBairros] = useState(INITIAL_BAIRROS);

  // FORÇANDO O NOME "BURGERS" NA INICIALIZAÇÃO
  const [appConfig, setAppConfig] = useState({
    ...INITIAL_CONFIG,
    storeName: "Burgers",
  });

  const [motoboys, setMotoboys] = useState(INITIAL_MOTOBOYS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);

  const [myOrderIds, setMyOrderIds] = useState(() => {
    try {
      // ATUALIZADO PARA V4 PARA LIMPAR CACHE ANTIGO DE PEDIDOS
      return JSON.parse(localStorage.getItem("sk_my_order_ids_v4")) || [];
    } catch {
      return [];
    }
  });

  // --- ORDENAÇÃO GLOBAL ---
  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [menuItems]);

  // --- AUTENTICAÇÃO ---
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    signInAnonymously(auth).catch((err) => {
      console.error(err);
      setIsLoading(false);
    });
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserAuth(user);
      setIsOnline(!!user);
      setTimeout(() => setIsLoading(false), 1500);
    });
    return () => unsubAuth();
  }, []);

  // --- SINCRONIZAÇÃO ---
  useEffect(() => {
    if (!db || !userAuth) {
      // --- CORREÇÃO DE CACHE AQUI: Mudamos de v11 para v13 ---
      const localMenu = localStorage.getItem("sk_menu_v13");
      if (localMenu) setMenuItems(JSON.parse(localMenu));
      return;
    }

    const qOrders = query(
      collection(db, "artifacts", appId, "public", "data", "orders"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        setOrders(
          snap.docs
            .map((d) => ({ ...d.data(), fireId: d.id }))
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      },
      (error) => console.log("Erro Pedidos:", error)
    );

    const unsubMenu = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "menu"),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          setMenuItems(data);
          // --- CORREÇÃO DE CACHE AQUI TAMBÉM: Salva como v13 ---
          localStorage.setItem("sk_menu_v13", JSON.stringify(data));
        } else if (isOnline) {
          INITIAL_MENU.forEach((i) =>
            addDoc(
              collection(db, "artifacts", appId, "public", "data", "menu"),
              i
            )
          );
          setMenuItems(INITIAL_MENU);
        }
      }
    );

    const unsubConfig = onSnapshot(
      doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "settings",
        "global_config"
      ),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.bairros) setBairros(data.bairros);

          if (data.config) {
            setAppConfig({
              ...INITIAL_CONFIG,
              ...data.config,
              storeName: "Burgers",
            });
          }

          if (data.motoboys) setMotoboys(data.motoboys);
          if (data.coupons) setCoupons(data.coupons);
        } else if (isOnline) {
          setDoc(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "settings",
              "global_config"
            ),
            {
              bairros: INITIAL_BAIRROS,
              config: { ...INITIAL_CONFIG, storeName: "Burgers" },
              motoboys: INITIAL_MOTOBOYS,
              coupons: INITIAL_COUPONS,
            }
          );
        }
      }
    );

    return () => {
      unsubOrders();
      unsubMenu();
      unsubConfig();
    };
  }, [userAuth]);

  useEffect(() => {
    // ATUALIZADO PARA V4
    localStorage.setItem("sk_my_order_ids_v4", JSON.stringify(myOrderIds));
  }, [myOrderIds]);

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const safeDbOp = useCallback(
    async (coll, data, action = "add", id = null) => {
      if (!isOnline || !db) {
        showToast("Offline. Ação salva localmente.", "error");
        return;
      }
      try {
        const ref = collection(db, "artifacts", appId, "public", "data", coll);
        if (action === "add") await addDoc(ref, data);
        if (action === "update")
          await updateDoc(
            doc(db, "artifacts", appId, "public", "data", coll, id),
            data
          );
        if (action === "delete")
          await deleteDoc(
            doc(db, "artifacts", appId, "public", "data", coll, id)
          );
      } catch (e) {
        console.error(e);
      }
    },
    [isOnline, showToast]
  );

  const saveGlobalSettings = async (updates) => {
    const newSettings = {
      bairros,
      config: appConfig,
      motoboys,
      coupons,
      ...updates,
    };
    if (updates.bairros) setBairros(updates.bairros);
    if (updates.config) setAppConfig(updates.config);
    if (updates.motoboys) setMotoboys(updates.motoboys);
    if (updates.coupons) setCoupons(updates.coupons);
    if (db && isOnline) {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          "global_config"
        ),
        newSettings
      );
    }
    showToast("Salvo com sucesso!");
  };

  const hardResetMenu = () => {
    if (!confirm("Restaurar cardápio original?")) return;
    setMenuItems(INITIAL_MENU);
    if (isOnline && db) {
      INITIAL_MENU.forEach((i) =>
        addDoc(collection(db, "artifacts", appId, "public", "data", "menu"), i)
      );
    }
    showToast("Cardápio Restaurado!");
  };

  const addOrder = useCallback(
    (order) => {
      let stockError = false;
      order.items.forEach((cartItem) => {
        const menuItem = menuItems.find(
          (m) =>
            m.name === cartItem.name ||
            (cartItem.name.includes("COMBO") &&
              m.name === cartItem.name.replace("COMBO ", ""))
        );
        if (
          menuItem &&
          menuItem.stock !== undefined &&
          menuItem.stock < cartItem.qtd
        )
          stockError = true;
      });
      if (stockError) return alert("Ops! Item esgotado.");

      const newOrder = {
        ...order,
        id: `PED-${Math.floor(Math.random() * 10000)}`,
        timestamp: Date.now(),
      };

      order.items.forEach((cartItem) => {
        const menuItem = menuItems.find(
          (m) =>
            m.name === cartItem.name ||
            (cartItem.name.includes("COMBO") &&
              m.name === cartItem.name.replace("COMBO ", ""))
        );
        if (menuItem && menuItem.stock !== undefined) {
          const newStock = Math.max(0, menuItem.stock - cartItem.qtd);
          setMenuItems((prev) =>
            prev.map((m) =>
              m.id === menuItem.id ? { ...m, stock: newStock } : m
            )
          );
          safeDbOp("menu", { stock: newStock }, "update", menuItem.id);
        }
      });

      setOrders((p) => [newOrder, ...p]);
      setMyOrderIds((p) => [newOrder.id, ...p]);
      safeDbOp("orders", newOrder);
      showToast(`🔔 Pedido enviado!`);
    },
    [menuItems, safeDbOp, showToast]
  );

  const updateOrder = useCallback(
    (id, data) => {
      const ord = orders.find((o) => o.id === id);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data } : o))
      );
      if (ord?.fireId) safeDbOp("orders", data, "update", ord.fireId);
    },
    [orders, safeDbOp]
  );

  const deleteOrder = (id) => {
    const ord = orders.find((o) => o.id === id);
    if (ord?.fireId) safeDbOp("orders", null, "delete", ord.fireId);
  };

  const simulateIncomingOrder = useCallback(() => {
    const randomItem = menuItems[0];
    if (!randomItem) return;
    const fakeOrder = {
      id: `TEST-${Math.floor(Math.random() * 1000)}`,
      customer: `Teste`,
      address: "Rua Teste",
      items: [
        {
          name: randomItem.name,
          price: randomItem.priceSolo,
          qtd: 1,
          details: "",
        },
      ],
      total: randomItem.priceSolo,
      status: "preparing",
      timestamp: Date.now(),
    };
    setOrders((p) => [fakeOrder, ...p]);
    safeDbOp("orders", fakeOrder);
    showToast("Pedido Simulado!");
  }, [menuItems, safeDbOp, showToast]);

  const commonProps = useMemo(
    () => ({
      onBack: () => {
        setView("login");
        setCurrentUser(null);
      },
      orders,
      addOrder,
      updateOrder,
      deleteOrder,
      showToast,
      menuItems: sortedMenuItems,
      addMenuItem: (i) => safeDbOp("menu", i),
      updateMenuItem: (id, u) => safeDbOp("menu", u, "update", id),
      deleteMenuItem: (id) => safeDbOp("menu", null, "delete", id),
      bairros,
      setBairros,
      appConfig,
      saveGlobalSettings,
      motoboys,
      coupons,
      myOrderIds,
      hardResetMenu,
      simulateIncomingOrder,
      categories: [
        "LINHA SMASH",
        "LINHA PREMIUM",
        "ACOMPANHAMENTOS",
        "BEBIDAS",
      ],
    }),
    [orders, sortedMenuItems, bairros, appConfig, motoboys, coupons, myOrderIds]
  );

  const themeStyle = { backgroundColor: appConfig.themeColor || "#EAB308" };
  const textThemeStyle = { color: appConfig.themeColor || "#EAB308" };

  if (isLoading) {
    return (
      <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="text-yellow-500 animate-spin mb-4" size={48} />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
          Carregando Sistema...
        </p>
      </div>
    );
  }

  // --- LÓGICA DE LAYOUT INTELIGENTE ---
  const isWideView =
    view === "admin" || view === "kitchen" || view === "customer";

  return (
    <div className="bg-zinc-900 w-full min-h-screen flex justify-center sm:items-center sm:py-8 font-sans selection:bg-yellow-500 selection:text-black overflow-hidden">
      <div className="hidden xl:flex fixed bottom-8 left-8 flex-col gap-2 text-zinc-700 pointer-events-none">
        <div className="flex items-center gap-2">
          {isWideView ? <Monitor size={20} /> : <Smartphone size={20} />}
          <span className="font-bold text-xs tracking-widest uppercase">
            Modo: {isWideView ? "Desktop Expandido" : "Mobile"}
          </span>
        </div>
      </div>

      <div
        className={`
          relative bg-zinc-950 flex flex-col shadow-2xl transition-all duration-700 ease-in-out
          
          /* --- MOBILE (Padrão) --- */
          w-full h-[100dvh] rounded-none border-none

          /* --- TABLET e PC (Responsivo) --- */
          sm:h-[85vh] sm:rounded-[2.5rem] sm:border-[8px] sm:border-zinc-800
          
          ${
            isWideView
              ? "sm:w-[95vw] sm:max-w-[1400px] sm:rounded-3xl"
              : "sm:w-full sm:max-w-[420px]"
          }
        `}
      >
        <div className="hidden sm:flex absolute top-0 left-0 right-0 justify-center pt-2 z-50 pointer-events-none">
          <div className="w-24 h-6 bg-zinc-800 rounded-b-xl flex items-center justify-center gap-2">
            <div className="w-10 h-1 bg-zinc-900 rounded-full opacity-50"></div>
            <div className="w-1 h-1 bg-zinc-900 rounded-full opacity-50"></div>
          </div>
        </div>

        <div
          style={themeStyle}
          className="shrink-0 text-black text-[9px] font-bold text-center py-1 z-[60] shadow-md flex justify-center items-center gap-2"
        >
          <span>SYSTEM V13.0</span>
          {isWideView && <Maximize2 size={8} />}
        </div>

        <div className="absolute top-12 left-0 right-0 flex flex-col items-center pointer-events-none z-[70] px-4 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 backdrop-blur-md w-full max-w-sm transition-all ${
                t.type === "success"
                  ? "bg-zinc-800/95 border-green-500 text-green-100"
                  : "bg-zinc-800/95 border-red-500 text-red-100"
              }`}
            >
              <Bell
                size={16}
                className={
                  t.type === "success" ? "text-green-500" : "text-red-500"
                }
              />
              <span className="text-xs font-bold leading-tight">{t.msg}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 w-full overflow-y-auto scroll-smooth relative bg-zinc-950 scrollbar-hide">
          <div className="min-h-full pb-20">
            {view === "login" && (
              <LoginScreen
                setView={setView}
                setCurrentUser={setCurrentUser}
                appConfig={appConfig}
                motoboys={motoboys}
                themeStyle={themeStyle}
                textThemeStyle={textThemeStyle}
              />
            )}
            {view === "customer" && (
              <CustomerApp
                {...commonProps}
                themeStyle={themeStyle}
                textThemeStyle={textThemeStyle}
              />
            )}
            {view === "admin" && (
              <AdminDashboard
                {...commonProps}
                themeStyle={themeStyle}
                textThemeStyle={textThemeStyle}
              />
            )}
            {view === "motoboy" && (
              <MotoboyApp
                user={currentUser}
                {...commonProps}
                themeStyle={themeStyle}
              />
            )}
            {view === "kitchen" && <KitchenDisplay {...commonProps} />}
          </div>
        </div>
      </div>
    </div>
  );
}
