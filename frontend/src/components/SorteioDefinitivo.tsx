
import { useEffect, useState } from "react";
import {
  Gift,
  Shuffle,
  MessageCircle,
  Copy,
  RefreshCw
} from "lucide-react";

import { apiFetch } from "../services/api";

interface ParticipanteLink {
  participanteId: number;
  nome: string;
  telefone: string | null;
  token: string | null;
}

interface SorteioDefinitivoProps {
  eventoId: number;
}

export default function SorteioDefinitivo({
  eventoId
}: SorteioDefinitivoProps) {
  const [realizado, setRealizado] = useState(false);
  const [links, setLinks] = useState<ParticipanteLink[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarStatus() {
    try {
      const dados = await apiFetch(
        `/api/sorteio/status/${eventoId}`
      );

      setRealizado(dados.realizado);
      setLinks(dados.participantes ?? []);
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Erro ao consultar o sorteio."
      );
    }
  }

  useEffect(() => {
    void carregarStatus();
  }, [eventoId]);

  async function realizarSorteio() {
    if (!window.confirm(
      "Deseja realizar o sorteio definitivo? " +
      "Os participantes não poderão ser sorteados novamente."
    )) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const dados = await apiFetch(
        `/api/sorteio/realizar/${eventoId}`,
        { method: "POST" }
      );

      setRealizado(true);

      // Os tokens são devolvidos somente na criação.
      const tokens = new Map<number, string>(
        dados.links.map(
          (item: { participanteId: number; token: string }) =>
            [item.participanteId, item.token]
        )
      );

      const participantes = await apiFetch(
        `/api/participantes?eventoId=${eventoId}`
      );

      setLinks(
        participantes
          .filter((p: { ativo: boolean }) => p.ativo)
          .map((p: {
            id: number;
            nome: string;
            telefone: string | null;
          }) => ({
            participanteId: p.id,
            nome: p.nome,
            telefone: p.telefone,
            token: tokens.get(p.id) ?? null
          }))
      );

      setMensagem("Sorteio definitivo realizado com sucesso!");
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Erro ao realizar sorteio."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function gerarNovoLink(participanteId: number) {
    setCarregando(true);
    setMensagem("");

    try {
      const dados = await apiFetch(
        `/api/sorteio/link/${eventoId}/${participanteId}`,
        { method: "POST" }
      );

      setLinks(anteriores =>
        anteriores.map(item =>
          item.participanteId === participanteId
            ? { ...item, token: dados.token }
            : item
        )
      );

      setMensagem("Novo link gerado. O anterior foi invalidado.");
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Erro ao gerar novo link."
      );
    } finally {
      setCarregando(false);
    }
  }

  function obterUrl(token: string) {
    return `${window.location.origin}/resultado/${token}`;
  }

  async function copiarLink(token: string) {
    try {
      await navigator.clipboard.writeText(obterUrl(token));
      setMensagem("Link copiado!");
    } catch {
      setMensagem("Não foi possível copiar o link.");
    }
  }

  function enviarWhatsApp(item: ParticipanteLink) {
    if (!item.token || !item.telefone) return;

    const numero = item.telefone.replace(/\D/g, "");

    const mensagem =
      `🎁 Olá, ${item.nome}!\n\n` +
      `O sorteio do Amigo Secreto foi realizado!\n\n` +
      `Descubra quem você tirou:\n` +
      `${obterUrl(item.token)}\n\n` +
      `🤫 Guarde segredo!`;

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section className="painel">
      <div className="titulo-secao">
        <Gift size={23} />
        <h2>Sorteio definitivo</h2>
      </div>

      {!realizado ? (
        <>
          <p className="descricao">
            Depois de cadastrar os participantes e configurar
            as restrições, realize o sorteio definitivo.
          </p>

          <button
            type="button"
            className="botao-principal"
            onClick={realizarSorteio}
            disabled={carregando}
          >
            <Shuffle size={18} />
            {carregando
              ? "Realizando sorteio..."
              : "Realizar sorteio definitivo"}
          </button>
        </>
      ) : (
        <>
          <p className="descricao">
            Sorteio realizado! Compartilhe o link exclusivo
            com cada participante.
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
                    {item.telefone || "Telefone não cadastrado"}
                  </p>
                </div>

                <div className="acoes-sorteio">
                  {item.token && (
                    <>
                      <button
                        type="button"
                        onClick={() => copiarLink(item.token!)}
                        title="Copiar link"
                      >
                        <Copy size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => enviarWhatsApp(item)}
                        disabled={!item.telefone}
                        title="Enviar pelo WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      gerarNovoLink(item.participanteId)
                    }
                    disabled={carregando}
                    title="Gerar novo link"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {mensagem && <p className="mensagem">{mensagem}</p>}
    </section>
  );
}
