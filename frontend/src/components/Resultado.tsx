
import { useEffect, useState } from "react";
import {
  Gift,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  LogIn,
  UserPlus,
  LogOut,
  CalendarDays,
  AlertCircle,
  LoaderCircle
} from "lucide-react";

import {
  participanteFetch,
  salvarSessaoParticipante,
  obterSessaoParticipante,
  sairParticipante,
  type DadosConvite,
  type DadosResultado,
  type RespostaLogin
} from "../services/participanteAuth";

interface ResultadoProps {
  token?: string;
}

type Tela =
  | "carregando"
  | "cadastro"
  | "login"
  | "resultado"
  | "erro";

export default function Resultado({ token }: ResultadoProps) {
  const [tela, setTela] = useState<Tela>("carregando");
  const [convite, setConvite] = useState<DadosConvite | null>(null);
  const [dados, setDados] = useState<DadosResultado | null>(null);

  const [eventoId, setEventoId] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [revelado, setRevelado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  // CARREGAR RESULTADO COM SESSÃO AUTENTICADA
  async function consultarResultado() {
    const resultado = await participanteFetch<DadosResultado>(
      "/api/participante-auth/resultado"
    );

    setDados(resultado);
    setRevelado(false);
    setTela("resultado");
  }

  // IDENTIFICAR PRIMEIRO ACESSO OU LOGIN
  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      setTela("carregando");
      setErro("");
      setDados(null);
      setConvite(null);
      setRevelado(false);

      // Se já estiver autenticado, tenta recuperar
      // o resultado sem exigir um novo login.
      if (obterSessaoParticipante()) {
        try {
          const resultado =
            await participanteFetch<DadosResultado>(
              "/api/participante-auth/resultado"
            );

          if (!ativo) return;

          setDados(resultado);
          setTela("resultado");
          return;
        } catch {
          sairParticipante();
        }
      }

      // Link individual recebido do organizador.
      if (token) {
        try {
          const resposta =
            await participanteFetch<DadosConvite>(
              `/api/participante-auth/convite/${encodeURIComponent(token)}`
            );

          if (!ativo) return;

          setConvite(resposta);
          setEventoId(String(resposta.eventoId));
          setNome(resposta.participante);

          setTela(
            resposta.cadastrado ? "login" : "cadastro"
          );

          return;
        } catch (error) {
          if (!ativo) return;

          setErro(
            error instanceof Error
              ? error.message
              : "Convite inválido."
          );

          setTela("erro");
          return;
        }
      }

      if (ativo) {
        setTela("login");
      }
    }

    void inicializar();

    return () => {
      ativo = false;
    };
  }, [token]);

  // CADASTRAR SENHA NO PRIMEIRO ACESSO
  async function cadastrarSenha() {
    if (!token || !convite) {
      setErro("É necessário acessar pelo link de convite.");
      return;
    }

    if (senha.length < 8 || senha.length > 72) {
      setErro("A senha deve conter entre 8 e 72 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      const resposta =
        await participanteFetch<RespostaLogin>(
          "/api/participante-auth/cadastrar",
          {
            method: "POST",
            body: JSON.stringify({
              token,
              senha
            })
          }
        );

      salvarSessaoParticipante(resposta.token);
      setSenha("");
      setConfirmarSenha("");

      await consultarResultado();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar senha."
      );
    } finally {
      setProcessando(false);
    }
  }

  // LOGIN COM EVENTO, NOME E SENHA
  async function entrar() {
    if (!eventoId || !nome.trim() || !senha) {
      setErro("Preencha o evento, nome e senha.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      const resposta =
        await participanteFetch<RespostaLogin>(
          "/api/participante-auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              eventoId: Number(eventoId),
              nome: nome.trim(),
              senha
            })
          }
        );

      salvarSessaoParticipante(resposta.token);
      setSenha("");

      await consultarResultado();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar login."
      );
    } finally {
      setProcessando(false);
    }
  }

  function sair() {
    sairParticipante();
    setDados(null);
    setSenha("");
    setConfirmarSenha("");
    setRevelado(false);
    setErro("");
    setTela("login");
  }

  function formatarData(data: string) {
    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "Data indisponível";
    }

    return valor.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  if (tela === "carregando") {
    return (
      <main className="resultado-page">
        <div className="resultado-card">
          <LoaderCircle size={40} />
          <h1>Amigo Secreto</h1>
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  if (tela === "erro") {
    return (
      <main className="resultado-page">
        <div className="resultado-card">
          <AlertCircle size={45} />
          <h1>Link indisponível</h1>
          <p>{erro}</p>

          <button
            type="button"
            className="botao-secundario"
            onClick={() => {
              setErro("");
              setTela("login");
            }}
          >
            <LogIn size={18} />
            Entrar com minha senha
          </button>
        </div>
      </main>
    );
  }

  if (tela === "cadastro") {
    return (
      <main className="resultado-page">
        <div className="resultado-card">
          <Gift size={48} />

          <h1>Bem-vindo ao Amigo Secreto!</h1>

          <p>
            Evento: <strong>{convite?.evento}</strong>
          </p>

          <p>
            Olá, <strong>{convite?.participante}</strong>!
          </p>

          <p>
            Para acessar seu resultado, cadastre
            uma senha pessoal.
          </p>

          <form
            className="formulario-participante"
            onSubmit={event => {
              event.preventDefault();
              void cadastrarSenha();
            }}
          >
            <label htmlFor="cadastro-senha">
              Criar senha
            </label>

            <input
              id="cadastro-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={senha}
              onChange={event =>
                setSenha(event.target.value)
              }
              minLength={8}
              maxLength={72}
              required
            />

            <label htmlFor="confirmar-senha">
              Confirmar senha
            </label>

            <input
              id="confirmar-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={event =>
                setConfirmarSenha(event.target.value)
              }
              required
            />

            <label className="mostrar-senha">
              <input
                type="checkbox"
                checked={mostrarSenha}
                onChange={event =>
                  setMostrarSenha(event.target.checked)
                }
              />
              Mostrar senha
            </label>

            {erro && (
              <p className="erro-participante" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="botao-principal"
              disabled={processando}
            >
              <UserPlus size={18} />
              {processando
                ? "Cadastrando..."
                : "Cadastrar senha e entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (tela === "login") {
    return (
      <main className="resultado-page">
        <div className="resultado-card">
          <LockKeyhole size={45} />

          <h1>Entrar no Amigo Secreto</h1>

          <p>
            Informe seus dados para consultar
            seu resultado.
          </p>

          {convite && (
            <p>
              Evento: <strong>{convite.evento}</strong>
            </p>
          )}

          <form
            className="formulario-participante"
            onSubmit={event => {
              event.preventDefault();
              void entrar();
            }}
          >
            <label htmlFor="login-evento">
              Código do evento
            </label>

            <input
              id="login-evento"
              type="number"
              min="1"
              placeholder="ID do evento"
              value={eventoId}
              onChange={event =>
                setEventoId(event.target.value)
              }
              readOnly={Boolean(convite)}
              required
            />

            <label htmlFor="login-nome">
              <UserRound size={16} />
              Nome do participante
            </label>

            <input
              id="login-nome"
              type="text"
              placeholder="Seu nome no sorteio"
              value={nome}
              onChange={event =>
                setNome(event.target.value)
              }
              readOnly={Boolean(convite)}
              autoComplete="username"
              required
            />

            <label htmlFor="login-senha">
              Senha
            </label>

            <input
              id="login-senha"
              type={mostrarSenha ? "text" : "password"}
              placeholder="Sua senha"
              value={senha}
              onChange={event =>
                setSenha(event.target.value)
              }
              autoComplete="current-password"
              required
            />

            <label className="mostrar-senha">
              <input
                type="checkbox"
                checked={mostrarSenha}
                onChange={event =>
                  setMostrarSenha(event.target.checked)
                }
              />
              Mostrar senha
            </label>

            {erro && (
              <p className="erro-participante" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="botao-principal"
              disabled={processando}
            >
              <LogIn size={18} />
              {processando
                ? "Entrando..."
                : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (tela === "resultado" && dados) {
    return (
      <main className="resultado-page">
        <div className="resultado-card">
          <Gift size={48} />

          <h1>{dados.evento}</h1>

          {dados.dataEvento && (
            <p>
              <CalendarDays size={16} />
              {" "}
              {formatarData(dados.dataEvento)}
            </p>
          )}

          <p>
            Olá, <strong>{dados.participante}</strong>!
          </p>

          {!revelado ? (
            <>
              <LockKeyhole size={35} />

              <p>
                Seu Amigo Secreto está pronto!
              </p>

              <p>
                Clique abaixo para descobrir
                quem você tirou.
              </p>

              <button
                type="button"
                className="botao-principal"
                onClick={() => setRevelado(true)}
              >
                <Eye size={18} />
                Revelar meu Amigo Secreto
              </button>
            </>
          ) : (
            <div className="resultado-revelado">
              <p>🎉 Você tirou:</p>

              <h2>{dados.sorteado}</h2>

              <p>🤫 Guarde segredo!</p>

              <button
                type="button"
                className="botao-secundario"
                onClick={() => setRevelado(false)}
              >
                <EyeOff size={18} />
                Ocultar resultado
              </button>
            </div>
          )}

          <button
            type="button"
            className="botao-sair-participante"
            onClick={sair}
          >
            <LogOut size={17} />
            Sair da minha conta
          </button>
        </div>
      </main>
    );
  }

  return null;
}
