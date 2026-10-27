
import { useEffect, useState } from "react";

import Login, { type Usuario } from "./components/Login";
import Painel from "./components/Painel";
import Restricoes from "./components/Restricoes";

import {
  apiFetch,
  obterToken,
  removerToken
} from "./services/api";

import "./App.css";

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      if (!obterToken()) {
        setVerificando(false);
        return;
      }

      try {
        const dados = await apiFetch("/api/auth/me");
        setUsuario(dados.usuario);
      } catch {
        removerToken();
        setUsuario(null);
      } finally {
        setVerificando(false);
      }
    }

    void verificarSessao();
  }, []);

  function sair() {
    removerToken();
    setUsuario(null);
    setEventoId(null);
  }

  if (verificando) {
    return (
      <div className="loading-page">
        Verificando sessão...
      </div>
    );
  }

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  if (eventoId !== null) {
    return (
      <Restricoes
        eventoId={eventoId}
        onVoltar={() => setEventoId(null)}
      />
    );
  }

  return (
    <Painel
      usuario={usuario}
      onSair={sair}
      onSelecionarEvento={setEventoId}
    />
  );
}
