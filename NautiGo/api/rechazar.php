<?php
/* =========================================
   NAUTIGO — RECHAZAR O SUSPENDER LANCHERO  (POST, solo admin)
   POST: id, motivo, csrf
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
exigir_rol('admin');

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}
exigir_csrf();

$id    = (int) campo('id');
$motivo = campo('motivo');

if ($id <= 0) {
    responder(['ok' => false, 'error' => 'Identificador no válido.'], 422);
}
if (mb_strlen($motivo) < 3) {
    responder(['ok' => false, 'error' => 'Escribe un motivo para que el lanchero sepa qué falta.'], 422);
}

$pdo = db();
$c = $pdo->prepare('SELECT COUNT(*) FROM usuarios WHERE id = :id AND rol = "lanchero"');
$c->execute([':id' => $id]);
if ((int) $c->fetchColumn() === 0) {
    responder(['ok' => false, 'error' => 'Ese lanchero no existe.'], 404);
}

$pdo->prepare('UPDATE usuarios SET estado = "rechazado", motivo_rechazo = :motivo WHERE id = :id')
    ->execute([':id' => $id, ':motivo' => mb_substr($motivo, 0, 255)]);
$pdo->prepare('UPDATE lanchas SET activa = 0 WHERE usuario_id = :id')
    ->execute([':id' => $id]);

responder(['ok' => true, 'mensaje' => 'Solicitud rechazada.']);
