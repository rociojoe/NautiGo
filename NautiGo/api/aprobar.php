<?php
/* =========================================
   NAUTIGO — APROBAR LANCHERO  (POST, solo admin)
   POST: id, csrf
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
exigir_rol('admin');

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}
exigir_csrf();

$id = (int) campo('id');
if ($id <= 0) {
    responder(['ok' => false, 'error' => 'Identificador no válido.'], 422);
}

$pdo = db();
$c = $pdo->prepare('SELECT COUNT(*) FROM usuarios WHERE id = :id AND rol = "lanchero"');
$c->execute([':id' => $id]);
if ((int) $c->fetchColumn() === 0) {
    responder(['ok' => false, 'error' => 'Ese lanchero no existe.'], 404);
}

$pdo->prepare('UPDATE usuarios SET estado = "aprobado", motivo_rechazo = NULL WHERE id = :id')
    ->execute([':id' => $id]);
$pdo->prepare('UPDATE lanchas SET activa = 1 WHERE usuario_id = :id')
    ->execute([':id' => $id]);

responder(['ok' => true, 'mensaje' => 'Lanchero aprobado y lancha activada.']);
