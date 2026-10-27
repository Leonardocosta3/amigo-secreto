import { randomInt } from "node:crypto";

type TipoRestricao = "PERMITIDO" | "PROIBIDO";

interface Participante {
  id: number;
  nome: string;
}

interface Restricao {
  participanteId: number;
  destinatarioId: number;
  tipo: TipoRestricao;
}

export interface ResultadoSorteio {
  participanteId: number;
  destinatarioId: number;
}

function embaralhar<T>(lista: T[]): T[] {
  const resultado = [...lista];

  for (let i = resultado.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);

    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }

  return resultado;
}

export function realizarSorteio(
  participantes: Participante[],
  restricoes: Restricao[]
): ResultadoSorteio[] | null {

  if (participantes.length < 3) {
    return null;
  }

  const ids = participantes.map(p => p.id);

  if (new Set(ids).size !== ids.length) {
    throw new Error("Existem participantes duplicados.");
  }

  const conjuntoIds = new Set(ids);

  const permitidos = new Map<number, Set<number>>();
  const proibidos = new Map<number, Set<number>>();

  for (const restricao of restricoes) {
    if (
      !conjuntoIds.has(restricao.participanteId) ||
      !conjuntoIds.has(restricao.destinatarioId)
    ) {
      continue;
    }

    const mapa = restricao.tipo === "PERMITIDO"
      ? permitidos
      : proibidos;

    if (!mapa.has(restricao.participanteId)) {
      mapa.set(restricao.participanteId, new Set());
    }

    mapa.get(restricao.participanteId)!.add(
      restricao.destinatarioId
    );
  }

  const candidatos = new Map<number, number[]>();

  for (const participante of participantes) {
    const listaPermitidos = permitidos.get(participante.id);
    const listaProibidos = proibidos.get(participante.id);

    const opcoes = ids.filter(destinatarioId => {
      if (destinatarioId === participante.id) {
        return false;
      }

      if (
        listaPermitidos &&
        !listaPermitidos.has(destinatarioId)
      ) {
        return false;
      }

      if (listaProibidos?.has(destinatarioId)) {
        return false;
      }

      return true;
    });

    if (opcoes.length === 0) {
      return null;
    }

    candidatos.set(participante.id, embaralhar(opcoes));
  }

  // Prioriza quem possui menos opções.
  const ordem = embaralhar(participantes).sort(
    (a, b) =>
      candidatos.get(a.id)!.length -
      candidatos.get(b.id)!.length
  );

  const atribuicoes = new Map<number, number>();
  const destinatariosUsados = new Set<number>();

  function buscar(indice: number): boolean {
    if (indice === ordem.length) {
      return true;
    }

    const participanteId = ordem[indice].id;
    const opcoes = candidatos.get(participanteId)!;

    for (const destinatarioId of opcoes) {
      if (destinatariosUsados.has(destinatarioId)) {
        continue;
      }

      // Impede trocas recíprocas.
      if (
        atribuicoes.get(destinatarioId) === participanteId
      ) {
        continue;
      }

      atribuicoes.set(participanteId, destinatarioId);
      destinatariosUsados.add(destinatarioId);

      if (buscar(indice + 1)) {
        return true;
      }

      atribuicoes.delete(participanteId);
      destinatariosUsados.delete(destinatarioId);
    }

    return false;
  }

  if (!buscar(0)) {
    return null;
  }

  return participantes.map(p => ({
    participanteId: p.id,
    destinatarioId: atribuicoes.get(p.id)!
  }));
}