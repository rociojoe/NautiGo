/* =========================================
   NAUTIGO — ESQUEMA MySQL 8
   Cargar con:  mysql -u root -p < sql/schema.sql
   o pegar en phpMyAdmin / MySQL Workbench
   ========================================= */

CREATE DATABASE IF NOT EXISTS nautigo
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nautigo;

/* -----------------------------------------
   USUARIOS: cliente / lanchero / admin
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS usuarios (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    rol          ENUM('cliente','lanchero','admin') NOT NULL,
    nombre       VARCHAR(120)  NOT NULL,
    email        VARCHAR(190)  NOT NULL,
    telefono     VARCHAR(30)   NULL,
    password_hash VARCHAR(255)  NOT NULL,
    puntos       INT           NOT NULL DEFAULT 0,

    /* cliente entra como 'activo'; lanchero nace 'pendiente'
       y el admin lo pasa a 'aprobado' o 'rechazado' */
    estado       ENUM('activo','pendiente','aprobado','rechazado')
                 NOT NULL DEFAULT 'activo',
    motivo_rechazo VARCHAR(255) NULL,

    creado_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_usuarios_email (email),
    INDEX idx_usuarios_rol_estado (rol, estado)
) ENGINE=InnoDB;

/* -----------------------------------------
   LANCHAS: una por lanchero (1:1)
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS lanchas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT          NOT NULL,
    nombre        VARCHAR(120) NOT NULL,
    galones       DECIMAL(6,2) NOT NULL DEFAULT 0,
    aforo         SMALLINT     NOT NULL DEFAULT 8,
    motor_hp      SMALLINT     NULL,
    costo_gasolina_hora DECIMAL(8,2) NULL,
    horario_inicio TIME        NOT NULL DEFAULT '06:00:00',
    horario_fin    TIME        NOT NULL DEFAULT '18:00:00',
    activa        TINYINT(1)   NOT NULL DEFAULT 0,

    /* el lanchero se registra con su lancha, así que es 1:1 */
    UNIQUE KEY uq_lanchas_usuario (usuario_id),
    CONSTRAINT fk_lanchas_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* -----------------------------------------
   RESERVAS
   destino_slug aún sin FK: el catálogo vive en
   datos.js hasta la migración del Paso 4.
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS reservas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    cliente_id  INT          NULL,
    lancha_id   INT          NULL,
    destino_slug VARCHAR(60) NOT NULL,
    tour_id     VARCHAR(60)  NULL,
    fecha       DATE         NOT NULL,
    adultos     SMALLINT     NOT NULL DEFAULT 1,
    ninos       SMALLINT     NOT NULL DEFAULT 0,
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado      ENUM('pendiente','confirmada','cancelada','completada')
                NOT NULL DEFAULT 'pendiente',
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_reservas_codigo (codigo),
    INDEX idx_reservas_cliente (cliente_id),
    INDEX idx_reservas_lancha (lancha_id),
    CONSTRAINT fk_reservas_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_reservas_lancha FOREIGN KEY (lancha_id)
        REFERENCES lanchas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

/* Contraseña del admin: admin123 (hash bcrypt generado con PHP 8.2)
   INSERT IGNORE + email único => se puede re-ejecutar sin duplicar */
INSERT IGNORE INTO usuarios (rol, nombre, email, password_hash, estado)
VALUES ('admin', 'Administrador', 'admin@nautigo.com',
        '$2y$10$YR.mMVYOcvTvZ1mxWBQUI.ZqtoU1qhZ8oJBIT5E3nQtGYQNyzBixe', 'activo');
