-- AlterTable
ALTER TABLE `eventos` ADD COLUMN `sorteio_realizado_em` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `resultados_sorteio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evento_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `sorteado_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resultados_sorteio_participante_id_key`(`participante_id`),
    UNIQUE INDEX `resultados_sorteio_token_hash_key`(`token_hash`),
    INDEX `resultados_sorteio_evento_id_idx`(`evento_id`),
    UNIQUE INDEX `resultados_sorteio_evento_id_sorteado_id_key`(`evento_id`, `sorteado_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resultados_sorteio` ADD CONSTRAINT `resultados_sorteio_evento_id_fkey` FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_sorteio` ADD CONSTRAINT `resultados_sorteio_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_sorteio` ADD CONSTRAINT `resultados_sorteio_sorteado_id_fkey` FOREIGN KEY (`sorteado_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
