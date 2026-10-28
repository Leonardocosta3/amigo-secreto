import { useEffect, useState } from "react";

import Login, { type Usuario } from "./components/Login";
import Painel from "./components/Painel";
import Restricoes from "./components/Restricoes";
import Resultado from "./components/Resultado";

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

  const caminho = window.location.pathname;

  const tokenResultado = caminho.match(
    /^\/resultado\/([a-fA-F0-9]{64})\/?$/
  )?.[1];

  useEffect(() => {
    async function verificarSessao() {
      if (tokenResultado) {
        setVerificando(false);
        return;
      }

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
  }, [tokenResultado]);

  function sair() {
    removerToken();
    setUsuario(null);
    setEventoId(null);
  }

  if (tokenResultado) {
    return <Resultado token={tokenResultado} />;
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