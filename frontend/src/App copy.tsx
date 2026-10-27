import { useEffect, useState } from "react";
import { House, Plus, Trash2, Users } from "lucide-react";
import "./App.css";
import { apiFetch } from "./services/api";


type Participante = {
  id: number;
  nome: string;
  ativo: boolean;
};

type Restricao = {
  id: number;
  participanteId: number;
  destinatarioId: number;
  tipo: "PERMITIDO" | "PROIBIDO";
};

export default function App() {
  const [eventoId, setEventoId] = useState(1);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
  setCarregando(true);
  setMensagem("");

  try {
    const [dadosParticipantes, dadosRestricoes] =
      await Promise.all([
        apiFetch(`/api/participantes?eventoId=${eventoId}`),
        apiFetch(`/api/restricoes?eventoId=${eventoId}`)
      ]);

    setParticipantes(dadosParticipantes);
    setRestricoes(dadosRestricoes);

  } catch (erro) {
    setParticipantes([]);
    setRestricoes([]);
    setMensagem(
      erro instanceof Error
        ? erro.message
        : "Erro ao carregar os dados."
    );
  } finally {
    setCarregando(false);
  }
}

  useEffect(() => {
    void carregarDados();
  }, [eventoId]);

  function alternarSelecao(id: number) {
    setSelecionados(atual =>
      atual.includes(id)
        ? atual.filter(item => item !== id)
        : [...atual, id]
    );
  }

  async function adicionarRestricoes() {
    if (selecionados.length < 2) {
      setMensagem("Selecione pelo menos duas pessoas.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const existentes = new Set(
        restricoes
          .filter(r => r.tipo === "PROIBIDO")
          .map(r => `${r.participanteId}-${r.destinatarioId}`)
      );

      const novas: Array<{
        eventoId: number;
        participanteId: number;
        destinatarioId: number;
        tipo: "PROIBIDO";
      }> = [];

      for (const origem of selecionados) {
        for (const destino of selecionados) {
          if (origem === destino) continue;

          if (!existentes.has(`${origem}-${destino}`)) {
            novas.push({
              eventoId,
              participanteId: origem,
              destinatarioId: destino,
              tipo: "PROIBIDO"
            });
          }
        }
      }

      if (novas.length === 0) {
        setMensagem("Todas essas restrições já estão cadastradas.");
        return;
      }

      for (const restricao of novas) {
        const resposta = await apiFetch("/api/restricoes", {
                method: "POST",
                body: JSON.stringify(restricao)
            });

        if (!resposta.ok) {
          const dados = await resposta.json();
          throw new Error(dados.erro || "Erro ao cadastrar restrição.");
        }
      }

      setSelecionados([]);
      await carregarDados();
      setMensagem("Restrições cadastradas com sucesso!");
    } catch (erro) {
      await carregarDados();
      setMensagem(
        erro instanceof Error ? erro.message : "Erro inesperado."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluirRestricao(id: number) {
  if (!window.confirm("Deseja excluir esta restrição?")) {
    return;
  }

  setCarregando(true);
  setMensagem("");

  try {
    // Excluir restrição no banco de dados
    await apiFetch(`/api/restricoes/${id}`, {
      method: "DELETE"
    });

    // Atualizar participantes e restrições
    await carregarDados();

    // Exibir mensagem de sucesso
    setMensagem("Restrição excluída com sucesso!");

  } catch (erro) {
    setMensagem(
      erro instanceof Error
        ? erro.message
        : "Erro inesperado ao excluir restrição."
    );
  } finally {
    setCarregando(false);
  }
}

  function nomeParticipante(id: number) {
    return participantes.find(p => p.id === id)?.nome ?? `ID ${id}`;
  }

  return (
    <main className="pagina">
      <header className="cabecalho">
        <div className="icone-principal">
          <Users size={30} />
        </div>
        <div>
          <h1>Amigo Secreto Inteligente</h1>
          <p>Gerencie as restrições do seu sorteio familiar.</p>
        </div>
      </header>

      <section className="painel">
        <label htmlFor="evento">ID do evento</label>
        <input
          id="evento"
          type="number"
          min="1"
          value={eventoId}
          onChange={e => {
            const id = Number(e.target.value);
            if (Number.isInteger(id) && id > 0) {
              setEventoId(id);
              setSelecionados([]);
            }
          }}
        />
      </section>

      <section className="painel">
        <div className="titulo-secao">
          <House size={23} />
          <h2>Pessoas da mesma casa</h2>
        </div>

        <p className="descricao">
          Selecione todas as pessoas que moram juntas.
          O sistema impedirá que elas se sorteiem entre si.
        </p>

        <div className="participantes">
          {participantes
            .filter(p => p.ativo)
            .map(p => (
              <label className="participante" key={p.id}>
                <input
                  type="checkbox"
                  checked={selecionados.includes(p.id)}
                  onChange={() => alternarSelecao(p.id)}
                  disabled={carregando}
                />
                <span>{p.nome}</span>
              </label>
            ))}
        </div>

        <button
          className="botao-principal"
          onClick={adicionarRestricoes}
          disabled={carregando || selecionados.length < 2}
        >
          <Plus size={18} />
          Adicionar restrições
        </button>
      </section>

      <section className="painel">
        <div className="titulo-secao">
          <House size={23} />
          <h2>Restrições cadastradas</h2>
        </div>

        {restricoes.filter(r => r.tipo === "PROIBIDO").length === 0 ? (
          <p className="descricao">Nenhuma restrição cadastrada.</p>
        ) : (
          <div className="lista-restricoes">
            {restricoes
              .filter(r => r.tipo === "PROIBIDO")
              .map(r => (
                <div className="restricao" key={r.id}>
                  <span>
                    {nomeParticipante(r.participanteId)}
                    {" → "}
                    {nomeParticipante(r.destinatarioId)}
                  </span>

                  <button
                    className="botao-excluir"
                    onClick={() => excluirRestricao(r.id)}
                    disabled={carregando}
                    title="Excluir restrição"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      {mensagem && <p className="mensagem">{mensagem}</p>}
      {carregando && <p className="descricao">Processando...</p>}
    </main>
  );
}