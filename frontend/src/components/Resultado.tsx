import { useEffect, useState } from "react";
import { Gift, Eye, LockKeyhole } from "lucide-react";

import { apiFetch } from "../services/api";

interface DadosResultado {
  evento: string;
  dataEvento: string | null;
  participante: string;
  sorteado: string;
}

interface ResultadoProps {
  token: string;
}

export default function Resultado({ token }: ResultadoProps) {
  const [dados, setDados] = useState<DadosResultado | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarResultado() {
      try {
        const resposta = await apiFetch(
          `/api/resultado/${encodeURIComponent(token)}`
        );

        if (ativo) {
          setDados(resposta);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seu resultado."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarResultado();

    return () => {
      ativo = false;
    };
  }, [token]);

  if (carregando) {
    return (
      <main className="resultado-page">
        <p>Carregando seu Amigo Secreto...</p>
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="resultado-page">
        <Gift size={48} />
        <h1>Link indisponível</h1>
        <p>{erro || "Resultado não encontrado."}</p>
      </main>
    );
  }

  return (
    <main className="resultado-page">
      <div className="resultado-card">
        <Gift size={48} />

        <h1>{dados.evento}</h1>

        <p>Olá, {dados.participante}!</p>

        {!revelado ? (
          <>
            <LockKeyhole size={36} />

            <p>
              Seu Amigo Secreto já foi sorteado.
              Clique abaixo para descobrir quem você tirou!
            </p>

            <button
              type="button"
              onClick={() => setRevelado(true)}
            >
              <Eye size={18} />
              Revelar meu Amigo Secreto
            </button>
          </>
        ) : (
          <div className="resultado-revelado">
            <p>Você tirou:</p>

            <h2>{dados.sorteado}</h2>

            <p>🤫 Guarde segredo!</p>
          </div>
        )}
      </div>
    </main>
  );
}