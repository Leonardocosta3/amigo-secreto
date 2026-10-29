-- CreateTable
CREATE TABLE `participantes_acessos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participante_id` INTEGER NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `participantes_acessos_participante_id_key`(`participante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `participantes_acessos` ADD CONSTRAINT `participantes_acessos_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
