<?php
/* =========================================
   NAUTIGO — BLOG: PUBLICACIONES
   GET  ?usuario=ID&buscar=texto  → listado del feed
   POST texto, destino_slug, imagen (data URL) → publicar
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

$pdo = db();

/* ---------- PUBLICAR ---------- */
if (es_post()) {
    $yo = exigir_rol();          // cualquier cuenta puede compartir
    exigir_csrf();

    $texto = campo('texto');
    if (mb_strlen($texto) < 3 || mb_strlen($texto) > 4000) {
        responder(['ok' => false, 'error' => 'Tu experiencia debe tener entre 3 y 4000 caracteres.'], 422);
    }

    $destino = campo('destino_slug');
    if (mb_strlen($destino) > 60) {
        $destino = '';
    }

    $imagen = campo('imagen');
    if ($imagen !== '') {
        /* Solo data URL de imagen y con un tamaño razonable. */
        if (!preg_match('#^data:image/(png|jpe?g|webp);base64,#', $imagen) || strlen($imagen) > 3500000) {
            responder(['ok' => false, 'error' => 'La foto no es válida o pesa demasiado.'], 422);
        }
    }

    $st = $pdo->prepare(
        'INSERT INTO blog_publicaciones (usuario_id, destino_slug, texto, imagen)
         VALUES (:uid, :destino, :texto, NULLIF(:imagen, \'\'))'
    );
    $st->execute([
        ':uid'     => $yo['id'],
        ':destino' => $destino !== '' ? $destino : null,
        ':texto'   => $texto,
        ':imagen'  => $imagen,
    ]);

    responder(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

/* ---------- LISTAR ---------- */
$where  = [];
$params = [];

$usuarioId = (int) ($_GET['usuario'] ?? 0);
if ($usuarioId > 0) {
    $where[] = 'p.usuario_id = :uid';
    $params[':uid'] = $usuarioId;
}

$buscar = trim((string) ($_GET['buscar'] ?? ''));
if ($buscar !== '') {
    $where[] = '(p.texto LIKE :q OR u.nombre LIKE :q)';
    $params[':q'] = '%' . $buscar . '%';
}

$sql = 'SELECT p.id, p.texto, p.imagen, p.destino_slug, p.creado_en,
               u.id AS autor_id, u.nombre AS autor_nombre, u.rol AS autor_rol, u.foto AS autor_foto
        FROM blog_publicaciones p
        JOIN usuarios u ON u.id = p.usuario_id'
    . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
    . ' ORDER BY p.creado_en DESC, p.id DESC
       LIMIT 120';

$st = $pdo->prepare($sql);
$st->execute($params);
$filas = $st->fetchAll();

$yo = usuario_actual();
$ids = array_map('intval', array_column($filas, 'id'));

$conteoLikes = [];
$meGustaIds  = [];
$comentarios = [];

if ($ids) {
    $marcadores = implode(',', array_fill(0, count($ids), '?'));

    $s = $pdo->prepare('SELECT publicacion_id, COUNT(*) AS total FROM blog_me_gusta
                        WHERE publicacion_id IN (' . $marcadores . ')
                        GROUP BY publicacion_id');
    $s->execute($ids);
    foreach ($s->fetchAll() as $f) {
        $conteoLikes[(int) $f['publicacion_id']] = (int) $f['total'];
    }

    if ($yo) {
        $s = $pdo->prepare('SELECT publicacion_id FROM blog_me_gusta
                            WHERE usuario_id = ? AND publicacion_id IN (' . $marcadores . ')');
        $s->execute(array_merge([$yo['id']], $ids));
        $meGustaIds = array_map('intval', $s->fetchAll(PDO::FETCH_COLUMN));
    }

    $s = $pdo->prepare('SELECT c.id, c.publicacion_id, c.padre_id, c.texto, c.creado_en,
                               u.id AS autor_id, u.nombre AS autor_nombre, u.rol AS autor_rol, u.foto AS autor_foto
                        FROM blog_comentarios c
                        JOIN usuarios u ON u.id = c.usuario_id
                        WHERE c.publicacion_id IN (' . $marcadores . ')
                        ORDER BY c.creado_en ASC, c.id ASC');
    $s->execute($ids);
    $filasCom = $s->fetchAll();

    $likesComentario = [];
    $meGustaComs     = [];
    if ($filasCom) {
        $marcadoresCom = implode(',', array_fill(0, count($filasCom), '?'));
        $idsCom = array_map('intval', array_column($filasCom, 'id'));

        $t = $pdo->prepare('SELECT comentario_id, COUNT(*) AS total
                            FROM blog_comentarios_me_gusta
                            WHERE comentario_id IN (' . $marcadoresCom . ')
                            GROUP BY comentario_id');
        $t->execute($idsCom);
        foreach ($t->fetchAll() as $f) {
            $likesComentario[(int) $f['comentario_id']] = (int) $f['total'];
        }

        if ($yo) {
            $t = $pdo->prepare('SELECT comentario_id FROM blog_comentarios_me_gusta
                                WHERE usuario_id = ? AND comentario_id IN (' . $marcadoresCom . ')');
            $t->execute(array_merge([$yo['id']], $idsCom));
            $meGustaComs = array_map('intval', $t->fetchAll(PDO::FETCH_COLUMN));
        }
    }

    foreach ($filasCom as $c) {
        $cid = (int) $c['id'];
        $comentario = [
            'id'        => $cid,
            'padreId'   => $c['padre_id'] !== null ? (int) $c['padre_id'] : null,
            'texto'     => $c['texto'],
            'creado_en' => $c['creado_en'],
            'likes'     => $likesComentario[$cid] ?? 0,
            'meGusta'   => in_array($cid, $meGustaComs, true),
            'autor'     => [
                'id'     => (int) $c['autor_id'],
                'nombre' => $c['autor_nombre'],
                'rol'    => $c['autor_rol'],
                'foto'   => $c['autor_foto'],
            ],
            'respuestas' => [],
        ];
        if ($comentario['padreId'] === null) {
            $comentarios[(int) $c['publicacion_id']][] = $comentario;
        } else {
            /* Las respuestas cuelgan del comentario principal. */
            foreach ($comentarios[(int) $c['publicacion_id']] as &$principal) {
                if ($principal['id'] === $comentario['padreId']) {
                    $principal['respuestas'][] = $comentario;
                    break;
                }
            }
            unset($principal);
        }
    }
}

$publicaciones = array_map(function ($f) use ($conteoLikes, $meGustaIds, $comentarios) {
    $id = (int) $f['id'];
    return [
        'id'          => $id,
        'texto'       => $f['texto'],
        'imagen'      => $f['imagen'],
        'destinoSlug' => $f['destino_slug'],
        'creado_en'   => $f['creado_en'],
        'autor'       => [
            'id'     => (int) $f['autor_id'],
            'nombre' => $f['autor_nombre'],
            'rol'    => $f['autor_rol'],
            'foto'   => $f['autor_foto'],
        ],
        'likes'       => $conteoLikes[$id] ?? 0,
        'meGusta'     => in_array($id, $meGustaIds, true),
        'comentarios' => $comentarios[$id] ?? [],
    ];
}, $filas);

responder(['ok' => true, 'publicaciones' => $publicaciones]);
