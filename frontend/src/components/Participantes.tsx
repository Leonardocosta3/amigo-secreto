
import { useEffect, useState, type FormEvent } from "react";
import { UserPlus, Trash2, Users } from "lucide-react";
import { apiFetch } from "../services/api";

type Participante = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

interface ParticipantesProps {
  eventoId: number;
  onAtualizar?: () => void;
}

export default function Participantes({
  eventoId,
  onAtualizar
}: ParticipantesProps) {
  const [participantes, setParticipantes] =
    useState<Participante[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarParticipantes() {
    try {
      const dados = await apiFetch(
        `/api/participantes?eventoId=${eventoId}`
      );

      setParticipantes(dados);
    } catch (erro) {
      setParticipantes([]);
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar participantes."
      );
    }
  }

  useEffect(() => {
    void carregarParticipantes();
  }, [eventoId]);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!nome.trim() || carregando) return;

    setCarregando(true);
    setMensagem("");

    try {
      await apiFetch("/api/participantes", {
        method: "POST",
        body: JSON.stringify({
          eventoId,
          nome: nome.trim(),
          email: email.trim() || null,
          telefone: telefone.trim() || null
        })
      });

      setNome("");
      setEmail("");
      setTelefone("");

      await carregarParticipantes();
      onAtualizar?.();

      setMensagem("Participante cadastrado com sucesso!");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao cadastrar participante."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluir(id: number) {
    if (!window.confirm("Deseja excluir este participante?")) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      await apiFetch(`/api/participantes/${id}`, {
        method: "DELETE"
      });

      await carregarParticipantes();
      onAtualizar?.();

      setMensagem("Participante excluído com sucesso!");
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao excluir participante."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="painel">
      <div className="titulo-secao">
        <Users size={23} />
        <h2>Participantes do sorteio</h2>
      </div>

      <form onSubmit={cadastrar} className="form-participante">
        <input
          type="text"
          placeholder="Nome do participante"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="E-mail (opcional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Telefone (opcional)"
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
        />

        <button
          type="submit"
          className="botao-principal"
          disabled={carregando}
        >
          <UserPlus size={18} />
          Adicionar participante
        </button>
      </form>

      {mensagem && (
        <p className="mensagem">{mensagem}</p>
      )}

      <div className="lista-restricoes">
        {participantes.map(p => (
          <div className="restricao" key={p.id}>
            <div>
              <strong>{p.nome}</strong>
              <p className="descricao">
                {p.email || "Sem e-mail"}
              </p>
            </div>

            <button
              type="button"
              className="botao-excluir"
              onClick={() => excluir(p.id)}
              disabled={carregando}
              title="Excluir participante"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {participantes.length === 0 && (
        <p className="descricao">
          Nenhum participante cadastrado.
        </p>
      )}
    </section>
  );
}
