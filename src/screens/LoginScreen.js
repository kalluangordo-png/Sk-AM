import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Lock,
  Utensils,
  ChevronRight,
  Box,
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
  const SENHA_EQUIPE = "123";

  const config = {
    ...appConfig,
    storeName: "SK BURGERS",
    openHour: appConfig?.openHour || 18,
    closeHour: appConfig?.closeHour || 23,
    forceClose: appConfig?.forceClose || false,
  };

  const currentHour = new Date().getHours();
  const isOpen =
    !config.forceClose &&
    currentHour >= config.openHour &&
    currentHour < config.closeHour;

  useEffect(() => {
    const term = login.trim().toLowerCase();
    const isMotoboy = motoboys.find((m) => m.login === term);

    if (term === "admin" || term === "cozinha" || isMotoboy) {
      setShowPasswordInput(true);
    } else {
      setShowPasswordInput(false);
      setPassword("");
    }
  }, [login, motoboys]);

  const handleLogin = () => {
    const term = login.trim().toLowerCase();

    if (term === "admin") {
      if (password === SENHA_ADMIN) {
        setCurrentUser({ name: "Dono", role: "admin" });
        setView("admin");
      } else {
        alert("Senha de Admin incorreta!");
      }
      return;
    }

    if (term === "cozinha") {
      if (password === SENHA_EQUIPE) {
        setCurrentUser({ name: "Cozinha", role: "kitchen" });
        setView("kitchen");
      } else {
        alert("Senha incorreta!");
      }
      return;
    }

    const moto = motoboys.find((m) => m.login === term);
    if (moto) {
      if (password === SENHA_EQUIPE) {
        setCurrentUser({ ...moto, role: "motoboy" });
        setView("motoboy");
      } else {
        alert("Senha incorreta!");
      }
      return;
    }

    alert("Usuário não encontrado.");
  };

  return (
    <div className="min-h-full bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden font-sans text-white h-full">
      {/* 1. FUNDO VIVO */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1080&q=80"
          alt="Background Burger"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 w-full max-w-sm p-6 flex flex-col items-center">
        {/* LOGO NEON */}
        <div className="mb-10 flex items-center gap-4 animate-in slide-in-from-top-10 duration-1000 pb-6 border-b border-white/20 w-full justify-center">
          {/* Caixa SK com brilho forte */}
          <div className="bg-yellow-500 p-3 rounded-xl border-2 border-yellow-300 shadow-[0_0_50px_#EAB308]">
            <span className="font-black text-4xl text-black tracking-tighter leading-none block pt-1">
              SK
            </span>
          </div>
          <div className="flex flex-col">
            {/* Texto BURGERS com brilho amarelo neon */}
            <h1
              className="text-5xl font-black text-white tracking-tighter leading-none"
              style={{ textShadow: "0 0 30px rgba(234, 179, 8, 0.8)" }}
            >
              BURGERS
            </h1>
            <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-[0.4em] mt-1 pl-1 drop-shadow-lg">
              Delivery System
            </span>
          </div>
        </div>

        {/* STATUS */}
        <div className="w-full flex justify-center mb-10">
          <div
            className={`px-6 py-3 rounded-full border backdrop-blur-md flex items-center gap-3 text-xs font-black tracking-widest shadow-2xl uppercase transition-all ${
              isOpen
                ? "bg-green-950/60 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                : "bg-red-950/60 border-red-500 text-red-400"
            }`}
          >
            {isOpen ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LOJA ABERTA
              </>
            ) : (
              <>
                <Lock size={14} /> FECHADO • ABRE ÀS {config.openHour}H
              </>
            )}
          </div>
        </div>

        {/* BOTÃO PRINCIPAL */}
        <button
          onClick={() => setView("customer")}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(234,179,8,0.5)] transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-between px-6 mb-16 group border-2 border-yellow-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10 flex items-center gap-2">
            <Utensils size={20} className="text-black/50" />
            FAZER PEDIDO
          </span>
          <div className="bg-black/10 p-2 rounded-full relative z-10 group-hover:bg-black/20 transition">
            <ArrowRight size={24} strokeWidth={3} />
          </div>
        </button>

        {/* ÁREA DA EQUIPE (COMPACTA) */}
        <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-1000 delay-200 shadow-xl">
          <div className="bg-black/40 p-2 border-b border-white/5 flex items-center justify-center gap-2">
            <Box size={12} className="text-zinc-500" />
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
              Acesso Equipe
            </p>
          </div>

          <div className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="ID (ex: cozinha)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-yellow-500/50 focus:bg-black/50 transition pl-8"
                />
                <Lock
                  size={14}
                  className="absolute left-2.5 top-2.5 text-zinc-600"
                />
              </div>
              <button
                onClick={handleLogin}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg transition border border-white/10 flex items-center justify-center active:scale-95"
              >
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {showPasswordInput && (
              <div className="animate-in fade-in slide-in-from-top-2 mt-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a Senha"
                  className="w-full bg-white/5 border border-red-500/50 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 text-center tracking-widest"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
