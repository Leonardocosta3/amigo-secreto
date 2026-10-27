
import { useEffect, useState, type FormEvent } from "react";
import { Gift, LogOut, Plus, Users } from "lucide-react";

import { apiFetch } from "../services/api";
import type { Usuario } from "./Login";

interface Evento {
  id: number;
  nome: string;
  descricao: string | null;
  _count: {
    participantes: number;
  };
}

interface PainelProps {
  usuario: Usuario;
  onSair: () => void;
  onSelecionarEvento: (id: number) => void;
}

export default function Painel({
  usuario,
  onSair,
  onSelecionarEvento
}: PainelProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [nomeEvento, setNomeEvento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarEventos() {
    setCarregando(true);

    try {
      const dados = await apiFetch("/api/eventos");
      setEventos(dados);
      setErro("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar eventos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarEventos();
  }, []);

  async function criarEvento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!nomeEvento.trim() || salvando) return;

    setSalvando(true);
    setErro("");

    try {
      await apiFetch("/api/eventos", {
        method: "POST",
        body: JSON.stringify({
          nome: nomeEvento.trim()
        })
      });

      setNomeEvento("");
      await carregarEventos();

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao criar evento."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="painel-page">
      <header className="painel-header">
        <div className="painel-brand">
          <Gift size={28} />
          <strong>Amigo Secreto Inteligente</strong>
        </div>

        <div className="painel-user">
          <span>Olá, {usuario.nome}</span>

          <button
            type="button"
            className="logout-button"
            onClick={onSair}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </header>

      <main className="painel-main">
        <h1>Meus sorteios</h1>
        <p>
          Crie um novo evento ou selecione um sorteio existente.
        </p>

        <form className="novo-evento" onSubmit={criarEvento}>
          <input
            type="text"
            placeholder="Nome do novo evento"
            value={nomeEvento}
            onChange={e => setNomeEvento(e.target.value)}
            required
          />

          <button type="submit" disabled={salvando}>
            <Plus size={18} />
            {salvando ? "Criando..." : "Criar evento"}
          </button>
        </form>

        {erro && <p className="login-error">{erro}</p>}

        {carregando ? (
          <p>Carregando eventos...</p>
        ) : eventos.length === 0 ? (
          <div className="evento-vazio">
            Você ainda não possui eventos cadastrados.
          </div>
        ) : (
          <div className="eventos-grid">
            {eventos.map(evento => (
              <article className="evento-card" key={evento.id}>
                <Gift size={30} />

                <h3>{evento.nome}</h3>
                <p>{evento.descricao || "Sem descrição"}</p>

                <div className="evento-participantes">
                  <Users size={17} />
                  {evento._count.participantes} participantes
                </div>

                <button
                  type="button"
                  onClick={() => onSelecionarEvento(evento.id)}
                >
                  Gerenciar sorteio
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
