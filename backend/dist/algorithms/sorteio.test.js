"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sorteio_js_1 = require("./sorteio.js");
const participantes = [
    { id: 1, nome: "Ana" },
    { id: 2, nome: "Bruno" },
    { id: 3, nome: "Carlos" },
    { id: 4, nome: "Daniela" },
    { id: 5, nome: "Eduardo" }
];
(0, vitest_1.describe)("Algoritmo de Amigo Secreto", () => {
    (0, vitest_1.it)("deve gerar um sorteio válido", () => {
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, []);
        (0, vitest_1.expect)(resultado).not.toBeNull();
        (0, vitest_1.expect)(resultado).toHaveLength(participantes.length);
        const destinatarios = new Set(resultado.map(r => r.destinatarioId));
        (0, vitest_1.expect)(destinatarios.size).toBe(participantes.length);
        for (const item of resultado) {
            (0, vitest_1.expect)(item.participanteId).not.toBe(item.destinatarioId);
            const reciproco = resultado.find(r => r.participanteId === item.destinatarioId &&
                r.destinatarioId === item.participanteId);
            (0, vitest_1.expect)(reciproco).toBeUndefined();
        }
    });
    (0, vitest_1.it)("deve respeitar uma restrição PROIBIDO", () => {
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, [
            {
                participanteId: 1,
                destinatarioId: 2,
                tipo: "PROIBIDO"
            }
        ]);
        (0, vitest_1.expect)(resultado).not.toBeNull();
        const atribuicaoAna = resultado.find(r => r.participanteId === 1);
        (0, vitest_1.expect)(atribuicaoAna?.destinatarioId).not.toBe(2);
    });
    (0, vitest_1.it)("deve respeitar uma restrição PERMITIDO", () => {
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, [
            {
                participanteId: 1,
                destinatarioId: 3,
                tipo: "PERMITIDO"
            }
        ]);
        (0, vitest_1.expect)(resultado).not.toBeNull();
        const atribuicaoAna = resultado.find(r => r.participanteId === 1);
        (0, vitest_1.expect)(atribuicaoAna?.destinatarioId).toBe(3);
    });
    (0, vitest_1.it)("não deve sortear com apenas duas pessoas", () => {
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes.slice(0, 2), []);
        (0, vitest_1.expect)(resultado).toBeNull();
    });
    (0, vitest_1.it)("deve identificar quando não existe solução", () => {
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, [
            { participanteId: 1, destinatarioId: 2, tipo: "PERMITIDO" },
            { participanteId: 2, destinatarioId: 1, tipo: "PERMITIDO" }
        ]);
        (0, vitest_1.expect)(resultado).toBeNull();
    });
});
//# sourceMappingURL=sorteio.test.js.map