<?php
/* =========================================
   NAUTIGO — LISTA DE LANCHEROS  (GET, solo admin)
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
exigir_rol('admin');

$sql = 'SELECT u.id, u.nombre, u.email, u.telefono, u.estado, u.motivo_rechazo, u.creado_en,
               l.nombre AS lancha_nombre, l.aforo, l.galones, l.motor_hp,
               l.costo_gasolina_hora, l.activa
        FROM usuarios u
        LEFT JOIN lanchas l ON l.usuario_id = u.id
        WHERE u.rol = "lanchero"
        ORDER BY (u.estado = "pendiente") DESC, u.creado_en DESC';

$lancheros = array_map(function (array $f) {
    return [
        'id'         => (int) $f['id'],
        'nombre'     => $f['nombre'],
        'email'      => $f['email'],
        'telefono'   => $f['telefono'],
        'estado'     => $f['estado'],
        'motivo'     => $f['motivo_rechazo'],
        'creadoEn'   => $f['creado_en'],
        'lancha'     => $f['lancha_nombre'] !== null ? [
            'nombre'   => $f['lancha_nombre'],
            'aforo'    => (int) $f['aforo'],
            'galones'  => (float) $f['galones'],
            'motorHP'  => $f['motor_hp'] !== null ? (int) $f['motor_hp'] : null,
            'gasolina' => $f['costo_gasolina_hora'] !== null ? (float) $f['costo_gasolina_hora'] : null,
            'activa'   => (bool) $f['activa'],
        ] : null,
    ];
}, db()->query($sql)->fetchAll());

responder(['ok' => true, 'lancheros' => $lancheros]);
