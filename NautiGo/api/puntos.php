<?php
/* =========================================
   NAUTIGO — SUMAR PUNTOS  (POST, solo cliente)
   POST: puntos, csrf
   Lo usa el flujo de confirmación de reserva.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
$yo = exigir_rol('cliente');

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}
exigir_csrf();

$puntos = (int) campo('puntos');
if ($puntos < 1 || $puntos > 1000) {
    responder(['ok' => false, 'error' => 'Cantidad de puntos fuera de lo posible.'], 422);
}

$pdo = db();
$pdo->prepare('UPDATE usuarios SET puntos = puntos + :p WHERE id = :id')
    ->execute([':p' => $puntos, ':id' => $yo['id']]);

$s = $pdo->prepare('SELECT puntos FROM usuarios WHERE id = :id');
$s->execute([':id' => $yo['id']]);

responder(['ok' => true, 'puntos' => (int) $s->fetchColumn()]);
