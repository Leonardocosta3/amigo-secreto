"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.podeAdministrarEvento = podeAdministrarEvento;
const prisma_js_1 = require("../lib/prisma.js");
async function podeAdministrarEvento(usuarioId, eventoId) {
    if (!Number.isSafeInteger(usuarioId) ||
        !Number.isSafeInteger(eventoId) ||
        usuarioId <= 0 ||
        eventoId <= 0) {
        return false;
    }
    const evento = await prisma_js_1.prisma.evento.findFirst({
        where: {
            id: eventoId,
            usuarioId
        },
        select: { id: true }
    });
    return evento !== null;
}
//# sourceMappingURL=permissaoEvento.js.map