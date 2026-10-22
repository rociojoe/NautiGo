<?php
/* =========================================
   NAUTIGO — BANDEJA DE CONTACTO  (GET, admin)
   Lee mensajes_contacto, que hasta ahora solo
   acumulaba filas sin que nadie las viera.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
exigir_rol('admin');

$s = db()->query('SELECT id, nombre, email, asunto, mensaje, creado_en
                  FROM mensajes_contacto ORDER BY id DESC LIMIT 200');

$mensajes = [];
foreach ($s as $m) {
    $mensajes[] = [
        'id'       => (int) $m['id'],
        'nombre'   => $m['nombre'],
        'email'    => $m['email'],
        'asunto'   => $m['asunto'],
        'mensaje'  => $m['mensaje'],
        'creadoEn' => $m['creado_en'],
    ];
}

responder(['ok' => true, 'mensajes' => $mensajes]);
