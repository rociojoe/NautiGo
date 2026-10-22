<?php
/* =========================================
   NAUTIGO — BLOG: ME GUSTA EN COMENTARIOS (POST, toggle)
   POST: comentario_id, csrf
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$yo = exigir_rol();
exigir_csrf();

$comentarioId = (int) campo('comentario_id');
if ($comentarioId < 1) {
    responder(['ok' => false, 'error' => 'Comentario no válido.'], 422);
}

$pdo = db();

$existe = $pdo->prepare('SELECT 1 FROM blog_comentarios WHERE id = :id');
$existe->execute([':id' => $comentarioId]);
if (!$existe->fetchColumn()) {
    responder(['ok' => false, 'error' => 'Ese comentario ya no existe.'], 404);
}

$ya = $pdo->prepare('SELECT 1 FROM blog_comentarios_me_gusta
                     WHERE comentario_id = :cid AND usuario_id = :uid');
$ya->execute([':cid' => $comentarioId, ':uid' => $yo['id']]);

if ($ya->fetchColumn()) {
    $pdo->prepare('DELETE FROM blog_comentarios_me_gusta
                   WHERE comentario_id = :cid AND usuario_id = :uid')
        ->execute([':cid' => $comentarioId, ':uid' => $yo['id']]);
    $meGusta = false;
} else {
    $pdo->prepare('INSERT INTO blog_comentarios_me_gusta (comentario_id, usuario_id)
                   VALUES (:cid, :uid)')
        ->execute([':cid' => $comentarioId, ':uid' => $yo['id']]);
    $meGusta = true;
}

$total = $pdo->prepare('SELECT COUNT(*) FROM blog_comentarios_me_gusta WHERE comentario_id = :cid');
$total->execute([':cid' => $comentarioId]);

responder(['ok' => true, 'meGusta' => $meGusta, 'likes' => (int) $total->fetchColumn()]);
