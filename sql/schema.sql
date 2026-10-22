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

    /* foto de perfil y banner como data URL (el navegador las reduce) */
    foto         MEDIUMTEXT    NULL,
    banner       MEDIUMTEXT    NULL,

    /* cliente entra como 'activo'; lanchero nace 'pendiente'
       y el admin lo pasa a 'aprobado' o 'rechazado' */
    estado       ENUM('activo','pendiente','aprobado','rechazado')
                 NOT NULL DEFAULT 'activo',
    motivo_rechazo VARCHAR(255) NULL,

    creado_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_usuarios_email (email),
    INDEX idx_usuarios_rol_estado (rol, estado)
) ENGINE=InnoDB;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS foto   MEDIUMTEXT NULL AFTER puntos,
    ADD COLUMN IF NOT EXISTS banner MEDIUMTEXT NULL AFTER foto;

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
   El catálogo de destinos/tours/lanchas de demo vive en
   datos.js, así que la lancha, el lanchero y el hotel se
   guardan también como texto (instantánea del momento de
   reservar). lancha_id queda para cuando el catálogo
   migre a la base de datos.
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS reservas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    cliente_id  INT          NULL,
    lancha_id   INT          NULL,
    destino_slug VARCHAR(60) NOT NULL,
    tour_id     VARCHAR(60)  NULL,
    fecha       DATE         NOT NULL,
    fecha_regreso DATE       NULL,
    adultos     SMALLINT     NOT NULL DEFAULT 1,
    ninos       SMALLINT     NOT NULL DEFAULT 0,
    bebes       SMALLINT     NOT NULL DEFAULT 0,
    total       DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado      ENUM('pendiente','confirmada','cancelada','completada')
                NOT NULL DEFAULT 'pendiente',

    /* datos del formulario (la reserva puede ser de un invitado) */
    cliente_nombre   VARCHAR(120) NULL,
    cliente_email    VARCHAR(190) NULL,
    cliente_telefono VARCHAR(30)  NULL,
    notas            VARCHAR(1000) NULL,

    /* instantáneas para mostrar sin depender de datos.js */
    lancha_nombre    VARCHAR(120) NULL,
    lanchero_nombre  VARCHAR(120) NULL,
    lanchero_telefono VARCHAR(30) NULL,
    hotel_nombre     VARCHAR(120) NULL,
    noches           SMALLINT     NOT NULL DEFAULT 0,
    desglose         TEXT         NULL,

    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_reservas_codigo (codigo),
    INDEX idx_reservas_cliente (cliente_id),
    INDEX idx_reservas_lancha (lancha_id),
    INDEX idx_reservas_email (cliente_email),
    INDEX idx_reservas_lancha_nombre (lancha_nombre),
    CONSTRAINT fk_reservas_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_reservas_lancha FOREIGN KEY (lancha_id)
        REFERENCES lanchas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

/* Para bases de datos creadas con la versión anterior del schema:
   agregamos las columnas nuevas sin tocar los datos (MariaDB). */
ALTER TABLE reservas
    ADD COLUMN IF NOT EXISTS cliente_nombre   VARCHAR(120)  NULL AFTER estado,
    ADD COLUMN IF NOT EXISTS cliente_email    VARCHAR(190)  NULL AFTER cliente_nombre,
    ADD COLUMN IF NOT EXISTS cliente_telefono VARCHAR(30)   NULL AFTER cliente_email,
    ADD COLUMN IF NOT EXISTS notas            VARCHAR(1000) NULL AFTER cliente_telefono,
    ADD COLUMN IF NOT EXISTS lancha_nombre    VARCHAR(120)  NULL AFTER notas,
    ADD COLUMN IF NOT EXISTS lanchero_nombre  VARCHAR(120)  NULL AFTER lancha_nombre,
    ADD COLUMN IF NOT EXISTS lanchero_telefono VARCHAR(30)  NULL AFTER lanchero_nombre,
    ADD COLUMN IF NOT EXISTS hotel_nombre     VARCHAR(120)  NULL AFTER lanchero_telefono,
    ADD COLUMN IF NOT EXISTS noches           SMALLINT      NOT NULL DEFAULT 0 AFTER hotel_nombre,
    ADD COLUMN IF NOT EXISTS desglose         TEXT          NULL AFTER noches,
    ADD COLUMN IF NOT EXISTS bebes            SMALLINT      NOT NULL DEFAULT 0 AFTER ninos,
    ADD COLUMN IF NOT EXISTS fecha_regreso    DATE          NULL AFTER fecha;

ALTER TABLE reservas
    ADD INDEX IF NOT EXISTS idx_reservas_email (cliente_email),
    ADD INDEX IF NOT EXISTS idx_reservas_lancha_nombre (lancha_nombre);

/* Contraseña del admin: admin123 (hash bcrypt generado con PHP 8.2)
   INSERT IGNORE + email único => se puede re-ejecutar sin duplicar */
INSERT IGNORE INTO usuarios (rol, nombre, email, password_hash, estado)
VALUES ('admin', 'Administrador', 'admin@nautigo.com',
        '$2y$10$YR.mMVYOcvTvZ1mxWBQUI.ZqtoU1qhZ8oJBIT5E3nQtGYQNyzBixe', 'activo');

/* -----------------------------------------
   BLOG: publicaciones tipo red social
   La imagen se guarda como data URL (el navegador
   la reduce antes de subirla).
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS blog_publicaciones (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT          NOT NULL,
    destino_slug VARCHAR(60)  NULL,
    texto        TEXT         NOT NULL,
    imagen       MEDIUMTEXT   NULL,
    creado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_blogpub_usuario (usuario_id),
    INDEX idx_blogpub_fecha (creado_en),
    CONSTRAINT fk_blogpub_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blog_me_gusta (
    publicacion_id INT NOT NULL,
    usuario_id     INT NOT NULL,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (publicacion_id, usuario_id),
    CONSTRAINT fk_bloglike_pub FOREIGN KEY (publicacion_id)
        REFERENCES blog_publicaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_bloglike_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blog_comentarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id     INT NOT NULL,
    padre_id       INT NULL,
    texto          VARCHAR(600) NOT NULL,
    creado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_blogcom_pub (publicacion_id),
    INDEX idx_blogcom_padre (padre_id),
    CONSTRAINT fk_blogcom_pub FOREIGN KEY (publicacion_id)
        REFERENCES blog_publicaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_blogcom_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_blogcom_padre FOREIGN KEY (padre_id)
        REFERENCES blog_comentarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* Para bases creadas con la versión anterior del schema. */
ALTER TABLE blog_comentarios
    ADD COLUMN IF NOT EXISTS padre_id INT NULL AFTER usuario_id,
    ADD INDEX IF NOT EXISTS idx_blogcom_padre (padre_id);

/* Me gusta en comentarios y respuestas (estilo Twitter). */
CREATE TABLE IF NOT EXISTS blog_comentarios_me_gusta (
    comentario_id INT NOT NULL,
    usuario_id    INT NOT NULL,
    creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (comentario_id, usuario_id),
    CONSTRAINT fk_blogcomlike_com FOREIGN KEY (comentario_id)
        REFERENCES blog_comentarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_blogcomlike_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

/* -----------------------------------------
   CONTACTO: mensajes del formulario
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    nombre    VARCHAR(120) NOT NULL,
    email     VARCHAR(190) NOT NULL,
    asunto    VARCHAR(150) NULL,
    mensaje   TEXT         NOT NULL,
    creado_en TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

/* -----------------------------------------
   DATOS DE EJEMPLO DEL BLOG
   Usuarios demo (contraseña: caribe2026) y algunas
   publicaciones para que el feed no nazca vacío.
   Se pueden volver a ejecutar sin duplicar nada.
   ----------------------------------------- */
INSERT IGNORE INTO usuarios (rol, nombre, email, password_hash, estado) VALUES
('cliente', 'Andrea Morales',    'andrea@correo.com', '$2y$10$5xNoc9CeZebzbgKpepfCkejmnMrCNmGcCSqFWrg7vOQfr9FuV5dZq', 'activo'),
('cliente', 'Luis Fernando Cucul','luis@correo.com',   '$2y$10$5xNoc9CeZebzbgKpepfCkejmnMrCNmGcCSqFWrg7vOQfr9FuV5dZq', 'activo'),
('cliente', 'Sofía Reyes',       'sofia@correo.com',  '$2y$10$5xNoc9CeZebzbgKpepfCkejmnMrCNmGcCSqFWrg7vOQfr9FuV5dZq', 'activo'),
('cliente', 'Diego Chacón',      'diego@correo.com',  '$2y$10$5xNoc9CeZebzbgKpepfCkejmnMrCNmGcCSqFWrg7vOQfr9FuV5dZq', 'activo');

/* Cada publicación de ejemplo solo entra si ese usuario todavía
   no publicó sobre ese destino: el archivo se puede re-ejecutar. */
INSERT INTO blog_publicaciones (usuario_id, destino_slug, texto, imagen, creado_en)
SELECT u.id, 'playa-blanca',
       'Amanecer en Playa Blanca con el agua más quieta que he visto. Fuimos temprano para agarrar la lancha de las 6 y valió cada minuto de sueño perdido. El agua entra tibia y la arena no quema nada. Volvería mil veces.',
       'img/playa.jpg', NOW() - INTERVAL 3 DAY
FROM usuarios u
WHERE u.email = 'andrea@correo.com'
  AND NOT EXISTS (SELECT 1 FROM blog_publicaciones bp
                  WHERE bp.usuario_id = u.id AND bp.destino_slug = 'playa-blanca');

INSERT INTO blog_publicaciones (usuario_id, destino_slug, texto, creado_en)
SELECT u.id, 'siete-altares',
       'Siete Altares es otra cosa temprano: llegamos antes de los grupos grandes y tuvimos las pozas para nosotros. Lleven zapatos de agua, las piedras resbalan un poco al subir a la segunda poza.',
       NOW() - INTERVAL 2 DAY
FROM usuarios u
WHERE u.email = 'luis@correo.com'
  AND NOT EXISTS (SELECT 1 FROM blog_publicaciones bp
                  WHERE bp.usuario_id = u.id AND bp.destino_slug = 'siete-altares');

INSERT INTO blog_publicaciones (usuario_id, destino_slug, texto, imagen, creado_en)
SELECT u.id, 'rio-dulce',
       'El cañón te hace callar en serio. Las paredes de selva, las aves pasando por encima de la lancha y de repente el Castillo de San Felipe apareciendo al final. Lleven protector solar aunque esté nublado.',
       'img/rio-dulce.jpg', NOW() - INTERVAL 1 DAY
FROM usuarios u
WHERE u.email = 'sofia@correo.com'
  AND NOT EXISTS (SELECT 1 FROM blog_publicaciones bp
                  WHERE bp.usuario_id = u.id AND bp.destino_slug = 'rio-dulce');

INSERT INTO blog_publicaciones (usuario_id, destino_slug, texto, creado_en)
SELECT u.id, 'punta-palma',
       'Punta Palma se sintió como playa privada: media hora de lancha y nadamás nosotros cuatro. Pregunten al lanchero por la vuelta antes del mediodía, el mar se mueve después.',
       NOW() - INTERVAL 4 HOUR
FROM usuarios u
WHERE u.email = 'diego@correo.com'
  AND NOT EXISTS (SELECT 1 FROM blog_publicaciones bp
                  WHERE bp.usuario_id = u.id AND bp.destino_slug = 'punta-palma');

/* La llave primaria (publicacion_id, usuario_id) evita duplicados. */
INSERT IGNORE INTO blog_me_gusta (publicacion_id, usuario_id)
SELECT p.id, u.id
FROM blog_publicaciones p JOIN usuarios u
  ON u.email IN ('luis@correo.com', 'sofia@correo.com', 'diego@correo.com')
WHERE p.destino_slug = 'playa-blanca';

INSERT IGNORE INTO blog_me_gusta (publicacion_id, usuario_id)
SELECT p.id, u.id
FROM blog_publicaciones p JOIN usuarios u
  ON u.email IN ('andrea@correo.com', 'diego@correo.com')
WHERE p.destino_slug = 'rio-dulce';

INSERT INTO blog_comentarios (publicacion_id, usuario_id, texto, creado_en)
SELECT p.id, u.id, 'Ese amanecer no se paga con dinero. Qué fotos tan lindas.', NOW() - INTERVAL 3 HOUR
FROM blog_publicaciones p JOIN usuarios u ON u.email = 'sofia@correo.com'
WHERE p.destino_slug = 'playa-blanca'
  AND NOT EXISTS (SELECT 1 FROM blog_comentarios bc
                  WHERE bc.publicacion_id = p.id AND bc.usuario_id = u.id);

INSERT INTO blog_comentarios (publicacion_id, usuario_id, texto, creado_en)
SELECT p.id, u.id, 'Yo fui la semana pasada, el guía nos contó toda la historia del castillo.', NOW() - INTERVAL 6 HOUR
FROM blog_publicaciones p JOIN usuarios u ON u.email = 'luis@correo.com'
WHERE p.destino_slug = 'rio-dulce'
  AND NOT EXISTS (SELECT 1 FROM blog_comentarios bc
                  WHERE bc.publicacion_id = p.id AND bc.usuario_id = u.id);

/* -----------------------------------------
   HOTELES DEL ADMINISTRADOR
   Los tres de demo viven en datos.js; aquí caen
   los que el admin crea desde su panel. La imagen
   es opcional porque las tarjetas no la muestran.
   ----------------------------------------- */
CREATE TABLE IF NOT EXISTS hoteles (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(120) NOT NULL,
    categoria    ENUM('economico','medio','boutique') NOT NULL DEFAULT 'medio',
    precio_noche DECIMAL(10,2) NOT NULL DEFAULT 0,
    estrellas    TINYINT NOT NULL DEFAULT 3,
    ubicacion    VARCHAR(150) NULL,
    descripcion  VARCHAR(1000) NULL,
    creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
