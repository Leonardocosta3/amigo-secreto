

import Participantes from "./Participantes";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  House,
  Plus,
  Trash2,
  Users
} from "lucide-react";

import { apiFetch } from "../services/api";
import "../App.css";

// Tipos
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

// Propriedades recebidas do App.tsx
interface RestricoesProps {
  eventoId: number;
  onVoltar: () => void;
}

export default function Restricoes({
  eventoId,
  onVoltar
}: RestricoesProps) {

  // Estados
  const [participantes, setParticipantes] =
    useState<Participante[]>([]);

  const [restricoes, setRestricoes] =
    useState<Restricao[]>([]);

  const [selecionados, setSelecionados] =
    useState<number[]>([]);

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  // CARREGAR PARTICIPANTES E RESTRIÇÕES
  async function carregarDados() {
    setCarregando(true);
    setMensagem("");

    try {
      const [dadosParticipantes, dadosRestricoes] =
        await Promise.all([
          apiFetch(
            `/api/participantes?eventoId=${eventoId}`
          ),
          apiFetch(
            `/api/restricoes?eventoId=${eventoId}`
          )
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

  // ATUALIZAR AO SELECIONAR UM EVENTO
  useEffect(() => {
    setSelecionados([]);
    void carregarDados();
  }, [eventoId]);

  // SELECIONAR OU DESMARCAR PARTICIPANTE
  function alternarSelecao(id: number) {
    setSelecionados(atual =>
      atual.includes(id)
        ? atual.filter(item => item !== id)
        : [...atual, id]
    );
  }

  // ADICIONAR RESTRIÇÕES ENTRE PESSOAS DA MESMA CASA
  async function adicionarRestricoes() {

    if (selecionados.length < 2) {
      setMensagem(
        "Selecione pelo menos duas pessoas."
      );
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      // Restrições proibidas já cadastradas
      const existentes = new Set(
        restricoes
          .filter(r => r.tipo === "PROIBIDO")
          .map(
            r =>
              `${r.participanteId}-${r.destinatarioId}`
          )
      );

      // Lista de novas restrições
      const novas: Array<{
        eventoId: number;
        participanteId: number;
        destinatarioId: number;
        tipo: "PROIBIDO";
      }> = [];

      // Criar restrições nos dois sentidos
      for (const origem of selecionados) {
        for (const destino of selecionados) {

          // Uma pessoa não pode restringir a si mesma
          if (origem === destino) {
            continue;
          }

          const chave = `${origem}-${destino}`;

          // Evitar duplicação
          if (!existentes.has(chave)) {
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
        setMensagem(
          "Todas essas restrições já estão cadastradas."
        );
        return;
      }

      // Salvar restrições no backend
      for (const restricao of novas) {
        await apiFetch("/api/restricoes", {
          method: "POST",
          body: JSON.stringify(restricao)
        });
      }

      // Limpar seleção
      setSelecionados([]);

      // Atualizar lista
      await carregarDados();

      setMensagem(
        "Restrições cadastradas com sucesso!"
      );

    } catch (erro) {
      // Atualizar a lista para refletir possíveis
      // restrições já salvas antes de um erro
      await carregarDados();

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro inesperado ao cadastrar restrições."
      );

    } finally {
      setCarregando(false);
    }
  }

  // EXCLUIR RESTRIÇÃO
  async function excluirRestricao(id: number) {

    if (
      !window.confirm(
        "Deseja excluir esta restrição?"
      )
    ) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      await apiFetch(
        `/api/restricoes/${id}`,
        {
          method: "DELETE"
        }
      );

      await carregarDados();

      setMensagem(
        "Restrição excluída com sucesso!"
      );

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

  // OBTER NOME DO PARTICIPANTE PELO ID
  function nomeParticipante(id: number) {
    return (
      participantes.find(
        p => p.id === id
      )?.nome ?? `ID ${id}`
    );
  }

  // RESTRIÇÕES PROIBIDAS
  const restricoesProibidas =
    restricoes.filter(
      r => r.tipo === "PROIBIDO"
    );

  return (
    <main className="pagina">

      {/* CABEÇALHO */}
      <header className="cabecalho">

        <button
          type="button"
          onClick={onVoltar}
          className="botao-voltar"
          title="Voltar aos sorteios"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="icone-principal">
          <Users size={30} />
        </div>

        <div>
          <h1>
            Amigo Secreto Inteligente
          </h1>

          <p>
            Gerencie as restrições do seu sorteio familiar.
          </p>

          <p className="descricao">
            Evento #{eventoId}
          </p>
        </div>
      </header>
      <Participantes
        eventoId={eventoId}
        onAtualizar={() => void carregarDados()}
/>
      {/* PESSOAS DA MESMA CASA */}
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

              <label
                className="participante"
                key={p.id}
              >
                <input
                  type="checkbox"
                  checked={
                    selecionados.includes(p.id)
                  }
                  onChange={() =>
                    alternarSelecao(p.id)
                  }
                  disabled={carregando}
                />

                <span>{p.nome}</span>
              </label>

            ))}

        </div>

        {participantes.filter(p => p.ativo).length === 0 &&
          !carregando && (
            <p className="descricao">
              Nenhum participante ativo encontrado.
            </p>
          )
        }

        <button
          type="button"
          className="botao-principal"
          onClick={adicionarRestricoes}
          disabled={
            carregando ||
            selecionados.length < 2
          }
        >
          <Plus size={18} />
          Adicionar restrições
        </button>

      </section>

      {/* RESTRIÇÕES CADASTRADAS */}
      <section className="painel">

        <div className="titulo-secao">
          <House size={23} />
          <h2>Restrições cadastradas</h2>
        </div>

        {restricoesProibidas.length === 0 ? (

          <p className="descricao">
            Nenhuma restrição cadastrada.
          </p>

        ) : (

          <div className="lista-restricoes">

            {restricoesProibidas.map(r => (

              <div
                className="restricao"
                key={r.id}
              >

                <span>
                  {nomeParticipante(
                    r.participanteId
                  )}

                  {" → "}

                  {nomeParticipante(
                    r.destinatarioId
                  )}
                </span>

                <button
                  type="button"
                  className="botao-excluir"
                  onClick={() =>
                    excluirRestricao(r.id)
                  }
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

      {/* MENSAGENS */}
      {mensagem && (
        <p className="mensagem">
          {mensagem}
        </p>
      )}

      {carregando && (
        <p className="descricao">
          Processando...
        </p>
      )}

    </main>
  );
}
