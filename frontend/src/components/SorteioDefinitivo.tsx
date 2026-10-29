
import { useEffect, useState } from "react";

import {
  Gift,
  Shuffle,
  MessageCircle,
  Copy,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Users,
  Link2,
  AlertCircle
} from "lucide-react";

import { apiFetch } from "../services/api";

interface ParticipanteLink {
  participanteId: number;
  nome: string;
  telefone: string | null;
  token: string | null;
}

interface ResultadoItem {
  participanteId: number;
  participante: string;
  telefone: string | null;
  sorteadoId: number;
  sorteado: string;
}

interface RespostaStatus {
  realizado: boolean;
  realizadoEm: string | null;
  participantes: ParticipanteLink[];
}

interface RespostaSorteio {
  mensagem: string;
  totalParticipantes: number;
  links: {
    participanteId: number;
    token: string;
  }[];
}

interface RespostaResultados {
  evento: string;
  realizadoEm: string;
  totalParticipantes: number;
  resultados: ResultadoItem[];
}

interface SorteioDefinitivoProps {
  eventoId: number;
}

type Visualizacao = "links" | "individual" | "completo";

export default function SorteioDefinitivo({
  eventoId
}: SorteioDefinitivoProps) {
  const [realizado, setRealizado] = useState(false);
  const [realizadoEm, setRealizadoEm] = useState<string | null>(null);

  const [links, setLinks] = useState<ParticipanteLink[]>([]);
  const [resultados, setResultados] = useState<ResultadoItem[]>([]);

  const [visualizacao, setVisualizacao] =
    useState<Visualizacao>("links");

  const [participanteSelecionado, setParticipanteSelecionado] =
    useState<number | null>(null);

  const [revelado, setRevelado] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [consultando, setConsultando] = useState(true);
  const [consultandoResultados, setConsultandoResultados] =
    useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  // CARREGAR STATUS AO ABRIR O EVENTO
  useEffect(() => {
    let ativo = true;

    async function carregarStatus() {
      setConsultando(true);
      setMensagem("");
      setErro(false);
      setRealizado(false);
      setRealizadoEm(null);
      setLinks([]);
      setResultados([]);
      setVisualizacao("links");
      setParticipanteSelecionado(null);
      setRevelado(false);

      try {
        const dados = await apiFetch(
          `/api/sorteio/status/${eventoId}`
        ) as RespostaStatus;

        if (!ativo) return;

        setRealizado(dados.realizado);
        setRealizadoEm(dados.realizadoEm ?? null);
        setLinks(dados.participantes ?? []);
      } catch (error) {
        if (!ativo) return;

        setErro(true);
        setMensagem(
          error instanceof Error
            ? error.message
            : "Erro ao consultar o sorteio."
        );
      } finally {
        if (ativo) setConsultando(false);
      }
    }

    void carregarStatus();

    return () => {
      ativo = false;
    };
  }, [eventoId]);

  // REALIZAR SORTEIO DEFINITIVO
  async function realizarSorteio() {
    if (carregando) return;

    const confirmou = window.confirm(
      "Deseja realizar o sorteio definitivo?\n\n" +
      "O resultado será permanente e não poderá ser refeito."
    );

    if (!confirmou) return;

    setCarregando(true);
    setMensagem("");
    setErro(false);

    try {
      const dados = await apiFetch(
        `/api/sorteio/realizar/${eventoId}`,
        { method: "POST" }
      ) as RespostaSorteio;

      const tokens = new Map(
        dados.links.map(item => [
          item.participanteId,
          item.token
        ])
      );

      setRealizado(true);
      setRealizadoEm(new Date().toISOString());

      try {
        const status = await apiFetch(
          `/api/sorteio/status/${eventoId}`
        ) as RespostaStatus;

        setRealizadoEm(status.realizadoEm ?? null);

        setLinks(
          status.participantes.map(item => ({
            ...item,
            token: tokens.get(item.participanteId) ?? null
          }))
        );

        setMensagem(
          "Sorteio realizado! Copie os links dos participantes."
        );
      } catch {
        setLinks(
          dados.links.map(item => ({
            participanteId: item.participanteId,
            nome: `Participante ${item.participanteId}`,
            telefone: null,
            token: item.token
          }))
        );

        setMensagem(
          "O sorteio foi realizado, mas houve um erro " +
          "ao consultar os participantes. " +
          "Copie os links antes de atualizar a página."
        );
        setErro(true);
      }
    } catch (error) {
      setErro(true);
      setMensagem(
        error instanceof Error
          ? error.message
          : "Erro ao realizar sorteio."
      );

      // Verifica se a operação foi concluída no servidor.
      try {
        const status = await apiFetch(
          `/api/sorteio/status/${eventoId}`
        ) as RespostaStatus;

        setRealizado(status.realizado);
        setRealizadoEm(status.realizadoEm);
        setLinks(status.participantes ?? []);
      } catch {
        // Mantém a mensagem original.
      }
    } finally {
      setCarregando(false);
    }
  }

  // CARREGAR RESULTADOS PARA O ORGANIZADOR
  // async function carregarResultados(
  //   modo: "individual" | "completo"
  // ) {
  //   setVisualizacao(modo);
  //   setRevelado(false);
  //   setParticipanteSelecionado(null);
  //   setMensagem("");
  //   setErro(false);

  //   setConsultandoResultados(true);

  //   try {
  //     const dados = await apiFetch(
  //       `/api/sorteio/resultados/${eventoId}`
  //     ) as RespostaResultados;

  //     setResultados(dados.resultados ?? []);
  //   } catch (error) {
  //     setResultados([]);
  //     setErro(true);
  //     setMensagem(
  //       error instanceof Error
  //         ? error.message
  //         : "Erro ao carregar os resultados."
  //     );
  //   } finally {
  //     setConsultandoResultados(false);
  //   }
  // }
  async function carregarResultados(
  modo: "individual" | "completo"
) {
  setMensagem("");
  setErro(false);
  setRevelado(false);
  setParticipanteSelecionado(null);

  // Solicitar a senha do organizador
  const senha = window.prompt(
    "Digite a senha do organizador para visualizar os resultados:"
  );

  // Cancelou ou não informou a senha
  if (senha === null || senha.length === 0) {
    return;
  }

  setConsultandoResultados(true);

  // Limpar resultados anteriores para evitar exibição indevida
  setResultados([]);

  try {
    const dados = await apiFetch(
      `/api/sorteio/resultados/${eventoId}`,
      {
        method: "POST",
        body: JSON.stringify({
          senha
        })
      }
    ) as RespostaResultados;

    // Exibir somente após validação pelo backend
    setResultados(dados.resultados ?? []);
    setVisualizacao(modo);

  } catch (error) {
    setResultados([]);
    setErro(true);
    setMensagem(
      error instanceof Error
        ? error.message
        : "Erro ao carregar os resultados."
    );
  } finally {
    setConsultandoResultados(false);
  }
}


  // GERAR NOVO LINK
  async function gerarNovoLink(item: ParticipanteLink) {
    if (carregando) return;

    const confirmou = window.confirm(
      `Gerar novo link para ${item.nome}?\n\n` +
      "O link anterior será invalidado."
    );

    if (!confirmou) return;

    setCarregando(true);
    setMensagem("");
    setErro(false);

    try {
      const dados = await apiFetch(
        `/api/sorteio/link/${eventoId}/${item.participanteId}`,
        { method: "POST" }
      ) as { token: string };

      setLinks(anteriores =>
        anteriores.map(p =>
          p.participanteId === item.participanteId
            ? { ...p, token: dados.token }
            : p
        )
      );

      setMensagem(
        `Novo link de ${item.nome} gerado com sucesso.`
      );
    } catch (error) {
      setErro(true);
      setMensagem(
        error instanceof Error
          ? error.message
          : "Erro ao gerar novo link."
      );
    } finally {
      setCarregando(false);
    }
  }

  function obterUrl(token: string): string {
    return `${window.location.origin}/resultado/${token}`;
  }

  async function copiarLink(token: string) {
    try {
      await navigator.clipboard.writeText(obterUrl(token));
      setErro(false);
      setMensagem("Link copiado!");
    } catch {
      setErro(true);
      setMensagem("Não foi possível copiar o link.");
    }
  }

  function formatarTelefone(
    telefone: string | null
  ): string | null {
    if (!telefone) return null;

    const numero = telefone.replace(/\D/g, "");

    if (numero.length === 10 || numero.length === 11) {
      return `55${numero}`;
    }

    if (
      numero.startsWith("55") &&
      (numero.length === 12 || numero.length === 13)
    ) {
      return numero;
    }

    if (numero.length >= 11 && numero.length <= 15) {
      return numero;
    }

    return null;
  }

  function enviarWhatsApp(item: ParticipanteLink) {
    if (!item.token) return;

    const numero = formatarTelefone(item.telefone);

    if (!numero) {
      setErro(true);
      setMensagem("Telefone inválido ou não cadastrado.");
      return;
    }

    const texto =
      `🎁 Olá, ${item.nome}!\n\n` +
      `O sorteio do Amigo Secreto foi realizado!\n\n` +
      `Descubra quem você tirou:\n` +
      `${obterUrl(item.token)}\n\n` +
      `🤫 Guarde segredo!`;

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function formatarData(data: string) {
    const valor = new Date(data);

    return Number.isNaN(valor.getTime())
      ? "Data indisponível"
      : valor.toLocaleString("pt-BR");
  }

  const resultadoIndividual = resultados.find(
    item => item.participanteId === participanteSelecionado
  );

  return (
    <section className="painel">
      <div className="titulo-secao">
        <Gift size={23} />
        <h2>Sorteio definitivo</h2>
      </div>

      {consultando ? (
        <p className="descricao">
          Consultando situação do sorteio...
        </p>
      ) : !realizado ? (
        <>
          <p className="descricao">
            Cadastre os participantes, configure as
            restrições e confirme o sorteio definitivo.
          </p>

          <button
            type="button"
            className="botao-principal"
            onClick={realizarSorteio}
            disabled={carregando || erro}
          >
            <Shuffle size={18} />
            {carregando
              ? "Realizando sorteio..."
              : "Realizar sorteio definitivo"}
          </button>
        </>
      ) : (
        <>
          <div className="titulo-secao">
            <CheckCircle2 size={20} color="#16a34a" />
            <strong>Sorteio realizado</strong>
          </div>

          {realizadoEm && (
            <p className="descricao">
              Realizado em: {formatarData(realizadoEm)}
            </p>
          )}

          <div className="opcoes-resultado">
            <button
              type="button"
              className={
                visualizacao === "links"
                  ? "botao-principal"
                  : "botao-secundario"
              }
              onClick={() => {
                setVisualizacao("links");
                setRevelado(false);
              }}
            >
              <Link2 size={18} />
              Links individuais
            </button>

            <button
              type="button"
              className={
                visualizacao === "individual"
                  ? "botao-principal"
                  : "botao-secundario"
              }
              onClick={() => void carregarResultados("individual")}
              disabled={consultandoResultados}
            >
              <Eye size={18} />
              Visualização individual
            </button>

            <button
              type="button"
              className={
                visualizacao === "completo"
                  ? "botao-principal"
                  : "botao-secundario"
              }
              onClick={() => void carregarResultados("completo")}
              disabled={consultandoResultados}
            >
              <Users size={18} />
              Resultado completo
            </button>
          </div>

          {visualizacao === "links" && (
            <>
              <p className="descricao">
                Compartilhe o link exclusivo de cada
                participante. Após atualizar a página,
                será necessário gerar novos links para
                os tokens que não foram copiados.
              </p>

              <div className="lista-restricoes">
                {links.map(item => (
                  <div
                    className="restricao"
                    key={item.participanteId}
                  >
                    <div>
                      <strong>{item.nome}</strong>

                      <p className="descricao">
                        {item.telefone ||
                          "Telefone não cadastrado"}
                      </p>

                      {!item.token && (
                        <p className="descricao">
                          Link não disponível nesta sessão.
                        </p>
                      )}
                    </div>

                    <div className="acoes-sorteio">
                      {item.token && (
                        <>
                          <button
                            type="button"
                            title="Copiar link"
                            onClick={() =>
                              copiarLink(item.token!)
                            }
                          >
                            <Copy size={18} />
                          </button>

                          <button
                            type="button"
                            title="Enviar pelo WhatsApp"
                            disabled={
                              !formatarTelefone(item.telefone)
                            }
                            onClick={() =>
                              enviarWhatsApp(item)
                            }
                          >
                            <MessageCircle size={18} />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        title="Gerar novo link"
                        disabled={carregando}
                        onClick={() =>
                          void gerarNovoLink(item)
                        }
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {visualizacao === "individual" && (
            <div className="visualizacao-individual">
              <h3>Consultar resultado individual</h3>

              <p className="descricao">
                Selecione um participante para visualizar
                quem ele tirou.
              </p>

              {consultandoResultados ? (
                <p>Carregando resultados...</p>
              ) : resultados.length > 0 ? (
                <>
                  <select
                    className="seletor-participante"
                    value={participanteSelecionado ?? ""}
                    onChange={event => {
                      const valor = Number(event.target.value);

                      setParticipanteSelecionado(
                        valor > 0 ? valor : null
                      );

                      setRevelado(false);
                    }}
                  >
                    <option value="">
                      Selecione um participante
                    </option>

                    {resultados.map(item => (
                      <option
                        key={item.participanteId}
                        value={item.participanteId}
                      >
                        {item.participante}
                      </option>
                    ))}
                  </select>

                  {resultadoIndividual && (
                    <div className="cartao-resultado-individual">
                      <Gift size={35} />

                      <h3>
                        {resultadoIndividual.participante}
                      </h3>

                      {!revelado ? (
                        <button
                          type="button"
                          className="botao-principal"
                          onClick={() => setRevelado(true)}
                        >
                          <Eye size={18} />
                          Revelar resultado
                        </button>
                      ) : (
                        <>
                          <p>Você tirou:</p>

                          <h2>
                            {resultadoIndividual.sorteado}
                          </h2>

                          <button
                            type="button"
                            className="botao-secundario"
                            onClick={() => setRevelado(false)}
                          >
                            <EyeOff size={18} />
                            Ocultar resultado
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="descricao">
                  Nenhum resultado disponível.
                </p>
              )}
            </div>
          )}

          {visualizacao === "completo" && (
            <div className="visualizacao-completa">
              <h3>Resultado completo do sorteio</h3>

              <p className="descricao">
                Esta tabela é exclusiva do organizador.
                Não compartilhe os resultados antes
                da revelação entre os participantes.
              </p>

              {consultandoResultados ? (
                <p>Carregando resultados...</p>
              ) : resultados.length > 0 ? (
                <div className="tabela-resultado-container">
                  <table className="tabela-resultado">
                    <thead>
                      <tr>
                        <th>Participante</th>
                        <th>Amigo secreto</th>
                      </tr>
                    </thead>

                    <tbody>
                      {resultados.map(item => (
                        <tr key={item.participanteId}>
                          <td>{item.participante}</td>
                          <td>{item.sorteado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="descricao">
                    Total: {resultados.length} participantes
                  </p>
                </div>
              ) : (
                <p className="descricao">
                  Nenhum resultado disponível.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {mensagem && (
        <p
          className="mensagem"
          role={erro ? "alert" : "status"}
        >
          {erro && <AlertCircle size={16} />}
          {" "}{mensagem}
        </p>
      )}
    </section>
  );
}
