import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";

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
  const [appConfig, setAppConfig] = useState(INITIAL_CONFIG);
  const [motoboys, setMotoboys] = useState(INITIAL_MOTOBOYS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);

  const [myOrderIds, setMyOrderIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sk_my_order_ids_v3")) || [];
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
      const localMenu = localStorage.getItem("sk_menu_v11");
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
          localStorage.setItem("sk_menu_v11", JSON.stringify(data));
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
          if (data.config) setAppConfig({ ...INITIAL_CONFIG, ...data.config });
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
              config: INITIAL_CONFIG,
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
    localStorage.setItem("sk_my_order_ids_v3", JSON.stringify(myOrderIds));
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
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center relative z-10 shadow-2xl">
            <span className="font-black text-4xl text-white">SK</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="text-yellow-500 animate-spin" size={32} />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
            Carregando Sistema...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans relative overflow-hidden flex flex-col">
      <div
        style={themeStyle}
        className="text-black text-[10px] font-bold text-center py-1 z-[60] shadow-lg"
      >
        SK SYSTEM V12.5 • FINAL
      </div>
      <div className="fixed top-10 right-0 left-0 flex flex-col items-center pointer-events-none z-[70]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`mt-2 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce border-l-4 backdrop-blur-md ${
              t.type === "success"
                ? "bg-zinc-800/90 border-green-500"
                : "bg-zinc-800/90 border-red-500"
            }`}
          >
            <Bell
              size={14}
              className={
                t.type === "success" ? "text-green-500" : "text-red-500"
              }
            />
            <span className="text-xs font-bold">{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "login" && (
          <LoginScreen
            setView={setView}
            setCurrentUser={setCurrentUser} // <--- AQUI ESTÁ A CORREÇÃO!
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
  );
}
