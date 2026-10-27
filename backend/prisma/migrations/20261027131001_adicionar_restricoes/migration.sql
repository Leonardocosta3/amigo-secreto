-- CreateTable
CREATE TABLE `restricoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evento_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `destinatario_id` INTEGER NOT NULL,
    `tipo` ENUM('PERMITIDO', 'PROIBIDO') NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `restricoes_evento_id_participante_id_destinatario_id_tipo_key`(`evento_id`, `participante_id`, `destinatario_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
