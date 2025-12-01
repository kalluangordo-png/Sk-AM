import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Lock,
  Utensils,
  Bike,
  ChevronRight,
} from "lucide-react";

export default function LoginScreen({
  setView,
  setCurrentUser,
  appConfig,
  motoboys,
  themeStyle,
  textThemeStyle,
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // --- SENHAS ---
  const SENHA_ADMIN = "sk2024";
  const SENHA_COZINHA = "1234";

  const config = {
    ...appConfig,
    storeName: "SK BURGERS", // Nome interno
    openHour: appConfig?.openHour || 18,
    closeHour: appConfig?.closeHour || 23,
    forceClose: appConfig?.forceClose || false,
  };

  const currentHour = new Date().getHours();
  const isOpen =
    !config.forceClose &&
    currentHour >= config.openHour &&
    currentHour < config.closeHour;

  // Monitora o campo de login
  useEffect(() => {
    const term = login.trim().toLowerCase();
    if (term === "admin" || term === "cozinha") {
      setShowPasswordInput(true);
    } else {
      setShowPasswordInput(false);
      setPassword("");
    }
  }, [login]);

  const handleLogin = () => {
    const term = login.trim().toLowerCase();

    if (term === "admin") {
      if (password === SENHA_ADMIN) {
        setCurrentUser({ name: "Dono", role: "admin" });
        setView("admin");
      } else {
        alert("Senha incorreta!");
      }
      return;
    }

    if (term === "cozinha") {
      if (password === SENHA_COZINHA) {
        setCurrentUser({ name: "Cozinha", role: "kitchen" });
        setView("kitchen");
      } else {
        alert("Senha da cozinha incorreta!");
      }
      return;
    }

    performUserLogin(term);
  };

  const handleQuickLogin = (term) => {
    setLogin(term);
    if (term === "cozinha") {
      return;
    }
    performUserLogin(term);
  };

  const performUserLogin = (term) => {
    const moto = motoboys.find((m) => m.login === term);
    if (moto) {
      setCurrentUser({ ...moto, role: "motoboy" });
      setView("motoboy");
    } else if (term !== "admin" && term !== "cozinha") {
      alert("Usuário não encontrado.");
    }
  };

  return (
    <div className="min-h-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans text-white h-full">
      {/* 1. IMAGEM DE FUNDO */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1080&fit=max"
          alt="Background Burger"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 w-full max-w-sm p-6 flex flex-col items-center">
        {/* LOGO: SK (Texto) + BURGERS (Texto) - SEM ÍCONES */}
        <div className="mb-10 flex flex-col items-center animate-in slide-in-from-top-10 duration-1000">
          <div className="w-28 h-28 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.6)] border-4 border-black mb-4 relative">
            {/* AQUI ESTÁ A MUDANÇA: VOLTA O TEXTO "SK" */}
            <span className="font-black text-6xl text-black tracking-tighter mt-1">
              SK
            </span>
          </div>
          <h1
            className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl uppercase"
            style={{ textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}
          >
            BURGERS
          </h1>
          <div className="h-1 w-32 bg-yellow-500 rounded-full mt-2 shadow-[0_0_15px_rgba(234,179,8,0.8)]"></div>
        </div>

        {/* STATUS DA LOJA */}
        <div
          className={`mb-8 px-5 py-2 rounded-full border backdrop-blur-xl flex items-center gap-2 text-xs font-black tracking-widest shadow-2xl uppercase ${
            isOpen
              ? "bg-green-500/20 border-green-500 text-green-400 shadow-green-500/20"
              : "bg-red-500/20 border-red-500 text-red-400 shadow-red-500/20"
          }`}
        >
          {isOpen ? (
            <>
              <Clock size={14} /> ABERTO AGORA
            </>
          ) : (
            <>
              <Lock size={14} /> FECHADO • ABRE ÀS {config.openHour}H
            </>
          )}
        </div>

        {/* BOTÃO CLIENTE */}
        <button
          onClick={() => setView("customer")}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(234,179,8,0.4)] transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mb-12 group border-2 border-yellow-400"
        >
          FAZER PEDIDO{" "}
          <ArrowRight
            className="group-hover:translate-x-2 transition"
            size={28}
            strokeWidth={3}
          />
        </button>

        {/* ÁREA DA EQUIPE */}
        <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-1000 delay-200">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 text-center border-b border-white/5 pb-2">
            Área Restrita da Equipe
          </p>

          <div className="flex gap-2 mb-4">
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Login..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-500/50 focus:bg-black/80 transition"
            />
            <button
              onClick={handleLogin}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition border border-white/10 flex items-center justify-center"
            >
              <ChevronRight />
            </button>
          </div>

          {/* CAMPO DE SENHA (CONDICIONAL) */}
          {showPasswordInput && (
            <div className="animate-in fade-in slide-in-from-top-2 mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  login === "admin" ? "Senha Admin" : "Senha da Cozinha"
                }
                className="w-full bg-black/50 border border-red-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500"
              />
              {login === "cozinha" && (
                <p className="text-[10px] text-zinc-500 mt-1 ml-1">
                  Dica: a senha é 1234
                </p>
              )}
            </div>
          )}

          {/* ATALHOS RÁPIDOS */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleQuickLogin("cozinha")}
              className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/5 transition active:scale-95"
            >
              <Utensils size={16} className="text-orange-500 mb-1" />
              <span className="text-[9px] text-zinc-300 font-bold">
                COZINHA
              </span>
            </button>
            {motoboys &&
              motoboys.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleQuickLogin(m.login)}
                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/5 transition active:scale-95"
                >
                  <Bike size={16} className="text-blue-500 mb-1" />
                  <span className="text-[9px] text-zinc-300 font-bold">
                    {m.name.split(" ")[0].toUpperCase()}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>

      <p className="absolute bottom-4 text-[10px] text-zinc-600 font-bold opacity-50">
        SYSTEM V12.9
      </p>
    </div>
  );
}
