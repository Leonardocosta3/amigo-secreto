
import { useState, type FormEvent } from "react";
import {
  Gift,
  LockKeyhole,
  Mail,
  LogIn,
  UserPlus,
  UserRound
} from "lucide-react";

import { apiFetch, salvarToken } from "../services/api";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [modoCadastro, setModoCadastro] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alternarTela() {
    if (carregando) return;

    setModoCadastro(!modoCadastro);
    setErro("");
    setSucesso("");
    setSenha("");
    setConfirmarSenha("");
  }

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    if (modoCadastro) {
      if (nome.trim().length < 2) {
        setErro("Informe seu nome completo ou nome de organizador.");
        return;
      }

      if (senha.length < 8) {
        setErro("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }

      if (senha !== confirmarSenha) {
        setErro("As senhas informadas não coincidem.");
        return;
      }
    }

    setCarregando(true);

    try {
      if (modoCadastro) {
        // Criar a conta no backend
        await apiFetch("/api/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha
          })
        });

        // Após cadastrar, retornar ao login
        setModoCadastro(false);
        setNome("");
        setSenha("");
        setConfirmarSenha("");

        setSucesso(
          "Conta criada com sucesso! Entre com seu e-mail e senha."
        );

        return;
      }

      // Login de uma conta existente
      const resultado = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha
        })
      });

      if (!resultado.token || !resultado.usuario) {
        throw new Error("Resposta de login inválida.");
      }

      salvarToken(resultado.token);
      onLogin(resultado.usuario);

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <Gift size={32} />
        </div>

        <h1>
          {modoCadastro
            ? "Criar minha conta"
            : "Amigo Secreto"}
        </h1>

        <p>
          {modoCadastro
            ? "Cadastre-se gratuitamente para organizar seus sorteios."
            : "Entre para organizar seus sorteios."}
        </p>

        <form onSubmit={enviarFormulario}>

          {modoCadastro && (
            <>
              <label htmlFor="cadastro-nome">
                Nome do organizador
              </label>

              <div className="login-input">
                <UserRound size={19} />

                <input
                  id="cadastro-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </div>
            </>
          )}

          <label htmlFor="email">E-mail</label>

          <div className="login-input">
            <Mail size={19} />

            <input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="senha">Senha</label>

          <div className="login-input">
            <LockKeyhole size={19} />

            <input
              id="senha"
              type="password"
              placeholder={
                modoCadastro
                  ? "Mínimo de 8 caracteres"
                  : "Digite sua senha"
              }
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete={
                modoCadastro
                  ? "new-password"
                  : "current-password"
              }
              minLength={modoCadastro ? 8 : undefined}
              required
            />
          </div>

          {modoCadastro && (
            <>
              <label htmlFor="confirmar-senha">
                Confirmar senha
              </label>

              <div className="login-input">
                <LockKeyhole size={19} />

                <input
                  id="confirmar-senha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={e =>
                    setConfirmarSenha(e.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {erro && (
            <p className="login-error" role="alert">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="login-success" role="status">
              {sucesso}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={carregando}
          >
            {modoCadastro
              ? <UserPlus size={19} />
              : <LogIn size={19} />
            }

            {carregando
              ? "Processando..."
              : modoCadastro
                ? "Criar minha conta"
                : "Entrar"}
          </button>
        </form>

        <div className="login-switch">
          <span>
            {modoCadastro
              ? "Já possui uma conta?"
              : "Ainda não tem uma conta?"}
          </span>

          <button
            type="button"
            onClick={alternarTela}
            disabled={carregando}
          >
            {modoCadastro
              ? "Fazer login"
              : "Criar conta"}
          </button>
        </div>

      </div>
    </div>
  );
}
