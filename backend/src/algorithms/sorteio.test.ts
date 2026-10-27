import { describe, it, expect } from "vitest";
import { realizarSorteio } from "./sorteio.js";

const participantes = [
  { id: 1, nome: "Ana" },
  { id: 2, nome: "Bruno" },
  { id: 3, nome: "Carlos" },
  { id: 4, nome: "Daniela" },
  { id: 5, nome: "Eduardo" }
];

describe("Algoritmo de Amigo Secreto", () => {

  it("deve gerar um sorteio válido", () => {
    const resultado = realizarSorteio(participantes, []);

    expect(resultado).not.toBeNull();
    expect(resultado).toHaveLength(participantes.length);

    const destinatarios = new Set(
      resultado!.map(r => r.destinatarioId)
    );

    expect(destinatarios.size).toBe(participantes.length);

    for (const item of resultado!) {
      expect(item.participanteId).not.toBe(item.destinatarioId);

      const reciproco = resultado!.find(
        r =>
          r.participanteId === item.destinatarioId &&
          r.destinatarioId === item.participanteId
      );

      expect(reciproco).toBeUndefined();
    }
  });

  it("deve respeitar uma restrição PROIBIDO", () => {
    const resultado = realizarSorteio(participantes, [
      {
        participanteId: 1,
        destinatarioId: 2,
        tipo: "PROIBIDO"
      }
    ]);

    expect(resultado).not.toBeNull();

    const atribuicaoAna = resultado!.find(
      r => r.participanteId === 1
    );

    expect(atribuicaoAna?.destinatarioId).not.toBe(2);
  });

  it("deve respeitar uma restrição PERMITIDO", () => {
    const resultado = realizarSorteio(participantes, [
      {
        participanteId: 1,
        destinatarioId: 3,
        tipo: "PERMITIDO"
      }
    ]);

    expect(resultado).not.toBeNull();

    const atribuicaoAna = resultado!.find(
      r => r.participanteId === 1
    );

    expect(atribuicaoAna?.destinatarioId).toBe(3);
  });

  it("não deve sortear com apenas duas pessoas", () => {
    const resultado = realizarSorteio(
      participantes.slice(0, 2),
      []
    );

    expect(resultado).toBeNull();
  });

  it("deve identificar quando não existe solução", () => {
    const resultado = realizarSorteio(participantes, [
      { participanteId: 1, destinatarioId: 2, tipo: "PERMITIDO" },
      { participanteId: 2, destinatarioId: 1, tipo: "PERMITIDO" }
    ]);

    expect(resultado).toBeNull();
  });

});