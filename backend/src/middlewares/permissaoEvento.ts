import { prisma } from "../lib/prisma.js";

export async function podeAdministrarEvento(
  usuarioId: number,
  eventoId: number
): Promise<boolean> {
  if (
    !Number.isSafeInteger(usuarioId) ||
    !Number.isSafeInteger(eventoId) ||
    usuarioId <= 0 ||
    eventoId <= 0
  ) {
    return false;
  }

  const evento = await prisma.evento.findFirst({
    where: {
      id: eventoId,
      usuarioId
    },
    select: { id: true }
  });

  return evento !== null;
}