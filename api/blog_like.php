<?php
/* =========================================
   NAUTIGO — BLOG: ME GUSTA  (POST, toggle)
   POST: publicacion_id, csrf
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$yo = exigir_rol();
exigir_csrf();

$publicacionId = (int) campo('publicacion_id');
if ($publicacionId < 1) {
    responder(['ok' => false, 'error' => 'Publicación no válida.'], 422);
}

$pdo = db();

$existe = $pdo->prepare('SELECT 1 FROM blog_publicaciones WHERE id = :id');
$existe->execute([':id' => $publicacionId]);
if (!$existe->fetchColumn()) {
    responder(['ok' => false, 'error' => 'Esa publicación ya no existe.'], 404);
}

$ya = $pdo->prepare('SELECT 1 FROM blog_me_gusta WHERE publicacion_id = :pid AND usuario_id = :uid');
$ya->execute([':pid' => $publicacionId, ':uid' => $yo['id']]);

if ($ya->fetchColumn()) {
    $pdo->prepare('DELETE FROM blog_me_gusta WHERE publicacion_id = :pid AND usuario_id = :uid')
        ->execute([':pid' => $publicacionId, ':uid' => $yo['id']]);
    $meGusta = false;
} else {
    $pdo->prepare('INSERT INTO blog_me_gusta (publicacion_id, usuario_id) VALUES (:pid, :uid)')
        ->execute([':pid' => $publicacionId, ':uid' => $yo['id']]);
    $meGusta = true;
}

$total = $pdo->prepare('SELECT COUNT(*) FROM blog_me_gusta WHERE publicacion_id = :pid');
$total->execute([':pid' => $publicacionId]);

responder(['ok' => true, 'meGusta' => $meGusta, 'likes' => (int) $total->fetchColumn()]);
