<?php
/* =========================================
   NAUTIGO — BLOG: COMENTARIOS  (POST)
   POST: publicacion_id, texto, csrf
         padre_id (opcional: responder a un comentario)
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

$texto = campo('texto');
if (mb_strlen($texto) < 1 || mb_strlen($texto) > 600) {
    responder(['ok' => false, 'error' => 'El comentario debe tener entre 1 y 600 caracteres.'], 422);
}

$pdo = db();

$existe = $pdo->prepare('SELECT 1 FROM blog_publicaciones WHERE id = :id');
$existe->execute([':id' => $publicacionId]);
if (!$existe->fetchColumn()) {
    responder(['ok' => false, 'error' => 'Esa publicación ya no existe.'], 404);
}

/* Respuestas estilo Twitter: solo a comentarios principales. */
$padreId = (int) campo('padre_id');
$padre = null;
if ($padreId > 0) {
    $s = $pdo->prepare('SELECT id, padre_id FROM blog_comentarios
                        WHERE id = :id AND publicacion_id = :pid');
    $s->execute([':id' => $padreId, ':pid' => $publicacionId]);
    $padre = $s->fetch(PDO::FETCH_ASSOC);
    if (!$padre) {
        responder(['ok' => false, 'error' => 'El comentario que quieres responder ya no existe.'], 404);
    }
    if ($padre['padre_id'] !== null) {
        responder(['ok' => false, 'error' => 'Solo se puede responder a comentarios principales.'], 422);
    }
} else {
    $padreId = null;
}

$st = $pdo->prepare('INSERT INTO blog_comentarios (publicacion_id, usuario_id, padre_id, texto)
                     VALUES (:pid, :uid, :padre, :texto)');
$st->execute([':pid' => $publicacionId, ':uid' => $yo['id'],
              ':padre' => $padreId, ':texto' => $texto]);

$nuevoId = (int) $pdo->lastInsertId();

$creado = $pdo->prepare('SELECT creado_en, (SELECT foto FROM usuarios WHERE id = :uid) AS foto
                         FROM blog_comentarios WHERE id = :id');
$creado->execute([':id' => $nuevoId, ':uid' => $yo['id']]);
$fila = $creado->fetch(PDO::FETCH_ASSOC);

responder([
    'ok' => true,
    'comentario' => [
        'id'        => $nuevoId,
        'padreId'   => $padreId ? (int) $padreId : null,
        'texto'     => $texto,
        'creado_en' => $fila['creado_en'],
        'autor'     => [
            'id'     => (int) $yo['id'],
            'nombre' => $yo['nombre'],
            'rol'    => $yo['rol'],
            'foto'   => $fila['foto'],
        ],
    ],
]);
