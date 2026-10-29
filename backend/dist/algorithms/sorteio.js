"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realizarSorteio = realizarSorteio;
const node_crypto_1 = require("node:crypto");
// EMBARALHAR UTILIZANDO ALEATORIEDADE CRIPTOGRÁFICA
function embaralhar(lista) {
    const resultado = [...lista];
    for (let i = resultado.length - 1; i > 0; i--) {
        const j = (0, node_crypto_1.randomInt)(i + 1);
        const temporario = resultado[i];
        resultado[i] = resultado[j];
        resultado[j] = temporario;
    }
    return resultado;
}
// REALIZAR SORTEIO
function realizarSorteio(participantes, restricoes) {
    // MÍNIMO DE PARTICIPANTES
    if (participantes.length < 3) {
        return null;
    }
    const ids = participantes.map(p => p.id);
    const conjuntoIds = new Set(ids);
    // VERIFICAR PARTICIPANTES DUPLICADOS
    if (conjuntoIds.size !== participantes.length) {
        throw new Error("Existem participantes duplicados.");
    }
    // MAPAS DE RESTRIÇÕES
    const permitidos = new Map();
    const proibidos = new Map();
    for (const restricao of restricoes) {
        const origem = restricao.participanteId;
        const destino = restricao.destinatarioId;
        // IGNORAR RESTRIÇÕES DE PARTICIPANTES INATIVOS
        // OU QUE NÃO ESTEJAM NA LISTA RECEBIDA
        if (!conjuntoIds.has(origem) ||
            !conjuntoIds.has(destino)) {
            continue;
        }
        const mapa = restricao.tipo === "PERMITIDO"
            ? permitidos
            : proibidos;
        if (!mapa.has(origem)) {
            mapa.set(origem, new Set());
        }
        mapa.get(origem).add(destino);
    }
    // CRIAR LISTA DE CANDIDATOS PARA CADA PARTICIPANTE
    const candidatos = new Map();
    for (const participante of participantes) {
        const listaPermitidos = permitidos.get(participante.id);
        const listaProibidos = proibidos.get(participante.id);
        const opcoes = ids.filter(destinatarioId => {
            // NINGUÉM PODE SORTear A SI MESMO
            if (destinatarioId === participante.id) {
                return false;
            }
            // RESPEITAR LISTA DE PERMITIDOS
            if (listaPermitidos &&
                !listaPermitidos.has(destinatarioId)) {
                return false;
            }
            // RESPEITAR LISTA DE PROIBIDOS
            if (listaProibidos?.has(destinatarioId)) {
                return false;
            }
            return true;
        });
        // SEM CANDIDATOS DISPONÍVEIS
        if (opcoes.length === 0) {
            return null;
        }
        candidatos.set(participante.id, embaralhar(opcoes));
    }
    // PRIORIZAR PARTICIPANTES COM MENOS OPÇÕES
    const ordem = embaralhar(participantes);
    ordem.sort((a, b) => {
        const quantidadeA = candidatos.get(a.id).length;
        const quantidadeB = candidatos.get(b.id).length;
        return quantidadeA - quantidadeB;
    });
    // CONTROLE DAS ATRIBUIÇÕES
    const atribuicoes = new Map();
    const destinatariosUsados = new Set();
    // BACKTRACKING
    function buscar(indice) {
        // TODOS RECEBERAM UMA ATRIBUIÇÃO
        if (indice === ordem.length) {
            return true;
        }
        const participanteId = ordem[indice].id;
        const opcoes = candidatos.get(participanteId);
        for (const destinatarioId of opcoes) {
            // NÃO REPETIR DESTINATÁRIOS
            if (destinatariosUsados.has(destinatarioId)) {
                continue;
            }
            // IMPEDIR TROCAS RECÍPROCAS
            // Exemplo: Ana -> Bruno e Bruno -> Ana
            if (atribuicoes.get(destinatarioId) === participanteId) {
                continue;
            }
            // REALIZAR ATRIBUIÇÃO TEMPORÁRIA
            atribuicoes.set(participanteId, destinatarioId);
            destinatariosUsados.add(destinatarioId);
            // CONTINUAR BUSCA
            if (buscar(indice + 1)) {
                return true;
            }
            // DESFAZER ATRIBUIÇÃO
            atribuicoes.delete(participanteId);
            destinatariosUsados.delete(destinatarioId);
        }
        return false;
    }
    // EXECUTAR BUSCA
    if (!buscar(0)) {
        return null;
    }
    // MONTAR RESULTADO
    const resultado = participantes.map(participante => ({
        participanteId: participante.id,
        destinatarioId: atribuicoes.get(participante.id)
    }));
    // VALIDAÇÃO FINAL
    const sorteadores = new Set();
    const sorteados = new Set();
    for (const item of resultado) {
        const origem = item.participanteId;
        const destino = item.destinatarioId;
        // IMPEDIR AUTOATRIBUIÇÃO
        if (origem === destino) {
            return null;
        }
        // VERIFICAR PARTICIPANTES VÁLIDOS
        if (!conjuntoIds.has(origem) ||
            !conjuntoIds.has(destino)) {
            return null;
        }
        // IMPEDIR SORTEADORES DUPLICADOS
        if (sorteadores.has(origem)) {
            return null;
        }
        // IMPEDIR DESTINATÁRIOS DUPLICADOS
        if (sorteados.has(destino)) {
            return null;
        }
        // VERIFICAR RESTRIÇÕES PROIBIDAS
        if (proibidos.get(origem)?.has(destino)) {
            return null;
        }
        // VERIFICAR RESTRIÇÕES PERMITIDAS
        const listaPermitidos = permitidos.get(origem);
        if (listaPermitidos &&
            !listaPermitidos.has(destino)) {
            return null;
        }
        sorteadores.add(origem);
        sorteados.add(destino);
    }
    // VERIFICAR QUANTIDADE FINAL
    if (sorteadores.size !== participantes.length ||
        sorteados.size !== participantes.length) {
        return null;
    }
    // VERIFICAR TROCAS RECÍPROCAS
    const mapaResultado = new Map();
    for (const item of resultado) {
        mapaResultado.set(item.participanteId, item.destinatarioId);
    }
    for (const item of resultado) {
        const sorteadoPeloDestino = mapaResultado.get(item.destinatarioId);
        if (sorteadoPeloDestino === item.participanteId) {
            return null;
        }
    }
    // RESULTADO VÁLIDO
    return resultado;
}
//# sourceMappingURL=sorteio.js.map