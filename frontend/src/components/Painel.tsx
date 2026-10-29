
import { useEffect, useState, type FormEvent } from "react";
import {
  Gift,
  LogOut,
  Plus,
  Users,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";

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
  const [excluindo, setExcluindo] = useState(false);
  const [eventoParaExcluir, setEventoParaExcluir] =
    useState<Evento | null>(null);
  const [confirmacao, setConfirmacao] = useState("");
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

  async function criarEvento(
    evento: FormEvent<HTMLFormElement>
  ) {
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

  function abrirConfirmacao(evento: Evento) {
    setEventoParaExcluir(evento);
    setConfirmacao("");
    setErro("");
  }

  function fecharConfirmacao() {
    if (excluindo) return;

    setEventoParaExcluir(null);
    setConfirmacao("");
  }

  async function excluirEvento() {
    if (
      !eventoParaExcluir ||
      excluindo ||
      confirmacao !== eventoParaExcluir.nome
    ) {
      return;
    }

    setExcluindo(true);
    setErro("");

    try {
      await apiFetch(
        `/api/eventos/${eventoParaExcluir.id}`,
        {
          method: "DELETE"
        }
      );

      // Atualizar a lista somente após a exclusão
      // ter sido confirmada pelo backend.
      setEventos(anteriores =>
        anteriores.filter(
          evento => evento.id !== eventoParaExcluir.id
        )
      );

      setEventoParaExcluir(null);
      setConfirmacao("");

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir evento."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="painel-page">
      <header className="painel-header">
        <div className="painel-brand">
          <Gift size={28} />
          <strong>Amigo Secreto 2026</strong>
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

        <form
          className="novo-evento"
          onSubmit={criarEvento}
        >
          <input
            type="text"
            placeholder="Nome do novo evento"
            value={nomeEvento}
            onChange={e => setNomeEvento(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={salvando}
          >
            <Plus size={18} />
            {salvando ? "Criando..." : "Criar evento"}
          </button>
        </form>

        {erro && (
          <p className="login-error" role="alert">
            {erro}
          </p>
        )}

        {carregando ? (
          <p>Carregando eventos...</p>
        ) : eventos.length === 0 ? (
          <div className="evento-vazio">
            Você ainda não possui eventos cadastrados.
          </div>
        ) : (
          <div className="eventos-grid">
            {eventos.map(evento => (
              <article
                className="evento-card"
                key={evento.id}
              >
                <Gift size={30} />

                <h3>{evento.nome}</h3>

                <p>
                  {evento.descricao || "Sem descrição"}
                </p>

                <div className="evento-participantes">
                  <Users size={17} />
                  {evento._count.participantes} participantes
                </div>

                <div className="evento-acoes">
                  <button
                    type="button"
                    onClick={() =>
                      onSelecionarEvento(evento.id)
                    }
                  >
                    Gerenciar sorteio
                  </button>

                  <button
                    type="button"
                    className="evento-botao-excluir"
                    onClick={() =>
                      abrirConfirmacao(evento)
                    }
                  >
                    <Trash2 size={17} />
                    Excluir evento
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* JANELA DE CONFIRMAÇÃO */}
      {eventoParaExcluir && (
        <div
          className="excluir-evento-overlay"
          role="presentation"
        >
          <div
            className="excluir-evento-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-evento"
          >
            <div className="excluir-evento-topo">
              <AlertTriangle size={35} />

              <button
                type="button"
                className="excluir-evento-fechar"
                onClick={fecharConfirmacao}
                disabled={excluindo}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <h2 id="titulo-excluir-evento">
              Excluir evento?
            </h2>

            <p>
              Você está prestes a excluir permanentemente:
            </p>

            <strong>{eventoParaExcluir.nome}</strong>

            <p>
              Todos os participantes, restrições,
              resultados do sorteio e acessos individuais
              serão excluídos.
            </p>

            <p>
              <strong>
                Esta ação não poderá ser desfeita.
              </strong>
            </p>

            <label htmlFor="confirmar-nome-evento">
              Digite o nome do evento para confirmar:
            </label>

            <input
              id="confirmar-nome-evento"
              type="text"
              value={confirmacao}
              onChange={e =>
                setConfirmacao(e.target.value)
              }
              placeholder={eventoParaExcluir.nome}
              autoComplete="off"
              disabled={excluindo}
            />

            {erro && (
              <p
                className="login-error"
                role="alert"
              >
                {erro}
              </p>
            )}

            <div className="excluir-evento-botoes">
              <button
                type="button"
                className="excluir-evento-cancelar"
                onClick={fecharConfirmacao}
                disabled={excluindo}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="excluir-evento-confirmar"
                onClick={() => void excluirEvento()}
                disabled={
                  excluindo ||
                  confirmacao !== eventoParaExcluir.nome
                }
              >
                <Trash2 size={17} />
                {excluindo
                  ? "Excluindo..."
                  : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
