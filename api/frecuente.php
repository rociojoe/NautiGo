<?php
/* =========================================
   NAUTIGO — FRECUENCIA DEL CLIENTE  (GET, cliente)
   Cada 4 viajes completados, el siguiente sale con 20%.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
$yo = exigir_rol('cliente');

$s = db()->prepare('SELECT COUNT(*) FROM reservas
                    WHERE estado = "completada"
                      AND (cliente_id = :uid OR LOWER(cliente_email) = LOWER(:email))');
$s->execute([':uid' => $yo['id'], ':email' => $yo['email']]);
$completados = (int) $s->fetchColumn();

responder([
    'ok'                 => true,
    'viajesCompletados'  => $completados,
    'faltan'             => 4 - ($completados % 4),
    'descuentoDisponible' => $completados > 0 && ($completados % 4) === 0,
]);
